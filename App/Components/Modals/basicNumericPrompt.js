/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('basicNumericPrompt', {
        templateUrl: 'Components/Modals/basicNumericPrompt.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controller: function (userService, modalService, $timeout) {

            var $ctrl = this;
            $ctrl.inputValue = "";

            // Possible resolve params (title, isPhoneNumber, pattern, maxLength)
            $ctrl.$onInit = function () {
                if ($ctrl.resolve.initialValue) {
                    $ctrl.inputValue = $ctrl.resolve.initialValue;
                }
                $ctrl.focusInput();
            };

            $ctrl.focusInput = function () {
                $timeout(function () {
                    angular.element('#inputNumber').focus();
                }, 50);
            };

            $ctrl.error = function () {
                // dont test if we dont have a pattern
                if (!$ctrl.resolve.pattern) {
                    return false;
                }

                if ($ctrl.inputValue.match($ctrl.resolve.pattern)) {
                    return false;
                }

                return true;
            };

            $ctrl.keypadPressed = function (value) {
                $ctrl.focusInput();
                $timeout(function () {
                    // if phonenumber format d(3)-(d3)-(d4)
                    if ($ctrl.resolve.isPhoneNumber && ($ctrl.inputValue.length == 3 || $ctrl.inputValue.length == 7))
                    {
                        value = "-" + value
                    }
                    if ($ctrl.inputValue.length < $ctrl.resolve.maxLength )
                        $ctrl.inputValue += value;
                }, 50);

            };

            $ctrl.delete = function () {
                $ctrl.inputValue = $ctrl.inputValue.slice(0, -1);
                $ctrl.focusInput();
            };

            $ctrl.ok = function () {
                $ctrl.close({
                    $value: $ctrl.inputValue
                });
            };
        }
    });
