/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */



angular
    .module('app')
    .component('ssoLogin',
        {
            template: '',
            controller: function ($state, modalService, $location, ssoService, strings, device, connectService, loginService, localStorageService) {

                var $ctrl = this;
                $ctrl.$onInit = function () {
                    if (device.generation === -1) {
                        modalService.showSimpleAlert("SDE_CONTACT_DEVICE_ADMINISTRATOR", "ERROR_VERSION");
                    } else {
                        // Get query string if it is present
                        $(".loading-spinner").show();
                        connectService.vaultStatus = "";
                        $ctrl.qs = ssoService.parseUrlParams();
                        if ($ctrl.qs.agConfig) {
                            var configObj = JSON.parse($ctrl.qs.agConfig);
                            //saving  the snmp community string and advanced config setting in locastorage to access later
                            localStorageService.setCommunityName(configObj.CommunityName || 'public');
                            localStorageService.setAdvancedConfig(configObj.AdvancedConfig || '');

                            //this will colect the weblet info from the app first call
                            if ($ctrl.qs.webletsource !== undefined && $ctrl.qs.webletsource !== '') {
                                localStorageService.setWebletSource($ctrl.qs.webletsource);
                            }
                            else {
                                localStorageService.setWebletSource("connectapps");
                            }
                        }
                        if ($ctrl.qs.vault !== null && $ctrl.qs.vault !== undefined) {
                            var vaultObj = JSON.parse(decodeURIComponent($ctrl.qs.vault));
                            sessionStorage.setItem("vaultStatus", vaultObj.VaultStatus);
                            if (vaultObj.VaultStatus === "stored") {

                                var vaultDataObj = JSON.parse(vaultObj.VaultData);
                                ssoService.asyncUpdatePath = vaultObj.AsyncUpdatePath;
                                ssoService.asyncUpdateAccessToken = vaultObj.AsyncUpdateAccessToken;

                                if ($ctrl.qs.vaultSaved !== undefined) {
                                    // token saved recently so just use it
                                    loginService.finishLogin(vaultDataObj).then(function (userNames) {
                                        $ctrl.completeLogin();
                                    }).catch(function (error) {
                                        //handles the unauthorized and unknown errors
                                        $ctrl.handleLoginErrors(error);
                                    });
                                } else {
                                    loginService.refreshTokens(vaultDataObj).then(function (tokens) {
                                        loginService.finishLogin(tokens).then(function (userNames) {
                                            ssoService.saveVaultData(strings["SSOAppId"], strings["SSOManagerHost"], JSON.stringify(connectService.security), angular.noop, connectService.getReturnUrl());
                                            $ctrl.completeLogin();
                                        }).catch(function (error) {
                                            //handles the unauthorized and unknown errors
                                            $ctrl.handleLoginErrors(error);
                                        });
                                    }).catch(function (error) {
                                        //handles the unauthorized and unknown errors
                                        $ctrl.handleLoginErrors(error);
                                    });
                                }                              
                            }
                            else if (vaultObj.VaultStatus === "error") {
                                $ctrl.loginFallback();
                            }
                            else {
                                $ctrl.loginFallback();
                            }
                        }
                        else
                            if ($ctrl.qs === null || $ctrl.qs === undefined || $ctrl.qs.Access === undefined) {
                                ssoService.getVaultData(strings["SSOAppId"], strings["SSOManagerHost"], $ctrl.loginFallback, connectService.getReturnUrl());
                            }
                            else {
                                $ctrl.loginFallback();
                            }
                    }
                };
                $ctrl.loginFallback = function (resp) {
                    $(".loading-spinner").hide();
                    // Get failed, just go to login
                    $state.go('loginScreen');
                };

                $ctrl.completeLogin = function () {
                    _.delay(function () { $(window).trigger('resize') }); // Fix for header overlap
                    $(".loading-spinner").hide();
                    $state.go("homeScreen");
                };
                $ctrl.handleLoginErrors = function (error) {
                    // user is unauthorized or unknown error (so start login)
                    if (error.status === 401) {
                        modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_OCCURRED4.format(error.status), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                            $ctrl.loginFallback()
                        });
                    }
                    else {
                        modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                            $ctrl.loginFallback()
                        });
                    }
                };
            }
        });
