/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


angular
    .module('app')
    .directive("xdaCalendar", xdaCalendar);

function xdaCalendar($document, $timeout) {

    // Usage:
    //     <xda-calendar><\xda-calendar>
    // Creates:
    //
    var directive = {
        link: link,
        restrict: 'E',
        scope: {
            callback: '&',
            date: '@',
            minDate: '@',
            maxDate: '@',
            dateFormat: '@'
        },
        template: '<div id="xdaCalendar"></div>'
    };
    return directive;

    function link(scope, element, attrs) {
        $('#xdaCalendar').pignoseCalendar({
            date: moment(scope.date, scope.dateFormat),
            format: scope.dateFormat,
            select: getDate,
            minDate: moment(scope.minDate, scope.dateFormat),
            maxDate: moment(scope.maxDate, scope.dateFormat)
        });

        // Set selected date to initial date
        scope.callback({ selectedDate: moment(scope.date, scope.dateFormat)._i});

        function getDate(event, context) {
            scope.callback({ selectedDate: context.current[0] ? moment(context.current[0]._i).format(scope.dateFormat) : null});
        }
    }
}
