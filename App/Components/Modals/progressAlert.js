/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('progressAlert',
        {
            templateUrl: 'Components/Modals/progressAlert.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function ($timeout) {
                var $ctrl = this;
                $ctrl.showSpinner = true;

                $ctrl.$onInit = function () {
                    if ($ctrl.resolve.isCompleted) {
                        $timeout(function () {
                            $ctrl.close();
                        }, 5000);
                    }
                };
            }
        });
