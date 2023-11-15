/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('printOptionsService', printOptionsService);

function printOptionsService() {
    var service = {};

    service.printFeatures = [
        // Quantity
        {
            name: 'quantity',
            title: 'SDE_QUANTITY',
            icon: 'quantity_48.png',
            maxlength: 4,
            pattern: "^([1-9][0-9]{3}|[1-9][0-9]{2}|[1-9][0-9]|[1-9])$",
            options: [
                { value: 1, isDefault: true }
            ]
        },

        // Plex
        {
            name: 'plex',
            title: 'SDE_2SIDED_PRINTING2',
            icon: '2_sided_48.png',
            options: [{
                value: 'OneSided',
                title: 'SDE_1SIDED',
                icon: '2_sided_1_48.png'
            }, {
                value: 'TwoSided',
                title: 'SDE_2SIDED',
                icon: '2_sided_2_48.png',
                isDefault: true
            }]
        },

        // Color Mode
        {
            name: "colorMode",
            title: "SDE_OUTPUT_COLOR2",
            icon: "output_color_auto_48.png",
            options: [{
                value: "Auto",
                title: "SDE_AUTO",
                icon: "output_color_auto_48.png",
                isDefault: true
            }, {
                value: "Color",
                title: "SDE_COLOR",
                icon: "output_color_color_48.png"
            }, {
                value: "MonochromeGrayscale",
                title: "SDE_BLACK_WHITE",
                icon: "output_color_bw_48.png"
            }, {
                value: "MonochromeGrayscale",
                title: "SDE_GRAYSCALE",
                icon: "output_color_gray_48.png"
            }]
        },
        // Stapling
        {
            name: 'stapling',
            title: 'SDE_STAPLING',
            icon: 'stapling.png',
            type: 'toggle',
            options: [{
                value: false,
                isDefault: true
            }, {
                value: true

            }]
        }
    ];

    _.each(service.printFeatures, function (feature) {
        setDefaults(feature);
    });
    // Set defaults for each of the features. We want these to be actual
    // object references because of how we manipulate them


    // Set selected options for the features (and any subfeatures) to the default based on the data
    function setDefaults(feature) {
        _.each(feature.subFeatures, function (subFeature) {
            setDefaults(subFeature);
        });

        if (feature.options) {
            feature.selectedOption = _.find(feature.options, 'isDefault');
        }
        if (feature.name === 'quantity') {
            feature.selectedOption.value = 1;
        }
    }
    service.resetPrintDefaults = function () {
        _.each(service.printFeatures, function (feature) {
            setDefaults(feature);
        });
    };
    // Transform the data in this service into a simple object of key value pairs that looks like
    // {featureName: feature.selectedOption.value}
    service.getValues = function () {
        var values = {};
        _.each(service.printFeatures, function (feature) {
            mapSelected(feature, values);
        });

        return values;
    };

    // Add a new property to the features array with the selected option value for that feature.
    // Recurse through any subfeatures (file format)
    function mapSelected(feature, feats) {
        _.each(feature.subFeatures, function (f) {
            mapSelected(f, feats);
        });
        var p = {};
        p[feature.name] = feature.selectedOption.value;
        _.merge(feats, p);
    }

    // Check if any of this features options are disabled
    service.updateDisabledOptions = function (feature) {
        var currentOptions = service.getValues();

        _.each(feature.options, function (option) {
            _.each(option.disabledIf, function (disabledCondition) {
                if (currentOptions[disabledCondition.feature] === disabledCondition.value) {
                    option.disabled = true;
                    option.disabledMessage = disabledCondition.message;
                    return false;
                }
                else {
                    option.disabled = false;
                    option.disabledMessage = null;
                }
            });
        });
    };

    return service;
}
