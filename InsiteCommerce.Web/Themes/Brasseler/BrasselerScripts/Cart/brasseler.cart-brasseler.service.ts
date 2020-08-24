module insite.cart {
    "use strict";


    export class BrasslerCartService extends CartService {
        errorMessage: String;
        private invalidAddressExceptionNew = "Insite.Core.Exceptions.InvalidAddressException";
        private sampleException = "SampleException";

        static $inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService", "coreService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected addressErrorPopupService: cart.IAddressErrorPopupService,
            protected addToCartPopupService: IAddToCartPopupService,
            protected apiErrorPopupService: core.IApiErrorPopupService,
            protected httpWrapperService: core.HttpWrapperService,
            protected coreService: core.ICoreService) {
            super($http, $rootScope, $q, addressErrorPopupService, addToCartPopupService, apiErrorPopupService, httpWrapperService);

        }

        protected showCartError(error: any): void {
            var sampleMessage = null;
            if (error.message != null || error.message == "") {
                sampleMessage = error.message.substring(0, 45);
            }
            
            if (error.message === this.invalidAddressExceptionNew) {
                this.addressErrorPopupService.display(null);
            }
            else if (sampleMessage.includes("Limit Notification") || sampleMessage.includes("Notification de limite")) {
                this.errorMessage = error.message;
                const $popup = angular.element("#sampleproduct");
                this.coreService.displayModal($popup);
            }
            else {
                this.apiErrorPopupService.display(error);
            }
        }
    }

    angular
        .module("insite")
        .service("cartService", BrasslerCartService);
}