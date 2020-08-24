module insite.wishlist {
    "use strict";

    export class BrasselerMyListsController extends MyListsController {
        errorMessage: string;
        
        protected addLineCollectionFailed(error: any): void {
            this.inProgress = false;
            this.errorMessage = error.message;
        }
    }

    angular
        .module("insite")
        .controller("MyListsController", BrasselerMyListsController);
}