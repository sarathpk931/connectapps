/* Copyright © 2012 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

// Try to center the header title without occluding the floating buttons

angular
    .module('app')
    .directive('actionBar', function ($timeout, $window) {

        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var calc = function () {
                    var headerDiv = element;
                    var leftDiv = headerDiv.find('.header-left');
                    var rightDiv = headerDiv.find('.header-right');
                    var middleDiv = headerDiv.find('.header-middle');
                    var totalWidth = headerDiv.width();
                    var mid = totalWidth / 2;
                    var leftSpace = mid - (leftDiv.width() || 0);
                    var rightSpace = mid - (rightDiv.width() || 0);
                    var min = Math.min(leftSpace, rightSpace);
                    var w = min * 2;
                    middleDiv.css('width', w + 'px');
                }

                // Attempt to adjust size for content
                $timeout(calc, 100);
                // if content takes a little longer wait a little longer
                $timeout(calc, 1000);
                // if content takes a little longer wait a little longer
                $timeout(calc, 3000);
                $timeout(calc, 5000);
                $timeout(calc, 7000);
                $timeout(calc, 9000);
                // if content takes a little longer wait a little longer
                $timeout(calc, 10000);
                $timeout(calc, 50000);
                angular.element($window).on('resize', calc);
                scope.$on('$destroy', function () {
                    angular.element($window).off('resize', calc);
                });
            }
        }
    });
