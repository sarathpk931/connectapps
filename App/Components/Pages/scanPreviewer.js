/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */



angular
    .module('app')
    .component('scanPreviewer', {
        templateUrl: 'Components/Pages/scanPreviewer.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controller: function ($scope, $timeout, $compile, modalService, scanService, connectService,strings, device) {
            var $ctrl = this;
            $ctrl.progress = null;
            $ctrl.selectedImage = null;
            $ctrl.imageZoom = null;
            $ctrl.justTapped = false;
            $ctrl.connectService = connectService;
            $ctrl.selectedRecipient;
            $ctrl.device = device;
            $ctrl.showNinthGenScroll = true;
            $ctrl.zoomFactor = 1;
            if ($ctrl.device.isEighthGen) {
                $ctrl.showNinthGenScroll = false;
            }
            var tabDocIsDirty = false;

            $ctrl.tabOptions = {
                name: 'Delete',
                options: [{
                    value: 'DELETE',
                    title: 'SDE_DELETE'
                }]
            };
            var glyphClickOffsetX = 25;
            var docuSignGlyph = { height: 25, width: 39 };  // at 75% scale

            $ctrl.$onInit = function () {
                // Disable addFields on CK devices:
                if (device.isEighthGen) {
                    $ctrl.resolve.addTabs = false;
                } else {
                    // on 9th gen devices check for iscroll to load and refresh to get scroll indicator to appear
                    var checker = setInterval(function () {
                        if (window._iScrolls && window._iScrolls.length > 0) {
                            if (angular.element('.slide-show-image').length > 0) {
                                //Potential improvement to add snap to either .slide-show-image or img (however snap code should be improved for device compatability)
                                //window._iScrolls[0].options.snap = ".slide-show-image";
                                //window._iScrolls[0]._initSnap();
                                var topScroll = window._iScrolls.length - 1;
                                window._iScrolls[topScroll].refresh();

                                if (window._iScrolls[topScroll].maxScrollX !== 0 || angular.element('.slide-show-image').length <= 3) {
                                    $timeout(function () {
                                        window._iScrolls[topScroll].refresh();
                                    });
                                    clearInterval(checker);
                                }
                            }
                        }
                    });
                }

                // Remote UI doesnt send tapped values by default so we have an app setting that will "Force" the tapped state
                $ctrl.justTapped = strings.REMOTEUI === 'true';

                //set scale height/width to height/width of container based on device size
                $ctrl.scaleHeight = window.innerWidth === 1024 ? 514 : 393;
                $ctrl.scaleWidth = window.innerWidth === 1024 ? 645 : 500;

                //$ctrl.recipients = userService.recipients();
            };

            $ctrl.ok = function () {
                $ctrl.close({ $value: "ok" });
            };

            $ctrl.cancel = function () {
                if ($ctrl.singleSelected) {
                    $ctrl.singleSelected = null;
                    $ctrl.destroyIScroll();
                }else {
                    modalService.showChoiceAlert('SDE_CONFIRM_CANCEL_JOB', 'SDE_ALL_SCANS_DATA', 'SDE_NO', 'SDE_YES', 'xrx-cancel', 'xrx-OK').result.then(function () {
                        // user canceled job so remove sign tabs
                        $ctrl.connectService.previewImages = [];
                        $ctrl.connectService.deleteFromBlob($ctrl.connectService.accountId);
                       $ctrl.dismiss();
                    }, angular.noop);
                }
            };

            $ctrl.addDocumentForScan = function () {
                $ctrl.rescan();
            }
            $ctrl.rescan = function () {
                $ctrl.close({ $value: "rescan" });
            };
          
            $ctrl.clickImage = function (clickedImage, countTap) {
                // Handle double tap
                if (countTap && clickedImage.justTapped) {
                    clickedImage.selected = true;
                    $ctrl.selectedImage = clickedImage;
                    $ctrl.zoom();
                    return;
                }

                clickedImage.justTapped = countTap;
                $timeout(function () { clickedImage.justTapped = false; }, 800);

                // handle normal tap
                clickedImage.selected = !clickedImage.selected;
                if (clickedImage.selected) {
                    if ($ctrl.selectedImage) {
                        $ctrl.selectedImage.justTapped = false;
                        $ctrl.selectedImage.selected = false;
                    }
                    $ctrl.selectedImage = clickedImage;
                } else {
                    $ctrl.selectedImage = null;
                }
            };
            //To Zoom the image
            $ctrl.zoom = function () {
                $ctrl.zoomFactor = 1;
                $('.single-item .scroll-container .image-container').height(
                   ""
                );               
                //$ctrl.connectService.accountId = "7f27dc9e-3968-4ea7-96c1-decb8673264d";
                //$ctrl.connectService.fileIds.push("dbc2a5e8-403b-45d3-9353-d2f1fbb058e5");
                $ctrl.progress = modalService.showProgressAlert();
                $ctrl.connectService.getFullResolutionImage($ctrl.connectService.accountId, $ctrl.connectService.fileIds, $ctrl.selectedImage.id).then(function (data) {
                    
                    $ctrl.singleSelected = data;
                    $timeout(function () {
                        $ctrl.setImageZoom('.scroll-container');
                        $ctrl.singleSelected.ready = true;
                        $ctrl.progress.close();
                    }, 250);
                }).catch(function (error) {
                    $ctrl.progress.close();
                });
            };
            //Set Imagezoom container
            $ctrl.setImageZoom = function (container) {
                $ctrl.imageZoom = new IScroll(container, {
                    zoom: true,
                    scrollX: $ctrl.showNinthGenScroll,
                    scrollY: $ctrl.showNinthGenScroll,
                    mouseWheel: true,
                    wheelAction: 'zoom',
                    scrollbars: 'custom',
                    tap: true
                });
            };

        
            $ctrl.enableScrolling = function (enable) {
                if (enable) {
                    $ctrl.imageZoom.enable();
                } else {
                    $ctrl.imageZoom.disable();
                }
            };

          $ctrl.destroyIScroll = function () {
                if ($ctrl.imageZoom && $ctrl.imageZoom.destroy) {
                    $ctrl.imageZoom.destroy();
                    $ctrl.imageZoom = null;
                }
            };

            $ctrl.$onDestroy = function () {
                $ctrl.destroyIScroll();
                $ctrl.singleSelected = null;
                $ctrl.selectedImages = null;
                $ctrl.resolve.images = null;
            };

            $ctrl.zoomIn = function (zoomFactor) {
                $ctrl.zoomFactor += zoomFactor;
                $ctrl.imageZoom.zoom($ctrl.zoomFactor);

                $timeout(function () {
                    if (zoomFactor == .5) {
                        $('.single-item .scroll-container .image-container').height(
                            $('.single-item .scroll-container .image-container').height() + 1
                        );
                        $('.single-item .scroll-container .image-container').width(
                            $('.single-item .scroll-container .image-container').width() + 1
                        );
                    }
                    else if (zoomFactor == -.5) {
                        $('.single-item .scroll-container .image-container').height(
                            $('.single-item .scroll-container .image-container').height() - 1
                        );
                        $('.single-item .scroll-container .image-container').width(
                            $('.single-item .scroll-container .image-container').width() - 1
                        );
                    }
                    //$('.single-item .scroll-container').scrollLeft(($(".single-item .scroll-container .image-container")[0].getBoundingClientRect().width -
                    //    $(".single-item .scroll-container").width())/2);
                }, 500);

            };
        }
    });
