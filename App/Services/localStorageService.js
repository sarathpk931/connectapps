/* Copyright © 2022 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('localStorageService', localStorageService);
function localStorageService(strings) {
    var service = {};

    /* PROPERTIES */
    var cryptoKey = strings.ClientSideEncryptionKey;
    var configPrefix = 'config';
    var communityNameKey = 'communityName';
    var advancedConfigKey = 'advancedConfig';
    var defaultLandingPageKey = 'defaultLandingPage';
    var enableEmailKey = 'enableEmail';

    var webletSourceKey = "webletsource-" + $('meta[name=connector]').attr("content").toLowerCase()+"-" + window.location.host;

    /* Private METHODS */
    function encrypt(value) {
        return CryptoJS.AES.encrypt(value, cryptoKey);
    }
    function decrypt(value) {
        if (value) {
            try {
                var decryptedBytes = CryptoJS.AES.decrypt(value, cryptoKey);
                return decryptedBytes.toString(CryptoJS.enc.Utf8);
            } catch (err) {
                return value;
            }
        }
        return value;
    }

    function setLocalStorageItem(key, data, config) {
        if (typeof (Storage) !== "undefined") {
            localStorage.setItem(config ? configPrefix + key : key, encrypt(data));
        }
    }

    function getLocalStorageItem(config, key, defaultValue) {
        var result;
        if (typeof (Storage) !== "undefined") {
            if (config) {
                result = decrypt(localStorage.getItem(configPrefix + key));
            } else {
                result = decrypt(localStorage.getItem(key) || localStorage.getItem(configPrefix + key));
            }
        }
        //if the default value is undefined then will return empty;
        result = result || (typeof defaultValue !== "undefined" ? defaultValue : '');
        return strings[result] !== undefined ? strings[result] : result;
    }

    // Set device snmp communityname
    service.setCommunityName = function (communityName) {
        setLocalStorageItem(communityNameKey, communityName, true);
    };

    // Used to get snmp communityname
    service.getCommunityName = function () {
        return getLocalStorageItem(true, communityNameKey, 'public');
    };

    // Set device snmp communityname
    service.setAdvancedConfig = function (advancedConfig) {
        setLocalStorageItem(advancedConfigKey, advancedConfig, true);
    };

    // Used to get snmp communityname
    service.getAdvancedConfig = function () {
        return getLocalStorageItem(true, advancedConfigKey, '');
    };


    // Set O365 Default Landing Page
    service.setDefaultLandingPage = function (defaultLandingPage) {
        setLocalStorageItem(defaultLandingPageKey, defaultLandingPage, true);
    };
    // Used to get O365 Default Landing Page
    service.getDefaultLandingPage = function () {
        return getLocalStorageItem(true, defaultLandingPageKey, '');
    };

    service.setEnableEmailFeature = function (enableEmail) {
        setLocalStorageItem(enableEmailKey, enableEmail, true);
    };

    service.getEnableEmailFeature = function () {
        return getLocalStorageItem(true, enableEmailKey, '1');
    };


    // Sets the source webletname basically for Fedramp implementation
    service.setWebletSource = function (webletSource) {
        setLocalStorageItem(webletSourceKey, webletSource, true);
    };
    // Gets the source webletname basically for Fedramp implementation
    service.getWebletSource = function () {
        return getLocalStorageItem(true, webletSourceKey, '');
    };

    return service;
}
