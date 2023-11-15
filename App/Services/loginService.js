/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('loginService', loginService);

function loginService($http, modalService, device, connectService, $rootScope, authService, localStorageService) {
    var service = {};
    service.userInfo = null;

    //login
    service.startLogin = function () {
        service.getSAMLToken().then(function (token) {

            var oauthParams = {
                "Connector": connectService.connector,
                "DeviceModelName": device.model,
                "DeviceEIPVersion": device.eipVersion,
                "DeviceVersion": device.firmwareVersion,
                "Variant": device.generation,
                "DeviceSerial": device.serial,
                "SAMLToken": token
            };

            $http.get('./api/connectApps/login', { params: oauthParams }).then(function (result) {
                window.location = result.data.RedirectURL;
            }).catch(function (error) {
                console.log("Error getting auth grant url");
            });
        });
    };

    //Refresh Tokens 
    service.refreshTokens = function (tokens) {
        var data = JSON.stringify({
            'Access': tokens.Access,
            'Refresh': tokens.Refresh,
            'Security': tokens.Security,
            'Connector': connectService.connector
        });

        return $http.post('./api/connectApps/refreshTokens', data).then(function (result) {
            return result.data;
        }).catch(function (error) {
            return service.startLogin();
        });
    };



    // This waits for our http auth failure handler to let us know we got ourselves a 401
    $rootScope.$on("event:auth-loginRequired", function (event, enable) {

        // Go through the authentication process, which hopefully will resolve without an oauth redirect
        $q.when(service.refreshTokens(connectService.security)).then(function (tokens) {
            // Modify any queued http calls to use our new tokens before reissuing them
            authService.loginConfirmed('success', function (config) {
                connectService.setTokens(tokens);
                if (config.data) {
                    // getLibraries, searchDirectory, or getCurrentUser request data obj
                    if (config.data.indexOf("Security") !== -1 && config.data.indexOf("Access") !== -1) {
                        // Replace tokens in the data obj (getLibraries & searchDirectory specify in Token object)
                        var jsonData = JSON.parse(config.data);

                        //update the counter for number of tries
                        connectService.requestCounter++;
                        if (connectService.requestCounter === 2) { //On thrid try skip refresh token in getLibraries
                            config.ignoreAuthModule = true;
                            connectService.requestCounter = 0;
                        }
                        if (!_.isEmpty(jsonData.Token)) {
                            jsonData.Token.Security = connectService.security.Security;
                            jsonData.Token.Access = connectService.security.Access;
                            jsonData.Token.Refresh = connectService.security.Refresh;
                        } else if (!_.isEmpty(jsonData.Security)) {
                            jsonData.Security = connectService.security.Security;
                            jsonData.Access = connectService.security.Access;
                            jsonData.Refresh = connectService.security.Refresh;
                        }
                        config.data = JSON.stringify(jsonData);
                    }
                    //Download(Preview)/Upload(Scan) request data obj
                    if (config.data.indexOf("OAuthToken") !== -1 && config.data.indexOf("Token") !== -1) {
                        // Replace tokens in the data obj
                        config.data = service.formatListLibraryModel(config.data);
                    }
                }
                //Print 
                if (config.url) {
                    if (config.url.indexOf("id") !== -1) {
                        var urlPram = '';
                        var splitData = config.url.split('?id=');
                        if (splitData.length == 2) {
                            urlPram = encodeURI(service.formatListLibraryModel(decodeURI(splitData[1])));
                        }
                        config.url = splitData[0] + '?id=' + urlPram;
                    }
                }
                return config;
            })

        },
            function (error) {
                // If the automatic re-auth failed, go to the login screen and show a message, the user will have to pick up the pieces
                console.log("automatic re-auth failed, going to 'retry login' screen");
                authService.loginCancelled();
                service.startLogin();
            });
    });

    service.formatListLibraryModel = function (obj) {
        var jsonData = JSON.parse(obj);
        jsonData.Token = connectService.security.Security;
        jsonData.OAuthToken = connectService.security.Access;
        return JSON.stringify(jsonData);
    };

    //after login Success
    service.finishLogin = function (tokens) {
        connectService.setTokens(tokens);
        return connectService.getCurrentUser();
    };

    //logout
    service.logoff = function () {
        modalService.showChoiceAlert('SDE_CONFIRM_LOG_OUT4', null, 'SDE_CANCEL', 'SDE_LOG_OUT', 'xrx-cancel', 'xrx-exit').result.then(function () {
            if (typeof ExitCUIMode === "function") {
                ExitCUIMode();
            } else {
                // User not on a device, so just refresh the page.
                window.location.replace(window.location.origin);
                //window.location.reload();
            }
        }).catch(angular.noop);
    };

    service.getQueryString = function () {
        function fullyDecode(urlParam) {
            var result = urlParam;
            while (result !== decodeURIComponent(result)) {
                result = decodeURIComponent(result);
            }
            return result;
        }

        var qs = window.location.search;
        var result = [];
        if (qs[0] === "?") {
            var params = qs.slice(1).split('&');
            for (var i = 0; i < params.length; i++) {
                var param = params[i].split('=');
                result.push(param[0]);
                result[param[0]] = fullyDecode(param[1]);
            }

        }
        return result;
    };

    service.getSAMLToken = function () {
        var deferred = $q.defer();

        // If security key is configured for the O365 or OneDrive weblet, check if SAML token is available.
        var key = localStorageService.getAdvancedConfig();
        if (!_.isEmpty(key) && (connectService.connector == "GraphSharePoint" || connectService.connector == "GraphOneDrive")) {

            xrxSessionGetSecurityToken('http://localhost', 'Office365', B64.encode(key),
                function success(envelope, response) {
                    var securityToken = xrxSessionParseGetSecurityToken(response);
                    deferred.resolve(securityToken);
                },
                function error(envelope, response, status) {
                    try {
                        var error = xrxParseErrorResponse(response);
                        var fault = xrxGetElementValue(error, "faultstring");
                        console.log("GetSecurityToken error. Status: " + status + ", Fault: " + fault);
                    }
                    catch (error) {
                        console.log("GetSecurityToken error. Status: " + status + ", Fault: Unknown");
                    }

                    // Error getting token, just return empty strings
                    deferred.resolve('');
                });
        }
        else {
            deferred.resolve('');
        }
        return deferred.promise;
    }
    return service;
}
