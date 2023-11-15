/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('loginScreen',
        {
            controller: function (loginService, modalService, strings, ssoService, $location, $state, connectService) {
                var $ctrl = this;
                $ctrl.loginService = loginService;
                $ctrl.$onInit = function () {
                    
                    modalService.closeAllModals();
                    $ctrl.progress = modalService.showProgressAlert();
                    $ctrl.qs = loginService.getQueryString();
                    if ($ctrl.qs.Access === undefined) {
                        loginService.startLogin();
                    }
                    //if SSOis not enabled, then no need to save the token in vault and no need to transfer the controll to Workplace SSO screens
                    else if (!connectService.customAppCapabilities().SSOEnabled) {
                        loginService.finishLogin($ctrl.qs).then(function (userNames) {

                            $ctrl.ssoCallback();
                            _.delay(function () { $(window).trigger('resize') }); // Fix for header overlap
                        }).catch(function (error) {
                            // user is unauthorized or unknown error (so start login)
                            if (error.status === 401) {
                                modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_OCCURRED4.format(error.status), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                                    loginService.startLogin();
                                });
                            }
                            else {
                                modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                                    loginService.startLogin();
                                });
                            }
                            $ctrl.progress.close();
                        });
                    }
                    else {
                        var vaultStatus = sessionStorage.getItem("vaultStatus");
                        sessionStorage.removeItem("vaultStatus");
                        if (vaultStatus === null || vaultStatus === "error") {
                            $state.go("homeScreen");
                        }
                        //after login complete this method get called
                        loginService.finishLogin($ctrl.qs).then(function (userNames) {
                            if (vaultStatus !== null && vaultStatus !== "error") {
                                ssoService.saveVaultData(strings["SSOAppId"], strings["SSOManagerHost"], JSON.stringify(connectService.security), $ctrl.ssoCallback, connectService.getReturnUrl());
                            }
                            _.delay(function () { $(window).trigger('resize') }); // Fix for header overlap
                        }).catch(function (error) {
                            // user is unauthorized or unknown error (so start login)
                            if (error.status === 401) {
                                modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_OCCURRED4.format(error.status), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                                    loginService.startLogin();
                                });
                            }
                            else {
                                modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                                    loginService.startLogin();
                                });
                            }
                            $ctrl.progress.close();
                        });
                    }                   
                
                };

                $ctrl.ssoCallback = function (error) {
                    $ctrl.progress.close();
                    $state.go("homeScreen");
                };
            }
        });
