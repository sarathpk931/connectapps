/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular.module('app')
    .directive('draggable', function () {
        return {
            restrict: 'A',
            require: ['^ngModel', '^toggleSwitch'],
            scope: {
                disabled: '@'
            },
            link: function (scope, element, attr, controllers) {
                // First parse out required stuff
                var ngModel = controllers[0];
                var trueValue = controllers[1].trueValue;
                var falseValue = controllers[1].falseValue;

                var startTouch,
                    startLeft,
                    parentWidth = parseInt(window.getComputedStyle(element[0].parentElement).getPropertyValue('width')),
                    maxLeft = parentWidth - parseInt(window.getComputedStyle(element[0]).getPropertyValue('width')),
                    halfway = maxLeft / 2;

                // If we're in a button attach a click handler to it to toggle us
                if (element.parents('button').length) {
                    angular.element(element.parents("button")[0]).bind('tap click', function (event) {
                        click();
                    });
                }

                // Update view based on model change
                ngModel.$render = function () {
                    if ((trueValue && _.isEqual(trueValue, ngModel.$modelValue)) || (!trueValue && ngModel.$modelValue)) {
                        element[0].style['left'] = maxLeft + 'px';
                    }
                    else {
                        element[0].style['left'] = 0 + 'px';
                    }
                };

                var getClientX = function (e) {
                    return e.touches ? e.touches[0].clientX : e.clientX;
                };

                var dragging = function (e) {
                    var offset = startTouch - getClientX(e);
                    var left = startLeft - offset;
                    left = Math.min(left, maxLeft);
                    left = Math.max(left, 0);

                    element[0].style['left'] = left + 'px';
                };

                var click = function (e) {
                    //if we have a true value object, toggle to the opposite                          
                    if ((trueValue && _.isEqual(trueValue, ngModel.$modelValue)) || (!trueValue && ngModel.$modelValue)) {
                        element[0].style['left'] = 0 + 'px';
                        ngModel.$setViewValue(falseValue || false);
                    }
                    else {
                        element[0].style['left'] = maxLeft + 'px';
                        ngModel.$setViewValue(trueValue || true);
                    }
                };

                var dragEnd = function (e) {
                    document.removeEventListener('mouseup', dragEnd, false);
                    document.removeEventListener('mousemove', dragging, false);
                    document.removeEventListener('touchend', dragEnd, false);
                    document.removeEventListener('touchmove', dragging, false);
                    element.removeClass('no-transition');
                    element.removeClass('pressed');

                    var endTouch = e.touches ? e.changedTouches[event.changedTouches.length - 1].clientX : e.clientX;
                    var newLeft = parseInt(element[0].style['left']);

                    // If the mouse didn't move at all during our drag, toggle the state to simulate a click
                    if (startTouch === endTouch) {
                        click(e);
                    }
                    else {
                        // Check if we dragged the slider closer to true or false and update accordingly
                        if (newLeft >= halfway) {
                            element[0].style['left'] = maxLeft + 'px';
                            ngModel.$setViewValue(trueValue || true);
                        }
                        else {
                            element[0].style['left'] = 0 + 'px';
                            ngModel.$setViewValue(falseValue || false);
                        }
                    }

                };

                var dragStart = function (e) {

                    startTouch = getClientX(e);
                    startLeft = parseInt(element[0].style['left']);

                    //prevent transition while dragging
                    element.addClass('no-transition');
                    element.addClass('pressed');

                    document.addEventListener('mouseup', dragEnd, false);
                    document.addEventListener('mousemove', dragging, false);
                    document.addEventListener('touchend', dragEnd, false);
                    document.addEventListener('touchmove', dragging, false);

                    // Disable highlighting while dragging
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                    e.cancelBubble = true;
                    e.returnValue = false;
                };

                var grabber = element[0];
                grabber.ondragstart = function () { return false; };

                var down = function (e) {
                    var disabled = scope.disabled === 'true';
                    if (!disabled && (e.which === 1 || e.touches)) {
                        // left mouse click or touch screen
                        dragStart(e);
                    }
                };

                // we'll handle click events on the grabber manually in the dragging logic
                var cancel = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                };

                grabber.addEventListener('mousedown', down, false);
                grabber.addEventListener('touchstart', down, false);
                grabber.addEventListener('click', cancel, false);

                element.on('$destroy', function () {
                    grabber.removeEventListener('mousedown', down, false);
                    grabber.removeEventListener('touchstart', down, false);
                    grabber.removeEventListener('click', cancel, false);
                });
            }
        };
    });
