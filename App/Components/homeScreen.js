/* Copyright © 2022 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('homeScreen',
        {

            templateUrl: 'Scripts/App/Components/homeScreen.html',
            controller: function ($uibModal, $state, loginService, connectService, modalService, capabilities, onBoxOcrCapabilityService, device) {
                var $ctrl = this;
                $ctrl.loginService = loginService;
                $ctrl.connectService = connectService;
                $ctrl.capabilities = capabilities;
                $ctrl.isPrintOnly = $ctrl.capabilities.isPrintOnly;
                $ctrl.modalService = modalService;
                $ctrl.showMenus = ($ctrl.connectService.connector === connectService.connectors.DocuShare) ? false : true;

                $ctrl.$onInit = function () {
                    if ($ctrl.connectService.connector === connectService.connectors.DocuShare) {
                        $ctrl.connectService.getLibraries(false, 1, "", "").then(function (data) {
                            $ctrl.showMenus = true;
                        }).catch(function (error) {
                            if (error.status === 424) {
                                $ctrl.showMenus = false;
                                $ctrl.modalService.showSimpleAlert('SDE_SUBSCRIPTION_EXPIRED1');
                            }
                        });
                    }
                    modalService.closeAllModals();
                    if (!$ctrl.isPrintOnly) {
                        $ctrl.connectService.checkScanDisabled().then(function (result) {
                            $ctrl.isPrintOnly = result;
                        });
                    } 
                    //To check ocr capability of the MFD
                    var eipVersion = device.eipVersion.split('.')[0];
                    if (eipVersion >= '5') {
                        onBoxOcrCapabilityService.getOnBoxOcrCapability().then(function (result) {
                            connectService.isOnBoxOcrCapable = result.isOnBoxOcrCapable;
                        });
                    }
                }

                $(".loading-spinner").hide();

                //Scan Popup
                $ctrl.enterScan = function () {
                    if (!$ctrl.isPrintOnly) {
                        if ($ctrl.connectService.displayName !== "") {
                            $state.go('scanScreen');
                        }
                        else {
                            modalService.showAlertBanner("SDE_PLEASE_WAIT_WHILE30");
                        }
                    }
                    else {
                        modalService.showAlertBanner("SDE_SCANNING_NOT_SUPPORTED");
                    }
                };
                //Print popup
                $ctrl.enterPrint = function () {
                    if ($ctrl.connectService.displayName !== "") {
                        $state.go('printScreen');
                    }
                    else {
                        modalService.showAlertBanner("SDE_PLEASE_WAIT_WHILE30");
                    }
                };
                //pivacy statement popup
                $ctrl.openPrivacy = function () {
                    $uibModal.open({ component: 'privacyPolicy' });
                }
            }
        });
