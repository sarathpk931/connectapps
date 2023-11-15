/* Copyright © 2021 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular.module('app').component('scanFileBrowser', {
    templateUrl: 'Scripts/App/Components/Pages/scanFileBrowser.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },

    controller: function ($scope, connectService, modalService, $state, $rootScope, strings, loginService, localStorageService, $interval) {
        var $ctrl = this;
        $ctrl.showSpin = false;
        $ctrl.isBackButtonVisible = true;
        $ctrl.breadCrumbs = [];
        $ctrl.currentFolders = [];
        $ctrl.connectService = connectService;
        $ctrl.modalService = modalService;
        $ctrl.rootScope = $rootScope;
        $ctrl.filterTerm = '';
        $ctrl.AppName = strings["AppName"];
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
        //default selecetd folder icon for non Office 365 connectors
        $ctrl.connectService.selectedFolderIcon = $ctrl.connectService.glyphIconClass.folderGlyph;
        $ctrl.disableHomeButton = true;
        // Variable to hold the interval promise object which is used to show the spinner while searching
        var filterInterval;
        $ctrl.$onInit = function () {
            $ctrl.connectService.Feature = "Scan";

            if ($ctrl.resolve.resumeBrowse) {
                $ctrl.breadCrumbs = $ctrl.connectService.breadCrumbs;
                if ($ctrl.connectService.selectedFolder != undefined && $ctrl.connectService.selectedFolder.length !== 0) {
                    $ctrl.fetchData($ctrl.connectService.selectedFolder, "resume");
                } else {
                    $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
                    $ctrl.getFolders(false, "", "");
                }
            }
            //checks default landing page is not empty or not undefiend for Sharepoint
            else if ($ctrl.connectService.connector === connectService.connectors.Office365 && localStorageService.getDefaultLandingPage() != '' &&  localStorageService.getDefaultLandingPage() !== 'undefined') {
                var defaultLandingPage = localStorageService.getDefaultLandingPage();
                var defaultLandingPageArray = defaultLandingPage.split('/');
                $ctrl.breadCrumbs.push({ Name: strings["AppName"], IsSite: $ctrl.getisSitevalue() });
                $ctrl.selectedFolder = { Name: defaultLandingPageArray[defaultLandingPageArray.length - 1], IsSite: true };
                $ctrl.getFolders(true, btoa(defaultLandingPage), btoa(''));
            }
            else {
                $ctrl.connectService.breadCrumbs = [];
                $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
                $ctrl.getFolders(false, "", "");
            }

        };
        //navigate back to the root item
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
        //naviagte to the folders
        $ctrl.navigateForward = function (item) {
            $ctrl.breadCrumbs.push($ctrl.selectedFolder);
            $ctrl.fetchData(item, "next");
        };
        $ctrl.fetchData = function (selectedItem, action) {
            $ctrl.connectService.setRequestParams(selectedItem);
            var FolderName = "";
            if (selectedItem.Name == $ctrl.connectService.sharePointFolders.teamSite) {
                FolderName = "mysite";
            } else if (selectedItem.Name == $ctrl.connectService.sharePointFolders.followedSites) {
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
        //to get the folders
        $ctrl.getFolders = function (IsSite, ParentDir, FolderName) {
            $ctrl.setSelectedFolderIcon($ctrl.selectedFolder);
            $ctrl.showSpin = true;
            $ctrl.currentFolders = [];
            $ctrl.stopFiltering();
            $ctrl.connectService.getLibraries(IsSite, 1, ParentDir, FolderName).then(function (data) {
                $ctrl.showSpin = false;
                $ctrl.connectService.currentData = data;
                $ctrl.connectService.currentPath = data.CurrentPath;
                $ctrl.currentFolders = data.Items;
                $ctrl.connectService.selectedScanFolderContents = $ctrl.currentFolders;
                if (data.Items.length == 0 && data.CurrentFolderName == $ctrl.connectService.sharePointFolders.followedSites) {
                    $ctrl.modalService.showAlertBanner("SDE_NO_FOLLOWED_SITES");
                }
                //$ctrl.refreshShadow();
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
                    $ctrl.modalService.showSimpleAlert(strings.SDE_APPLICATION_ERROR_RECEIVED.format(error.status +".<br>", new Date().toGMTString()), 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3');
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

        $ctrl.searchFiles = function () {
            $ctrl.filtering = true;

            /* TODO Go back to search when we move to using search not filtering
            modalService.showSearchFiles("SDE_SEARCHFILES", null).result.then(function () {

            }).catch(function () {
                $state.go("homeScreen");
                });
            $ctrl.closeScanBrowse();
            */
        };

        $ctrl.dismissScanPopup = function () {
            if ($ctrl.filtering) {
                $ctrl.stopFiltering();
            } else {
                $ctrl.connectService.selectedFolder = [];
                $ctrl.dismiss();
            }
        };

        $ctrl.closeScanBrowse = function () {
            $ctrl.connectService.breadCrumbs = [];
            $ctrl.connectService.breadCrumbs = $ctrl.breadCrumbs;
            if ($ctrl.connectService.breadCrumbs.length === 0) {
                $ctrl.setRootFolder();
            }
            $ctrl.close();
        };

        $ctrl.setRootFolder = function () {
            switch ($ctrl.connectService.connector) {
                case $ctrl.connectService.connectors.GoogleDrive:
                case $ctrl.connectService.connectors.Dropbox:
                case $ctrl.connectService.connectors.Box:
                case $ctrl.connectService.connectors.DocuShare:
                    $ctrl.connectService.selectedFolder = $ctrl.selectedFolder;
                    return;
                default:
                    return;
            }
        }

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

        //Reset all and go to Repository root
        $ctrl.goToRepoHome = function () {
            //resets resumeresumeBrowse option
            $ctrl.resolve.resumeBrowse = false;
            //setting the root folder
            $ctrl.selectedFolder = { Name: strings["AppName"], IsSite: $ctrl.getisSitevalue()};
            //resetting the breadcrumbs
            $ctrl.breadCrumbs = [];
            $ctrl.connectService.setRequestParams($ctrl.selectedFolder);
            $ctrl.setSelectedFolderIcon($ctrl.selectedFolder);
            $ctrl.showSpin = true;
            $ctrl.currentFolders = [];
            $ctrl.stopFiltering();
            $ctrl.connectService.repohome(false, 1, '', '', true).then(function (data) {
                $ctrl.showSpin = false;
                $ctrl.connectService.currentData = data;
                $ctrl.connectService.currentPath = data.CurrentPath;
                $ctrl.currentFolders = data.Items;
                $ctrl.connectService.selectedScanFolderContents = $ctrl.currentFolders;
                $ctrl.disableHomeButton = true;
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
    }
});
