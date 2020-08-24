module insite.smartsupply {
    "use strict";

    export interface IAddToExistingSmartSupply {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class SmartSupplyPopupController {
        // custom pagination to avoid default pagination for popup.
        pagination: PaginationModel = {
            currentPage: 1,
            pageSize: 500,
            defaultPageSize: 1,
            totalItemCount: 0,
            numberOfPages: 0,
            pageSizeOptions: [],
            sortOptions: null,
            sortType: "",
            nextPageUri: "",
            prevPageUri: "",
            page: 1
        };
        smartSupplyCarts: CartModel[];
        smartSupplyNames = [];
        paginationStorageKey = "DefaultPagination-AddToExistingSmartSupplyList";
        searchFilter: cart.IQueryStringFilter = {
            status: "SubscriptionOrder",
            sort: "OrderDate DESC",
            shipToId: null
        };

        errorMessage: string;
        selectedSmartSupply: string;
        successMessage: boolean;
        smartSupplyCollection: WishListModel[];
        smartSupplyOrderNoErrorMessage: boolean;
        popupId: string;
        productsToAdd: ProductDto[];
        product: ProductDto;
        cartCollection = {};



        newWishListName: string;
        selectedWishList: WishListModel;
        addToWishlistCompleted: boolean;
        wishListCollection: WishListModel[];
        showWishlistNameErrorMessage: boolean;
        allowMultipleWishLists: boolean;
        isRememberedUser: boolean;
        isGuest: boolean;
        addingToList: boolean;
        isAuthenticateduser: boolean;

        static $inject = [
            "$scope"
            , "$window"
            , "cartService"
            , "sessionService"
            , "spinnerService"
            , "coreService"
            , "paginationService"
            , "userPaymentProfileService"
            , "smartSupplyService"
            , "$localStorage"
            , "AddToExistingSmartSupplyService"
            , "settingsService",
            "accessToken"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected cartService: cart.ICartService,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected userPaymentProfileService: insite.paymentoptions.IUserPaymentProfileService,
            protected smartSupplyService: insite.smartsupply.ISmartSupplyService,
            protected $localStorage: common.IWindowStorage,
            protected addToExistingSmartSupplyService: AddToExistingSmartSupplyService,
            protected settingsService: core.ISettingsService,
            protected accessToken: common.IAccessTokenService) {
            this.init();
        }

        init(): void {
            this.productsToAdd = [];


            this.settingsService.getSettings().then(
                (settings: core.SettingsCollection) => { this.getSettingsCompleted(settings); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settings: core.SettingsCollection): void {


            this.sessionService.getSession().then((session: SessionModel) => {
                this.isAuthenticateduser = session.isAuthenticated;
                this.isRememberedUser = session.rememberMe;
                this.isGuest = session.isGuest;

                this.addToExistingSmartSupplyService.registerDisplayFunction((data) => {
                    this.productsToAdd = data;
                    this.initialize();
                    this.coreService.displayModal(angular.element("#popup-add-existing-smartsupply"));
                });
            });

        }

        protected getSettingsFailed(error: any): void {
        }

        initialize() {
            if (this.isAuthenticateduser && this.isAuthenticated()) {
                this.spinnerService.show();
                this.clearMessages();
                this.smartSupplyService.getSmartSupplyCarts(this.searchFilter, this.pagination).then(result => {
                    this.smartSupplyCarts = result.carts;
                    var list = result.properties["subscriptionNames"];
                    var parsedData = JSON.parse(list);
                    var map = Object.keys(parsedData).map(key => ({ key, value: parsedData[key] }));
                    this.smartSupplyNames = map;
                    this.smartSupplyCarts.forEach(data => {
                        this.cartCollection[data.id] = data;
                    });
                    //BUSA-761 SS-Add name for Smart Supply order and force users enter a name while placing order start
                    this.smartSupplyCarts.forEach(x => {
                        //BUSA-859 : Add to Existing SS                       
                        this.smartSupplyService.getSmartSupplyCart(x.id).then(y => {
                            if (y.properties["subscriptionName"] == undefined) {
                                y.properties["subscriptionName"] = y.orderNumber;
                            }
                        });
                    });
                    //BUSA-761 SS-Add name for Smart Supply order and force users enter a name while placing order end
                });
            }
        }

        clearMessages(): void {
            this.successMessage = false;
            this.errorMessage = "";
            this.smartSupplyOrderNoErrorMessage = false;
        }

        showPopup(): void {
            this.coreService.displayModal(angular.element(this.popupId));
        }

        addToSmartSupply(): void {
            this.clearMessages();
            //BUSA-859: Add to Existing SS
            if (this.selectedSmartSupply) {
                this.addLineToSmartSupply(this.cartCollection[this.selectedSmartSupply]);
            }
            else {
                this.smartSupplyOrderNoErrorMessage = true;
            }
        }

        addLineToSmartSupply(smartSupply: CartModel): void {
            this.spinnerService.show();
            this.smartSupplyService.addLineToSmartSupply(this.productsToAdd[0], smartSupply.uri.toString()).then(() => {
                this.spinnerService.hide();
                this.successMessage = true;
            }, error => {
                this.errorMessage = error.message;
            });
        }

        showAddToCartPopup(): void {
            this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
        }

        isAuthenticated(): boolean {
            return this.$localStorage.get("accessToken", null) !== null;
        }
    }




    export class AddToExistingSmartSupplyService extends base.BasePopupService<any> implements IAddToExistingSmartSupply {
        protected getDirectiveHtml(): string {
            return "<isc-add-to-existing-smart-supply-popup></isc-add-to-existing-smart-supply-popup>";
        }
    }

    angular
        .module("insite")
        .controller("SmartSupplyPopupController", SmartSupplyPopupController)
        .service("AddToExistingSmartSupplyService", AddToExistingSmartSupplyService)
        .directive("iscAddToExistingSmartSupplyPopup", () => ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/SmartSupply-AddSmartSupplyPopup",
            controller: "SmartSupplyPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}