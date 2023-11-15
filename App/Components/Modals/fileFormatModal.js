/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('fileFormatModal',
        {
            templateUrl: 'Components/Modals/fileFormatModal.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function ($rootScope,modalService) {
                var $ctrl = this;

                $ctrl.$onInit = function () {
                    // Clone the feature so we aren't live editing the original
                    $ctrl.feature = _.cloneDeep($ctrl.resolve.data.feature);
                };

                $ctrl.selectOption = function (option) {
                    if (option.disabled) {
                        modalService.showAlertBanner(option.disabledMessage);
                    }
                    else {
                        $ctrl.feature.selectedOption = option;
                        // set default language English for chnaging the file formats 
                        $ctrl.feature.subFeatures.forEach(function (value, key) {
                            if (value.name == "language") {
                                value.selectedOption = _.find(value.options, function (option) { return option.value == "en"; });
                            }
                        });
                    }
                };

                $ctrl.ok = function () {
                    $rootScope.$broadcast('updateFileName', $ctrl.feature.selectedOption);
                    $ctrl.close({ $value: $ctrl.feature });
                };

                $ctrl.openFeaturePopover = function (feature) {
                    modalService.showPopover(feature, event);
                };
            }
        });
