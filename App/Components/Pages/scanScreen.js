/* Copyright © 2022 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('scanScreen',
        {
            templateUrl: 'Scripts/App/Components/Pages/scanScreen.html',
            controller: function ($state, $document, modalService, scanOptionsService, scanService, connectService, loginService,
                $rootScope, device, $timeout, localStorageService, strings) {
                var $ctrl = this;
                $ctrl.rootScope = $rootScope;
                $ctrl.device = device;
                $ctrl.progress = null;
                scanService.destinationUrl = '/api/scan/process-image';
                $ctrl.scanValues = [];
                $ctrl.recipientList = [];
                $ctrl.mailto = "";
                $ctrl.loginService = loginService;
                $ctrl.format = /[\\/:*?"<>|';%^&#+`"]/;
                $ctrl.datetimeString = strings["SDE_DATE_TIME4"];
                //regex for the date time format  YYYY-MM-DD HH.mm.ss A
                $ctrl.dateTimeRegex = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]).[0-5][0-9].[0-5][0-9] [AaPp][Mm]/;
                // Some people consider exposing services directly on the scope to be bad form, but it's a convenient way
                // of setting up 2 way data-binding without having to have an intermediary data object that stores all
                // the properties we want to show and modify, since binding directly to scalar properties doesn't work properly.
                $ctrl.scanOptionsService = scanOptionsService;
                $ctrl.scanService = scanService;
                $ctrl.connectService = connectService;
                $ctrl.originalFileName;
                $ctrl.Invalid = false;
                $ctrl.fileValidationMessage = "";
                $ctrl.isValidFilename = true;
                $ctrl.loadTime = 3000, //Load the data every 3 second
                    $ctrl.loadPromise; //Pointer to the promise created by the Angular $timout service
                $ctrl.repoPath = "";
                $ctrl.isErrorOccured = false;
                $ctrl.enableEmail = true;
                              
                $ctrl.$onInit = function () {
                    $ctrl.resetScanWithoutMessage();
                    $ctrl.originalFileName = scanOptionsService.fileName;
                    connectService.security.Params = location.pathname.split('/')[3];
                    connectService.accountId = connectService.generateGUID();
                    $ctrl.openScanBrowseDirectory();

                    // If not eigth gen or 3rd gen browser, whenever scroll-container scrolls (its an accident, so scrolltop to 0)
                    if (!device.isEighthGen && !device.isThirdGenBrowser) {
                        $(".scroll-container").scroll(_.debounce(function () {
                            $(this).scrollTop(0);
                        }, 250, { leading: true })
                        );
                    }
                    //If the enable email feature is set to '1' then show the 'Email a copy' feature
                    $ctrl.enableEmail = localStorageService.getEnableEmailFeature() === '1' && connectService.customAppCapabilities().EmailAScanCopyEnabled;
                }
                // This is where your app would handle any authorization/login processes.
                $ctrl.auth = function () {
                    console.log('Login button clicked!');
                };

                //preview

                $ctrl.showPreview = function () {
                    if ($ctrl.scanOptionsService.fileFormat.selectedOption.value == 'xps') {
                        $ctrl.saveToServer();
                    }
                    else {
                        $ctrl.connectService.previewImages = [];
                        // if preview, then display preview before saving envelope
                        if (true) {
                            $ctrl.progress = modalService.showProgressAlert("SDE_GENERATING_PREVIEW");
                            $ctrl.connectService.getPreviewImages().then(function (data) {
                                if ($ctrl.connectService.previewImages.length > 0) {
                                    $ctrl.connectService.previewImages = $ctrl.connectService.previewImages.concat(data);
                                }
                                else {
                                    $ctrl.connectService.previewImages = data;
                                }
                                modalService.showPreview("SDE_PREVIEW", $ctrl.connectService.previewImages).result.then(function (previewResult) {
                                    $ctrl.saveToServer();
                                    // shows the info alert for Microsoft formats saying that the scanning and conversion may take time
                                    $ctrl.scanBannerNotification($ctrl.scanValues.fileFormat);
                                }).catch(function (error) {
                                    //TODO DELETE IMAGE IF PREVIEW CANCELED/FAILED
                                    /// Preview canceled
                                    console.log("Delete Images");
                                    //userService.clearDocuments();
                                });
                                // Free up data to prevent browser crash
                                data = null;
                                $ctrl.progress.close();
                            }).catch(function (error) {
                                $ctrl.progress.close();
                                modalService.showSimpleAlert('SDE_IMAGE_PREVIEW_FAILED', 'SDE_PLEASE_TRY_AGAIN2');
                                console.log("Error getting preview " + error);
                            });
                        } else {
                            $ctrl.saveToServer();
                        }
                    }
                };
                //reset the scan settings
                $ctrl.reset = function () {
                    $ctrl.resetScanWithoutMessage();
                    modalService.showAlertBanner("SDE_SCAN_RESET");
                };
                $ctrl.resetScanWithoutMessage = function () {
                    $ctrl.mailto = "";
                    $ctrl.scanOptionsService.resetScanDefaults($ctrl.originalFileName);
                    //date and time place holder is also localized now - 32941
                    $ctrl.connectService.contentName = "{0} {1}{2}".format(strings["SDE_XEROX_SCAN"],$ctrl.datetimeString, $ctrl.scanOptionsService.fileFormat.selectedOption.title);
                    $ctrl.isValidFilename = true;
                    $ctrl.setOutfocusCss();
                };
                //Save to Repo Params mapping
                $ctrl.mapSaveToRepoParms = function () {
                    $ctrl.connectService.recipientList = [];
                    $ctrl.connectService.contentName = scanOptionsService.fileName + $ctrl.scanOptionsService.fileFormat.selectedOption.title;
                    $ctrl.connectService.selectedLanguage = scanOptionsService.getValues().language;
                    $ctrl.repoPath = "";
                    connectService.breadCrumbs.forEach(function (item) {
                        if (!item.IsSite) {
                            $ctrl.repoPath = $ctrl.repoPath + item.Name;
                        }
                    });
                    $ctrl.repoPath = $ctrl.repoPath + connectService.currentData.CurrentFolderName;
                    if ($ctrl.mailto != "") {
                        $ctrl.connectService.recipientList.push($ctrl.mailto);
                    }
                };

                //Save to the server
                $ctrl.saveToServer = function () {
                    $ctrl.progress = modalService.showProgressAlert("SDE_SENDING_FMTSTR", null, "AppName");
                    $ctrl.mapSaveToRepoParms();
                    $ctrl.handleScanProgress();
                    connectService.uploadDocument($ctrl.repoPath);
                };

                $ctrl.scanCompletion = function () {
                    if ($ctrl.progress) {
                        $ctrl.progress.close();
                    }
                    $ctrl.progress = null;                    
                    $ctrl.progress = modalService.showProgressAlert("SDE_COMPLETED", "", "", true);
                    //onscancompletion, display the last scanned filename and instead of actual date and time, display date time placeholder 
                    var fileName = $ctrl.connectService.contentName.replace($ctrl.dateTimeRegex, '');
                    //getting the position of selected file extension to remove the last occurence of the extension as filename may contain the  extension prefixex with dot -20686
                    var titlePos = fileName.lastIndexOf($ctrl.scanOptionsService.fileFormat.selectedOption.title);
                    fileName = fileName.slice(0, titlePos);
                    $ctrl.connectService.contentName = "{0}{1}{2}".format(fileName, $ctrl.datetimeString, $ctrl.scanOptionsService.fileFormat.selectedOption.title);
                   
                };

                $ctrl.scanErrorHandle = function (error) {
                    connectService.showGenericError(error);
                    $ctrl.resetScanWithoutMessage();
                    $ctrl.progress.close();
                }

                $ctrl.openScanBrowseDirectory = function (resumeBrowse) {
                    modalService.showScanFileBrowser("SDE_BROWSE", resumeBrowse).result.then(function () {

                    }).catch(function () {
                        $state.go("homeScreen");
                    });
                };
                $ctrl.validateScanFileName = function () {
                     //32979 - disable scan button if filename is invalid
                    $ctrl.scanButtonDisabled = false;
                    $ctrl.isValidFilename = true;
                    var fileName = $ctrl.connectService.contentName.split(' {0}'.format($ctrl.datetimeString))[0];
                    //After pressing the scan button it will be a real date and time value instead of the string '[Date & Time]' in the contentName variable
                    if ($ctrl.connectService.contentName != undefined && $ctrl.IsDateTimeAddedWithcontentName()) {
                        var fileName = $ctrl.connectService.contentName.replace($ctrl.dateTimeRegex, '').replace($ctrl.scanOptionsService.fileFormat.selectedOption.title, '').replace(/^\s+|\s+$/g, '');
                        if (fileName.length > 41) {
                            $ctrl.fileValidationMessage = "SDE_HAVE_REACHED_MAXIMUM2";
                            $ctrl.isValidFilename = false;
                            $ctrl.scanButtonDisabled = true;
                            return true;
                        }
                    }
                    else {
                        if (fileName.length == 0) {
                            $ctrl.fileValidationMessage = "SDE_ENTER_FILE_NAME2";
                            $ctrl.isValidFilename = false;
                            $ctrl.scanButtonDisabled = true;
                            return true;
                        }
                        if ($ctrl.connectService.selectedScanFolderContents.some(
                            function (item) { return item.Name == $ctrl.connectService.contentName + $ctrl.scanOptionsService.fileFormat.selectedOption.title })) {
                            $ctrl.fileValidationMessage = "SDE_FILE_SAME_NAME1";
                            $ctrl.isValidFilename = false;
                            return true;
                        }
                        if ($ctrl.format.test(fileName)) {
                            $ctrl.fileValidationMessage = "SDE_PLEASE_ENTER_ONLY2";
                            $ctrl.isValidFilename = false;
                            $ctrl.scanButtonDisabled = true;
                            return true;
                        }
                        if (fileName.length == 41) {
                            //$ctrl.isValidFilename is no need to set here, since 41 is valid length for scan file name
                            //Once user entered 41 character, shows a warning message and HTML will block to enter more character
                            //Total length of scan file name is 41 + [Date and Time] = 64
                            $ctrl.fileValidationMessage = "SDE_HAVE_REACHED_MAXIMUM2";
                            return true;
                        }
                        if (fileName.length > 41) {
                            $ctrl.fileValidationMessage = "SDE_HAVE_REACHED_MAXIMUM2";
                            $ctrl.isValidFilename = false;
                            $ctrl.scanButtonDisabled = true;
                            return true;
                        }
                    }
                   
                    return false;
                   
                };
                //32979 - update the css , when user edits the file name field. 
                $ctrl.setInfocusCss = function () {
                    if ($ctrl.isValidFilename) {
                        $ctrl.btnStyle = "background-white";
                        $ctrl.txtStyle = "background-white";
                    }
                    else {
                        $ctrl.btnStyle = "btn-error-alert";
                        $ctrl.txtStyle = "txt-error-alert";
                    }
                };

                $ctrl.setOutfocusCss = function () {
                  
                    if ($ctrl.isValidFilename) {
                        $ctrl.btnStyle = "background-transparent";
                        $ctrl.txtStyle = "background-transparent";
                    }
                    else {
                        $ctrl.btnStyle = "outfocus-btn-err-alert";
                        $ctrl.txtStyle = "outfocus-txt-err-alert";
                    }
                };


                $ctrl.goBack = function () {
                    $state.go('homeScreen');
                };

                $ctrl.openFeaturePopover = function (feature) {
                    if (feature == "email") {
                        return;
                    }
                    modalService.showPopover(feature, event).result.then(function (data) {
                        $ctrl.connectService.contentName = $ctrl.connectService.contentName.split('.').slice(0, -1).join('.');
                        $ctrl.connectService.contentName = $ctrl.connectService.contentName + $ctrl.scanOptionsService.fileFormat.selectedOption.title;

                    });
                };
                //Open email popup
                $ctrl.openEmailPopover = function () {
                    modalService.showEmailPopover($ctrl.mailto).result.then(function (data) {
                        $ctrl.mailto = data.email || '';
                    }).catch(function () {

                    });
                };
                //To Scan
                $ctrl.scan = function () {
                    $ctrl.connectService.previewImages = [];
                    connectService.accountId = connectService.generateGUID();
                    connectService.fileIds = [];                   
                    connectService.pdfCompatibility = $ctrl.getPdfompatability();
                    //replaces the datetime placeholder 
                    $ctrl.ReplaceDateTimeWithContentName(); 
                    connectService.isDocConversion = $ctrl.getIsDocConversion();
                   
                    $ctrl.scanValues = scanOptionsService.getValues();
                    //for XPS format, the preview feature will be undefined , so updating the preview value to false for ease of use
                    $ctrl.scanValues.preview = $ctrl.scanValues.preview === undefined ? false : $ctrl.scanValues.preview;
                    connectService.fileIds.push(connectService.generateGUID());
                    $ctrl.mapSaveToRepoParms();
                    $ctrl.progress = modalService.showProgressAlert("SDE_SCANNING_DOCUMENT");
                    $ctrl.isErrorOccured = false;
                    if ($ctrl.scanValues.preview == false) {
                        $ctrl.handleScanProgress();
                        // shows the info alert for Microsoft formats saying that the scanning and conversion may take time
                        $ctrl.scanBannerNotification($ctrl.scanValues.fileFormat);
                    }
                   
                    connectService.saveToAzureTable($ctrl.repoPath).then(function () {                        
                        scanService.scan(scanOptionsService.getValues()).then(function (doneScanning) {
                            if ($ctrl.scanValues.preview != false) {
                                $ctrl.progress.close();
                                $ctrl.showPreview();
                            }
                        }).catch(function (detail) {
                            $ctrl.progress.close();
                            //kill the existing time out created for scan statuscheck
                            //without killing the loadPromise timer it will get called in certain interval and the Progress Modal will show on top of other screens until the timer canceled.
                            if ($ctrl.loadPromise) {
                                $timeout.cancel($ctrl.loadPromise);
                            }
                            $ctrl.isErrorOccured = true;
                            if (detail && detail.message === 'Input size not determined') {
                                modalService.showSimpleAlert('SDE_INPUT_SIZE_NOT1');
                            } else if (detail && detail.message === 'Scan Job Aborted By System') {
                                modalService.showSimpleAlert('SDE_JOB_ABORTED');
                            } else if (detail && detail.message === 'A security IR mark was detected on the original') {  
                                modalService.showSimpleAlert('SDE_JOB_DELETED', 'SDE_SECURITY_DOCUMENT_DETECTED');
                            } else if (detail && detail.message === 'Error sending template to device') {  
                                modalService.showSimpleAlert('SDE_ERROR_ACCESSING_TEMPLATE');
                            } else {
                                modalService.showSimpleAlert('SDE_SCANNED_DOCUMENT_NOT4', 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3', null, 'AppName');
                            }
                            connectService.deleteScanRecord(connectService.accountId);
                        });
                    }).catch(function (error) {
                        $ctrl.isErrorOccured = true;
                        $ctrl.scanErrorHandle(error);
                    });
                };

                //Show alert on microsoftformats
                $ctrl.scanBannerNotification = function (fileformat) {
                    if (fileformat == "xlsx" || fileformat == "pptx" || fileformat == "docx") {
                        modalService.showAlertBanner("SDE_JOB_MAY_TAKE", 5000);
                    }
                }

                $ctrl.getIsDocConversion = function () {
                    if (!connectService.isOnBoxOcrCapable) {
                        switch ($ctrl.scanOptionsService.fileFormat.selectedOption.value) {
                            case 'pdf':
                                {
                                    var isSearchable = _.find(scanOptionsService.fileFormat.subFeatures, { 'name': 'searchableText' });
                                    if (isSearchable.selectedOption.value === 'SEARCHABLE_IMAGE') {
                                        return true;
                                    }
                                    return false;
                                }
                            default:
                                return false;
                        }
                    }
                    return false;
                }

                $ctrl.getPdfompatability = function () {
                    switch ($ctrl.scanOptionsService.fileFormat.selectedOption.value) {
                        case 'pdf':
                            {
                                var isArchival = _.find($ctrl.scanOptionsService.fileFormat.subFeatures, {
                                    name: "archivalFormat"
                                });
                                if (isArchival && isArchival.selectedOption.value) {
                                    return 'PdfA1a';
                                }
                                return 'Pdf16';
                            }
                        default:
                            return 'Pdf16';
                    }
                }

                //To handle the progress icon in screen 
                $ctrl.handleScanProgress = function () {

                    if (!$ctrl.isErrorOccured) {
                        $ctrl.loadPromise = $timeout(function () {
                            //ensure there is no error before checking scanstatus to avoid scanstatus modal as overlay
                            if (!$ctrl.isErrorOccured) {
                                connectService.getScanStatus().then(function (result) {
                                    if ($ctrl.progress) {
                                        $ctrl.progress.close();
                                        switch (result) {
                                            case "Processing":
                                                //kill the existing time out created for scan statuscheck
                                                $timeout.cancel($ctrl.loadPromise);
                                                $ctrl.progress = modalService.showProgressAlert("SDE_SCANNING_DOCUMENT");
                                                $ctrl.handleScanProgress();
                                                break;
                                            case "SavetoRepo":
                                                //kill the existing time out created for scan statuscheck
                                                $timeout.cancel($ctrl.loadPromise);
                                                $ctrl.progress = modalService.showProgressAlert("SDE_SENDING_FMTSTR", null, "AppName");
                                                $ctrl.handleScanProgress();
                                                break;
                                            case "Completed":
                                                $ctrl.scanCompletion();
                                                $timeout.cancel($ctrl.loadPromise);
                                                break;
                                            case "Error":
                                                modalService.showSimpleAlert('SDE_SCANNED_DOCUMENT_NOT4', 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3', null, 'AppName');
                                                $timeout.cancel($ctrl.loadPromise);
                                                break;
                                        }
                                    }
                                }).catch(function (error) {
                                    $timeout.cancel($ctrl.loadPromise);
                                });
                            }
                        }, $ctrl.loadTime);
                    }
                    else {
                        $ctrl.progress.close();
                        //kill the existing time out created for scan statuscheck
                        //without killing the loadPromise timer it will get called in certain interval and the Progress Modal will show on top of other screens until the timer canceled.
                        if ($ctrl.loadPromise) {
                            $timeout.cancel($ctrl.loadPromise);
                        }
                    }
                };

                var listener = $ctrl.rootScope.$on('scanJobSubmitted', scanJobSubmitted)

                function scanJobSubmitted($event, item) {
                    if (item.jobId != null) {
                        $ctrl.connectService.jobId = item.jobId;
                        var dvcJobId = item.jobId.indexOf(":") != -1 ? item.jobId.split(":")[1] : item.jobId;
                        connectService.updateJobIdScanRecord(connectService.accountId, dvcJobId);
                    }
                    else {
                        $ctrl.connectService.jobId = "";
                    }
                }
                $ctrl.switchToPrint = function () {
                    $state.go("printScreen");
                };

                var captureScanPress = function (event) {
                    if (event !== null) {
                        if (event.which === "4098") {
                            $ctrl.scan();
                        }
                    }
                };

                // Capture start button on the device
                $document.on('keyup', captureScanPress);


                //Capture tap event 
                //Directive 'editable-field' defined this event in HTML
                //this function call file validation and focus out event handler
                $ctrl.tapFocusout = function () {
                    $ctrl.validateScanFileName();
                    focusOutEventHandler();
                }


                //focusin event after tap event                
                //Directive 'editable-field' defined this event in HTML
                //this function call focus in event handler
                $ctrl.tapFocusin = function () {
                   focusInEventHandler();
                }

                //Common event handler for 'tap' and FOCUSOUT
                //Event get fired user enetered file name for scan amd click or tap out side of textbox
                function focusOutEventHandler() {
                    if ($ctrl.connectService.contentName.length == 0) {
                        $ctrl.connectService.contentName = "{0} {1}{2}".format(strings["SDE_XEROX_SCAN"], $ctrl.datetimeString, $ctrl.scanOptionsService.fileFormat.selectedOption.title);
                        $ctrl.isValidFilename = true;
                        $ctrl.setOutfocusCss();
                        return;
                    }
                    else if (!$ctrl.isValidFilename) {
                        if (!$ctrl.connectService.contentName.includes($ctrl.datetimeString))
                        $ctrl.connectService.contentName = "{0} {1}{2}".format($ctrl.connectService.contentName, $ctrl.datetimeString, $ctrl.scanOptionsService.fileFormat.selectedOption.title);
                        $ctrl.setOutfocusCss();
                        return;
                    }
                    else {
                        //checks if the datetime is already added and if not added adds the placeholder
                        //Checking existance of '[Date & Time]' in file name is essential, because this event may call multiple time
                        //if event called multiple times then multiple '[Date & Time]' get updated in file name
                        if (!$ctrl.IsDateTimeAddedWithcontentName() && !_.includes($ctrl.connectService.contentName, $ctrl.datetimeString)) {
                            $ctrl.connectService.contentName = "{0} {1}{2}".format($ctrl.connectService.contentName, $ctrl.datetimeString, $ctrl.scanOptionsService.fileFormat.selectedOption.title);
                        }
                        $ctrl.setOutfocusCss();
                    }
                   
                }

                //Common event handler for 'tap' and FOCUSIN
                //User enable editing by click or tap on filename 
                function focusInEventHandler() {
                    //remove the existing datetime and add [Date & Time] placeholder
                    if ($ctrl.IsDateTimeAddedWithcontentName()) {
                        $ctrl.ReplaceDateTimeWithContentName()
                    }
                    $ctrl.connectService.contentName = $ctrl.connectService.contentName.split(' {0}'.format($ctrl.datetimeString))[0];
                }

                $ctrl.$onDestroy = function () {
                    $document.off('keyup', captureScanPress);
                    if (!device.isEighthGen && !device.isThirdGenBrowser) {
                        $(".scroll-container").off("scroll");
                    }
                    listener();
                    changeFileName();
                };

                               
                $("INPUT").focusout(function () {
                    focusOutEventHandler();
                });

                $("INPUT").focusin(function () {
                    focusInEventHandler();
                });

                var changeFileName = $ctrl.rootScope.$on('updateFileName', updateFileName)
                function updateFileName($event, item) {
                    if (item.value == 'xps' && scanOptionsService.scanFeatures[0].name == 'preview') {
                        scanOptionsService.scanFeatures[0].selectedOption = false;
                    }
                    $ctrl.connectService.contentName = $ctrl.connectService.contentName.split('.').slice(0, -1).join('.');
                    $ctrl.connectService.contentName = $ctrl.connectService.contentName + item.title;
                }
                $ctrl.IsDateTimeAddedWithcontentName = function () {
                    //search for the content name if datetime is already exists
                    var regexMatch = $ctrl.connectService.contentName.search($ctrl.dateTimeRegex);
                    //return true only if date time is already exists
                    return regexMatch > 0;
                }
                //replaces the existing datetime by matching the regex with [Date & Time] place holder.
                $ctrl.AddDateTimePlaceHolder = function () {
                    $ctrl.connectService.contentName = $ctrl.connectService.contentName.replace($ctrl.dateTimeRegex, $ctrl.datetimeString);
                }

                $ctrl.ReplaceDateTimeWithContentName = function () {
                    if ($ctrl.IsDateTimeAddedWithcontentName()) {
                        $ctrl.AddDateTimePlaceHolder()
                    }
                    // Replace [Date & Time] with current date/time and remove file extension (it will be provided in /api/scan/process-image call)
                    scanOptionsService.fileName = $ctrl.connectService.contentName.replace($ctrl.datetimeString, moment(new Date()).format("YYYY-MM-DD HH.mm.ss A"));
                    //getting the filetype extension position to remove the last occurence of extension if filename input contains dot fileextension. - 20686
                    var titlePos = scanOptionsService.fileName.lastIndexOf($ctrl.scanOptionsService.fileFormat.selectedOption.title);
                    scanOptionsService.fileName = scanOptionsService.fileName.slice(0, titlePos);
                }

                //#region Commented region Obsolete Methods
                //$ctrl.abbyyStatusCheckandSave = function (path, abbyyTaskId) { 
                //    $ctrl.loadPromise = $timeout(function () {
                //        connectService.saveToRepoAbbyy(path, abbyyTaskId).then(function (result) {
                //            if (result.data) {
                //                $ctrl.abbyyStatusCheckandSave(path, result.data);
                //            }
                //            else {
                //                $ctrl.scanCompletion();
                //                $timeout.cancel($ctrl.loadPromise);
                //            }
                //        }).catch(function (error) {
                //            $ctrl.scanErrorHandle(error);
                //            $timeout.cancel($ctrl.loadPromise);
                //        });
                //    }, $ctrl.loadTime);
                //};
                //#endregion
            }
        });
