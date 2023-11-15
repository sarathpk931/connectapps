/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('privacyPolicy', {
        templateUrl: 'Scripts/App/Components/privacyPolicy.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controller: function ($scope, $http, modalService, strings, $sce) {
            var $ctrl = this;
            $ctrl.privacyPolicy = "";

            $ctrl.$onInit = function () {
                var progress = modalService.showProgressAlert();
                var privacyPolicyURL = strings.PrivacyPolicyURL;
                $http.get(privacyPolicyURL).then(function (response) {
                    $ctrl.privacyPolicy = response.data;
                    $ctrl.showVersion = strings.VERSION;
                    progress.close();
                }).catch(function (error) {
                    $ctrl.privacyPolicy = strings.SDE_COMM_ERROR;
                    progress.close();
                    //odalService.showSimpleAlert(strings.SDE_PROBLEM_ACCESSING_FMTSTR.format(strings.AppCompanyName), strings.SDE_PLEASE_TRY_AGAIN1 + "<br>" + strings.SDE_IF_PROBLEM_PERSISTS2);
                });
            };


        
        }

    });
