/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular.module('app').component('printList', {
    templateUrl: 'Scripts/App/Components/Pages/printList.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },

    controller: function ($scope, connectService, $state, modalService) {
        var $ctrl = this;
        var originalPrintList = [];
        $ctrl.showSpin = false;
        $ctrl.connectService = connectService;

        $ctrl.$onInit = function () {
            originalPrintList = _.clone($ctrl.connectService.selectedDocsForPrint);
        };

        //to resume the file browse activity
        $ctrl.openPrintFileBrowser = function (resumeBrowse) {
            modalService.showPrintFileBrowser("SDE_BROWSE", resumeBrowse).result.then(function () {

            }).catch(function () {
                $state.go("homeScreen");
            });
        };

        $ctrl.deleteDocFromPrintList = function (item) {
            $ctrl.connectService.selectedDocsForPrint = $ctrl.connectService.selectedDocsForPrint.filter(function (ele) {
                return (ele.FullPath  + ele.Name != item.FullPath  + item.Name);//removes or filter the correct file by full path.
            });
        };

        $ctrl.cancel = function () {
            // restore original list
            $ctrl.connectService.selectedDocsForPrint = originalPrintList;
            $ctrl.close();
        }

    }
});
