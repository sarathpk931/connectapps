﻿/* Copyright © 2020 Xerox Corporation. All Rights Reserved. Copyright protection claimed includes all forms and */
/* matters of copyrightable material and information now allowed by statutory or judicial law or hereinafter granted, */
/* including without limitation, material generated from the software programs which are displayed on the screen such */
/* as icons, screen display looks, etc. */

angular
    .module('app')
    .component('basicAlert',
        {
            templateUrl: 'Components/Modals/basicAlert.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            }
        });
