module insite.quickorder {
    "use strict";

    export class BrasselerOrderUploadController extends OrderUploadController {
        sampleErrorMessage: string;

        protected uploadingFailed(error: any): void {
            this.sampleErrorMessage = error.message;
        }
    }

    angular
        .module("insite")
        .controller("OrderUploadController", BrasselerOrderUploadController);
}