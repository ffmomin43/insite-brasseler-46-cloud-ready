module insite.account {
    "use strict";

    export class DeliveryMethodPopupController {
        session: SessionModel;
        fulfillmentMethod: string;
        pickUpWarehouse: WarehouseModel;

        static $inject = ["coreService", "deliveryMethodPopupService"];

        constructor(
            protected coreService: core.ICoreService,
            protected deliveryMethodPopupService: IDeliveryMethodPopupService) {
        }

        $onInit() {
            this.deliveryMethodPopupService.registerDisplayFunction((data) => {
                this.session = data.session;
                this.fulfillmentMethod = data.session.fulfillmentMethod;
                this.pickUpWarehouse = data.session.pickUpWarehouse;
                this.coreService.displayModal(angular.element("#deliveryMethodPopup"));
            });
        }
    }

    export interface IDeliveryMethodPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class DeliveryMethodPopupService extends base.BasePopupService<any> implements IDeliveryMethodPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-delivery-method-popup></isc-delivery-method-popup>";
        }
    }

    angular
        .module("insite")
        .controller("DeliveryMethodPopupController", DeliveryMethodPopupController)
        .service("deliveryMethodPopupService", DeliveryMethodPopupService)
        .directive("iscDeliveryMethodPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-DeliveryMethodPopup",
            controller: "DeliveryMethodPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}