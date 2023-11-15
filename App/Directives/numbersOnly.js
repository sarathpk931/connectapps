/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .directive('numbersOnly', function () {
        return {
            require: ['ngModel', '^spinBox'],
            link: function (scope, element, attrs, controllers) {
                var modelCtrl = controllers[0];
                var min = controllers[1].min;
                var max = controllers[1].max;

                modelCtrl.$parsers.push(function (inputValue) {
                    if (inputValue === undefined) {
                        return '0';
                    }

                    // Don't allow non-numeric characters
                    var transformedInput = inputValue.replace(/[^0-9]/g, '');

                    // Make sure we have an actual number (default 0) and clamp to min/max bounds
                    transformedInput = parseInt(transformedInput || '0', 10);
                    transformedInput = Math.max(transformedInput, min);
                    transformedInput = Math.min(transformedInput, max);

                    // Set the view to be a string
                    modelCtrl.$setViewValue(transformedInput.toString());
                    modelCtrl.$render();

                    // Return a number for the model
                    return Number(transformedInput);
                });
            }
        };
    });
