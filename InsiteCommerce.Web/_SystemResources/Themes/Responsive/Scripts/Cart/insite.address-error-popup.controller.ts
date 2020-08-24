module insite.cart {
    "use strict";

    export class AddressErrorPopupController {
        isAddressEditAllowed: boolean;
        checkoutAddressUrl: string;
        myAccountAddressUrl: string;
        reviewAndPayPageUrl: string;
        continueUrl: string;
        oneTimeAddress: boolean;

        static $inject = ["$scope", "coreService", "settingsService", "addressErrorPopupService", "$window", "sessionService", "$q"];

        constructor(
            protected $scope: ICartScope,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected addressErrorPopupService: IAddressErrorPopupService,
            protected $window: ng.IWindowService,
            protected sessionService: account.ISessionService,
            protected $q: ng.IQService) {
        }

        $onInit(): void {
            this.$q.all([this.sessionService.getSession(), this.settingsService.getSettings()]).then(
                (results: any[]) => { this.getSessionAndSettingsCompleted(results); },
                (error: any) => { this.getSessionAndSettingsFailed(error); });
        }

        protected getSessionAndSettingsCompleted(results: any[]): void {
            const session = ((results[0]) as SessionModel);
            const customerSettings = ((results[1]) as core.SettingsCollection).customerSettings;

            this.oneTimeAddress = session.shipTo && session.shipTo.oneTimeAddress;
            this.isAddressEditAllowed = customerSettings.allowBillToAddressEdit && customerSettings.allowShipToAddressEdit;
            this.registerDisplayFunction();
        }

        protected getSessionAndSettingsFailed(error: any): void {
        }

        protected registerDisplayFunction(): void {
            this.addressErrorPopupService.registerDisplayFunction(() => this.displayFunction());
        }

        protected displayFunction(): void {
            const $popup = angular.element(".address-error-popup");
            if ($popup.length > 0) {
                const path = this.$window.location.pathname.toLowerCase();
                if (path.indexOf(this.checkoutAddressUrl.toLowerCase()) > -1 || path.indexOf(this.myAccountAddressUrl.toLowerCase()) > -1) {
                    this.continueUrl = "";
                } else {
                    this.continueUrl = (path.indexOf(this.reviewAndPayPageUrl.toLowerCase()) > -1 || this.oneTimeAddress) ? this.checkoutAddressUrl : this.myAccountAddressUrl;
                }
                this.coreService.displayModal($popup);
            }
        }
    }

    export interface IAddressErrorPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class AddressErrorPopupService extends base.BasePopupService<any> implements IAddressErrorPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-address-error-popup></isc-address-error-popup>";
        }
    }

    angular
        .module("insite")
        .controller("AddressErrorPopupController", AddressErrorPopupController)
        .service("addressErrorPopupService", AddressErrorPopupService)
        .directive("iscAddressErrorPopup", () => ({
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/Cart-AddressErrorPopup",
                scope: {},
                controller: "AddressErrorPopupController",
                controllerAs: "vm",
                bindToController: true
            }));
}