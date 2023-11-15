/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */


angular
    .module('app')
    .component('addRecipient', {
        templateUrl: 'Components/Modals/addRecipient.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controller: function (modalService, strings) {
            var $ctrl = this;
         

            $ctrl.$onInit = function () {
               
                if ($ctrl.resolve.email != "") {

                    $ctrl.headerTitle = strings.SDE_EMAIL_A_COPY; 
                    $ctrl.email = $ctrl.resolve.email;

                }
                else {
                    $ctrl.headerTitle = strings.SDE_EMAIL_A_COPY; 
                     // default to signer
                }

                _.delay(function () { angular.element('#name').focus(); }, 250);

            };

           

            $ctrl.accept = function () {
                // Close the keyboard when accepting.
                if (typeof EIP_CloseEmbeddedKeyboard === 'function') {
                    EIP_CloseEmbeddedKeyboard(); //dismiss device keyboard
                }
                $ctrl.close({ $value: { email: $ctrl.email } });
            };

            $ctrl.validate = function () {

                // ensure email address is valid
                var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                if ($ctrl.email != undefined) {
                    if ($ctrl.email.length > 0) {
                        $ctrl.email = $ctrl.email.trim();
                        if (!emailRegex.test($ctrl.email)) {
                            modalService.showSimpleAlert("SDE_INVALID_EMAIL_ADDRESS8", "");
                            return false;
                        }
                    }
                }
                return true;

            };

            $ctrl.hasError = function () {
                return ($ctrl.email) ? ($ctrl.email.length === 0) : true;
            };

            $ctrl.clearName = function () {
                $ctrl.name = "";
                angular.element('#name').focus();
            };
            $ctrl.clearEmail = function () {
                $ctrl.email = "";
                angular.element('#email').focus();
            };


        }
    });
