/* Copyright © 2022 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .factory('onBoxOcrCapabilityService', onBoxOcrCapabilityService);

function onBoxOcrCapabilityService(localStorageService, modalService) {    
    var DEVICE_URL = "http://127.0.0.1";
    var DEVICE_TIMEOUT = 0;
    var EIP_SNMP_OID = "1.3.6.1.4.1.253.8.74.5.2.1.4.30";
    var isOnBoxOcrCapable = false;
    var service = { communityString: localStorageService.getCommunityName() };    
    service.getOnBoxOcrCapability = function () {

        var deferred = $q.defer();        
            xrxWsSnmpGet(DEVICE_URL,
                service.communityString,
                EIP_SNMP_OID,
                function callback_success(envelope, response)
                {
                    var data = xrxWsSnmpParseGet(response);                   
                    if (data !== null) {

                        if (data.returnValue === null || data.returnValue === '') {
                        
                            isOnBoxOcrCapable = false;
                        }
                        else {
                            isOnBoxOcrCapable = (data.returnValue == 1) ? true : false;
                        }
                    } else {
                        
                        isOnBoxOcrCapable = false;
                    }
                    deferred.resolve({ isOnBoxOcrCapable: isOnBoxOcrCapable })
                },
                function callback_failure(envelope, response) {
                  
                    modalService.showAlertBanner('SDE_SNMP_INCORRECT');
                    deferred.resolve({ isOnBoxOcrCapable: isOnBoxOcrCapable })
                },
                DEVICE_TIMEOUT
            )     
        return deferred.promise;
    }
    return service;
}
