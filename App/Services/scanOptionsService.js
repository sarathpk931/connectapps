/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('scanOptionsService', scanOptionsService);

function scanOptionsService(strings) {
    var service = {};

    var isSearchablePDF = (strings["PDF_SEARCHABLE_VALUE"] == "ON" || strings["PDF_SEARCHABLE_VALUE"] == "1") ? true : false;

    // File Name
    // Bug id 32941 - instead of hardcoded value for filename, we get it from resource file. 
    service.fileName = strings["SDE_XEROX_SCAN"];

    // File Format
    service.fileFormat = {
        name: 'fileFormat',
        title: 'SDE_FILE_FORMAT',
        icon: 'file_name_and_format_48.png',
        options: [
            {
                value: 'docx',
                title: '.docx',
                icon: 'filetype_docx_48.png',
                isOCR: true,

            },
            {
                value: 'pptx',
                title: '.pptx',
                icon: 'filetype_pptx_48.png',
                isOCR: true,

            },
            {
                value: 'xlsx',
                title: '.xlsx',
                icon: 'filetype_xlsx_48.png',
                isOCR: true,

            },
            {
                value: 'pdf',
                title: '.pdf',
                icon: 'filetype_pdf_48.png',
                isOCR: true,
                isDefault: true
            },
            {
                value: 'tiff',
                title: '.tif',
                icon: 'filetype_tif_48.png',
                disabledIf: [{
                    feature: "colorMode",
                    value: "AUTO",
                    message: "SDE_TIF_UNAVAILABLE_WHILE"
                }]
            },
            {
                value: 'jpg',
                title: '.jpg',
                icon: 'filetype_jpg_48.png',
                disabledIf: [{
                    feature: "colorMode",
                    value: "BLACK_AND_WHITE",
                    message: "SDE_JPG_UNAVAILABLE_WHILE"
                }, {
                    feature: "colorMode",
                    value: "AUTO",
                    message: "SDE_JPG_UNAVAILABLE_WHILE1"
                }]
            }],
        moreOptionsModal: 'fileFormatModal',
        subFeatures: [
            {
                name: 'combineFiles',
                value: 'combineFiles',
                icon: 'filetype_file_option_48.png',
                title: 'SDE_COMBINE_FILES',
                enabledIfArray: ['tiff'],
                type: 'toggle',
                options: [{
                    value: false,
                    desc: "SDE_ALL_SCANS_WILL"
                }, {
                    value: true,
                    isDefault: true,
                    desc: "SDE_MAKES_ONE_ATTACHMENT"
                }]
            },
            {
                name: 'searchableText',
                title: 'SDE_SEARCHABLE',
                icon: 'filetype_search_48.png',
                enabledIfArray: ['pdf', 'xps'],
                type: 'toggle',
                options: [{
                    value: 'IMAGE_ONLY',
                    title: 'SDE_IMAGE_ONLY',
                    isDefault: !isSearchablePDF
                }, {
                    value: 'SEARCHABLE_IMAGE',
                    title: 'SDE_SEARCHABLE',
                    isDefault: isSearchablePDF
                }],
                subFeatures: [{
                    name: 'language',
                    title: 'SDE_LANGUAGE',
                    enabledIf: 'SEARCHABLE_IMAGE',
                    icon: 'filetype_lang_48.png',
                    type: 'dropdown',
                    options: [{
                        value: 'ca',
                        title: 'SDE_CATALAN',
                        icon: 'language_ca_48.png'
                    }, {
                        value: 'cs',
                        title: 'SDE_CZEK',
                        icon: 'language_cs_48.png'
                    }, {
                        value: 'da',
                        title: 'SDE_DANISH',
                        icon: 'language_da_48.png'
                    }, {
                        value: 'nl',
                        title: 'SDE_DUTCH',
                        icon: 'language_nl_48.png'
                    }, {
                        value: 'en',
                        title: 'SDE_ENGLISH',
                        icon: 'language_en_48.png',
                        isDefault: false
                    }, {
                        value: 'fi',
                        title: 'SDE_FINNISH2',
                        icon: 'language_fi_48.png'
                    }, {
                        value: 'fr',
                        title: 'SDE_FRENCH',
                        icon: 'language_fr_48.png'
                    }, {
                        value: 'de',
                        title: 'SDE_GERMAN',
                        icon: 'language_de_48.png'
                    }, {
                        value: 'el',
                        title: 'SDE_GREEK',
                        icon: 'language_el_48.png'
                    }, {
                        value: 'hu',
                        title: 'SDE_HUNGARIAN',
                        icon: 'language_hu_48.png'
                    }, {
                        value: 'it',
                        title: 'SDE_ITALIAN',
                        icon: 'language_it_48.png'
                    }, {
                        value: 'no',
                        title: 'SDE_NORWEGIAN',
                        icon: 'language_no_48.png'
                    }, {
                        value: 'pl',
                        title: 'SDE_POLISH',
                        icon: 'language_pl_48.png'
                    }, {
                        value: 'pt',
                        title: 'SDE_PORTUGUESE',
                        icon: 'language_pt_48.png'
                    }, {
                        value: 'ro',
                        title: 'SDE_ROMANIAN',
                        icon: 'language_ro_48.png'
                    }, {
                        value: 'ru',
                        title: 'SDE_RUSSIAN',
                        icon: 'language_ru_48.png'
                    }, {
                        value: 'es',
                        title: 'SDE_SPANISH',
                        icon: 'language_es_48.png'
                    }, {
                        value: 'sv',
                        title: 'SDE_SWEDISH',
                        icon: 'language_sv_48.png'
                    }, {
                        value: 'tr',
                        title: 'SDE_TURKISH',
                        icon: 'language_tr_48.png'
                    }]
                }]
            },
            {
                name: 'archivalFormat',
                title: 'SDE_ARCHIVAL_PDFA',
                icon: 'filetype_pdfa_48.png',
                enabledIf: 'pdf',
                type: 'toggle',
                options: [{
                    value: false,
                    isDefault: true
                }, {
                    value: true
                }]
            },
            //language option specifically for Microsoft file formats
            {
                name: 'language',
                title: 'SDE_LANGUAGE',
                enabledIfArray: ['docx', 'xlsx', 'pptx'],
                icon: 'filetype_lang_48.png',
                type: 'dropdown',
                options: [{
                    value: 'ca',
                    title: 'SDE_CATALAN',
                    icon: 'language_ca_48.png'
                }, {
                    value: 'cs',
                    title: 'SDE_CZEK',
                    icon: 'language_cs_48.png'
                }, {
                    value: 'da',
                    title: 'SDE_DANISH',
                    icon: 'language_da_48.png'
                }, {
                    value: 'nl',
                    title: 'SDE_DUTCH',
                    icon: 'language_nl_48.png'
                }, {
                    value: 'en',
                    title: 'SDE_ENGLISH',
                    icon: 'language_en_48.png',
                    isDefault: true
                }, {
                    value: 'fi',
                    title: 'SDE_FINNISH2',
                    icon: 'language_fi_48.png'
                }, {
                    value: 'fr',
                    title: 'SDE_FRENCH',
                    icon: 'language_fr_48.png'
                }, {
                    value: 'de',
                    title: 'SDE_GERMAN',
                    icon: 'language_de_48.png'
                }, {
                    value: 'el',
                    title: 'SDE_GREEK',
                    icon: 'language_el_48.png'
                }, {
                    value: 'hu',
                    title: 'SDE_HUNGARIAN',
                    icon: 'language_hu_48.png'
                }, {
                    value: 'it',
                    title: 'SDE_ITALIAN',
                    icon: 'language_it_48.png'
                }, {
                    value: 'no',
                    title: 'SDE_NORWEGIAN',
                    icon: 'language_no_48.png'
                }, {
                    value: 'pl',
                    title: 'SDE_POLISH',
                    icon: 'language_pl_48.png'
                }, {
                    value: 'pt',
                    title: 'SDE_PORTUGUESE',
                    icon: 'language_pt_48.png'
                }, {
                    value: 'ro',
                    title: 'SDE_ROMANIAN',
                    icon: 'language_ro_48.png'
                }, {
                    value: 'ru',
                    title: 'SDE_RUSSIAN',
                    icon: 'language_ru_48.png'
                }, {
                    value: 'es',
                    title: 'SDE_SPANISH',
                    icon: 'language_es_48.png'
                }, {
                    value: 'sv',
                    title: 'SDE_SWEDISH',
                    icon: 'language_sv_48.png'
                }, {
                    value: 'tr',
                    title: 'SDE_TURKISH',
                    icon: 'language_tr_48.png'
                }]
            }]
    };
    service.scanFeatures = [
        // Preview
        {
            name: 'preview',
            title: 'SDE_PREVIEW',
            icon: 'preview_48.png',
            type: 'toggle',
            options: [{
                value: false,
                isDefault: true
            }, {
                value: true

            }]
        },
        // Plex
        {
            name: 'plex',
            title: 'SDE_2SIDED_SCANNING',
            icon: '2_sided_48.png',
            options: [{
                value: 'ONE_SIDED',
                title: 'SDE_1SIDED',
                icon: '2_sided_1_48.png',
                isDefault: true
            }, {
                value: 'TWO_SIDED',
                title: 'SDE_2SIDED',
                icon: '2_sided_2_48.png'
            }, {
                value: 'SECOND_SIDE_ROTATION',
                title: 'SDE_2SIDED_ROTATE_SIDE',
                icon: '2_sided_rotate_48.png'
            }]
        },
        //resolution
        {
            name: 'resolution',
            title: 'SDE_RESOLUTION1',
            icon: 'resolution_48.png',
            options: [{
                value: 'RES_150X150',
                title: 'SDE_100X200',
                icon: 'resolution_150_48.png'
            }, {
                value: 'RES_200X200',
                title: 'SDE_200X200',
                icon: 'resolution_200_48.png'
            }, {
                value: 'RES_300X300',
                title: 'SDE_300X300',
                icon: 'resolution_300_48.png',
                isDefault: true
            }, {
                value: 'RES_400X400',
                title: 'SDE_400X400',
                icon: 'resolution_400_48.png',
                disabledIf: [{
                    feature: "versaSerchablePdfXps",
                    value: true,
                    message: "SDE_RESOLUTION_NOT_AVAILABLE"
                }]
            }, {
                value: 'RES_600X600',
                title: 'SDE_600X600',
                icon: 'resolution_600_48.png',
                disabledIf: [{
                    feature: "versaSerchablePdfXps",
                    value: true,
                    message: "SDE_RESOLUTION_NOT_AVAILABLE"
                }]
            }]
        },
        // Color Mode
        {
            name: "colorMode",
            title: "SDE_OUTPUT_COLOR2",
            icon: "output_color_48.png",
            options: [{
                value: "AUTO",
                title: "SDE_AUTO",
                icon: "output_color_auto_48.png",
                isDefault: true,
                disabledIf: [{
                    "feature": "fileFormat",
                    "value": "jpg",
                    "message": "SDE_AUTO_DETECT_UNAVAILABLE1"
                }, {
                    "feature": "fileFormat",
                    "value": "tiff",
                    "message": "SDE_AUTO_DETECT_UNAVAILABLE"
                }]
            }, {
                value: "FULL_COLOR",
                title: "SDE_COLOR",
                icon: "output_color_color_48.png"
            }, {
                value: "BLACK_AND_WHITE",
                title: "SDE_BLACK_WHITE",
                icon: "output_color_bw_48.png",
                disabledIf: [{
                    "feature": "fileFormat",
                    "value": "jpg",
                    "message": "SDE_BLACK_WHITE_UNAVAILABLE"
                }]
            }, {
                value: "GRAYSCALE",
                title: "SDE_GRAYSCALE",
                icon: "output_color_gray_48.png"
            }]
        },

        // Original Type
        {
            name: 'originalType',
            title: 'SDE_ORIGINAL_TYPE',
            icon: 'original_type_text_photo_48.png',
            options: [{
                value: 'MIXED',
                title: 'SDE_TEXT_AND_PHOTO',
                icon: 'original_type_text_photo_48.png',
                isDefault: true
            }, {
                value: 'PHOTO',
                title: 'SDE_PHOTO',
                icon: 'original_type_photo_48.png'
            }, {
                value: 'TEXT',
                title: 'SDE_TEXT',
                icon: 'original_type_text_48.png'
            }, {
                value: 'MAP',
                title: 'SDE_MAP',
                icon: 'original_type_map_48.png'
            }, {
                value: 'NEWSPAPER_AND_MAGAZINE',
                title: 'SDE_NEWSPAPER_MAGAZINE',
                icon: 'original_type_printed_48.png'
            }]
        },


        // Orientation
        {
            name: 'orientation',
            title: 'SDE_ORIGINAL_ORIENTATION',
            icon: 'orientation_48.png',
            options: [{
                value: 'PORTRAIT',
                title: 'SDE_PORTRAIT',
                icon: 'orientation_portrait_48.png',
                isDefault: true
            }, {
                value: 'LANDSCAPE',
                title: 'SDE_LANDSCAPE',
                icon: 'orientation_landscape_48.png'
            }]
        },
        // Quality
        {
            name: 'quality',
            title: 'SDE_QUALITY',
            icon: 'quality_good_48.png',
            options: [{
                value: '0',
                title: 'SDE_GOOD_QUALITYLARGE_FILE',
                icon: 'quality_good_48.png'
            }, {
                value: '128',
                title: 'SDE_BETTER_QUALITYMEDIUM_FILE',
                icon: 'quality_better_48.png',
                isDefault: true
            }, {
                value: '255',
                title: 'SDE_BEST_QUALITYMEDIUM_FILE',
                icon: 'quality_best_48.png'
            }]
        },
        // Media Size
        {
            name: 'mediaSize',
            title: 'SDE_ORIGINAL_SIZE',
            icon: 'original_size_48.png',
            options: [{
                value: 'AUTO',
                title: 'SDE_AUTO_DETECT',
                isDefault: true
            }, {
                value: 'NA_8.5x11LEF',
                title: 'SDE_85_X_114',
                glyph: 'xrx-portrait'
            }, {
                value: 'NA_8.5x11SEF',
                title: 'SDE_85_X_114',
                glyph: 'xrx-landscape'
            }, {
                value: 'NA_8.5x14SEF',
                title: 'SDE_85_X_143',
                glyph: 'xrx-landscape'
            }, {
                value: 'NA_11x17SEF',
                title: 'SDE_11_X_173',
                glyph: 'xrx-landscape'
            }, {
                value: 'NA_5.5x8.5LEF',
                title: 'SDE_55_X_854',
                glyph: 'xrx-portrait'
            }, {
                value: 'NA_5.5x8.5SEF',
                title: 'SDE_55_X_854',
                glyph: 'xrx-landscape'
            }, {
                value: 'NA_8.5x13SEF',
                title: 'SDE_85_X_134',
                glyph: 'xrx-landscape'
            }, {
                value: 'ISO_A4LEF',
                title: 'SDE_A41',
                glyph: 'xrx-portrait'
            }, {
                value: 'ISO_A4SEF',
                title: 'SDE_A41',
                glyph: 'xrx-landscape'
            }, {
                value: 'ISO_A3SEF',
                title: 'SDE_A31',
                glyph: 'xrx-landscape'
            }, {
                value: 'ISO_A5LEF',
                title: 'SDE_A51',
                glyph: 'xrx-portrait'
            }, {
                value: 'ISO_A5SEF',
                title: 'SDE_A51',
                glyph: 'xrx-landscape'
            }, {
                value: 'JIS_B4SEF',
                title: 'SDE_B4',
                glyph: 'xrx-landscape'
            },  {
                value: 'JIS_B5LEF',
                title: 'SDE_B5',
                glyph: 'xrx-portrait'
            }, {
                value: 'JIS_B5SEF',
                title: 'SDE_B5',
                glyph: 'xrx-landscape'
            }, {
                value: 'NA_5.5x7SEF',
                title: 'SDE_55_X_72',
                glyph: 'xrx-landscape'
            }, {
                value: 'NA_5.5x7LEF',
                title: 'SDE_55_X_72',
                glyph: 'xrx-portrait'
            }]
        },


    ];

    setLanguageDefaults();
    // Set defaults for each of the features (and the fileformat). We want these to be actual
    // object references because of how we manipulate them
    _.each(service.scanFeatures, function (feature) {
        setDefaults(feature);
    });

    setDefaults(service.fileFormat);

    // Set selected options for the features (and any subfeatures) to the default based on the data
    function setDefaults(feature) {
        _.each(feature.subFeatures, function (subFeature) {
            setDefaults(subFeature);
        });

        if (feature.options) {
            feature.selectedOption = _.find(feature.options, 'isDefault');
        }
    }

    // Transform the data in this service into a simple object of key value pairs that looks like
    // {featureName: feature.selectedOption.value}
    service.getValues = function (device) {
        var values = {};
        _.each(service.scanFeatures, function (feature) {
            mapSelected(feature, values);
        });

        mapSelected(service.fileFormat, values);

        values.fileName = service.fileName;
        values.versaSerchablePdfXps = setVersaSerchablePdfXps(device, values);
        return values;
    };

    //check device is versalink and file format is serchable pdf or xps
    function setVersaSerchablePdfXps(device, values) {
        if (device && device.isVersalink == true) {
            if (values.fileFormat === 'pdf' || values.fileFormat === 'xps') {
                if (values.searchableText === 'SEARCHABLE_IMAGE') {
                    return true;
                }
            }
        }

        return false;
    }

    //Setting the default searchable language to device language setting
    function setLanguageDefaults() {
        var regex = /(\w+)\-?/g;
        var locale =  regex.exec(window.navigator.userLanguage || window.navigator.language)[1] || 'en';

        var languageFeatureDefault = service.fileFormat.subFeatures.filter(function (x) {
            return x.name == 'searchableText' })[0].subFeatures.filter(function (x) {
            return x.name == 'language' })[0].options.filter(function (x) {
            return x.value == locale; });

        if (languageFeatureDefault) {
            languageFeatureDefault[0].isDefault = true;
        }

    }


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
    service.resetScanDefaults = function (fileName) {
        _.each(service.scanFeatures, function (feature) {
            setDefaults(feature);
        });
        setDefaults(service.fileFormat);
        service.fileName = fileName || strings.SDE_XEROX_SCAN;

    };
    // Check if any of this features options are disabled
    service.updateDisabledOptions = function (feature, device) {
        var currentOptions = service.getValues(device);

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
