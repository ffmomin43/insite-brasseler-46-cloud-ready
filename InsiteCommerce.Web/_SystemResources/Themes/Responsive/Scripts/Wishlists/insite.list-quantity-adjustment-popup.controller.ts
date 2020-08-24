module insite.wishlist {
    "use strict";

    export class ListQuantityAdjustmentPopupController {
        isQtyAdjusted: boolean;

        static $inject = [
            "coreService",
            "listQuantityAdjustmentPopupService"
        ];

        constructor(
            protected coreService: core.ICoreService,
            protected listQuantityAdjustmentPopupService: IListQuantityAdjustmentPopupService) {
        }

        $onInit(): void {
            this.registerDisplayFunction();
        }

        protected registerDisplayFunction(): void {
            this.listQuantityAdjustmentPopupService.registerDisplayFunction((data: any) => this.displayFunction(data));
        }

        protected displayFunction(data: IListQuantityAdjustmentPopupDisplayData): void {
            this.isQtyAdjusted = false;
            if (data && data.isQtyAdjusted) {
                this.isQtyAdjusted = data.isQtyAdjusted;
            }

            let showPopup = this.isQtyAdjusted;
            if (!showPopup) {
                return;
            }

            const popupSelector = ".list-quantity-adjustment-popup";
            const $popup = angular.element(popupSelector);
            if ($popup.length <= 0) {
                return;
            }

            this.coreService.displayModal($popup);
            if (!this.isQtyAdjusted) {
                setTimeout(() => {
                    this.coreService.closeModal(popupSelector);
                }, 3000);
            }
        }
    }

    export interface IListQuantityAdjustmentPopupDisplayData {
        isQtyAdjusted: boolean;
    }

    export interface IListQuantityAdjustmentPopupService {
        display(data: IListQuantityAdjustmentPopupDisplayData): void;
        registerDisplayFunction(p: (data: IListQuantityAdjustmentPopupDisplayData) => void);
    }

    export class ListQuantityAdjustmentPopupService extends base.BasePopupService<IListQuantityAdjustmentPopupDisplayData> implements IListQuantityAdjustmentPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-list-quantity-adjustment-popup></isc-quantity-adjustment-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ListQuantityAdjustmentPopupController", ListQuantityAdjustmentPopupController)
        .service("listQuantityAdjustmentPopupService", ListQuantityAdjustmentPopupService)
        .directive("iscListQuantityAdjustmentPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ListQuantityAdjustmentPopup",
            controller: "ListQuantityAdjustmentPopupController",
            controllerAs: "vm",
            scope: {},
            bindToController: true
        }));
}