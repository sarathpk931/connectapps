/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */



(function () {
    'use strict';

    angular
        .module('app')
        .component('printPreviewer',
            {
                bindings: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                templateUrl: 'Components/Pages/printPreviewer.html',
                controller: function ($scope, $timeout, device, connectService) {
                    var $ctrl = this;
                    $ctrl.imageZoom = null;
                    $ctrl.zoomFactor = 1;
                    $ctrl.device = device;
                    $ctrl.showNinthGenScroll = true;
                    if ($ctrl.device.isEighthGen) {
                        $ctrl.showNinthGenScroll = false;
                    }
                    $ctrl.connectService = connectService;
                    $ctrl.$onInit = function () {
                        $ctrl.zoom();
                    };
                    $ctrl.zoomIn = function (zoomFactor) {
                        $ctrl.zoomFactor += zoomFactor;
                        $ctrl.imageZoom.zoom($ctrl.zoomFactor);

                        $timeout(function () {
                            if (zoomFactor == .5) {
                                $('.print-preview.scroll-container .image-container').height(
                                    $('.scroll-container .image-container').height() + 1
                                );
                                $('.print-preview.scroll-container .image-container').width(
                                    $('.scroll-container .image-container').width() + 1
                                );
                            }
                            else if (zoomFactor == -.5) {
                                $('.print-preview.scroll-container .image-container').height(
                                    $('.scroll-container .image-container').height() - 1
                                );
                                $('.print-preview.scroll-container .image-container').width(
                                    $('.scroll-container .image-container').width() - 1
                                );
                            }
                            //$('.scroll-container').scrollLeft(($(".scroll-container .image-container")[0].getBoundingClientRect().width -
                            //    $(".scroll-container").width()) / 2);
                        }, 500);
                        
                    };
                    $ctrl.zoom = function () {

                       $timeout(function () {
                                $ctrl.setImageZoom('.scroll-container');                              
                               
                            }, 250);
                      
                    };
                    //image Zoom
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

                    $ctrl.destroyIScroll = function () {
                        if ($ctrl.imageZoom && $ctrl.imageZoom.destroy) {
                            $ctrl.imageZoom.destroy();
                            $ctrl.imageZoom = null;
                        }
                    };

                    $ctrl.$onDestroy = function () {
                        $ctrl.destroyIScroll();
                    };                   
                }
            });

})();
