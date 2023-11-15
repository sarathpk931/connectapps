/* Copyright © 2021 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular.module('app').component('printFileBrowser', {
    templateUrl: 'Components/Pages/printFileBrowser.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },

    controller: function ($scope, connectService, modalService, $state, $rootScope, strings, capabilities, loginService, localStorageService, $interval) {
        var $ctrl = this;
        $ctrl.showSelectAll = false;
        $ctrl.searchText = "";
        $ctrl.disablePreviewFormats = ["pcl", "xps"];
        var $ctrl = this;
        $ctrl.showSpin = false;
        $ctrl.isBackButtonVisible = true;
        $ctrl.connectService = connectService;
        $ctrl.getisSitevalue = function () {
            switch ($ctrl.connectService.connector) {
                case $ctrl.connectService.connectors.GoogleDrive:
                case $ctrl.connectService.connectors.Dropbox:
                case $ctrl.connectService.connectors.DocuShare:
                case $ctrl.connectService.connectors.Box:
                    return false;
                default:
                    return true;
            }
        };
        $ctrl.selectedFolder = { Name: strings["AppName"], IsSite: $ctrl.getisSitevalue() };
        $ctrl.breadCrumbs = [];
        $ctrl.currentFolders = [];

        $ctrl.modalService = modalService;
        $ctrl.rootScope = $rootScope;
        $ctrl.showSelectAll = false;
        $ctrl.allSeleted = false;
        $ctrl.filterTerm = '';
        $ctrl.AppName = strings["AppName"];
        //default selecetd folder icon for non Office 365 connectors
        $ctrl.connectService.selectedFolderIcon = $ctrl.connectService.glyphIconClass.folderGlyph;
        $ctrl.disableHomeButton = true;
        // Variable to hold the interval promise object which is used to show the spinner while searching
        var filterInterval;
        $ctrl.$onInit = function () {
            $ctrl.connectService.Feature = "Print";
            if ($ctrl.resolve.resumeBrowse) {

                //Use the details of folder from which the last file was selected
                if ($ctrl.connectService.previousPath != undefined && $ctrl.connectService.previousPath != "")
                    $ctrl.connectService.currentPath = $ctrl.connectService.previousPath;
                if ($ctrl.connectService.previousFolder != undefined && $ctrl.connectService.previousFolder != null)
                    $ctrl.connectService.selectedFolder = $ctrl.connectService.previousFolder;
                if ($ctrl.connectService.previousBreadCrumbs != undefined && $ctrl.connectService.previousBreadCrumbs != null)
                    $ctrl.connectService.breadCrumbs = angular.copy($ctrl.connectService.previousBreadCrumbs);

                $ctrl.breadCrumbs = $ctrl.connectService.breadCrumbs;
                if ($ctrl.connectService.selectedFolder != undefined) {
                    $ctrl.fetchData($ctrl.connectService.selectedFolder, "resume");
                } else {
                    $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
                    $ctrl.getFolders(false, "", "");
                }
            }
            //checks default landing page is not empty or not undefiend for Sharepoint
            else if ($ctrl.connectService.connector === connectService.connectors.Office365 && localStorageService.getDefaultLandingPage() != '' && localStorageService.getDefaultLandingPage() !== 'undefined') {
                var defaultLandingPage = localStorageService.getDefaultLandingPage();
                var defaultLandingPageArray = defaultLandingPage.split('/');
                $ctrl.breadCrumbs.push({ Name: strings["AppName"], IsSite: $ctrl.getisSitevalue() });
                $ctrl.selectedFolder = { Name: defaultLandingPageArray[defaultLandingPageArray.length - 1], IsSite: true };
                $ctrl.getFolders(true, btoa(defaultLandingPage), btoa(''));
            }
            else {
                $ctrl.connectService.breadCrumbs = [];
                $ctrl.connectService.selectedDocsForPrint = [];
                $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
                $ctrl.getFolders(false, "", "");
            }
        };

        $ctrl.navigateBackItem = function (item) {
            $ctrl.selectedFolder = $ctrl.breadCrumbs.pop();
            if ($ctrl.breadCrumbs.length === 0) {
                $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
                $ctrl.getFolders(false, "", "");
            }
            else {
                $ctrl.fetchData($ctrl.selectedFolder, "previous");
            }
        };
        //called when moving inside the selected folder
        $ctrl.navigateForward = function (item) {
            $ctrl.breadCrumbs.push($ctrl.selectedFolder);
            $ctrl.fetchData(item, "next");
        };

        $ctrl.fetchData = function (selectedItem, action) {
            $ctrl.connectService.setRequestParams(selectedItem);
            var FolderName = "";
            if (selectedItem.Name == $ctrl.connectService.sharePointFolders.teamSite) {
                FolderName = "mysite";
            }
            else if (selectedItem.Name == $ctrl.connectService.sharePointFolders.followedSites) {
                FolderName = "followedSites";
            }
            else if (selectedItem.IsDefaultSite) {
                var defaultLandingPage = localStorageService.getDefaultLandingPage()
                if ($ctrl.connectService.connector === connectService.connectors.Office365 && defaultLandingPage != '') {
                    var defaultLandingPageArray = defaultLandingPage.split('/');
                    $ctrl.selectedFolder = { Name: defaultLandingPageArray[defaultLandingPageArray.length - 1], IsSite: true };

                    $ctrl.connectService.currentPath = btoa(defaultLandingPage);
                    FolderName = '';
                }
            }
            else if (action != "next") {
                FolderName = action;
            }
            else {
                FolderName = selectedItem.EncodedName;
            }
            $ctrl.selectedFolder = selectedItem;
            $ctrl.connectService.selectedFolder = $ctrl.selectedFolder;
            $ctrl.getFolders(selectedItem.IsSite, $ctrl.connectService.currentPath, FolderName);
        };
        //to get the folders to browse
        $ctrl.getFolders = function (IsSite, ParentDir, FolderName) {
            $ctrl.setSelectedFolderIcon($ctrl.selectedFolder);
            $ctrl.showSpin = true;
            $ctrl.currentFolders = [];
            $ctrl.stopFiltering();
            $ctrl.connectService.getLibraries(IsSite, 2, ParentDir, FolderName).then(function (data) {
                $ctrl.showSpin = false;
                $ctrl.showSelectAll = false;
                $ctrl.connectService.currentData = data;
                $ctrl.connectService.currentPath = data.CurrentPath;
                $ctrl.currentFolders = data.Items;
                $ctrl.currentFolders.forEach(function (item) {
                    var fullPath = atob(data.CurrentPath);//used to filter or delete item from the seected list since there is no ID or Unique value coming out from Middleware.
                    //sinsce GraphSharepoint always retun a backslash along whith the current path so we are removing the last slash and this value is only used to check the slecetd files in print list.
                    if ($ctrl.connectService.connector === connectService.connectors.Office365)
                        item.FullPath = (fullPath != null && fullPath != undefined && fullPath != '' && fullPath.slice(-1) === '/') ? item.FullPath = fullPath.slice(0, -1) : fullPath;
                    else
                        item.FullPath = fullPath;
                    item["selected"] = false;
                    if (!item.IsSite && !item.IsFolder && !item.IsLibrary) {
                        //Setting the value of NativePrint here will allow App to print native files without using DCE, as well as improve the print workflow.
                        item.NativePrint = $ctrl.isFilePrintable(item);
                        //Enable items that are supported nativly by device
                        if (item.Disabled) {
                            item.Disabled = !item.NativePrint;
                        }
                        if ($ctrl.connectService.selectedDocsForPrint.length > 0 && containsObject(item, $ctrl.connectService.selectedDocsForPrint)) {
                            item["selected"] = true;
                        }
                        $ctrl.updateSelectedAll();
                    }
                });
                $ctrl.UpdateShowSelectAllButtonVisibility();
                if (data.Items.length == 0 && data.CurrentFolderName == $ctrl.connectService.sharePointFolders.followedSites) {
                    $ctrl.modalService.showAlertBanner("SDE_NO_FOLLOWED_SITES");
                }

            }).catch(function (error) {
                //Handels the 404 conditions, if the default landing page is not configured correctly of it is not present in the team site.
                if (error.status === 404 && error.data === "Landingpage NotFound") {
                    //gets the default laning page Display Name
                    if (localStorageService.getDefaultLandingPage() != '' || localStorageService.getDefaultLandingPage() !== 'undefined') {
                        var defaultSiteArray = localStorageService.getDefaultLandingPage().split('/');
                        $ctrl.modalService.showNoDefaultSiteAlert(strings.SDE_FMTSTR_CANNOT_BE12.format(defaultSiteArray[defaultSiteArray.length - 1]), 'SDE_CONTACT_APP_ADMINISTRATOR', 'SDE_CANCEL', 'SDE_CONTINUE', 'xrx-cancel', 'xrx-exit');
                    }
                }
                else {
                    $ctrl.modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
                    $ctrl.showSpin = false;
                }
            });
            $ctrl.checkSecolumndCssStatus();
        };
        $ctrl.getContentIcon = function (item) {
            if (item.Name === $ctrl.connectService.sharePointFolders.teamSite)
                return $ctrl.connectService.glyphIconClass.teamSiteGlyph;
            else if (item.IsFollowed)
                return $ctrl.connectService.glyphIconClass.followedSitesGlyph;
            else if (item.IsSite)
                return $ctrl.connectService.glyphIconClass.siteGlyph;
            else if (item.IsLibrary)
                return $ctrl.connectService.glyphIconClass.libraryGlyph;
            else if (item.IsCollection)
                return $ctrl.connectService.glyphIconClass.collectionGlyph;
            else
                return $ctrl.connectService.glyphIconClass.folderGlyph;
        }
        $ctrl.setSelectedFolderIcon = function (item) {

            //checks if the current folder is root folder, if yes home button willbe disabed
            if (item.Name == strings["AppName"] && item.IsSite == $ctrl.getisSitevalue())
                $ctrl.disableHomeButton = true;
            else
                $ctrl.disableHomeButton = false;
            if ($ctrl.connectService.connector === connectService.connectors.Office365) {
                if (item.Name === strings["AppName"]) {
                    $ctrl.connectService.selectedFolderIcon = $ctrl.connectService.glyphIconClass.MSOfficeGlyph;
                }
                else {
                    $ctrl.connectService.selectedFolderIcon = $ctrl.getContentIcon(item);
                }
            }

            if ($ctrl.connectService.connector === connectService.connectors.DocuShare) {
                if (item.Name == strings["AppName"] || item.IsCollection) {
                    $ctrl.connectService.selectedFolderIcon = $ctrl.connectService.glyphIconClass.collectionGlyph;
                }
                else if (item.IsFolder) {
                    $ctrl.connectService.selectedFolderIcon = $ctrl.connectService.glyphIconClass.folderGlyph;
                }
            }
        }

        $ctrl.checkSecolumndCssStatus = function () {
            if ($ctrl.isBackButtonVisible) {
                $ctrl.secondColumnCss = "column-offset-10-1 .column-10-51 column-5-c-51";
            }
            else {
                $ctrl.secondColumnCss = "column-10-63 column-5-c-63";
            }
        };
        //selct a document to print
        $ctrl.selectDocument = function (item) {

            if ($ctrl.cancelClick) {
                $ctrl.cancelClick = false;
            }
            else {
                item.selected = !item.selected;
                if (item.selected) {
                    $ctrl.connectService.selectedDocsForPrint.push(item);
                }
                else {
                    $ctrl.connectService.selectedDocsForPrint = $ctrl.connectService.selectedDocsForPrint.filter(function (ele) {
                        return (ele.FullPath + ele.Name != item.FullPath + item.Name);//removes or filter the correct file by full path.
                    });
                }
            }

            //Save the last selected file/folder details
            $ctrl.connectService.previousPath = $ctrl.connectService.currentPath;
            $ctrl.connectService.previousFolder = angular.copy($ctrl.selectedFolder);
            $ctrl.connectService.previousBreadCrumbs = angular.copy($ctrl.breadCrumbs);

            $ctrl.updateSelectedAll();
        };
        //selct all documents
        $ctrl.selectAll = function () {
            $ctrl.allSeleted = !$ctrl.allSeleted;
            if ($ctrl.allSeleted) {
                _.forEach($ctrl.currentFolders, function (item) {
                    if (!item.IsSite && !item.IsFolder && !item.IsLibrary && !item.Disabled) {
                        item.selected = true;
                        //remove the selected item if already exist to avoid duplication
                        $ctrl.connectService.selectedDocsForPrint = $ctrl.connectService.selectedDocsForPrint.filter(function (ele) {
                            return (ele.FullPath + ele.Name != item.FullPath + item.Name);//removes or filter the correct file by full path.
                        });
                        $ctrl.connectService.selectedDocsForPrint.push(item);
                    }
                });
            }
            else {
                _.forEach($ctrl.currentFolders, function (item) {
                    if (!item.IsSite && !item.IsFolder && !item.IsLibrary) {
                        item.selected = false;
                        $ctrl.connectService.selectedDocsForPrint = $ctrl.connectService.selectedDocsForPrint.filter(function (ele) {
                            return (ele.FullPath + ele.Name != item.FullPath + item.Name);//removes or filter the correct file by full path.
                        });
                    }
                });
                //$ctrl.connectService.selectedDocsForPrint = [];
            }
            $ctrl.updateSelectedAll();

            //Save the last selected file/folder details
            $ctrl.connectService.previousPath = $ctrl.connectService.currentPath;
            $ctrl.connectService.previousFolder = angular.copy($ctrl.selectedFolder);
            $ctrl.connectService.previousBreadCrumbs = angular.copy($ctrl.breadCrumbs);
        };

        $ctrl.searchFiles = function () {
            $ctrl.filtering = true;

            /* TODO Go back to search when we move to using search not filtering 
            modalService.showSearchFiles("SDE_SEARCHFILES", null).result.then(function () {

            }).catch(function () {
                $state.go("homeScreen");
                });
            $ctrl.closePrintPopup();
            */
        };

        $ctrl.stopFiltering = function () {
            $ctrl.searchTerm = "";
            $ctrl.filterTerm = "";
            $ctrl.filtering = false;
        };

        $ctrl.filter = function () {
            $ctrl.filterTerm = $ctrl.searchTerm;
            $ctrl.showSearchSpinner();
            if (typeof EIP_CloseEmbeddedKeyboard === 'function') {
                EIP_CloseEmbeddedKeyboard(); //dismiss device keyboard
            }
        };
        /*
       For showing the spinner while searching, we use angular interval to show the spinner, otherwise the UI would be blocked and no spinner would be visible.
       This method increase the limitTo property of ng-repeat every 100 milliseconds inside the angular interval method until it hits the current folders count.
       */
        $ctrl.showSearchSpinner = function () {
            $ctrl.showSpin = true;
            if (filterInterval != null && filterInterval != undefined) {
                $interval.cancel(filterInterval);
                filterInterval = undefined;
            }
            $scope.limitFolders = 1;
            filterInterval = $interval(function () {
                if ($scope.limitFolders > $ctrl.currentFolders.length) {
                    $interval.cancel(filterInterval);
                    filterInterval = undefined;
                    $ctrl.showSpin = false;
                }
                $scope.limitFolders += 10000;
            }, 100)
        }

        //to preview the selected document
        $ctrl.previewItem = function (item) {
            $ctrl.cancelClick = true; //Taking advantage of the fact this method triggers before $ctrl.selectDoc to cancel selection when previewing a document.
            $ctrl.progress = modalService.showProgressAlert("SDE_GENERATING_PREVIEW");
            connectService.selectedDocsForPreview = item;
            var path = "";
            $ctrl.breadCrumbs.forEach(function (item) {
                //Previously this checking was only for IsSite, as a part of the Icon Change feature,
                //site values are now taking based on the connecters and for all the connectors other than 365 Onedrive the site value is false to see the method  $ctrl.getisSitevalue()
                //so to avoid the root folder taking from the bread crump, we have to remove the 1st item in the breadcrumb which will be the root folder name
                if (!item.IsSite && ($ctrl.breadCrumbs.length > 0 && $ctrl.breadCrumbs[0].Name != item.Name)) {
                    path = path + item.Name;
                }
            });
            connectService.getPrintPreviewImages(item, path).then(function (data) {
                modalService.showPrintPreview("SDE_PREVIEW", data).result.then(function (previewResult) {
                    $ctrl.progress.close();
                    if (previewResult === "ok") {

                    }
                }).catch(function (error) {
                    $ctrl.progress.close();
                });
            }).catch(function (error) {
                $ctrl.progress.close();
                modalService.showSimpleAlert('SDE_IMAGE_PREVIEW_FAILED', 'SDE_PLEASE_TRY_AGAIN2');
                console.log("Error getting preview " + error);
            });
        };

        $ctrl.dismissPrintPopup = function () {
            if ($ctrl.filtering) {
                $ctrl.stopFiltering();
            } else {
                $ctrl.connectService.selectedDocsForPrint = [];
                $ctrl.dismiss();
            }
        };

        $ctrl.closePrintPopup = function () {
            $ctrl.connectService.breadCrumbs = [];
            $ctrl.connectService.breadCrumbs = $ctrl.breadCrumbs;
            $ctrl.close();
        };
        $ctrl.showBannerAlertOrClose = function (selectedDocumentCount) {
            if (selectedDocumentCount == 0) {
                modalService.showAlertBanner("SDE_SELECT_DOCUMENT1");
            }
            else {
                $ctrl.connectService.breadCrumbs = [];
                $ctrl.connectService.breadCrumbs = $ctrl.breadCrumbs;
                $ctrl.close();
            }
        };


        function containsObject(obj, list) {
            var hasfound = false;
            list.forEach(function (item) {
                //If same file name exists in diferent folder then comparing with only name will make some UI issue, 
                //to overcome this file name along with full path is validated
                if (obj.FullPath + obj.Name == item.FullPath + item.Name) {
                    hasfound = true;
                }
            });
            return hasfound;
        }

        // Determine if a file is printable based on its name, and supported pdls of the device
        $ctrl.isFilePrintable = function (file) {
            var fileName = file.Name || "";
            var extension = fileName.split('.').pop().toLowerCase();
            return _.find(capabilities.pdls, function (pdl) { return pdl === extension; }) ? true : false;
        };

        //update the selectAll status to show the glyp icon for each folder
        $ctrl.updateSelectedAll = function () {

            var allreadyExists = $ctrl.currentFolders.filter(function (item) {
                //Returns the list of items which is only valid to select but not selecetd.
                return (!item.IsSite && !item.IsFolder && !item.IsLibrary && !item.Disabled && !item.selected);

            });
            if (allreadyExists.length > 0) {
                $ctrl.allSeleted = false;
            }
            else if (allreadyExists.length == 0 && $ctrl.connectService.selectedDocsForPrint.length == 0) {
                $ctrl.allSeleted = false;
            }
            else {
                $ctrl.allSeleted = true;
            }

        }

        //Reset all and go to Repository root
        $ctrl.goToRepoHome = function () {
            //setting the root folder
            $ctrl.selectedFolder = { Name: strings["AppName"], IsSite: $ctrl.getisSitevalue() };
            //resetting the breadcrumbs
            $ctrl.breadCrumbs = [];
            $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
            $ctrl.setSelectedFolderIcon($ctrl.selectedFolder);
            $ctrl.showSpin = true;
            $ctrl.currentFolders = [];
            $ctrl.stopFiltering();
            $ctrl.connectService.repohome(false, 2, '', '', true).then(function (data) {
                $ctrl.showSpin = false;
                $ctrl.connectService.currentData = data;
                $ctrl.connectService.currentPath = data.CurrentPath;
                $ctrl.currentFolders = data.Items;
                $ctrl.connectService.selectedScanFolderContents = $ctrl.currentFolders;
                $ctrl.disableHomeButton = true;
                $ctrl.showSelectAll = false;
               
                $ctrl.currentFolders.forEach(function (item) {
                    item.FullPath = atob(data.CurrentPath);//used to filter or delete item from the seected list since there is no ID or Unique value coming out from Middleware.
                    item["selected"] = false;
                    if (!item.IsSite && !item.IsFolder && !item.IsLibrary) {
                        //Setting the value of NativePrint here will allow App to print native files without using DCE, as well as improve the print workflow.
                        item.NativePrint = $ctrl.isFilePrintable(item);
                        //Enable items that are supported nativly by device                   
                        if (item.Disabled) {                           
                            item.Disabled = !item.NativePrint;
                        }
                       
                        if ($ctrl.connectService.selectedDocsForPrint.length > 0 && containsObject(item, $ctrl.connectService.selectedDocsForPrint)) {
                            item["selected"] = true;
                        }
                        $ctrl.updateSelectedAll();
                    }
                });
                $ctrl.UpdateShowSelectAllButtonVisibility();
                if (data.Items.length == 0 && data.CurrentFolderName == $ctrl.connectService.sharePointFolders.followedSites) {
                    $ctrl.modalService.showAlertBanner("SDE_NO_FOLLOWED_SITES");
                }
                //$ctrl.refreshShadow();
            }).catch(function (error) {
                $ctrl.modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status + ".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3').result.then(function () {
                    $state.go("homeScreen");
                });
            });
            $ctrl.checkSecolumndCssStatus();
        }

        $ctrl.rootScope.$on('noLandingPageAction', noLandingPageAction)
        function noLandingPageAction($event, item) {
            if (item === 'continue') {
                $ctrl.goToRepoHome();
            }
            else if (item === 'cancel') {
                $ctrl.breadCrumbs = [];
                $state.go("homeScreen");
            }
        }
        //to enable and disable the filter button based on connector
        $ctrl.disableFilterButton = function () {
            switch ($ctrl.connectService.connector) {
                case $ctrl.connectService.connectors.Office365:
                    return $ctrl.currentFolders.length <= 1 || $ctrl.showSpin || $ctrl.selectedFolder.Name === $ctrl.AppName;
                case $ctrl.connectService.connectors.OneDrive:
                case $ctrl.connectService.connectors.GoogleDrive:
                case $ctrl.connectService.connectors.DocuShare:
                case $ctrl.connectService.connectors.Dropbox:
                case $ctrl.connectService.connectors.Box:
                    return $ctrl.currentFolders.length <= 1 || $ctrl.showSpin;
            }
        }
        //manages the visibility of the Select All button atlease one valid vile is present in the current folder.
        $ctrl.UpdateShowSelectAllButtonVisibility = function () {
           
            var array = _.filter($ctrl.currentFolders, function (item) {
                return !item.Disabled && !item.IsSite && !item.IsFolder && !item.IsLibrary;
            });
            $ctrl.showSelectAll =array.length > 0
        }
    }
});
