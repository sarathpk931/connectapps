/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
      .module('app')
      .directive('xasString', function (strings) {

          return {
              restrict: 'A',
              scope: {
                  xasString: '@',
                  formatValues: '@'
              },
              link: function (scope, element, attrs) {

                  //console.log("linking string: " + scope.xasString);

                  scope.$watch(function () {
                      return [attrs.xasString, attrs.formatValues];
                  }, replaceString, true);

                  function replaceString() {
                      
                      //console.log("xasstring: " + attrs.xasString + ", formatval: " + attrs.formatValues);

                      //stringsProvider.then(function (strings) {

                      var string = strings[attrs.xasString] || attrs.xasString;
                          //console.log("found: " + string);
                          if (string && attrs.formatValues) {

                              // convert the format values list into an array (even if it's a single value) so we can index into it
                              var formatString = scope.$eval(attrs.formatValues);
                              if (!Array.isArray(formatString))
                                  formatString = [formatString];

                              // Make sure our format string and values have the same number of items
                              var matches = string.match(/\{(\d)\}/g);
                              if (matches.length !== formatString.length)
                                  throw ("Format string length mismatch between " + attrs.xasString + " and " + attrs.formatValues);

                              // Do the string replacement
                              _.each(matches, (function (item, index) {

                                  // localize the format value string if we can
                                  var fv = formatString[index].toString().trim();
                                  fv = strings[fv] || fv;

                                  string = string.replace(item, fv);
                              }));
                          }

                          //element.html('<span class=\'xas-string\'>' + string + '</span>');
                          element.html(string);                      
                          //if (scope.sanitize) {
                          //    element.html($sanitize(string).trim());
                          //}
                          //else {
                          //    element.html($compile(string)(scope.$parent));
                          //}
                      //});

                  }
              }
          }






      });
