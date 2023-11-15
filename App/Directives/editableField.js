/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


angular
    .module('app')
    .directive("editableField", editableField);

function editableField($document, $timeout) {

    function link(scope, element) {

        // When the container is clicked set the style to edit mode and add a listener for outside clicks to close the input
        element.closest("button").on("tap click", function (event) {
            // If we're inside an active iscroll we'll ignore the click event and only respond to taps, since the iscroll will unhelpfully fire both
            if ($(event.target).parents('.wrapper').length > 0 && event.type == 'click') {
                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (!event.isDefaultPrevented() && !scope.locked) {
                var alreadyEditing = scope.editing;

                // This puts the control into edit mode
                $timeout(function () {
                    scope.editing = true;
                    scope.updateCss(true);
                });

                // Give the input a little time to display before we try focusing/selecting it
                $timeout(function () {
                    element.find("input")[0].focus();

                    if (!alreadyEditing)
                        element.find("input")[0].select();

                    //trap tap event and call event handler from consumer for focusin event
                    //Some deivces only 'tap' event fired while interact with some area of UI
                    //This code get called once user tap in(similar to focusin of input HTML control) editable field of scan UI
                    //'tapfocusin' function should be passed from consumer part(HTML anf Component or Controller)
                    if (event.type === 'tap' && scope.editing == true && typeof scope.tapfocusin == 'function') {

                        scope.tapfocusin();
                    }
                }, 100);

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


        //update color fields and button background
        scope.updateCss = function (edit) {
            if (edit) {
                element.closest("button").css('background', 'white');
                element.find("input").css('box-shadow', 'none');
                element.find("span#_glyph").addClass('option-text');
                element.find("span#_subject").addClass('option-text');
            }
            else {
                element.closest("button").css('background', 'transparent');
                element.find("span#_glyph").removeClass('option-text');
                element.find("span#_subject").removeClass('option-text');
            }
        };


        // When the user hits enter while editing the input set the field back to readonly mode
        scope.handleKeyEnter = function (key) {
            if (key.keyCode == 13) {
                document.activeElement.blur();
                $document.off('tap click', outsideClick);
                scope.editing = false;
                scope.updateCss(false);
                if (typeof EIP_CloseEmbeddedKeyboard == 'function') {
                    EIP_CloseEmbeddedKeyboard(); //dismiss device keyboard
                }
            }
        };

        // Remove the event handler and set the input back to readonly mode
        var outsideClick = function (event) {
            $timeout(function () {
                $document.off('tap click', outsideClick);
                $(this).off('blur', outsideClick);
                scope.editing = false;
                scope.updateCss(false);

                //trap tap event and call event handler from consumer for focusout event
                //Some deivces only 'tap' event fired while interact with some area of UI
                //This code get called once user tap out(similar to focusout of input HTML control) from editable field of scan UI
                //'tapfocusout' function should be passed from consumer part(HTML and Component or Controller)
                if (typeof scope.tapfocusout == 'function' && event.type === 'tap') {
                    scope.tapfocusout();
                }
            });
        };

        // Make sure the document event listener is removed when the component is destroyed
        element.on('$destroy', function () {
            $document.off('tap click', outsideClick);
            element.find("input").off('blur', outsideClick);
        });
    }

    return {
        link: link,
        restrict: 'E',
        scope: {
            name: '=',
            ext: '@',
            locked: '<',
            subject: '@',
            placeholder: '@',
            tapfocusout: '&',
            tapfocusin: '&'
        },
        template:
            '<span id="_glyph" class="xrx-paperclip" ng-if="!subject"></span>' +
            '<span id="_subject" class="emailSubject" xas-string="SDE_SUBJECT3" ng-if="subject && !editing"></span>' +
            '<input type="text" ng-show="editing"  xas-placeholder="{{placeholder}}" ng-readonly="!editing" maxlength="{{ subject ? 128: 41}}" class="editable-field-input option-text" ng-model="name" ng-keypress="handleKeyEnter($event)" spellCheck="false" />' +
            '<span ng-hide="editing" class="editable-field-label">' +
            '<span ng-bind="name"></span>' +
            '<span ng-bind="ext" ng-if="!subject"></span>' +
            '</span>'
    };
}
