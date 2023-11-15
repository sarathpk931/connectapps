/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


    angular
        .module('app')
        .directive('xasStopEvent', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    element.bind('tap', function (e) {
                        if(e.target === this)
                            e.stopPropagation();
                    });
                    element.bind('click', function (e) {
                        if (e.target === this)
                            e.stopPropagation();
                    });
                }
            };
        });
