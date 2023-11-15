/* Copyright © 2022 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('scanTemplate', scanTemplate);

function scanTemplate(connectService) {
    var XRX_SCAN_TEMPLATE_RETURN = '\n\n\r';

    // The types along with the validation function and formatting functions.
    var templateTypes = {
        'boolean': {
            supportsSimpleValidation: true,
            values: ['TRUE', 'FALSE']
        },
        'enum_autoexposure': {
            supportsSimpleValidation: true,
            values: ['ON', 'OFF']
        },
        'enum_originalsubtype': {
            supportsSimpleValidation: true,
            values: ['PRINTED_ORIGINAL']
        },
        'integer': {
            validate: function (v) {
                var pattern = /^[0-9]*$/;
                return v.toString().match(pattern);
            },
            values: ['NUMBER (integer)']
        },
        'string': {
            format: function (v) {
                return "\"" + v + "\"";
            }
        },
        'enum_resolution': {
            supportsSimpleValidation: true,
            values: ['RES_72X72', 'RES_150X150', 'RES_100X100', 'RES_200X200', 'RES_300X300', 'RES_400X400', 'RES_600X600']
        },
        'enum_colormode': {
            supportsSimpleValidation: true,
            values: ['AUTO', 'BLACK_AND_WHITE', 'GRAYSCALE', 'FULL_COLOR']
        },
        'enum_docformat': {
            supportsSimpleValidation: true,
            values: ['XSM_TIFF_V6', 'TIFF_V6', 'JFIF_JPEG', 'PDF', 'PDF/A-1b', 'XPS']
        },
        'enum_inputorientation': {
            supportsSimpleValidation: true,
            values: ['PORTRAIT', 'LANDSCAPE']
        },
        'enum_searchabletext': {
            supportsSimpleValidation: true,
            values: ['IMAGE_ONLY', 'SEARCHABLE_IMAGE']
        },
        'enum_imagemode': {
            supportsSimpleValidation: true,
            values: ['MIXED', 'PHOTO', 'TEXT', 'MAP', 'NEWSPAPER_AND_MAGAZINE']
        },
        'enum_sided': {
            supportsSimpleValidation: true,
            values: ['ONE_SIDED', 'TWO_SIDED', 'SECOND_SIDE_ROTATION']
        },
        'enum_mediasize': {
            supportsSimpleValidation: true,
            values: ['AUTO', 'NA_5.5x7LEF', 'NA_5.5x7SEF', 'NA_5.5x8.5LEF', 'NA_5.5x8.5SEF', 'NA_8.5x11LEF',
                'NA_8.5x11SEF', 'NA_8.5x13SEF', 'NA_8.5x14SEF', 'NA_11x17SEF',
                'ISO_A5LEF', 'ISO_A5SEF', 'ISO_A4LEF', 'ISO_A4SEF', 'ISO_A3SEF',
                'JIS_B4SEF', 'JIS_B5LEF', 'JIS_B5SEF']
        }
    };

    // Perform simple validation against an array of values.
    function validateAgainstArray(v, arr) {
        return arr.find(function (d) {
            return d === v;
        });
    }

    function scanTemplate(featureValues) {
        // Add properties from the section templates
        this.docSection = _.clone(__docSec);
        this.destSection = _.clone(__destSec);
        this.generalSection = _.clone(__generalSection);
        this.scanSection = _.clone(__scanSection);
        this.sections = [this.scanSection, this.generalSection, this.destSection, this.docSection];

        // Destination - For Versalinks (if (device.isVersalink)) you will need to prepend your
        // AppName to XrxHTTPScriptLocation, and append it to RepositoryName.
        // the querystring FILE_TYPE is used to add validate the file size for MS FIle formats for Documentconversion
        this.destSection.details.XrxHTTPScriptLocation.value = featureValues.destinationUrl + "?ACCOUNT_ID=" + connectService.accountId + "&amp;FILE_ID=" + connectService.fileIds.slice(-1).pop() + "&amp;FILE_TYPE=" + featureValues.fileFormat + "&amp;IS_PREVIEW=" + featureValues.preview; 
        this.destSection.details.RepositoryName.value = location.host;
        this.destSection.details.DocumentPath.value = connectService.connector; //'C:\\tmp';

        /* As a general rule, all apps should be running over https. However, if developers wish
         * to run locally using http, this is an example of how you would change that.
        if (location.href.startsWith('http:')) {
            this.destSection.details.FilingProtocol.value = 'XRXHTTP';
        }
        */

        // Resolution
        this.docSection.details.Resolution.value = featureValues.resolution;

        switch (featureValues.fileFormat) {
            case 'jpg':
                this.docSection.details.DocumentFormat.value = 'JFIF_JPEG';
                break;
            case 'pdf':
            case 'xps':
                if (connectService.isDocConversion) {
                    saveScannedDocumentToImageFormat(featureValues, this.docSection);
                }
                else {
                    if (featureValues.fileFormat === 'pdf') {
                        this.docSection.details.DocumentFormat.value = featureValues.archivalFormat ? 'PDF/A-1b' : 'PDF';
                    }
                    if (featureValues.fileFormat === 'xps') {
                        this.docSection.details.DocumentFormat.value = 'XPS'
                    }
                    this.docSection.details.SearchableText.value = featureValues.searchableText;
                    if (featureValues.searchableText) {
                        this.docSection.details.SourceDocumentLanguages.value = featureValues.language;
                    }
                }
                break;
            case 'tiff':
                this.docSection.details.DocumentFormat.value = featureValues.combineFiles ? 'TIFF_V6' : 'XSM_TIFF_V6';
                break;
            case 'docx':
            case 'xlsx':
            case 'pptx':
                saveScannedDocumentToImageFormat(featureValues, this.docSection);
                break;

            default:
                this.docSection.details.DocumentFormat.value = 'PDF/A-1b';
                this.docSection.details.SearchableText.value = 'SEARCHABLE_IMAGE';
                this.docSection.details.SourceDocumentLanguages.value = 'en';
                break;
        }

        this.docSection.details.DocumentObjectName.value = featureValues.fileName;

        // Scan settings
        this.scanSection.details.SidesToScan.value = featureValues.plex;
        this.scanSection.details.InputOrientation.value = featureValues.orientation;
        this.scanSection.details.CompressionQuality.value = featureValues.quality;
        this.scanSection.details.ColorMode.value = featureValues.colorMode;
        this.scanSection.details.InputMediaSize.value = featureValues.mediaSize;
        this.scanSection.details.DocumentImageMode.value = featureValues.originalType;

        // Template name
        this.name = "App_Scan" + new Date().getTime() + ".xst";
        this.generalSection.details.JobTemplateName.value = this.name;
    }

    function saveScannedDocumentToImageFormat(featureValues, docSection) {
        if (featureValues.colorMode == 'AUTO')
            featureValues.colorMode = 'FULL_COLOR';
        if (featureValues.colorMode == 'BLACK_AND_WHITE')
            featureValues.colorMode = 'GRAYSCALE';
        docSection.details.DocumentFormat.value = 'JFIF_JPEG';
        docSection.details.SourceDocumentLanguages.value = featureValues.language;        
    }

    // Creates a string representation of the template.
    scanTemplate.prototype.toString = function () {
        var _sectionStrings = [];

        for (var index = 0; index < this.sections.length; index++) {
            var section = this.sections[index];

            var sectionString = section.name + XRX_SCAN_TEMPLATE_RETURN;

            // Handles multiple destinations
            if (section.name === __destSec.name && section.details.constructor === Array) {
                _.each(section.details, function (detail, index) {
                    sectionString += "file_" + (index + 1) + transformObjectToTemplateSection(detail);
                });
            }
            else
                sectionString += transformObjectToTemplateSection(section.details);

            _sectionStrings.push(sectionString);
        }

        // Join them all up.
        return _sectionStrings.join('end' + XRX_SCAN_TEMPLATE_RETURN) + 'end' + XRX_SCAN_TEMPLATE_RETURN;
    };

    function transformObjectToTemplateSection(details) {
        var sectionString = '{' + XRX_SCAN_TEMPLATE_RETURN;

        // Get the values of the template.
        _.keys(details).forEach(function (detail) {
            var typeName = details[detail].type;
            var typeValue = details[detail].value;

            // Get the formatting function.
            var templateType = templateTypes[typeName];

            // Can we validate?
            if (templateType) {
                // Do we have a validation function? If not we might be able to use the simple validation function.
                var validateFunction = templateType.supportsSimpleValidation && templateType.supportsSimpleValidation === true ? validateAgainstArray : templateType.validate;

                if (validateFunction && !validateFunction(typeValue, templateType.values))
                    throw new ScanTemplateFormatException(typeValue, detail, templateTypes[typeName].values);
            }

            // Reformat if necessary.
            if (templateType && templateType.format) {
                typeValue = templateType.format(typeValue);
            }

            // Format the entry
            sectionString += '\t' +
                typeName + ' ' +
                detail + ' = ' +
                typeValue + ';' +
                XRX_SCAN_TEMPLATE_RETURN;
        });

        sectionString += '}' + XRX_SCAN_TEMPLATE_RETURN;
        return sectionString;
    }

    // Exception thrown if the scan template is invalid.
    function ScanTemplateFormatException(value, propName, acceptableValues) {
        this.value = value;
        this.acceptableValues = acceptableValues;
        this.propName = propName;
        this.toString = function () {
            return "The scan template is invalid. The property: " + propName +
                " is invalid. The acceptable values are: " + acceptableValues.join(',');
        };
    }

    // Scanner related settings.
    var __scanSection = {
        name: '[service xrx_svc_scan]',
        details: {
            AutoContrast: { type: 'boolean', value: 'FALSE' },
            AutoExposure: { type: 'enum_autoexposure', value: 'OFF' },
            CompressionQuality: { type: 'integer', value: 128 },
            Darkness: { type: 'integer', value: 0 },
            Contrast: { type: 'integer', value: 0 },
            OriginalSubType: { type: 'enum_originalsubtype', value: 'PRINTED_ORIGINAL' },
            InputEdgeErase: { type: 'struct_borders', value: '2/2/2/2/mm' },
            InputMediaSize: { type: 'enum_mediasize', value: 'AUTO' },
            InputOrientation: { type: 'enum_inputorientation', value: 'PORTRAIT' },
            Magnification: { type: 'struct_magnification', value: 'NONE' },
            Sharpness: { type: 'integer', value: 0 },
            Saturation: { type: 'integer', value: 0 },
            ColorMode: { type: 'enum_colormode', value: 'AUTO' },
            SidesToScan: { type: 'enum_sided', value: 'ONE_SIDED' },
            DocumentImageMode: { type: 'enum_imagemode', value: 'MIXED' },
            BlankPageRemoval: { type: 'enum_blankpageremoval', value: 'INCLUDE_ALL_PAGES' }
        }
    };

    // General section
    var __generalSection = {
        name: '[service xrx_svc_general]',
        details: {
            DCSDefinitionUsed: { type: 'enum_DCS', value: 'DCS_GENERIC' },
            JobTemplateCharacterEncoding: { type: 'enum_encoding', value: 'UTF-8' },
            ConfirmationStage: { type: 'enum_confstage', value: 'AFTER_JOB_COMPLETE' },
            JobTemplateCreator: { type: 'string', value: 'scanTemplate.js' },
            SuppressJobLog: { type: 'boolean', value: 'FALSE' },  // Important this is FALSE so the logfile is uploaded after last scan file and used to trigger sending files.
            JobTemplateLanguageVersion: { type: 'string', value: '4.00.07' },
            JobTemplateName: { type: 'string', value: '' }, // Random name of the template
            ConfirmationMethod: { type: 'enum_confmethod', value: 'NONE' }
        }
    };

    // Destination section
    var __destSec = {
        name: '[service xrx_svc_file]',
        details: {
            RepositoryAlias: { type: 'string', value: 'AG_SCAN' },
            FilingProtocol: { type: 'enum_filingprotocol', value: 'XRXHTTPS' }, //FTP, HTTP, XRXHTTP, HTTPS, XRXHTTPS, SMB
            RepositoryVolume: { type: 'string', value: '' }, //share folder path
            RepositoryName: { type: 'string', value: '' }, // server (13.121.236.113).
            DocumentPath: { type: 'string', value: '' },
            ServerValidationReq: { type: 'boolean', value: 'FALSE' },
            DocumentFilingPolicy: { type: 'enum_filingpolicy', value: 'NEW_AUTO_GENERATE' },
            XrxHTTPScriptLocation: { type: 'string', value: '' }, // web application name and route
            UserNetworkFilingLoginName: { type: 'string', value: '' },
            UserNetworkFilingLoginID: { type: 'string', value: '' }
        }
    };

    // Document section
    var __docSec = {
        name: '[doc_object xrx_document]',
        details: {
            DocumentFormat: { type: 'enum_docformat', value: 'PDF' },
            DocumentObjectName: { type: 'string', value: 'XeroxScan' },
            CompressionsSupported: { type: 'enum_compression', value: 'ANY' },
            MixedTypesSupported: { type: 'enum_mixedtype', value: 'MULTI_MASK_MRC, 3_LAYER_MRC' },
            MixedCompressionsSupported: { type: 'enum_mixedcompressions', value: 'ANY_BINARY, ANY_CONTONE' },
            Resolution: { type: 'enum_resolution', value: 'RES_300X300' },
            SearchableText: { type: 'enum_searchabletext', value: 'IMAGE_ONLY' },
            SourceDocumentLanguages: { type: 'string', value: 'en' },
            OutputImageSize: { type: 'enum_outputsize', value: 'SAME_AS_ORIGINAL' },
            UserData: { type: 'ref_invocation', value: '' }
        }
    };

    return scanTemplate;
}
