/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


angular
    .module('app')
    .directive('ngTap', ngTap)
    .directive('ngTapClick', function ($rootScope, $window, $parse, device) {

        return {
            restrict: 'A',
            scope: {
                ngTapClick: '&'
            },
            link: function (scope, element, attrs) {

                if (!device.isThirdGenBrowser && device.generation >= 9.0) {
                    element.on('tap', function (e) {
                        scope.ngTapClick(e);
                    });
                }
                else {
                    element.on('click', function (e) {
                        scope.$apply(scope.ngTapClick(e));
                    });
                }
            }
        };
    });

function ngTap($rootScope, $window, $parse) {
    var directive = {
        link: link,
        restrict: 'A',
        priority: 1
    };

    return directive;

    function link(scope, element, attrs) {
        var vmAction = $parse(attrs.ngTap);

        element[0].addEventListener('tap', function (e) {
            if (!element.hasClass("disabled")) {
                if (!scope.$$phase) {
                    scope.$apply(function (s) {
                        vmAction(s, { $event: e });
                    });
                }
                else {
                    scope.$applyAsync(function (s) {
                        vmAction(s, { $event: e });
                    });
                }
            }
        }, false);
    }
}
