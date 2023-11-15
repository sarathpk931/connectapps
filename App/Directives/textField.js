/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */




angular
    .module('app')
    .directive("textField", textField);

function textField($document, $timeout,device) {

    // Usage:
    //     <text-field><input></input><\text-field>
    // Creates:
    //
    var directive = {
        link: link,
        restrict: 'E',
        scope: {
            name: '=',
            placeholder: '@',
            type: '@',
            styles: '@',
            validatormsg: '@',
            isinvalid: '@'
        },
        transclude: true,
        template: '<ng-transclude ng-show="editing" class="{{styles}}"></ng-transclude>' +
            '<div ng-show="{{isinvalid}}">' +
            '<div class="requiredFieldForButton text-medium" style="font-weight:300;" ng-bind="placeholder" ng-hide="name || editing">' +
            '</div><div class="requiredFieldForButton text-medium" ng-bind="name" ng-show="name && !editing && (type != \'password\')">' +
            '</div><div class="requiredFieldForButton text-medium" ng-bind="name | passwordMask" ng-show="name && !editing && (type == \'password\')"></div>' +
            '<div class="requiredFieldForMessage" xas-string="{{validatormsg}}"></div>' +
            '</div>' +
            '<div ng-show="{{!isinvalid}}">' +
            '<div class="textField text-medium" style="font-weight:300;" ng-bind="placeholder" ng-hide="name || editing">' +
            '</div><div class="textField text-medium" ng-bind="name" ng-show="name && !editing && (type != \'password\')">' +
            '</div><div class="textField text-medium" ng-bind="name | passwordMask" ng-show="name && !editing && (type == \'password\')"></div>' +
            '</div>'
    };
    return directive;

    function link(scope, element, attrs) {

        // When the user hits enter while editing the input set the field back to readonly mode
        scope.handleKeyEnter = function (key) {
            if (key.keyCode == 9) {
                event.stopPropagation();
                event.preventDefault();
                $timeout(outsideClick, 100);
                return false;
            }
        }

        element.find("input").attr('readonly', true);
        element.find("input").on('keydown', scope.handleKeyEnter);

        element.on("tap click", function (event) {
            if (!device.isThirdGenBrowser && $(event.target).parents('.wrapper').length > 0 && event.type == 'click') {
                event.stopPropagation();
                event.preventDefault();
                return;
            }

            element.find("input").removeAttr('readonly')

            if (!event.isDefaultPrevented() && !scope.locked) {
                var alreadyEditing = scope.editing;


                scrollTextFieldIntoView();

                // This puts the control into edit mode
                $timeout(function () {
                    scope.$apply(function () {
                        scope.editing = true;
                    });
                }, 50);

                // Give the input a little time to display before we try focusing/selecting it
                $timeout(function () {
                    element.find("input")[0].focus();

                    if (!alreadyEditing)
                        element.find("input")[0].select();

                }, 200);

                // Make sure we don't have more than one outside click handler
                $document.off('tap click', outsideClick);
                $document.on('tap click', outsideClick);
                element.find("input").off('blur', outsideClick);
                element.find("input").on('blur', outsideClick);

                // Make sure clicking this input doesn't trigger the outside click handler
                event.stopPropagation();
                event.preventDefault();
            }

        });

        var scrollTextFieldIntoView = function () {
            // Scroll element into view first:
            if (window._iScrolls) {
                // Ensure we have an iscroll to scroll with and scroll to element with 15 px of padding above element
                if (window._iScrolls.length > 0) {
                    window._iScrolls[window._iScrolls.length - 1].scrollToElement(element[0], null, 0, -15);
                    // Scroll to element doesnt execute the scroll start and scroll end events, so we have to fire manually (or update iscroll-probe)
                    $timeout(function () {
                        window._iScrolls[window._iScrolls.length - 1]._execEvent('scrollStart');
                        window._iScrolls[window._iScrolls.length - 1]._execEvent('scrollEnd');
                    }, 50);
                }
            } else {
                var scrollContainer = element.closest("div[ng-scrollable]")[0];
                if (window.innerHeight == 480) {
                    $(scrollContainer).find(".eighth-gen-keyboard-spacer").addClass("show");
                }

                if ($(scrollContainer).find(element[0]).length > 0) {
                    // get parent until we have a top
                    var inputContainer = element;
                    while (inputContainer.position().top == 0) {
                        inputContainer = inputContainer.parent();
                    }

                    // Scroll the element into position if its not already in position
                    if (Math.round(inputContainer.position().top) != 43 && Math.round(inputContainer.position().top) != 65) {
                        scrollContainer.scrollTop += inputContainer.position().top - 43;
                    }
                }
            }
        };

        // Remove the event handler and set the input back to readonly mode
        var outsideClick = function () {
            $document.off('tap click', outsideClick);
            $(this).off('blur', outsideClick);
            element.find("input").attr('readonly', true);
            scope.editing = false;
            scope.$apply();
            $timeout(function () {
                if (typeof EIP_CloseEmbeddedKeyboard == 'function') {
                    EIP_CloseEmbeddedKeyboard(); //dismiss device keyboard
                }
            })
        }

        // Make sure the document event listener is removed when the component is destroyed
        element.on('$destroy', function () {
            $document.off('tap click', outsideClick);
            element.find("input").off('blur', outsideClick);
        });
    }
}
