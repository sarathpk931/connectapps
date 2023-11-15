/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('dateSelector',
        {
            templateUrl: 'Components/Modals/dateSelector.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function (modalService, $timeout, strings) {
                var $ctrl = this;
                $ctrl.dateValue = strings.SDE_MM_DD_YYYY;
                $ctrl.placeHolder = true;
                $ctrl.selectedMonth;

                $ctrl.$onInit = function () {
                    if ($ctrl.resolve.date) {
                        $ctrl.dateValue = $ctrl.resolve.date;
                        $ctrl.selectedMonth = moment($ctrl.resolve.date.substr(0, 2), "MM");
                        $ctrl.placeHolder = false;
                    }
                    $ctrl.minDate = $ctrl.resolve.minDate;
                    $ctrl.maxDate = $ctrl.resolve.maxDate;
                };

                $ctrl.selectDate = function () {
                    $ctrl.close({ $value: $ctrl.dateValue });
                };

                $ctrl.keypadPressed = function (number) {
                    $ctrl.focusInput();

                    // convert keyboard press into simple numeric
                    if (typeof number === 'object') {
                        number = number.charCode - 48;
                        if (number > 10 || number < 0)
                            number = null;
                    }

                    if (number !== null) {
                        if ($ctrl.placeHolder) {
                            $ctrl.placeHolder = false;
                            $ctrl.dateValue = "";
                        }

                        if ($ctrl.dateValue.length === 2 || $ctrl.dateValue.length === 5) {
                            $ctrl.dateValue += "/";
                        }

                        if ($ctrl.dateValue.length !== 10)
                            $ctrl.dateValue += number;

                        if ($ctrl.dateValue.length === 2) {
                            $ctrl.selectedMonth = moment($ctrl.dateValue, "MM");
                        }

                    }
                };

                $ctrl.disableNumber = function (number) {
                    if ($ctrl.placeHolder) {
                        return (number !== 0 && number !== 1);
                    }
                    switch ($ctrl.dateValue.length) {
                        case 1:
                            return ($ctrl.dateValue === '0') ? number === 0 : (number !== 0 && number !== 1 && number !== 2);
                        case 2:
                            return (number > Math.floor($ctrl.selectedMonth.daysInMonth() / 10));
                        case 4:
                            return $ctrl.dateValue.substr(-1) === '0' && number === 0 || $ctrl.dateValue.substr(-1) === Math.floor($ctrl.selectedMonth.daysInMonth() / 10).toString() && (number > $ctrl.selectedMonth.daysInMonth() % 10);
                        case 5:
                            return !(number >= Math.floor($ctrl.minDate.year() / 1000) && number <= Math.floor($ctrl.maxDate.year() / 1000));
                        case 7:
                            return !(parseInt($ctrl.dateValue.substr(-1) + number) >= Math.floor($ctrl.minDate.year() / 100) && parseInt($ctrl.dateValue.substr(-1) + number) <= Math.floor($ctrl.maxDate.year() / 100));
                        case 8:
                            return !(parseInt($ctrl.dateValue.substr(-2) + number) >= Math.floor($ctrl.minDate.year() / 10) && parseInt($ctrl.dateValue.substr(-2) + number) <= Math.floor($ctrl.maxDate.year() / 10));
                        case 9:
                            return !(parseInt($ctrl.dateValue.substr(-3) + number) >= Math.floor($ctrl.minDate.year()) && parseInt($ctrl.dateValue.substr(-3) + number) <= Math.floor($ctrl.maxDate.year()));
                        default: return true;
                    }
                };

                $ctrl.focusInput = function () {
                    $timeout(function () {
                        angular.element('#inputNumber').focus();
                    }, 50);
                };

                $ctrl.delete = function () {
                    if (!$ctrl.placeHolder) {
                        if ($ctrl.dateValue.length === 4 || $ctrl.dateValue.length === 7) {
                            $ctrl.dateValue = $ctrl.dateValue.slice(0, -1);
                        }
                        $ctrl.dateValue = $ctrl.dateValue.slice(0, -1);
                        if ($ctrl.dateValue === "") {
                            $ctrl.dateValue = strings.SDE_MM_DD_YYYY;
                            $ctrl.placeHolder = true;
                        }
                    }
                    $ctrl.focusInput();
                };

                $ctrl.openCalendar = function () {
                    var startCalendarDate = $ctrl.resolve.date;

                    if ($ctrl.dateValue && $ctrl.dateValue.length === 10) {
                        startCalendarDate = $ctrl.dateValue;
                    }

                    modalService.openCalendarModal(startCalendarDate, $ctrl.minDate.format($ctrl.resolve.dateFormat), $ctrl.maxDate.format($ctrl.resolve.dateFormat), $ctrl.resolve.dateFormat).result.then(function (selectedDate) {
                        if (selectedDate) {
                            $ctrl.dateValue = selectedDate;
                            $ctrl.placeHolder = false;
                        }
                    });
                };
            }
        });
