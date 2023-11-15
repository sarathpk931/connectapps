/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('printService', printService);

function printService($rootScope, $timeout, $q, device, modalService, connectService, sessionInfo) {
    var service = {};
    var printerUrl = 'http://127.0.0.1';
    var printerTimeout = 5000;
    var completePrintPromise = null;
    var JobId = "";
    var JobIds = [];
    var failedJobs = [];
    var jobFailed = null;
    var colorVal = "";
    var copies = "";
    var plex = "";
    var staple = "";
    service.showResourceHeld = true;
    service.displayStatus = false;
    
    service.gettingJobDetails = false;
    service.printJobUrl = '';
    service.filename = null;
    service.jobNumber = 1;
    service.totalJobs = null;
    service.progressAlert = null;

    // Standard set of callbacks.
    service.callbacks = {
        handlePrintException: function (message) {
            //Save the failed job id in failedJobs array
            if (!_.find(failedJobs, { jobId: JobId })) {
                failedJobs.push({ jobId: JobId });
            }            
            service
                .callbacks
                .completePrint({ error: true, message: message });
        },
        handleJobCanceled: function () {
            service
                .callbacks
                .completePrint({ error: true, message: 'canceled' });
        },
        handleInputSizeNotDetermined: function () {
            service
                .callbacks
                .completePrint({ error: true, message: 'Input size not determined' });
        },
        handleJobComplete: function () {
            service
                .callbacks
                .completePrint({ message: 'complete' });
        },
        handleBeginCheckFailure: function (request, response) {
            //Save the failed job id in failedJobs array
            if (!_.find(failedJobs, { jobId: JobId })) {
                failedJobs.push({ jobId: JobId });
            } 
            service
                .callbacks
                .completePrint({ error: true, deviceDetails: response });
        },
        completePrint: function (detail) {
            _.pull(JobIds, JobId);
            // if we have jobId's then increment job number and getJobDetails to process the new job
            if (JobIds.length > 0) {
                service.jobNumber++;
                getJobDetails();
            }
            // If we dont have jobId's and our jobNumber >= our totalJobs, that means we have completed all jobs in our job queue
            else if (JobIds.length == 0 && service.jobNumber >= service.totalJobs) {
                service.gettingJobDetails = false;
                //Show print failed message if failedJobs array is not empty 
                if (!_.isEmpty(failedJobs)) {
                    failedJobs = [];
                    //Timeout is added for modalService methods to hide the modal from function 'displayProgressAlert'.
                    $timeout(function () {
                        modalService.closeAllModals();
                        modalService.showSimpleAlert('SDE_PRINTING_ERROR_OCCURRED', 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
                    }, 500);                    
                }
                else {
                    modalService.closeAllModals();
                    modalService.showProgressAlert("SDE_COMPLETED", "", "", true);
                }
            }
            // Else we have noJobId's but we aren't done, so increment jobnumber and let new jobs get jobDetails
            else {
                service.jobNumber++;
                service.gettingJobDetails = false;
            }
            
        }
    };

    // Print Job
    service.printJob = function (model) {
        service.showResourceHeld = true;
        completePrintPromise = $q.defer();
        service.eval(model);

        return completePrintPromise.promise;
    };

    // Binds the internals to the parent model
    service.eval = function (model) {
        try {
            plex = model.plex;
            colorVal = model.colorMode;
            copies = model.quantity;
            staple = model.stapling ? "Staple" : "None";
            printDetails('', '');
        }
        catch (ex) {
            var error = ex.toString();

            $rootScope.$broadcast('jobProgress', e.toString());
            service.callbacks.handlePrintException("Model Parameters not defined");
        }
    };

    //To Print
    function printDetails(username, password) {
        var jobName = "";
        if (jobName === null || jobName === "") {
            jobName = service.filename;

            var slashIdxval = service.filename.lastIndexOf("/");
            if (slashIdxval >= 0)
                jobName = service.filename.substring(slashIdxval + 1, service.filename.length);
        }

        try {
            var printJobTicket = CreateJobTicket(copies, plex, colorVal, jobName, '', staple);

            xrxPrintInitiatePrintJobURL(printerUrl, service.printJobUrl, username, password,
                printJobTicket, initiatePrintSuccess, initiatePrintFailed, printerTimeout);

            displayProgressAlert();
        }
        catch (ex) {
            var error = ex.toString();

            $rootScope.$broadcast('jobProgress', ex.toString());
            service.callbacks.handlePrintException("Initiate Print Job Failed");
        }
    }

    function displayProgressAlert() {
        if (!service.progressAlert && service.displayStatus) {
            closeProgressAlert();
            $timeout(function () {
                service.progressAlert = modalService.showProgressAlert("SDE_DOWNLOADING_PRINTING");
            }, 500);
        }
    }

    function initiatePrintSuccess(req, res) {
        JobIds.push(xrxPrintParseInitiatePrintJobURL(res));
        jobFailed = null;
        if (!service.gettingJobDetails) {
            getJobDetails();
        }
    }


    function initiatePrintFailed(req, res) {
        // error so just put a garbage job id:
        JobIds.unshift(Math.floor(Math.random() * 1000000));
        JobId = JobIds[0];
        service.callbacks.handlePrintException("generic error");
        jobFailed = "Print Failed";
    }

    function CreateJobTicket(copies, sides, color, filename, username, staple) {

        var punch = "None";
        var fold = "None";
        var finishing = "None";
        var tray = "Automatic";

        var output = xrxPrintOutput(staple, punch, fold, color, finishing, copies, sides, tray);
        // Create Print input with jba values from session api
        var input = xrxPrintInputJBA(sessionInfo.jbaUserId, sessionInfo.jbaAcctId);

        var jobProcessing = xrxPrintJobProcessing(input, output);
        var userLogin = connectService.security.UserName;

        if (username !== "") {
            userLogin = username;
        }

        var jobDescription = xrxPrintJobDescription(filename, userLogin);
        var printJobTicket = xrxPrintJobTicket(jobDescription, jobProcessing);
        return printJobTicket;
    }

    // Start the get status loop.
    function getJobDetails() {
        JobId = JobIds[0];
        if (JobId) {
            service.gettingJobDetails = true;
            xrxGetJobDetails(printerUrl, "Print", "JobId", JobId, checkJobStatus,
                    service.callbacks.handleBeginCheckFailure, printerTimeout);
        }
    }

    // Check the printer for the status of the job.
    function checkJobStatus(request, response) {
        try {
            if (jobFailed !== null) {
                callPrintFailed();
            }

            var jobStateReason = "";

            var jobState = xrxParseJobState(response);
            jobStateReason = xrxParseJobStateReasons(response);
            // If we are a versalink device, let the VL job progress screen take over
            if (device.isVersaLink) {
                $rootScope.$broadcast('jobProgress', 'Exit');
            } else {
                $rootScope.$broadcast('jobProgress', jobState);

                if (jobStateReason === "JobCanceledByUser" || jobStateReason === "CancelByUser") {
                    $rootScope.$broadcast('jobProgress', jobStateReason);
                    service.callbacks.handleJobCanceled();
                }
                else if (jobState === "Pending") {
                    $timeout(getJobDetails, 500);
                }
                else if (jobState === "Processing") {
                    $timeout(getJobDetails, 500);
                }
                else if (jobState === "PendingHeld" && jobStateReason !== "JobIncoming") {
                    if (service.showResourceHeld) {
                        modalService.showSimpleAlert("SDE_HELD_RESOURCES_REQUIRED");
                        service.showResourceHeld = false;
                    }

                    $timeout(getJobDetails, 500);
                }
                else if (jobState === "Completed" && jobStateReason === "JobCompletedSuccessfully") {
                    service.callbacks.handleJobComplete();
                }
                else if (jobState === "Completed" && jobStateReason === "FacJobTypeRestrictionDeletion") {
                    $rootScope.$broadcast('jobProgress', "Print Job Deleted");
                    service.callbacks.handlePrintException("Print Job Deleted. Make sure the file is not corrupted");
                }
                else if (jobState === "Completed" && jobStateReason !== "JobCompletedSuccessfully") {
                    service.callbacks.handlePrintException(jobStateReason);
                }
                else {
                    $timeout(getJobDetails, 500);
                }
            }
        } catch (e) {
            $rootScope.$broadcast('jobProgress', e.toString());
        }
    }

    function callPrintFailed() {
        service.progressAlert.close();
        // Job state and job state reason has to be passed
        $rootScope.$broadcast('jobProgress', jobFailed);
        service.callbacks.handlePrintException("Job Failed");
    }

    function closeProgressAlert() {
        if (service.progressAlert) {            
            service.progressAlert.close();
        }
        service.progressAlert = null;
    }
    
    return service;
}
