/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('modalService', modalService);

function modalService($uibModal, $uibModalStack, $timeout) {
    var service = {};
    service.currentBannerModal = null;
    service.currentProgressAlert = null;

    service.openComponentModal = function (componentName, data) {
        return $uibModal.open({
            component: componentName,
            resolve: {
                data: function () { return data; }
            }
        });
    };
    service.showPrintFileBrowser = function (title, resume) {

        return $uibModal.open({
            component: 'printFileBrowser',
            resolve: {
                title: function () { return title; },
                resumeBrowse: function () { return resume === null ? false : resume; }
            }
        });
    };
    service.showPrintPreview = function (title, images) {
        return $uibModal.open({
            component: 'printPreviewer',
            resolve: {
                title: function () { return title; },

                images: function () { return images; }
            }
        });
    };
    service.showPreview = function (title, images) {
        return $uibModal.open({
            component: 'scanPreviewer',
            resolve: {
                title: function () { return title; },

                images: function () { return images; }
            }
        });
    };
    service.showScanFileBrowser = function (title, resume) {
        return $uibModal.open({
            component: 'scanFileBrowser',
            resolve: {
                title: function () { return title; },
                resumeBrowse: function () { return resume === null ? false : resume; }
            }
        });
    };
    service.showPrintList = function (title, resume) {
        return $uibModal.open({
            component: 'printList',
            resolve: {
                title: function () { return title; },
                resumeBrowse: function () { return resume === null ? true : resume; }
            }
        });
    };
    service.showSearchFiles = function (title, resume) {
        return $uibModal.open({
            component: 'searchFiles',
            resolve: {
                title: function () { return title; },
                resumeBrowse: function () { return resume === null ? true : resume; }
            }
        });
    };
    service.showPopover = function (feature, event) {
        return $uibModal.open({
            component: 'featurePopover',
            resolve: {
                feature: function () { return feature; },
                event: function () { return event; }
            }
        });
    };
    service.showEmailPopover = function (email) {
        return $uibModal.open({
            component: 'addRecipient',
            resolve: {
                email: function () { return email; }
            }
        });
    };
    service.showProgressBanner = function () {
        return $uibModal.open({
            component: 'progressBanner',
            windowClass: 'allow-outside-interaction',
            backdrop: false
        });
    };

    service.showProgressAlert = function (title, body, appName, isCompleted) {
        if (service.currentProgressAlert)
            service.currentProgressAlert.close();

        service.currentProgressAlert = $uibModal.open({
            component: 'progressAlert',
            resolve: {
                title: function () { return title; },
                body: function () { return body; },
                appName: function () { return appName; },
                isCompleted: function () { return isCompleted; }
            }
        });
        return service.currentProgressAlert;
    };

    service.showAlertBanner = function (message, timeout) {
        if (service.currentBannerModal)
            service.currentBannerModal.close();

        var modal = $uibModal.open({
            component: 'alertBanner',
            windowClass: 'allow-outside-interaction',
            backdrop: false,
            resolve: {
                message: function () { return message; }
            }
        });

        service.currentBannerModal = modal;

        // Automatically close after 3 seconds
        $timeout(function () {
            modal.close();
        }, timeout || 3000);
    };

    service.showSimpleAlert = function (title, bodyTitle, body, buttonText, appName, customClass) {
        return $uibModal.open({
            component: 'basicAlert',
            resolve: {
                title: function () { return title; },
                bodyTitle: function () { return bodyTitle; },
                body: function () { return body; },
                buttonText: function () { return buttonText || 'SDE_CLOSE'; },
                appName: function () { return appName; },
                customClass: function () { return customClass; }
            }
        });
    };

    var defaultDateFormat = "MM/DD/YYYY";

    service.openDateSelector = function (title, displayCalendar, date, minDate, maxDate, dateFormat) {
        return $uibModal.open({
            component: 'dateSelector',
            resolve: {
                title: function () { return title; },
                displayCalendar: function () { return Boolean(displayCalendar); },
                date: function () { return date; },
                dateFormat: function () { return dateFormat || defaultDateFormat; },
                minDate: function () { return minDate || moment("01/01/0000", defaultDateFormat); },
                maxDate: function () { return maxDate || moment().add(5, "years"); }
            }
        });
    };
    service.showChoiceAlert = function (title, body, buttonText1, buttonText2, buttonGlyph1, buttonGlyph2, buttonFunc1, buttonFunc2) {
        return $uibModal.open({
            component: 'choiceAlert',
            resolve: {
                title: function () { return title; },
                body: function () { return body; },
                buttonText1: function () { return buttonText1 || 'SDE_NO'; },
                buttonText2: function () { return buttonText2 || 'SDE_YES'; },
                buttonGlyph1: function () { return buttonGlyph1; },
                buttonGlyph2: function () { return buttonGlyph2; }
            }
        });
    };

    service.openCalendarModal = function (date, minDate, maxDate, dateFormat) {
        return $uibModal.open({
            component: 'calendarModal',
            resolve: {
                date: function () { return date || moment(moment.now()).format(dateFormat || defaultDateFormat); },
                dateFormat: function () { return dateFormat || defaultDateFormat; },
                minDate: function () { return minDate || moment("01/01/0000", defaultDateFormat); },
                maxDate: function () { return maxDate || moment().add(5, "years"); }
            }
        });
    };

    service.closeAllModals = function () {
        $uibModalStack.dismissAll();
    };
    service.showNoDefaultSiteAlert = function (title, body, buttonText1, buttonText2, buttonGlyph1, buttonGlyph2) {
        return $uibModal.open({
            component: 'noDefaultSiteAlert',
            resolve: {
                title: function () { return title; },
                body: function () { return body; },
                buttonText1: function () { return buttonText1 || 'SDE_NO'; },
                buttonText2: function () { return buttonText2 || 'SDE_YES'; },
                buttonGlyph1: function () { return buttonGlyph1; },
                buttonGlyph2: function () { return buttonGlyph2; },
            }
        });
    };
    return service;
}
