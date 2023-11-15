/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */




angular
    .module('app')
    .factory('ssoService', SSOService);

function SSOService(localStorageService) {
    var service = { ssoHost: '', ssoAppId: '', communityString: localStorageService.getCommunityName(), asyncUpdatePath: '', asyncUpdateAccessToken: '' };

    var DEVICE_URL = "http://localhost";
    var DEVICE_TIMEOUT = 0;
    var OID_AUTH_SERVER_P = "1.3.6.1.4.1.253.8.74.6.2.1.9.06.157.118.300";
    var KEY_USER = 'username';
    var statusCodes = { STATUS_S: 'Success', ERROR_NOT_FOUND: 'NotFound', ERROR_INTERNAL: 'InternalError', ERROR_PARSE: 'ParseError', ERROR_CONN: 'ConnectionError' }

    // Get the current device user session and authentication path.
    function getDeviceInfo(callback) {
        var maxTries = 0;
        var deviceInfo = { user: { value: null, status: null }, access: { value: null, status: null }, returnTo: null };
        // Get logged in username
        {
            try {
                xrxSessionGetSessionInfo(DEVICE_URL,
                    function (sessRequest, sessResponse) {

                        var payload = xrxSessionParseGetSessionInfo(sessResponse);
                        if (payload !== null) {
                            var userId = xrxGetElementValue(payload.documentElement, KEY_USER);
                            if (userId !== null) {
                                deviceInfo.user.value = userId;
                                deviceInfo.user.status = statusCodes.STATUS_S;
                            } else {
                                deviceInfo.user.status = statusCodes.ERROR_NOT_FOUND;
                            }
                        } else {
                            deviceInfo.user.status = statusCodes.ERROR_PARSE;
                        }
                    },
                    function (sessRequest, error) {
                        deviceInfo.user.status = statusCodes.ERROR_CONN;
                    },
                    DEVICE_TIMEOUT
                );
            }
            catch (e) {
                deviceInfo.user.value = null;
                deviceInfo.user.status = statusCodes.ERROR_INTERNAL;
                callback({ error: 'unable to read user from session', vaultStatus: 'Error', token: null });
            }
        }

        // Get Xerox Workplace Suite/Cloud Vault Access URL
        {
            try {
                xrxWsSnmpGet(DEVICE_URL,
                    service.communityString,
                    OID_AUTH_SERVER_P,
                    function (req, resp) {

                        var data = xrxWsSnmpParseGet(resp);

                        if (data !== null) {

                            if (data.returnValue === null || data.returnValue === '') {
                                deviceInfo.access.status = statusCodes.ERROR_NOT_FOUND;
                            } else {
                                deviceInfo.access.value = data.returnValue;
                                deviceInfo.access.status = statusCodes.STATUS_S;
                            }
                        } else {
                            deviceInfo.access.status = statusCodes.ERROR_NOT_FOUND;
                        }
                    },
                    function lookupAuthServerFailure(env, resp) {
                        deviceInfo.access.status = statusCodes.ERROR_CONN;
                    },
                    DEVICE_TIMEOUT
                )
            } catch (ex) {
                deviceInfo.access.status = statusCodes.ERROR_INTERNAL;
                callback({ error: 'unable to read access from session', vaultStatus: 'Error', token: null });
            }
        }

        wait4Data2Complete();

        function wait4Data2Complete() {

            if ((deviceInfo.user.status === null || deviceInfo.access.status === null) && maxTries < 50) {
                maxTries += 1;
                setTimeout(wait4Data2Complete, 500);
            } else {
                callback(deviceInfo);
            }
        }
    }

    function serializeData(data) {
        var buffer = [];
        // Serialize each key in the object.
        for (var name in data) {
            if (!data.hasOwnProperty(name)) {
                continue;
            }
            var value = data[name];
            buffer.push(
                encodeURIComponent(name) +
                '=' +
                encodeURIComponent((value === null) ? '' : value)
            );
        }
        // Serialize the buffer and clean it up for transportation.
        var source = buffer
            .join('&')
            .replace(/%20/g, '+')
            ;
        return (source);
    }

    // Create a form and submit it.
    function postform(path, params) {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", path);

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", params[key]);

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
    }

    // Used to Get request to Xerox Workplace Suite... From SSO Manager
    function createSSOStoreRequest(deviceInfo, callback, asyncUpdatePath, asyncUpdateAccessToken) {

        // Send device info to SSO Manager to create an access request ticket
        var url = service.ssoHost + '/api/home/login/' + service.ssoAppId + '?accessToken=';

        if (asyncUpdateAccessToken) {
            url = url + encodeURIComponent(asyncUpdateAccessToken);
        }

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {

            if (this.readyState === 4) {
                // send the access request ticket to the vault
                if (asyncUpdatePath) {
                    asyncVaultSave(this.responseText, callback, asyncUpdatePath, asyncUpdateAccessToken)
                } else {
                    accessSecurityVault(this.responseText, callback);
                }
            }
        };
        xhttp.open('POST', url, true);
        xhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

        xhttp.send(JSON.stringify(deviceInfo));
    }

    // Used to save vault data with Xerox Workplace Suite
    function asyncVaultSave(data, callback, asyncUpdatePath, asyncUpdateAccessToken) {
        var dataObj = JSON.parse(data);

        if (dataObj.error) {
            // Something went wrong creating the access request ticket (probably with sesssion)
            callback(dataObj);
        } else {
            var params = dataObj.model.params;

            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4) {
                    callback(this.status);
                }
            };

            var vaultSaveTicket = {
                AppID: params['appId'],
                large_transaction_data: params['large_transaction_data'],
                ticket: params['ticket'],
                Signature: params['signature']
            };

            xhttp.open('POST', asyncUpdatePath, true);
            xhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

            xhttp.send(JSON.stringify(vaultSaveTicket));
        }
    }

    // Used to Create Form for Xerox Workplace Suite and send it
    function accessSecurityVault(response, callback) {

        try {
            var vaultObj = JSON.parse(response);

            if (vaultObj.error) {
                // Something went wrong creating the access request ticket (probably with sesssion)
                callback(vaultObj);
            } else {
                var model = vaultObj.model;
                // Send sso vault access request to Xerox Workplace Suite
                postform(model.url, model.params);
            }
            // If something like 404 happens callback with that response
        } catch (ex) {
            callback(response);
        }
    }

    // Gets everything need to make vault requests, and makes them
    function getDeviceInfoAndLogin(appID, host, vaultData, callback, returnAddress, asyncUpdatePath, asyncUpdateAccessToken) {
        var deviceInfo = { user: { value: null, status: null }, access: { value: null, status: null }, token: null };
        service.ssoHost = host;
        service.ssoAppId = appID;

        getDeviceInfo(function (result) {
            deviceInfo = result;
            if (deviceInfo.user.value && deviceInfo.access.value) {
                deviceInfo.returnTo = returnAddress;

                deviceInfo.token = vaultData; //if this is empty, any current saved data is returned

                createSSOStoreRequest(deviceInfo, callback, asyncUpdatePath, asyncUpdateAccessToken);
            } else {
                callback(deviceInfo);
            }
        });
    }

    service.saveVaultData = function (appID, host, vaultData, callback, returnAddress, asyncUpdatePath, asyncUpdateAccessToken) {
        service.asyncUpdatePath = asyncUpdatePath || service.asyncUpdatePath;
        service.asyncUpdateAccessToken = asyncUpdateAccessToken || service.asyncUpdateAccessToken;
        getDeviceInfoAndLogin(appID, host, vaultData, callback, returnAddress, service.asyncUpdatePath, service.asyncUpdateAccessToken);
    };

    service.getVaultData = function (appID, host, callback, returnAddress) {
        getDeviceInfoAndLogin(appID, host, null, callback, returnAddress, null, null);
    };

    service.parseUrlParams = function () {
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



    return service;
}
