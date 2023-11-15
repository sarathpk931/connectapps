/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('choiceAlert',
        {
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            templateUrl: 'Scripts/App/Components/Modals/choiceAlert.html',
            controller: function ($element, $timeout) {
                var $ctrl = this;

                $ctrl.$onInit = function () {
                    $timeout(function () {
                        var buttons = $element.find("button");
                        if (buttons.first().width() > buttons.last().width()) {
                            buttons.last().width(buttons.first().width());
                        } else {
                            buttons.first().width(buttons.last().width());
                        }
                    }, 0);
                };
            }
        });
