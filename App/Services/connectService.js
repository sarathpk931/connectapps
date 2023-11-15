/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


angular
    .module('app')
    .factory('connectService', connectService);

function connectService(modalService, $http, $q, device, $location, strings, localStorageService) {
    var service = {
        user: {
            AccessToken: null, RefreshToken: null, UserInfo: null, Documents: [], Recipients: [], recipientOrder: true
        }, baseUrl: "{0}/restapi/v2/accounts/{1}/{2}", userName: '', baseUri: '', accountId: ''
    };    
    service.connector = $('meta[name=connector]').attr("content");
    service.security = {
        Params: "", Access: "", Refresh: "", Security: "", UserName: ""
    };
    service.displayName = "";
    service.requestParams = {
        SiteId: null, LibraryId: null, FolderId: null, FileId: null
    };
    service.recipientList = [];
    service.vaultStatus = "";
    service.pageSize = strings.PageSize;
    service.enablePagination = strings.EnablePagination;
    service.nextPageToken = "";
    service.Feature = "";
    service.DeletedList = "";
    service.mailId = "";
    service.pageCount = 1;
    service.currentData = {};
    service.selectedLanguage = "";
    service.requestCounter = 0;
    service.metaData = {
        contentName: "", documentNumber: "", client: "", matter: "", author: "", documentType: "", createdOn: "", modifiedOn: ""

    }
    service.accountId;
    service.fileIds = [];
    service.getDatetime = function () {
        return (new Date).toLocaleFormat("%A, %B %e, %Y");
    };
    service.selectedDate;
    service.jobId = "";
    service.currentPath = "";
    service.contentName = "";
    service.selectedLanguage = "";
    service.selectedDocsForPrint = [];
    service.selectedDocsForPreview;
    service.selectedScanFolderContents = [];
    service.previewImages = [];
    service.breadCrumbs = [];
    service.isOnBoxOcrCapable = true;// defaulting to true
    service.pdfCompatibility = "Pdf16";
    service.isDocConversion = false;

    //Properties for holding the folder details from where the last file was selected
    service.previousPath = "";
    service.previousFolder = null;
    service.previousBreadCrumbs = null;

    service.selectedTrustees = [
        {
            "name": "Boggs, Wade",
            "permission": "View"
        }, {
            "name": "Copper, John",
            "permission": "Collaborate"
        }, {
            "name": "Dannon, Karen",
            "permission": "Manage"
        }]


    service.customAppCapabilities = function () {
        var appCapabilities = {
            "EmailAScanCopyEnabled": true,
            "SSOEnabled": true,
            "DCEEnabled": true,
        }
        //if the source call from FedRamp then the customAappCapabilties will get updated.
        if (localStorageService.getWebletSource() === "fedramp") {
            appCapabilities = {
                "EmailAScanCopyEnabled": false,
                "SSOEnabled": false,
                "DCEEnabled": false,
            }
        }
        return appCapabilities;
    }


    service.sharePointFolders = {
        teamSite: "Team Site", followedSites: "Followed Sites", mySite: "My Site"
    }

    service.glyphIconClass = {
        MSOfficeGlyph: "xrx-ms_office", teamSiteGlyph: "xrx-group", followedSitesGlyph: "xrx-favorites", siteGlyph: "xrx-network_square", libraryGlyph: "xrx-accounting", folderGlyph:"xrx-folder", collectionGlyph: "xrx-collection"
    }

    service.connectors = {
        Office365: "GraphSharePoint",
        OneDrive: "GraphOneDrive",
        GoogleDrive: "GoogleDrive",
        DocuShare: "DocuShare",
        Dropbox: "Dropbox",
        Box: "Box"
        
    }
    //sets the default selected folder icon to folder 
    if (service.connector === service.connectors.DocuShare) {
        service.selectedFolderIcon = service.glyphIconClass.collectionGlyph;
    }
    else {
        service.selectedFolderIcon = service.glyphIconClass.folderGlyph;
    }
    service.setRequestParams = function (item) {
        if (!item.IsSite && item.IsLibrary === undefined && item.IsFolder === undefined) {
            service.requestParams.SiteId = null;
            service.requestParams.LibraryId = null;
            service.requestParams.FolderId = null;
            service.requestParams.FileId = null;
        }
        else if (item.IsSite) {
            service.requestParams.SiteId = item.Id;
            service.requestParams.LibraryId = null;
            service.requestParams.FolderId = null;
            service.requestParams.FileId = null;
        }
        else if (item.IsLibrary) {
            service.requestParams.LibraryId = item.Id;
            service.requestParams.FolderId = null;
            service.requestParams.FileId = null;
        }
        else if (item.IsFolder) {
            service.requestParams.FolderId = item.Id;
            service.requestParams.FileId = null;
        }
        else {
            service.requestParams.FileId = item.Id;
        }
    }
    //to get all the images to preview in scan workflow
    service.getPreviewImages = function () {
        var data = JSON.stringify({
            'AccountId': service.accountId,
            'FileId': service.fileIds.slice(-1).pop()
        });
        return $http.post('./api/preview/fullPreview', data, { timeout: parseInt("900000") }).then(function (result) {
            return result.data;
        }).catch(function (error) {
            console.log("Error getting preview");
            return $q.reject(error);
        });
    };
    //to get Full resoultion format of selected image in Scan preview 
    service.getFullResolutionImage = function (accountId, documents, pageNumber) {
        var data = JSON.stringify({
            'account_id': accountId,
            'document_ids': documents,
            'envelope_id': pageNumber
        });
        return $http.post('./api/preview/singlePreview', data).then(function (result) {
            return result.data;
        }).catch(function (error) {
            console.log("Error getting full resolution preview");
            return $q.reject(error);
        });
    };
    service.selectedFolder;
    service.startLogin = function () {
    };

    service.finishLogin = function () {
    };

    service.completeSSOLogin = function (token) {

    };

    service.getUserInfo = function () {

    };

    service.documents = function () {
        return service.user.Documents;
    };
    service.addDocument = function (name) {
        service.user.Documents.push(name);
    };
    service.clearDocuments = function () {
        return service.user.Documents = [];
    };

    service.recipients = function () {
        return service.user.Recipients;
    };
    service.clearRecipients = function () {
        service.user.recipientOrder = true;
        return service.user.Recipients = [];
    };


    service.saveEnvelope = function (envelopeName, message, templateId, sendStatus) {

    };

    service.getUser = function () {
        return service.user;
    };

    service.logoff = function () {

    };

    service.getJsonFromUrl = function () {
        var url = location.search;
        var query = url.substr(1);
        var result = {};
        query.split("&").forEach(function (part) {
            var item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    };
    service.generateGUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    //to get all the folders,sites
    service.getLibraries = function (IsSite, Feature, ParentDir, FolderName) {
        var data = service.CreateRequestData(IsSite, Feature, ParentDir, FolderName,false)

        return $http.post('./api/content/browse', data, service.setHeaders()).then(function (result) {
            return JSON.parse(result.data);
        }).catch(function (error) {
            console.log("Error getting libraries");
            return $q.reject(error);
        });
    };
    service.getWebletSource = function () {
        var weblet = null;
        if (localStorageService.getWebletSource() != '') {
            weblet = localStorageService.getWebletSource();
        }
        else {
            weblet = "connectapps";
        }
        return weblet;
    }
    service.setHeaders = function () {      
        var httpHeaders = {
            headers: { 'Cache-Control': 'no-cache', 'WEBLET_SOURCE': service.getWebletSource() }
        };
        return httpHeaders;
    };

    //to get all the folders,sites
    service.repohome = function (IsSite, Feature, ParentDir, FolderName) {
        var data = service.CreateRequestData(IsSite, Feature, ParentDir, FolderName,true)

        return $http.post('./api/content/repohome', data).then(function (result) {
            return JSON.parse(result.data);
        }).catch(function (error) {
            console.log("Error getting libraries");
            return $q.reject(error);
        });
    };

    service.CreateRequestData = function (IsSite, Feature, ParentDir, FolderName,IsRepoHome) {
        var data = JSON.stringify({
            'Token': {
                'Access': service.security.Access,
                'Refresh': service.security.Refresh,
                'Security': service.security.Security,
                'Connector': service.connector
            },
            'Feature': Feature,
            'IsSite': IsSite,
            'ParentDir': ParentDir,
            'FolderName': FolderName,
            'CurrentUser': service.security.UserName,
            'SiteId': service.requestParams.SiteId,
            'LibraryId': service.requestParams.LibraryId,
            'FolderId': service.requestParams.FolderId,
            'FileId': service.requestParams.FileId,
            'DefaultLandingPage': localStorageService.getDefaultLandingPage(),
            'IsRepoHome': IsRepoHome,
            'IsDCEEnabled': service.customAppCapabilities().DCEEnabled
        });
        return data;
    }




    //search for an item 
    service.searchDirectory = function (query) {
        var data = JSON.stringify({
            'Token': {
                'Access': service.security.Access,
                'Refresh': service.security.Refresh,
                'Security': service.security.Security,
                'Connector': service.connector
            },
            'Feature': service.currentData.Feature,
            'IsSite': true,
            'ParentDir': service.currentPath,
            'FolderName': '',
            'CurrentUser': service.security.UserName,
            'Query': query,
            'PageSize': service.enablePagination.toLowerCase() === "true" ? service.pageSize : "",
            'PageToken': service.nextPageToken,
            'SiteId': service.requestParams.SiteId,
            'LibraryId': service.requestParams.LibraryId,
            'FolderId': service.requestParams.FolderId,
            'FileId': service.requestParams.FileId
        });

        return $http.post('./api/content/search', data).then(function (result) {
            return JSON.parse(result.data);
        }).catch(function (error) {
            console.log("Error searching directory");
            return $q.reject(error);
        });
    };
    //Upload document to the server
    service.uploadDocument = function (filePath) {
        var data = JSON.stringify({
            'SitePath': service.currentData.SitePath,
            'Connector': service.connector,
            'EncodedData': service.currentData.EncodedData,
            'Token': service.currentData.Token,
            'OAuthToken': service.currentData.OAuthToken,
            'RefreshToken': service.security.Refresh,
            'FileName': service.contentName,
            'FilePath': filePath,
            'Feature': service.currentData.Feature,
            'Content': null,
            'ServerPath': service.currentData.ServerPath,
            'SAAccountId': service.accountId,
            'SAFileIds': service.fileIds,
            'SiteId': service.requestParams.SiteId,
            'LibraryId': service.requestParams.LibraryId,
            'FolderId': service.requestParams.FolderId,
            'JobId': service.jobId.indexOf(":") != -1 ? service.jobId.split(":")[1] : service.jobId,
            'Toaddress': service.recipientList,
            //gets the language code and if undefiend or null then set default language english
            'Language': service.selectedLanguage ? service.selectedLanguage : "en",
            'PdfCompatibility': service.pdfCompatibility,
            'IsDocConversion': service.isDocConversion 
        });
        debugger;
        return $http.post('./api/scan/uploadDocument', data).then(function (result) {
            return result;
        }).catch(function (error) {
            console.log("Error uploading document");
            return $q.reject(error);
        });
    };

    //Save scan details to the Azure Table Storage
    service.saveToAzureTable = function (filePath) {
        var data = JSON.stringify({
            'SitePath': service.currentData.SitePath,
            'Connector': service.connector,
            'EncodedData': service.currentData.EncodedData,
            'Token': service.currentData.Token,
            'OAuthToken': service.currentData.OAuthToken,
            'RefreshToken': service.security.Refresh,
            'FileName': service.contentName,
            'FilePath': filePath,
            'Feature': service.currentData.Feature,
            'SAAccountId': service.accountId,
            'FolderId': service.requestParams.FolderId,
            'JobId': service.jobId.indexOf(":") != -1 ? service.jobId.split(":")[1] : service.jobId,
            'Toaddress': service.recipientList,
            //gets the language code and if undefiend or null then set default language english
            'Language': service.selectedLanguage ? service.selectedLanguage : "en",
            'PdfCompatibility': service.pdfCompatibility,
            'IsDocConversion': service.isDocConversion 
            
        });
        return $http.post('./api/scan/saveToTable', data).then(function (result) {
            return result;
        }).catch(function (error) {
            console.log("Save to Table Error.");
            return $q.reject(error);
        });
    };

    //Get Scan Status
    service.getScanStatus = function () {
        return $http.get("./api/scan/getScanStatus?scanId=" + service.accountId).
            then(function (response) {
                if (response.data) {
                    return response.data;
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error calling Get Scan Status");
                return $q.reject(error);
            });
    };

    //Delete Scan Record from Azure Table
    service.deleteScanRecord = function (accountId) {
        return $http.delete("./api/scan/deleteScanRecord?scanId=" + accountId).
            then(function (response) {
                if (response) {
                    return response
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error on deleteScanRecord");
                return $q.reject(error);
            });
    };

    //Update Job Id in Scan Record of Azure Table
    service.updateJobIdScanRecord = function (accountId, jobId) {
        return $http.put("./api/scan/updateJobId?scanId=" + accountId + "&jobId=" + jobId).
            then(function (response) {
                if (response) {
                    return response
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error on updateJobIdScanRecord");
                return $q.reject(error);
            });
    };

    //to download the document from the server
    service.downloadDocument = function (selectedDocument) {
        if (service.requestParams.LibraryId === null) {
            service.requestParams.LibraryId = selectedDocument.LibraryId
        }
        var data = JSON.stringify({
            'SitePath': service.currentData.SitePath,
            'Connector': service.connector,
            'EncodedData': service.currentData.EncodedData,
            'Token': service.currentData.Token,
            'OAuthToken': service.currentData.OAuthToken,
            'FileName': service.currentData.CurrentFolderName,
            'filePath': service.currentData.CurrentFolderName + '/' + selectedDocument.Name,
            'Feature': service.currentData.Feature,
            'ServerPath': service.currentData.ServerPath,
            'SAAccountId': service.accountId,
            'SiteId': service.requestParams.SiteId,
            'LibraryId': service.requestParams.LibraryId,
            'SAFileId': selectedDocument.FileId,
            'FileId': selectedDocument.Id
        });
        return $http.post('./api/print/downloadDocument', data).then(function (result) {
            return result;
        }).catch(function (error) {
            console.log("Error downloading document");
            return $q.reject(error);
        });
    };
    //To get the images for preview in print workflow
    service.getPrintPreviewImages = function (selectedDocument, path) {
        if (service.requestParams.LibraryId === null) {
            service.requestParams.LibraryId = selectedDocument.LibraryId
        }
        var data = JSON.stringify({
            'SitePath': service.currentData.SitePath,
            'Connector': service.connector,
            'EncodedData': service.currentData.EncodedData,
            'Token': service.currentData.Token,
            'OAuthToken': service.currentData.OAuthToken,
            'FileName': service.currentData.CurrentFolderName,
            'filePath': path + service.currentData.CurrentFolderName + '/' + selectedDocument.Name,
            'Feature': service.currentData.Feature,
            'ServerPath': service.currentData.ServerPath,
            'SAAccountId': service.accountId,
            'SiteId': service.requestParams.SiteId,
            'LibraryId': service.requestParams.LibraryId,
            'SAFileId': service.fileIds[service.fileIds.length - 1],
            'FileId': selectedDocument.Id
        });
        return $http.post('./api/preview/printFullPreview', data).then(function (result) {
            return result.data;
        }).catch(function (error) {
            console.log("Error getting printFullPreview");
            return $q.reject(error);
        });
    };
    //Print peview zoom (need full resoultion image)
    service.getprintFullResoultion = function (selectedDocument) {
        var data = JSON.stringify({
            'SitePath': service.currentData.SitePath,
            'Connector': service.connector,
            'EncodedData': service.currentData.EncodedData,
            'Token': service.currentData.Token,
            'OAuthToken': service.currentData.OAuthToken,
            'FileName': service.currentData.CurrentFolderName,
            'filePath': service.currentData.CurrentFolderName + '/' + selectedDocument.Name,
            'Feature': service.currentData.Feature,
            'ServerPath': service.currentData.ServerPath,
            'SAAccountId': service.accountId,
            'SiteId': service.requestParams.SiteId,
            'LibraryId': service.requestParams.LibraryId,
            'SAFileId': service.fileIds[service.fileIds.length - 1],
            'FileId': selectedDocument.Id
        });
        return $http.post('./api/preview/printFullResoultionPreview', data).then(function (result) {
            return result.data;
        }).catch(function (error) {
            console.log("Error getting printFullResoultionPreview");
            return $q.reject(error);
        });
    };
    //get logined user details
    service.getCurrentUser = function () {
        var data = JSON.stringify({
            'Access': service.security.Access,
            'Refresh': service.security.Refresh,
            'Security': service.security.Security,
            'Connector': service.connector
        });
        return $http.post('./api/connectApps/getCurrentUser', data).then(function (result) {
            var userNames = JSON.parse(result.data);
            service.user.UserInfo = userNames;
            service.security.UserName = userNames.DisplayName;
            service.displayName = userNames.DisplayName;
            service.organizationName = userNames.AccountAttributes ? userNames.AccountAttributes['organizationName']: '';
            return userNames;
        }).catch(function (error) {
            console.log("Error getting current user");
            return $q.reject(error);
        });
    };

    service.getDisplayName = function () {
        return service.displayName;
    };

    service.getReturnUrl = function () {
        return "https://{0}/{1}.html".format($location.host(), service.connector);
    };

    service.startConversion = function (id) {
        return $http.get("./api/print/startConversion?id=" + id).
            then(function (response) {
                if (response.data) {
                    return response.data.JobId
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error calling DCE for conversion");
                return $q.reject(error);
            });
    };


    service.getConvertedPrintUrl = function (conversionId) {
        return $http.get("./api/print/getConvertedPrintUrl?jobId=" + conversionId).
            then(function (response) {
                if (response.data) {
                    return response.data
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error getting print url");
                return $q.reject(error);
            });
    };

    service.getNativePrintUrl = function (id) {
        return $http.get("./api/print/getNativePrintUrl?id=" + id).
            then(function (response) {
                if (response.data) {
                    return response.data
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error getting native print url");
                return $q.reject(error);
            });
    };
    //to detelet the file from blob
    service.deleteFromBlob = function (accountId) {
        return $http.delete("./api/scan/deleteFromBlob?accountId=" + accountId).
            then(function (response) {
                if (response) {
                    return response
                }
                else {
                    return $q.reject(response);
                }
            }).catch(function (error) {
                console.log("Error on deleteFromBlob");
                return $q.reject(error);
            });
    };

    service.setTokens = function (tokens) {
        function isEncoded(value) {
            value = value || '';
            return value !== decodeURIComponent(value);
        }
        service.security.Access = tokens.Access;
        service.security.Refresh = tokens.Refresh || "";
        if (isEncoded(tokens.Security)) {       //Since MW is expecting Encoded data 
            service.security.Security = tokens.Security;
        } else {
            service.security.Security = encodeURIComponent(tokens.Security);
        }
    };

    service.showGenericError = function (error) { // Can be used to show custom error based on status code.
        switch (error.status) {
            case 403:
                modalService.showSimpleAlert("SDE_JOB_CANNOT_BE5", "", strings.SDE_UNKNOWN_ERROR_OCCURRED4.format(service.connector));
                break;
            //checks if Abby file size limit is exceeded or not
            case 418:
                modalService.showSimpleAlert('SDE_SCANNED_DOCUMENT_NOT4', 'SDE_FILE_EXCEEDED_MAXIMUM', 'SDE_SCAN_BW_RATHER1', null, 'AppName', 'text-left');
                break;
            default:
                modalService.showSimpleAlert('SDE_SCANNED_DOCUMENT_NOT4', 'SDE_PLEASE_TRY_AGAIN1', 'SDE_IF_PROBLEM_PERSISTS3', null, 'AppName');
                break;
        }
    };

    //Check for scan service
    service.checkScanDisabled = function () {
        var deferred = $q.defer();
        // Verify Scan
        xrxScanGetInterfaceVersion(null, function () {
            // Verify Scan Template
            xrxTemplateGetInterfaceVersion(null, function () {
                deferred.resolve(false);
            }, function () { deferred.resolve(true); });
        }, function () { deferred.resolve(true); });
        return deferred.promise;
    }

    return service;

    //#region Commented region Obsolete Methods
    //Save to Repo in case of Abbyy Multipage scenario
    //service.saveToRepoAbbyy = function (filePath,abbyyTaskId) {
    //    var data = JSON.stringify({
    //        'SitePath': service.currentData.SitePath,
    //        'Connector': service.connector,
    //        'EncodedData': service.currentData.EncodedData,
    //        'Token': service.currentData.Token,
    //        'OAuthToken': service.currentData.OAuthToken,
    //        'FileName': service.contentName,
    //        'FilePath': filePath,
    //        'Feature': service.currentData.Feature,
    //        'SAAccountId': service.accountId,
    //        'SiteId': service.requestParams.SiteId,
    //        'FolderId': service.requestParams.FolderId,
    //        'JobId': service.jobId.indexOf(":") != -1 ? service.jobId.split(":")[1] : service.jobId,
    //        'Toaddress': service.recipientList,
    //        //gets the language code and if undefiend or null then set default language english
    //        'Language': service.selectedLanguage ? service.selectedLanguage : "en",
    //        'AbbyyTaskId': abbyyTaskId
    //    });
    //    return $http.post('./api/scan/saveToRepoAbbyy', data).then(function (result) {
    //        return result;
    //    }).catch(function (error) {
    //        console.log("Error saving document");
    //        return $q.reject(error);
    //    });
    //};
    //#endregion
}
