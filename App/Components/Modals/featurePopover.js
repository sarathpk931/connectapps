/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('featurePopover',
        {
            templateUrl: 'Components/Modals/featurePopover.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function ($timeout, modalService, scanOptionsService, device) {
                var $ctrl = this;
                $ctrl.$onInit = function () {
                    $ctrl.feature = $ctrl.resolve.feature;
                    $ctrl.device = device;
                    scanOptionsService.updateDisabledOptions($ctrl.resolve.feature, device);
                    $timeout(function () {
                        showPopoverHelper($ctrl.resolve.event, $ctrl.feature.name);
                        $timeout(function () {
                            $ctrl.show = true;
                        });
                    }, 50);

                };

                $ctrl.selectOption = function (option) {                   
                    if (option.value == 'xps' && scanOptionsService.scanFeatures[0].name == 'preview') {
                        scanOptionsService.scanFeatures[0].selectedOption = false;
                    }
                    if (option.disabled) {
                        modalService.showAlertBanner(option.disabledMessage);
                    }
                    else {
                        $ctrl.feature.selectedOption = option;
                    }
                    changeResolutionBasedOnSerachableDocument();
                    $ctrl.close();
                };

                $ctrl.openMoreOptionsModal = function () {
                    $ctrl.close();

                    modalService.openComponentModal($ctrl.feature.moreOptionsModal, { feature: $ctrl.feature })
                        .result.then(function (modifiedFeature) { 
                            _.assign($ctrl.feature, modifiedFeature);                           
                            $timeout(function () {                                
                                changeResolutionBasedOnSerachableDocument();
                            }, 50)
                            
                        });
                };

                function showPopoverHelper(e, name, options) {

                    var winHeight = $(window).height();
                    var winWidth = $(window).width();

                    //var popover = angular.element("#" + name);
                    var contents = angular.element("#" + name + " div.contents");

                    var popover = angular.element("#" + name);
                    var popoverModal = popover.parents('.modal-dialog');

                    var arrow = angular.element("arrow");
                    var arrowContents = angular.element("arrow *");

                    //console.log("looking for: " + name + ", found contents: " + JSON.stringify(contents));
                    contents.css({
                        'position': 'fixed',
                        'z-index': 1,
                        'display': 'none'
                    });

                    // Since we're manually setting the dimensions of this popover unset the modal-dialog css
                    popoverModal.css({
                        'width': 'initial',
                        'height': 'initial'
                    });

                    var height = contents.data("height") || contents.height();
                    var width = contents.width();
                    var padding = contents.innerWidth() - width;

                    // we dont want to recalculate the height every time the contents are shown (because depending
                    // how we lay it out it may change...so just take what angular thinks it is and reuse it.
                    contents.data("height", height);

                    // How much we need on the left?

                    // Try to put it approximately in the middle.
                    var bottom = 0;
                    var top = 0;
                    var mid = height / 2;
                    top = Math.max(2, e.pageY - mid); // two is arbitrary. so the popover will have some margin.

                    // we can just float the arrow contents to make it appear flipped.
                    var float = 'left';
                    var arrowLeft = 0;
                    var transform = 'none';

                    // normalize...should at least have an 8px margin from the top.
                    top = Math.max(8, top);

                    // Apply the options if available.
                    if (options) {
                        top = options.top;
                    }

                    var totalSize = width + padding + arrow.width();
                    var availableSpaceOnRight = winWidth - e.pageX;
                    var availableSpaceOnLeft = winWidth - availableSpaceOnRight;

                    var calcLeft = e.pageX - totalSize;
                    var showArrow = true;

                    // Adhere to max heights: http://edgmini.na.xerox.net:9000/ui_elements/popover.php
                    // 10" - max height: 584px
                    // 5" - max height: 470px;
                    var maxHeight = winWidth >= 1024 ? 584 : 470;

                    if (totalSize < availableSpaceOnRight) {
                        calcLeft = e.pageX + arrow.width();
                        arrowLeft = e.pageX;
                        float = 'right';
                    } else if (totalSize < availableSpaceOnLeft) {
                        arrowLeft = e.pageX - arrow.width();
                    } else {
                        // put it below
                        calcLeft = (winWidth - totalSize) / 2;
                        arrowLeft = e.pageX - arrow.width() / 2;
                        transform = 'rotate(270deg)';
                        showArrow = false;
                    }

                    // With long text, we will just put it in the middle.
                    if (showArrow) {
                        arrow.css({
                            'left': arrowLeft,
                            'top': e.pageY - arrow.height() / 2,
                            'z-index': 1300,
                            'transform': transform
                        });
                        arrowContents.css({ 'float': float });
                        arrow.show();
                    }
                    else {
                        arrow.hide();
                    }

                    // Adjust the top if it's too tall.
                    if (top + contents.height() + 16 >= winHeight) {
                        var diff = winHeight - (top + contents.height());
                        top = top - Math.abs(diff) - 24;
                    }

                    if (top < 0) {
                        contents
                            .css({
                                'left': calcLeft,
                                'display': 'block',
                                'bottom': '8px',
                                'maxHeight': maxHeight
                            });
                    }
                    else {
                        // Update the display and location.
                        contents
                            .css({
                                'left': calcLeft,
                                'display': 'block',
                                'top': top,
                                'maxHeight': maxHeight,
                                'bottom': ''
                            });
                    }
                }


                //set to 300dpi when select 400dpi and 600dpi in versalink devices for serchable pdf and xps formats.                
                function changeResolutionBasedOnSerachableDocument() { 
                    var isSerachableDocument = false;

                    if ($ctrl.device && $ctrl.device.isVersalink == true) {

                        var fileFormat = scanOptionsService.fileFormat.selectedOption.value;

                        console.log('fileFormat-' + fileFormat);

                        if (fileFormat == 'pdf' || fileFormat == 'xps') {

                            var resolutions = _.find(scanOptionsService.scanFeatures, { 'name': 'resolution' });
                            if (resolutions) {

                                var selectedResolution = resolutions.selectedOption;                             

                                if (selectedResolution.value == 'RES_400X400' || selectedResolution.value == 'RES_600X600') {

                                    var sercahableFeature = _.find(scanOptionsService.fileFormat.subFeatures, { 'name': 'searchableText' });
                                    if (sercahableFeature && sercahableFeature.selectedOption.value === 'SEARCHABLE_IMAGE') {

                                        isSerachableDocument = true;
                                    }

                                    if (isSerachableDocument == true) {

                                        var defaultResolution = _.find(resolutions.options, { 'title': 'SDE_300X300' });
                                        if (defaultResolution) {
                                           
                                            resolutions.selectedOption = defaultResolution;                                           
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
