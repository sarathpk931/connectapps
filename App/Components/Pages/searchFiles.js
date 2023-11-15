/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular.module('app').component('searchFiles', {
    templateUrl: 'Scripts/App/Components/Pages/searchFiles.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },

    controller: function ($scope, connectService, $state, modalService, $rootScope) {
        var $ctrl = this;
        $ctrl.showSpin = false;
        $ctrl.searchResults = [];
        $ctrl.disablePreviewFormats = ["pcl"];
        $ctrl.searchTerm = "";
        $ctrl.hasSearchValue = true;
        $ctrl.hasSearchResults = true;
        $ctrl.connectService = connectService;
        $ctrl.rootScope = $rootScope;
        $ctrl.$onInit = function () {
            $ctrl.search("Initiate");
        };
        $ctrl.navigateForward = function (item) {
            if (item.IsFolder) {
                $ctrl.connectService.requestParams.LibraryId = item.LibraryId;
            }
            $ctrl.connectService.breadCrumbs.push($ctrl.connectService.selectedFolder);
            $ctrl.connectService.selectedFolder = item;
            if ($ctrl.connectService.Feature === 'Scan') {
                modalService.showScanFileBrowser("SDE_BROWSE", true).result.then(function () {

                }).catch(function () {
                    $state.go("homeScreen");
                });
            }
            else{
                modalService.showPrintFileBrowser("SDE_BROWSE", true).result.then(function () {

                }).catch(function () {
                    $state.go("homeScreen");
                });
            }
           
            $ctrl.close()
        };
        //Search for the given Item
        $ctrl.search = function (searchState) {
            if (searchState != "Initiate") {
                if ($ctrl.searchTerm == "") {
                    modalService.showAlertBanner("SDE_ENTER_SEARCH_TERM1");
                    return;
                }
                else if ($ctrl.searchTerm.length < 3) {
                    return;
                }
                else {
                    $ctrl.showSpin = true;
                    $ctrl.hasSearchResults = true;
                    $ctrl.searchResults = [];
                    $ctrl.connectService.searchDirectory($ctrl.searchTerm).then(function (data) {
                        $ctrl.showSpin = false;
                        $ctrl.connectService.nextPageToken = data.NextPageToken;
                        $ctrl.searchResults = data.Items;
                        if ($ctrl.searchResults.length == 0) {
                            $ctrl.hasSearchResults = false;
                        }
                        $ctrl.searchResults.forEach(function (item) {
                            item["selected"] = false;
                        });
                    }).catch(function () {
                        $state.go("homeScreen");
                    });
                    //$ctrl.searchResults = $ctrl.folders.filter(function (ele) {
                    //    return ele.title.includes($ctrl.searchTerm);
                    //});
                    $ctrl.hasSearchValue = false;
                }
            }
        };
       //select item from search results
        $ctrl.selectDocument = function (item) {
            item.selected = !item.selected;
            if (item.selected) {
                $ctrl.connectService.selectedDocsForPrint.push(item);
            }
            else {
                $ctrl.connectService.selectedDocsForPrint = $ctrl.connectService.selectedDocsForPrint.filter(function (ele) {
                    return ele != item;
                });
            }
        }
        //preview 
        $ctrl.previewItem = function (item) {
            $ctrl.progress = modalService.showProgressAlert("SDE_GENERATING_PREVIEW");
            connectService.selectedDocsForPreview = item;
            connectService.getPrintPreviewImages(item).then(function (data) {
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
        var deregisterListener = $ctrl.rootScope.$on('whenScrolled', whenScrolled)

        function whenScrolled($event) {
            $ctrl.loadMore()
        }
        $ctrl.loadMore = function () {
            if ($ctrl.connectService.nextPageToken !== null && !$ctrl.showSpin) {
                $ctrl.showSpin = true;
                $ctrl.connectService.searchDirectory($ctrl.searchTerm).then(function (data) {
                    $ctrl.showSpin = false;
                    $ctrl.connectService.nextPageToken = data.NextPageToken;
                    data.Items.forEach(function (item) {
                        item["selected"] = false;
                    });
                    $ctrl.searchResults = $ctrl.searchResults.concat(data.Items);

                }).catch(function () {
                    $state.go("homeScreen");
                });
                //$ctrl.searchResults = $ctrl.folders.filter(function (ele) {
                //    return ele.title.includes($ctrl.searchTerm);
                //});
                $ctrl.hasSearchValue = false;
            }
        }
        $ctrl.$onDestroy = function () {
            deregisterListener();
        };
    }
});
