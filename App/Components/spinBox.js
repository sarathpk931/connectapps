/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('spinBox',
        {
            bindings: {
                ngModel: '=',
                interactive: '<',
                min: '<',
                max: '<'
            },
            templateUrl: 'Scripts/App/Components/spinBox.html',
            controller: function ($timeout) {
                var $ctrl = this;
                var maxRange = 99;
                var pressing, increments, timeout;

                $ctrl.$onInit = function () {
                    // Absolute range is currently 0-99 since it's unlikely this control will have to handle anything but positive
                    // integer values. To be able to handle negative numbers or larger values the numbersOnly directive will have
                    // to support minus signs and the width of the control will have to vary to contain more than four digits.
                    $ctrl.min = Math.max(1, $ctrl.min || 1);
                    $ctrl.max = Math.min(maxRange, $ctrl.max || maxRange);

                    // Make sure we start in our valid range.
                    // Other bindings to the same value can still violate this of course
                    updateValue($ctrl.ngModel);
                };

                $ctrl.mouseDown = function (val) {
                    updateValue($ctrl.ngModel + val);

                    pressing = true;
                    increments = 0;
                    $('.btn-spin').addClass('quantity');

                    // Time to initially start repeating after beginning to hold the button is 1000ms
                    timeout = $timeout(function () {
                        increment(val);
                    }, 1000);
                };

                // On mouse up, cancel the current increment and make sure we don't trigger anymore.
                // The finger/mouse leaving the button also calls this function since if the user moves their
                // finger and then lets go we don't get a proper mouseUp event to handle
                $ctrl.mouseUp = function () {
                    $timeout.cancel(timeout);
                    $timeout(function () { $('.btn-spin').removeClass('quantity'); }, 75);
                    pressing = false;
                };

                // Clamp to any min/max values we have set
                function updateValue(val) {
                    val = Number(val || 0);
                    val = Math.max(val, $ctrl.min);
                    val = Math.min(val, $ctrl.max);
                    $ctrl.ngModel = val;
                }

                function increment(val) {
                    // If the user let go of the button don't increment
                    if (!pressing) {
                        $timeout.cancel(timeout);
                        return;
                    }
                    else {
                        // If the user is still holding the button increment the model and start the process over again.
                        // As the number of increments increases the time to repeat gets faster
                        updateValue($ctrl.ngModel + val);

                        // Increments 1- 10 are 200ms, and after that 60ms.
                        increments++;
                        var repeatTime = increments < 10 ? 200 : 60;

                        // Start the next increment step
                        $timeout.cancel(timeout);
                        timeout = $timeout(function () { increment(val); }, repeatTime);
                    }
                }
            }
        });
