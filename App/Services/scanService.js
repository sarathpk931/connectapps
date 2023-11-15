/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('scanService', scanService);

function scanService($rootScope, $timeout, $q, modalService, scanTemplate) {
    var service = {};

    service.destinationUrl = '';

    var printerUrl = 'http://127.0.0.1';
    var sessionUrl = 'http://localhost';

    // Standard set of callbacks.
    service.callbacks = {
        handleScanException: function (message) {
            service
                .callbacks
                .completeScan({ error: true, message: message });
        },
        handleJobCanceled: function () {
            service
                .callbacks
                .completeScan({ error: true, message: 'canceled' });
        },
        handleJobAbortedBySystem: function () {
            service
                .callbacks
                .completeScan({ error: true, message: 'Scan Job Aborted By System' });
        },
        handleInputSizeNotDetermined: function () {
            service
                .callbacks
                .completeScan({ error: true, message: 'Input size not determined' });
        },
        handleIRMarkDetected: function () {
            service
                .callbacks
                .completeScan({ error: true, message: 'A security IR mark was detected on the original' });
        },
        handleJobComplete: function () {
            service
                .callbacks
                .completeScan({ message: 'complete' });
        },
        handleFinishPutTemplateError: function () {
            service
                .callbacks
                .completeScan({ error: true, message: 'Error sending template to device' });
        },
        handleBeginCheckFailure: function (request, response) {
            service
                .callbacks
                .completeScan({ error: true, deviceDetails: response });
        },
        handlePutTemplateFailure: function (message) {
            service
                .callbacks
                .completeScan({ error: true, deviceDetails: message });
        },
        completeScan: function (detail) {
            service.isScanning = false;
            service.isComplete = true;

            if (detail.error) {
                completeScanPromise
                    .reject(detail);
            }
            else {
                completeScanPromise
                    .resolve(detail);
            }
        }
    };

    service.isComplete = false;
    service.isScanning = false;

    var template;
    var completeScanPromise = null;
    var progressBanner;

    service.scan = function (model) {
        if (service.isScanning)
            throw "Please wait until job completes before scanning again.";

        model.destinationUrl = service.destinationUrl;
        template = new scanTemplate(model);

        // ToString will validate the template. Let's try that now before anything else
        // There's no user feedback for this type of error, it's more for dev testing
        template.toString();

        service.isScanning = true;
        //progressBanner = modalService.showProgressBanner();

        // Not that we currently do anything with this promise but the various callbacks
        // in the scan process will either resolve or reject it
        completeScanPromise = $q.defer();

        putTemplate();

        return completeScanPromise.promise;
    };

    // Begin sending the template to the device.
    function putTemplate() {
        xrxTemplatePutTemplate(printerUrl, template.name, template.toString(),
            function finish(callId, response) {
                finishPutTemplate(callId, response);
            },
            function fail(env, message) {
                service.callbacks.handlePutTemplateFailure(message);
            });
    }

    // Finished putting the template. Start checking the status of the job.
    function finishPutTemplate(callId, response) {
        var xmlDoc = xrxStringToDom(response);
        template.checkSum = xrxGetElementValue(xmlDoc, 'TemplateChecksum');

        xrxScanInitiateScan(printerUrl, template.name,
            false,
            function finish(callId, response) {

                template.jobId = xrxScanParseInitiateScan(response);

                // Let everyone know the job has been submitted.
                $rootScope.$broadcast('scanJobSubmitted', { jobId: template.jobId, template: template });

                $timeout(deleteScanTemplate(), 500);

                // Begin the check loop.
                beginCheckLoop();
            },
            function fail(env, message) {
                service.callbacks.handleFinishPutTemplateError();
                $timeout(deleteScanTemplate(), 500);
            });
    }

    // Start the get status loop.
    function beginCheckLoop() {
        xrxGetJobDetails(sessionUrl, "WorkflowScanning", "JobId", template.jobId, checkLoop,
            service.callbacks.handleBeginCheckFailure, 5000);
    }

    // Check the device for the status of the job.
    function checkLoop(request, response) {
        // Any job state?
        var jobStateReason = "";
        var jobState = xrxParseJobState(response);

        if (jobState === null || jobState === 'Completed') {
            jobStateReason = xrxParseJobStateReasons(response);
        }

        $rootScope.$broadcast('jobStatusCheckSuccess',
            { jobId: template.jobId, state: jobState, reason: jobStateReason });

        // Update the status of the template.
        template.status = {
            lastJobState: jobState,
            lastJobStateReason: jobStateReason
        };

        if (jobState === 'Completed' && jobStateReason && jobStateReason !== 'JobCompletedSuccessfully') {
            $rootScope.$broadcast('jobProgress', jobStateReason);
        }
        else {
            $rootScope.$broadcast('jobProgress', jobState);
        }
        if (jobState === 'Completed' && jobStateReason === 'InputScanSizeNotDetermined') {
            service.callbacks.handleInputSizeNotDetermined();
            $timeout(deleteScanTemplate(), 500);
        }
        else if (jobState === 'Completed' && jobStateReason === 'None') {
            $timeout(beginCheckLoop, 500);
        }
        else if (jobState === 'Completed' && (jobStateReason === 'JobAborted' || jobStateReason === 'AbortBySystem')) {
            $rootScope.$broadcast('jobProgress', 'JobAborted');
            service.callbacks.handleJobAbortedBySystem();
            $timeout(deleteScanTemplate(), 500);
        }
        else if (jobState === 'Completed' && (jobStateReason === 'JobCanceledByUser' || jobStateReason === 'CancelByUser')) {
            service.callbacks.handleJobCanceled();
            $timeout(deleteScanTemplate(), 500);
        }
        else if (jobState === 'Completed' && (jobStateReason === 'SecurityIRMarkDetected')) {
            service.callbacks.handleIRMarkDetected();
            $timeout(deleteScanTemplate(), 500);
        }
        else if (jobState === 'ProcessingStopped' && (jobStateReason === 'NextOriginalWait' || jobStateReason === '')) {
            $timeout(beginCheckLoop, 500);
        }
        else if (jobState === 'Completed' || jobState === 'ProcessingStopped') {
            $timeout(service.callbacks.handleJobComplete(), 500);
            $timeout(deleteScanTemplate(), 500);
        }
        else if (jobState === null && jobStateReason === 'JobCanceledByUser') {
            $rootScope.$broadcast('jobProgress', jobStateReason);
            service.callbacks.handleJobCanceled();
            $timeout(deleteScanTemplate(), 500);
        }
        else if (jobState === null && jobStateReason !== '') {
            service.callbacks.handleScanException(jobStateReason);
            $timeout(deleteScanTemplate(), 500);
        }
        else {
            $timeout(beginCheckLoop, 500);
        }
    }

    // Deletes the template by checksum.
    function deleteScanTemplate() {
        // We can delete the template by checksum if we have it.
        if (template.checkSum) {
            xrxTemplateDeleteTemplate(printerUrl, template.name, template.checkSum,
                function success() {
                },
                function failure() {
                });
        }
    }

    return service;
}
