module insite.rfq {
    "use strict";

    export class QuotePastExpirationDatePopupController {
        url: string;

        static $inject = [
            "$rootScope",
            "coreService",
            "quotePastExpirationDatePopupService"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected coreService: core.ICoreService,
            protected quotePastExpirationDatePopupService: QuotePastExpirationDatePopupService) {
        }

        $onInit(): void {
            this.quotePastExpirationDatePopupService.registerDisplayFunction((data) => {
                this.url = data.url;
                setTimeout(() => {
                    this.coreService.displayModal(angular.element("#popup-quote-past-expiration-date"));
                });
            });
        }

        cancel(): void {
            this.coreService.closeModal("#popup-quote-past-expiration-date");
        }

        submitQuote(): void {
            this.$rootScope.$broadcast("submitQuote", this.url);
            this.coreService.closeModal("#popup-quote-past-expiration-date");
        }
    }

    export interface IQuotePastExpirationDatePopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class QuotePastExpirationDatePopupService extends base.BasePopupService<any> implements IQuotePastExpirationDatePopupService {
        protected getDirectiveHtml(): string {
            return "<isc-quote-past-expiration-date-popup></isc-quote-past-expiration-date-popup>";
        }
    }

    angular
        .module("insite")
        .controller("QuotePastExpirationDatePopupController", QuotePastExpirationDatePopupController)
        .service("quotePastExpirationDatePopupService", QuotePastExpirationDatePopupService)
        .directive("iscQuotePastExpirationDatePopup", () => ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/Rfq-QuotePastExpirationDatePopup",
            controller: "QuotePastExpirationDatePopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}