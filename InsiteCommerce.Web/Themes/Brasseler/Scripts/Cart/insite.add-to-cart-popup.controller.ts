module insite.cart {
    "use strict";

    export class AddToCartPopupController {
        isAddAll: boolean;
        isQtyAdjusted: boolean;
        notAllAdded: boolean;
        showAddToCartPopup: boolean;
        productSettings: ProductSettingsModel;
        cartSettings: CartSettingsModel;

        static $inject = [
            "$scope",
            "coreService",
            "settingsService",
            "addToCartPopupService"
        ];

        constructor(
            protected $scope: ICartScope,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected addToCartPopupService: IAddToCartPopupService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            this.cartSettings = settingsCollection.cartSettings;
            this.registerDisplayFunction();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected registerDisplayFunction(): void {
            this.addToCartPopupService.registerDisplayFunction((data: any) => this.displayFunction(data));
        }

        protected displayFunction(data: IAddToCartPopupDisplayData): void {
            this.isAddAll = false;
            if (data && data.isAddAll) {
                this.isAddAll = data.isAddAll;
            }

            this.isQtyAdjusted = false;
            if (data && data.isQtyAdjusted) {
                this.isQtyAdjusted = data.isQtyAdjusted;
            }

            this.notAllAdded = false;
            if (data && data.notAllAdded) {
                this.notAllAdded = data.notAllAdded;
            }

            let showPopup: boolean;

            this.showAddToCartPopup = false;
            if (data && typeof data.showAddToCartPopup !== "undefined" && data.showAddToCartPopup !== null) {
                this.showAddToCartPopup = showPopup = data.showAddToCartPopup;
            } else {
                showPopup = this.productSettings.showAddToCartConfirmationDialog || this.isQtyAdjusted;
            }

            if (!showPopup) {
                return;
            }

            const popupSelector = ".add-to-cart-popup";
            const $popup = angular.element(popupSelector);
            if ($popup.length <= 0) {
                return;
            }

            this.coreService.displayModal($popup);
            if (!this.isQtyAdjusted) {
                setTimeout(() => {
                    this.coreService.closeModal(popupSelector);
                }, this.cartSettings.addToCartPopupTimeout);
            }
        }
    }

    export interface IAddToCartPopupDisplayData {
        isAddAll?: boolean;
        isQtyAdjusted: boolean;
        showAddToCartPopup?: boolean;
        notAllAdded?: boolean;
    }

    export interface IAddToCartPopupService {
        display(data: IAddToCartPopupDisplayData): void;
        registerDisplayFunction(p: (data: IAddToCartPopupDisplayData) => void);
    }

    export class AddToCartPopupService extends base.BasePopupService<IAddToCartPopupDisplayData> implements IAddToCartPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-add-to-cart-popup></isc-add-to-cart-popup>";
        }
    }

    angular
        .module("insite")
        .controller("AddToCartPopupController", AddToCartPopupController)
        .service("addToCartPopupService", AddToCartPopupService)
        .directive("iscAddToCartPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Cart-AddToCartPopup",
            controller: "AddToCartPopupController",
            controllerAs: "vm",
            scope: {},
            bindToController: true
        }));
}