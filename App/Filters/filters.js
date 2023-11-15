/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module("app").filter("passwordMask", function () {
        return function (input) {
            var result = "";

            if (input) {
                var split = input.split('');
                for (var i = 0; i < split.length; i++) {
                    result += "•";
                }
            }
            return result;
        };
    });

angular
    .module("app").filter("translate", function (strings) {
        return function (input) {
            var result = "";
            if (input) {
                result = strings[input] || input;
            }
            return result;
        };
    });
angular.module("app").filter("trimLast", function () {
    return function (input) {
        if (input && input.substr(-1) == "/") {
            return input.slice(0, -1);
        }
        else {
            return input;
        }
    };
});
