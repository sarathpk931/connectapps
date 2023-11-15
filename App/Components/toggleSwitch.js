/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('toggleSwitch',
        {
            bindings: {
                ngModel: '=',
                trueValue: '<',
                falseValue: '<'
            },
            templateUrl: 'Components/toggleSwitch.html',
            controller: function () {
                var $ctrl = this;

                $ctrl.toggle = function () {
                    if (($ctrl.trueValue && _.isEqual($ctrl.trueValue, $ctrl.ngModel)) || (!$ctrl.trueValue && $ctrl.ngModel))
                        $ctrl.ngModel = $ctrl.falseValue || false;
                    else {
                        $ctrl.ngModel = $ctrl.trueValue || true;
                    }
                };
            }
        });
