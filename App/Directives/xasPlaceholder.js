/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


    angular
        .module('app')        
        .directive('xasPlaceholder', xasPlaceholder);


    function xasPlaceholder(strings) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                xasPlaceholder: '@'
            }
        };
        return directive;

        function link(scope, element, attrs) {
            
                attrs.$observe('xasPlaceholder', function (value) {
                    var string = strings[value];
                    attrs.$set('placeholder',string || value);
                });

                attrs.$set('placeholder', strings[attrs.xasPlaceholder] || attrs.xasPlaceholder);
           
            
            var onFocus = function (e) {
                $(e.target).addClass("keepPlaceHolder");
            }

            var onBlur = function (e) {
                $(e.target).removeClass("keepPlaceHolder");
                $(e.target).removeClass("removePlaceholder");
            }

            var onKeyPress = function (e) {
                if (e.target.value != null) {
                    $(e.target).addClass("removePlaceholder");
                    $(e.target).removeClass("keepPlaceHolder");
                }
            }

            angular.element(element).on('focus', onFocus);
            angular.element(element).on('blur', onBlur);
            angular.element(element).on('input', onKeyPress);


            scope.$on('$destroy', function () {
                angular.element(element).off('focus', onFocus);
                angular.element(element).off('blur', onBlur);
                angular.element(element).off('input', onKeyPress);
            });
            
        }
    }
