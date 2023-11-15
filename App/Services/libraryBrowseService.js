/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('libraryBrowseService', libraryBrowseService);

function libraryBrowseService($http, $state, modalService, loginService) {
    var service = {};
    var $ctrl = this;
    $ctrl.loginService = loginService;
    service.fileFormat = {
        name: 'fileFormat',
        title: 'SDE_FILE_FORMAT',
        icon: 'file_name_and_format_48.png',
        options: [{
            value: 'pdf',
            title: '.pdf',
            icon: 'filetype_pdf_48.png',
            isOCR: true,
            isDefault: true
        }, {
            value: 'tiff',
            title: '.tif',
            icon: 'filetype_tif_48.png',
            disabledIf: [{
                feature: "colorMode",
                value: "AUTO",
                message: "SDE_TIF_UNAVAILABLE_WHILE"
            }]
        }, {
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
        subFeatures: [{
            name: 'combineFiles',
            value: 'combineFiles',
            title: 'SDE_COMBINE_FILES',
            enabledIf: 'tiff',
            type: 'toggle',
            options: [{
                value: false,
                desc: "SDE_ALL_SCANS_WILL"
            }, {
                value: true,
                isDefault: true,
                desc: "SDE_MAKES_ONE_ATTACHMENT"
            }]
        }, {
            name: 'searchableText',
            title: 'SDE_SEARCHABLE',
            enabledIf: 'pdf',
            type: 'toggle',
            options: [{
                value: 'IMAGE_ONLY',
                title: 'SDE_IMAGE_ONLY',
            }, {
                value: 'SEARCHABLE_IMAGE',
                title: 'SDE_SEARCHABLE',
                isDefault: true
            }],
            subFeatures: [{
                name: 'language',
                title: 'SDE_LANGUAGE',
                enabledIf: 'SEARCHABLE_IMAGE',
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
        }, {
            name: 'archivalFormat',
            title: 'SDE_ARCHIVAL_PDFA',
            enabledIf: 'pdf',
            type: 'toggle',
            options: [{
                value: false,
                isDefault: true
            }, {
                value: true
            }]
        }]
    };
    service.getFolders = function (callback) { 
        //var data = {"Avacado","Orange","Pinapple"}
        ////return $http.get('./api/edocs/folders?library=' + $ctrl.loginService.libraries).then(function (response) {
        ////    return response.data;
        ////}).catch(function (error) {
        ////    callback(error);
        ////});
        //return 
        return service.fileFormat;
    };
    service.getFolderContent = function (folderId, callback) {
        //return $http.get('./api/edocs/folderContent/'+ folderId +'?library=' + $ctrl.loginService.libraries).then(function (response) {
        //    return response.data;
        //}).catch(function (error) {
        //    callback(error);
        //});
    };
    return service;
}
