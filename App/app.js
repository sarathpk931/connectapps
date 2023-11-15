/* Copyright © 2022 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


deferredBootstrapper.bootstrap({
    element: window.document,
    module: 'app',
    resolve: {
        strings: function ($http) {
            /*
             * Testing note - This gets the language by the actual browser display language,
             * not the accept-header value or 'language preference' in the settings
             * var regex = /(\w+)\-?/g;
             * var locale = regex.exec(window.navigator.userLanguage || window.navigator.language)[1] || 'en';
             * var localizedLanguage = 'en';
             */
            return $http.get('api/home/GetStrings?connector=' + $('meta[name=connector]').attr("content")).then(function (result) { return result.data.strings; });
        },
        device: function ($q, $filter) {
            var deferred = $q.defer();
            xrxDeviceConfigGetDeviceInformation('http://localhost',
                function success(envelope, response) {
                    var doc = xrxStringToDom(response);
                    var info = xrxStringToDom($(doc).find('devcfg\\:Information, Information').text());

                    var generation = $(info).find('style > generation').text();
                    var model = $(info).find('model').text();
                    var isVersalink = _.includes(model.toLowerCase(), 'versalink') || _.includes(model.toLowerCase(), 'primelink');
                    var isAltalink = _.includes(model.toLowerCase(), 'altalink');
                    var eipVersion = _.map($(info).find("version > eipSoftware").children(), function (versions) { return $(versions).text() }).join('.');
                    var firmwareVersion = $(info).find('version > systemSoftware').text();
                    var serial = $(info).find('serial').text();
                    var isThirdGenBrowser = _.includes(navigator.userAgent.toLowerCase(), " x3g_");
                    // Allow testing from pc by forcing model
                    var qs = window.location.search;
                    var parsedQs = [];
                    if (qs[0] === "?") {
                        var params = qs.slice(1).split('&');
                        for (var i = 0; i < params.length; i++) {
                            var param = params[i].split('=');
                            parsedQs.push(param[0]);
                            var urlParam1 = param[1];
                            while (urlParam1 !== decodeURIComponent(urlParam1)) {
                                urlParam1 = decodeURIComponent(urlParam1);
                            }
                            parsedQs[param[0]] = urlParam1;
                        }
                    }
                    if (parsedQs.model && parsedQs.model.toLowerCase().includes("versa")) {
                        model = "Versalink 405";
                    }

                    deferred.resolve({
                        isThirdGenBrowser: isThirdGenBrowser,
                        generation: generation,
                        isVersalink: isVersalink,
                        isAltalink: isAltalink,
                        isEighthGen: generation < 9.0,
                        model: model,
                        eipVersion: eipVersion,
                        firmwareVersion: firmwareVersion,
                        serial: serial
                    });
                },
                function error(result) {
                    // error occured, prob not on a device
                    deferred.resolve({
                        generation: -1,
                        isVersalink: false,
                        isAltalink: false,
                        isEighthGen: false,
                        model: "None",
                        eipVersion: "0",
                        firmwareVersion: "0.0.0.0",
                        serial: "0"
                    });
                });

            return deferred.promise;
        },
        capabilities: function ($q, $filter) {
            var deferred = $q.defer();
            xrxDeviceConfigGetDeviceCapabilities('http://localhost',
                function success(envelope, response) {
                    var doc = xrxStringToDom(response);
                    var info = xrxStringToDom($(doc).find('devcfg\\:JobModelCapabilities_DeviceJobProcessingCapabilities, JobModelCapabilities_DeviceJobProcessingCapabilities').text());

                    var stapleValues = $(info).find('StapleFinishingsSupported, eipjobcap\\:StapleFinishingsSupported').first();
                    if (stapleValues.children().length > 0) {
                        stapleValues = stapleValues.children();
                    }
                    stapleValues = _.map(stapleValues, function (values) { return $(values).text(); });

                    var pdlValues = $(info).find('PDLSupported, eipjobcap\\:PDLSupported').children();

                    //remove notimplemented and none
                    _.pull(pdlValues, "notimplemented", "none")
                    pdlValues = _.map(pdlValues, function (values) { return $(values).text().toLowerCase(); });

                    //if printer supports tiff then it also supports jpg
                    if (_.includes(pdlValues, 'tiff')) {
                        pdlValues.push('tif', 'jpg', 'jpeg');
                    }

                    //if the connector is Google Drive
                    if ($('meta[name=connector]').attr("content") == 'GoogleDrive') {
                        pdlValues.push('googledocs');
                    }

                    //Check for Scan Support
                    var inputValues = $(info).find("Input, eipjobcap\\:Input").first();
                    var isPrintOnly = inputValues.children().length > 0 ? false : true;


                    deferred.resolve({
                        staple: stapleValues,
                        pdls: pdlValues,
                        isPrintOnly: isPrintOnly
                    });
                },
                function error(result) {
                    // error occured, just return empty strings
                    deferred.resolve({
                        staple: "",
                        pdls: "",
                        isPrintOnly: false
                    });
                });

            return deferred.promise;
        },       
        sessionInfo: function ($q) {
            var deferred = $q.defer();

            xrxSessionGetSessionInfo('http://localhost',
                function success(envelope, response) {
                    var data = xrxSessionParseGetSessionInfo(response);
                    var jba = xrxGetElementValue(data, "jba");
                    var jbaUserIdValue = '';
                    var jbaAcctIdValue = '';

                    //If jba values are set in session, return them
                    if (jba != null) {
                        jbaUserIdValue = xrxGetElementValue(data, "userID");
                        jbaAcctIdValue = xrxGetElementValue(data, "accountID");
                    }

                    deferred.resolve({
                        jbaUserId: jbaUserIdValue,
                        jbaAcctId: jbaAcctIdValue
                    });
                },
                function error(result) {
                    // Error getting session, just return empty strings
                    deferred.resolve({
                        jbaUserId: '',
                        jbaAcctId: ''
                    });
                });

            return deferred.promise;
        },
    },
    onError: function (error) {
        console.log('error: ' + error);
    }
});

var app = angular.module('app', ['ngSanitize', 'ui.router', 'ui.bootstrap', 'templates-main', 'http-auth-interceptor']);
app.constant('_', window._);

app.config(
    function ($stateProvider, $urlServiceProvider, $locationProvider, $qProvider) {
        $stateProvider.state('homeScreen', {
            component: 'homeScreen'
        });
        $stateProvider.state('ssoLogin', {
            component: 'ssoLogin'
        });

        $stateProvider.state('loginScreen', {
            component: 'loginScreen'
        });

        $stateProvider.state('scanScreen', {
            component: 'scanScreen'
        });
        $stateProvider.state('printScreen', {
            component: 'printScreen'
        });
        $urlServiceProvider.rules.otherwise({
            state: 'ssoLogin'
        });

        //$stateProvider.state('connectApps', {
        //    url: '/connectApps/Access/{token}',
        //    component: 'homeScreen',
        //    params: {
        //        mode: { value: null, squash: true }
        //    },

        //    resolve: {
        //        token: function ($transition$) {
        //            return $transition$.params().token;
        //        }

        //    },
        //    //resolve: {
        //    //    someData: function ($http) {
        //    //        return $http.get('something').then(
        //    //            res => res.data);
        //    //    }

        //});
        $locationProvider.html5Mode(true);
        $qProvider.errorOnUnhandledRejections(false);
    }
);

app.run(
    function ($rootScope, localStorageService, ssoService) {
      
        var qs = ssoService.parseUrlParams();

        if (qs.agConfig) {
            var configObj = JSON.parse(qs.agConfig);
            //saving  the default landing page for in locastorage to access later
            if (configObj.DefaultLandingPage != '' && typeof configObj.DefaultLandingPage !== "undefined") {
                localStorageService.setDefaultLandingPage('/{mysite}/' + configObj.DefaultLandingPage || '');
            }
            else {
                //set the defaultLandingpage to empty.
                localStorageService.setDefaultLandingPage('');
            }
            //saving the enable email a copy feature in localstorage to access later
            if (configObj.EnableScanEmailCopy != '' && typeof configObj.EnableScanEmailCopy !== "undefined") {
                localStorageService.setEnableEmailFeature(configObj.EnableScanEmailCopy);
            }
            else {
                //Setting the value to '1' to show the 'Email a copy' feature by default
                localStorageService.setEnableEmailFeature('1');
            }

            $rootScope._ = window._;
        }
    }
);
