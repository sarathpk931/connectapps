/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('printScreen',
        {
            templateUrl: 'Scripts/App/Components/Pages/printScreen.html',
            controller: function ($document, $state, modalService, printOptionsService, printService, connectService, loginService, device, capabilities) {
                var $ctrl = this;
                $ctrl.device = device;
                $ctrl.progress = null;
                $ctrl.userName = "";
                $ctrl.loginService = loginService;
                $ctrl.capabilities = capabilities;
                $ctrl.isPrintOnly = $ctrl.capabilities.isPrintOnly;
                // Some people consider exposing services directly on the scope to be bad form, but it's a convenient way
                // of setting up 2 way data-binding without having to have an intermediary data object that stores all
                // the properties we want to show and modify, since binding directly to scalar properties doesn't work properly.
                $ctrl.printOptionsService = printOptionsService;
                $ctrl.connectService = connectService;
                $ctrl.copies = _.find($ctrl.printOptionsService.printFeatures, { 'name': 'quantity' }).selectedOption.value;

                // This is where your app would handle any authorization/login processes.
                $ctrl.auth = function () {
                    console.log('Login button clicked!');
                };
                $ctrl.$onInit = function () {
                    $ctrl.resetPrintWithoutMessage();
                    $ctrl.openPrintBrowseDirectory();
                    // If not eigth gen or 3rd gen browser, whenever scroll-container scrolls (its an accident, so scrolltop to 0)
                    if (!device.isEighthGen && !device.isThirdGenBrowser) {
                        $(".scroll-container").scroll(_.debounce(function () {
                            $(this).scrollTop(0);
                        }, 250, { leading: true })
                        );
                    }
                    if (!$ctrl.isPrintOnly) {
                        $ctrl.connectService.checkScanDisabled().then(function (result) {
                            $ctrl.isPrintOnly = result;
                        });
                    }
                }
                //initial file browsing component calling
                $ctrl.openPrintBrowseDirectory = function () {
                    modalService.showPrintFileBrowser("SDE_BROWSE", null).result.then(function () {
                        // $ctrl.openMetadataForm();
                    }).catch(function () {
                        $state.go("homeScreen");
                    });
                };
                //Open printlist to add more than one doc to print
                $ctrl.openPrintList = function () {
                    modalService.showPrintList("SDE_PRINT_LIST", null).result.then(function () {

                    }).catch(function () {
                        $state.go("homeScreen");
                    });
                };

                $ctrl.goBack = function () {
                    $state.go('homeScreen');
                };
                $ctrl.switchToScan = function () {
                    $state.go("scanScreen");
                };
                $ctrl.openFeaturePopover = function (feature) {
                    modalService.showPopover(feature, event);
                };
                $ctrl.openPrintList = function () {
                    modalService.showPrintList("SDE_PRINT_LIST", null).result.then(function () {

                    }).catch(function () {
                        $state.go("homeScreen");
                    });
                };
                //For printing selected files
                $ctrl.startPrint = function () {
                    _.find($ctrl.printOptionsService.printFeatures, { 'name': 'quantity' }).selectedOption.value = $ctrl.copies;

                    printService.totalJobs = connectService.selectedDocsForPrint.length;
                    printService.jobNumber = 1;
                    printService.displayStatus = false;
                    connectService.accountId = connectService.generateGUID();
                    $ctrl.progress = modalService.showProgressAlert("SDE_PROCESSING");
                    //modalService.showAlertBanner("SDE_CONVERTING1", 300000);
                    var docsNeedConverting = connectService.selectedDocsForPrint.length;
                    connectService.selectedDocsForPrint.forEach(function (selectedDoc) {
                        selectedDoc.FileId = connectService.generateGUID();
                        var path = "";

                        //Previously this checking was only for IsSite, as a part of the Icon Change feature,
                        //site values are now taking based on the connecters and for all the connectors other than 365 Onedrive the site value is false to see the method  $ctrl.getisSitevalue()
                        //so to avoid the root folder taking from the bread crump, we have to remove the 1st item in the breadcrumb which will be the root folder name

                        connectService.breadCrumbs.forEach(function (item) {
                            if (!item.IsSite && (connectService.breadCrumbs.length > 0 && connectService.breadCrumbs[0].Name != item.Name)) {
                                path = path + item.Name;
                            }
                        });
                        var data = JSON.stringify({
                            'SitePath': $ctrl.getSitePath(selectedDoc.FullPath, connectService.currentData.Connector),
                            'Connector': connectService.currentData.Connector,
                            'Token': connectService.currentData.Token,
                            'OAuthToken': connectService.currentData.OAuthToken,
                            'FileName': selectedDoc.Name,
                            'filePath': $ctrl.getFilePath(selectedDoc.FullPath, connectService.currentData.Connector) + "/" + selectedDoc.Name,
                            'FileId': selectedDoc.Id
                        });
                        //The below object structure is used for calling new Middleware API

                        //var data = JSON.stringify({
                        //    'Connector': connectService.currentData.Connector,
                        //    'Token': connectService.currentData.Token,
                        //    'OAuthToken': connectService.currentData.OAuthToken,
                        //    'SiteId': connectService.requestParams.SiteId,
                        //    'LibraryId': connectService.requestParams.LibraryId,
                        //    'filePath': selectedDoc.Name,
                        //    'FileId': selectedDoc.Id
                        //});
                        var docUrl = encodeURI(data);
                        if (selectedDoc.NativePrint) {
                            connectService.getNativePrintUrl(docUrl).then(function (response) {
                                docsNeedConverting -= 1;
                                if (docsNeedConverting === 0) {
                                    printService.displayStatus = true;
                                }
                                printService.filename = selectedDoc.Name; //For getting correct job name when multiple files are printed together
                                printService.printJobUrl = location.origin + "/api/print/getFile?connector=" + connectService.currentData.Connector + "&amp;id=" + response;
                                printService.printJob(printOptionsService.getValues());
                            }).catch(function (error) {
                                //Decrease the total number of jobs by one if conversion failed.
                                printService.totalJobs -= 1;
                                modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
                                console.log(error);
                            });
                        } else {
                            connectService.startConversion(docUrl).then(function (jobId) {
                                var tryGetPrintUrl = function (triesLeft) {
                                    if (triesLeft < 5) {
                                        console.log("Get Print Url Failed after 5 mins");
                                        $ctrl.loadPrintFailError();
                                    } else {
                                        connectService.getConvertedPrintUrl(jobId).then(function (response) {
                                            // Check for PrintUrl
                                            if (response.length > 0 && response[0].PrintUrl) {
                                                // Got PrintUrl, send to printer
                                                docsNeedConverting -= 1;
                                                if (docsNeedConverting === 0) {
                                                    printService.displayStatus = true;
                                                }
                                                printService.printJobUrl = response[0].PrintUrl;
                                                //For getting file name
                                                printService.filename = response[0].ConversionSessionParts[0].FileName;
                                                printService.printJob(printOptionsService.getValues());

                                                // TODO Fix Reset of print defaults (after all docs print)
                                                // printOptionsService.resetPrintDefaults();
                                                // $ctrl.copies = _.find($ctrl.printOptionsService.printFeatures, { 'name': 'quantity' }).selectedOption.value;
                                            } else {
                                                // PrintUrl not ready wait 5 seconds and try again
                                                triesLeft = triesLeft - 1;
                                                _.delay(function () { tryGetPrintUrl(triesLeft); }, 5000);
                                            }
                                        }).catch(function (error) {
                                            modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
                                            console.log(error);
                                        });
                                    }
                                };
                                // try to get print url up to 30 times (2.5 mins)
                                tryGetPrintUrl(30);
                                if ($ctrl.progress) {
                                    modalService.showProgressAlert("SDE_CONVERTING1", "SDE_CONNECTED_CLOUD_SERVICE");
                                    $ctrl.progress = null;
                                }
                            }).catch(function (error) {
                                //Decrease the total number of jobs by one if conversion failed.
                                printService.totalJobs -= 1;
                                modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
                                console.log(error);
                            });
                        }
                    });

                    $(".loading-spinner").hide();
                };

                $ctrl.loadPrintFailError = function () {
                    modalService.closeAllModals();
                    modalService.showSimpleAlert('SDE_PRINTING_ERROR_OCCURRED', 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
                };

                $ctrl.launchQuantity = function () {
                    modalService.openComponentModal('keypad', { value: $ctrl.copies }).result.then(function (copies) {
                        if (copies) {
                            $ctrl.copies = copies;
                        }
                    });
                };

                var captureStartPress = function (event) {
                    if (event !== null) {
                        if (event.which === "4098") {
                            $ctrl.startPrint();
                        }
                    }
                };
                //reset the print Settings
                $ctrl.reset = function () {
                    printOptionsService.resetPrintDefaults();
                    $ctrl.copies = _.find($ctrl.printOptionsService.printFeatures, { 'name': 'quantity' }).selectedOption.value;
                    modalService.showAlertBanner("SDE_PRINT_RESET");
                };
                $ctrl.resetPrintWithoutMessage = function () {
                    printOptionsService.resetPrintDefaults();
                    $ctrl.copies = _.find($ctrl.printOptionsService.printFeatures, { 'name': 'quantity' }).selectedOption.value;
                };
                // Capture start button on the device
                $document.on('keyup', captureStartPress);

                //Returns file path from full path based on the connector
                $ctrl.getFilePath = function (fullPath, connectorName) {
                    var filePath = fullPath;
                    //If the connector is O365 remove site name from full file path
                    if (connectorName.toLowerCase() === connectService.connectors.Office365.toLowerCase()) {
                        filePath = filePath.replace(/^.+?\|/, '').replace(/\|/g, '/');
                    }
                    return filePath.indexOf('/') === 0 && filePath.length > 1 ? filePath.substring(1) : filePath;
                };
                //Returns site path from full path, for all connectors except O365 the site path will be null
                $ctrl.getSitePath = function (fullPath, connectorName) {
                    var sitePath = null;
                    //If the connector is O365 remove file path from full file path
                    if (connectorName.toLowerCase() === connectService.connectors.Office365.toLowerCase()) {
                        var matches = fullPath.match(/^.+?(?=\|)/);
                        if (matches.length > 0) {
                            sitePath = matches[0].replace('/{followedSites}', '').replace('/{mysite}', '').replace('/{teamsite}', '');
                        }
                    }
                    return sitePath;
                };

                $ctrl.$onDestroy = function () {
                    //this will clear the selected documents in print list if any, to solve bug -13723 -when landing page is configured.
                    $ctrl.connectService.selectedDocsForPrint = [];
                    console.log("Destroying printScreen.");
                    $document.off('keyup', captureStartPress);
                    if (!device.isEighthGen && !device.isThirdGenBrowser) {
                        $(".scroll-container").off("scroll");
                    }
                };
            }
        });
