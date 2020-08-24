//import CartSettingsModel = Insite.Cart.WebApi.V1.ApiModels.CartSettingsModel;
module insite.smartsupply {
    "use strict";

    export class SmartSupplyDetailController {
        userPaymentProfileCollection: UserPaymentProfileModel[];
        frequencyMap: any;
        cart: CartModel = null;
        expand: string;
        paymentMethod: any;
        selectedPayment: any;
        cartSubscriptionDto: CartSubscriptionDto;
        canEditFrequency: boolean;
        smartSupplyCartsList: CartModelBrasseler;
        cartModelBrasseler: CartModelBrasseler = null;
        canEditNextDelieveryDate: boolean;
        canEditPayment: boolean;
        ifOtherUser: boolean = false;
        error: string;
        nextShipDate: Date;
        subscriptionName: string;
        canEditSubscriptionName: boolean;
        promotions: PromotionModel[];
        showInventoryAvailability = false;
        requiresRealTimeInventory = false;
        settings: CartSettingsModel;
        cancellationReasons: any;
        selectedReason: any;
        othersReason: any;
        static $inject = [
            "$scope"
            , "$window"
            , "cartService"
            , "userPaymentProfileService"
            , "coreService"
            , "queryString"
            , "spinnerService"
            , "smartSupplyService"
            , "sessionService"
            , "promotionService"
            , "settingsService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected cartService: cart.ICartService,
            protected userPaymentProfileService: insite.paymentoptions.IUserPaymentProfileService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService,
            protected spinnerService: core.ISpinnerService,
            protected smartSupplyService: insite.smartsupply.ISmartSupplyService,
            protected sessionService: account.ISessionService,
            protected promotionService: promotions.IPromotionService,
            protected settingsService: core.ISettingsService) {
            this.init();
        }

        init(): void {
            this.initEvents();

        }


        protected initEvents(): void {


            this.settingsService.getSettings().then(
                (settings: core.SettingsCollection) => { this.getSettingsCompleted(settings); },
                (error: any) => { this.getSettingsFailed(error); });

            this.getSmartSupply();
        }


        getSmartSupply(): void {
            this.spinnerService.show("mainLayout");
            this.cartService.expand = "cartLines,paymentoptions,shipping,tax"
            this.smartSupplyService.expand = "cartLines,paymentoptions,shipping,tax";
            var cartId = this.queryString.get("cartid");
            this.smartSupplyService.getSmartSupplyCart(cartId).then(cart => {
                this.cart = cart;
                this.sessionService.getSession().then(x => {
                    if (x.userName != this.cart.initiatedByUserName) {
                        this.ifOtherUser = true;
                    }
                });
                this.cartModelBrasseler = <CartModelBrasseler>cart;
                this.paymentMethod = angular.copy(this.cartModelBrasseler.paymentOptions.paymentMethods);
                if (this.cartModelBrasseler.properties["subscriptionFrequency"] != null) {
                    this.frequencyMap = JSON.parse(this.cartModelBrasseler.properties["subscriptionFrequency"]);
                }
                if (this.cartModelBrasseler.properties["cancellationReason"] != null) {
                    this.cancellationReasons = JSON.parse(this.cartModelBrasseler.properties["cancellationReason"]);
                }
                this.getPromotions(this.cartModelBrasseler);
                this.getPaymentDetails();
                this.nextShipDate = new Date(this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate.toString());
            });
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.cartSettings;
            this.showInventoryAvailability = settingsCollection.productSettings.showInventoryAvailability;
            this.requiresRealTimeInventory = settingsCollection.productSettings.realTimeInventory;
        }
        getPaymentDetails() {
            this.userPaymentProfileService.getUserPaymentProfiles().success(data => {
                this.userPaymentProfileCollection = data.listUserPaymentProfileModel;

                this.cartModelBrasseler.paymentOptions.paymentMethods.forEach(y => {
                    if (y.name == "CC") {
                        var ax = this.cartModelBrasseler.paymentOptions.paymentMethods.indexOf(y);
                        if (ax != -1) {
                            this.cartModelBrasseler.paymentOptions.paymentMethods.splice(ax, 1);
                        }
                    }
                });
                if (this.cartModelBrasseler.cartSubscriptionDto.paymentMethod == 'CK') {
                    this.selectedPayment = 'CK';
                }
                else {
                    this.userPaymentProfileCollection.forEach(x => {
                        if (x.id == this.cartModelBrasseler.cartSubscriptionDto.paymentMethod) {
                            this.cartModelBrasseler.paymentOptions.paymentMethods.forEach(z => {
                                if (z.name == x.cardIdentifier) {
                                    this.selectedPayment = x;
                                }
                            });
                        }
                    });
                }
            });

        }

        changePaymentMethod() {
            var subscriptionPayment;
            if (this.selectedPayment != null) {
                if (this.selectedPayment != 'CK') {
                    this.userPaymentProfileCollection.forEach(x => {
                        if (x.cardIdentifier == this.selectedPayment) {
                            subscriptionPayment = x.id;
                            this.selectedPayment = x;
                        }
                    });
                }
                else {
                    subscriptionPayment = 'CK';
                }

                var cartSubscriptionDTO: CartSubscriptionDto = {
                    customerOrderId: this.cartModelBrasseler.id,
                    frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                    activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                    deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                    nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                    paymentMethod: subscriptionPayment,
                    parentCustomerOrderId: this.cartModelBrasseler.id, //BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
                    shipNow: false,
                    isModified: true
                };

                this.smartSupplyService.postCartSubscriptionDto(cartSubscriptionDTO).then(data => {
                    var $popup = angular.element("#changeSavedPopup");
                    this.coreService.displayModal($popup);
                });
                this.canEditPayment = false;
            }
        }

        updateLine(cartLine: CartLineModel, refresh: boolean, redirectURI?: string) {
            if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                if (this.cart.lineCount == 1) {
                    this.cartService.removeCart(this.cartModelBrasseler).then(() => {
                        this.spinnerService.show();
                        this.$window.location.href = redirectURI + "?returnUrl=" + this.$window.location.href;
                    });
                } else {
                    this.cartService.removeLine(cartLine).then(result => {
                        this.getPromotions(this.cartModelBrasseler);
                        this.getPaymentDetails();
                    });
                    this.spinnerService.show();
                }
            } else {
                this.cartService.updateLine(cartLine, refresh).then(result => {
                    this.smartSupplyService.getSmartSupplyCart(this.cart.id).then(x => {
                        this.cartModelBrasseler = <CartModelBrasseler>x;
                        this.getPromotions(this.cartModelBrasseler);
                        this.getPaymentDetails();
                    });
                });
                this.spinnerService.show();
            }
        }

        quantityKeyPress(keyEvent: KeyboardEvent, cartLine: CartLineModel) {
            if (keyEvent.which === 13) {
                (<any>keyEvent.target).blur();
                this.spinnerService.show();
            }
        }

        //Cancel SmartSupply Order.
        cancelSmartSupplyOrder(redirectUri: string) {
            //BUSA-1085 : Cancel SmartSupply
            var $popup = angular.element("#CancellationPopup");
            this.coreService.displayModal($popup);
        }

        updateCart(redirectUri: string) {
            const valid = $("#CancellationSS").validate().form();
            if (!valid) {
                return;
            }
            $('#Cancel_SmartSupply_Submit').attr('disabled', 'disabled');
            $('#smartSupplyDetailViewCancelSmartSupplyOrderButton').attr('disabled', 'disabled');
            this.cartModelBrasseler.status = 'SubscriptionCancelled';
            if (this.selectedReason == 'Other' || this.selectedReason =='Autre') {

                this.cartModelBrasseler.notes = this.selectedReason + ": " + this.othersReason;
            }
            else {

                this.cartModelBrasseler.notes = this.selectedReason;
            }
            this.cartService.updateCart(this.cartModelBrasseler).then(x => {
                this.$window.location.href = redirectUri;
            });

        }
        updateFrequency() {
            if (this.cartModelBrasseler.cartSubscriptionDto.frequency != null) {
                var cartSubscriptionDTO: CartSubscriptionDto = {
                    customerOrderId: this.cartModelBrasseler.id,
                    frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                    activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                    deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                    nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                    paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                    parentCustomerOrderId: this.cartModelBrasseler.id, //BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
                    shipNow: false,
                    isModified: true
                };
                this.smartSupplyService.postCartSubscriptionDto(cartSubscriptionDTO).then(data => {
                    var $popup = angular.element("#changeSavedPopup");
                    this.coreService.displayModal($popup);
                });
                this.canEditFrequency = false;
            }
        }

        updateNextDelieveryDate() {

            if (this.nextShipDate.toString() == "") {
                this.error = "Next Ship Date Cannot Be Empty.";
                return;
            }

            var currentDate = new Date();
            var deActivationDate = new Date(this.cartModelBrasseler.cartSubscriptionDto.deActivationDate.toString());

            if (new Date(this.nextShipDate.toString()) <= currentDate) {
                this.error = "Next Ship Date Cannot Be Less Than Or Equals To Current Date.";
                return;
            }
            else if (new Date(this.nextShipDate.toString()) > deActivationDate) {
                this.error = "Next Ship Date Cannot Exceed SmartSupply End Date.";
                return;
            }

            var cartSubscriptionDTO: CartSubscriptionDto = {
                customerOrderId: this.cartModelBrasseler.id,
                frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                nextDelieveryDate: this.nextShipDate,
                paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                parentCustomerOrderId: this.cartModelBrasseler.id, //BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
                shipNow: false,
                isModified: true
            };
            this.smartSupplyService.postCartSubscriptionDto(cartSubscriptionDTO).then(data => {
                var $popup = angular.element("#changeSavedPopup");
                this.coreService.displayModal($popup);
            });
            this.canEditNextDelieveryDate = false;
            this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate = this.nextShipDate;
            this.error = "";
        }

        //BUSA-761 SS- Add name for Smart Supply order and force users enter a name while placing order start
        updateSubscriptionName(Name: string) {
            if (Name == "") {
                this.error = "Smart Supply Name Cannot Be Empty.";
                return;
            }
            this.cartService.updateCart(this.cartModelBrasseler).then(data => {
                var $popup = angular.element("#changeSavedPopup");
                this.coreService.displayModal($popup);
            });
            this.canEditSubscriptionName = false;
            this.cartModelBrasseler.properties['subscriptionName'] = Name;
            this.error = "";
        }
        //BUSA - 761 SS- Add name for Smart Supply order and force users enter a name while placing order end

        removeLine(cartLine: CartLineModel, redirectURI: string) {
            this.spinnerService.show();
            this.cartService.removeLine(cartLine).then(result => {
                this.spinnerService.show();
                this.smartSupplyService.getSmartSupplyCart(this.cartModelBrasseler.id).then(x => {
                    this.cart = x;
                    this.cartModelBrasseler = <CartModelBrasseler>x;
                    this.getPromotions(this.cartModelBrasseler);
                    this.getPaymentDetails();
                    this.spinnerService.show();
                    //BUSA - 762 Emails need to be triggered when the user modify the SS order from details page start.
                    this.cartSubscriptionDto = {
                        customerOrderId: this.cartModelBrasseler.id,
                        frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                        activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                        deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                        nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                        paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                        parentCustomerOrderId: this.cartModelBrasseler.id, //BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
                        shipNow: false,
                        isModified: true
                    };
                    this.spinnerService.show();
                    this.smartSupplyService.postCartSubscriptionDto(this.cartSubscriptionDto);
                    if (this.cart.lineCount == 0) {
                        this.cartModelBrasseler.status = 'SubscriptionCancelled';
                        this.cartService.updateCart(this.cartModelBrasseler).then(x => {
                            this.spinnerService.show();
                            this.$window.location.href = redirectURI + "?returnUrl=" + this.$window.location.href;
                        });
                    }
                    //BUSA -762 Emails need to be triggered when the user modify the SS order from details page end.
                    this.spinnerService.show();
                });
            });
        }

        updateNotes() {
            this.cartService.updateCart(this.cartModelBrasseler).then(data => {
                var $popup = angular.element("#changeSavedPopup");
                this.coreService.displayModal($popup);
            });
            //BUSA - 762 Emails need to be triggered when the user modify the SS order from details page start.
            this.cartSubscriptionDto = {
                customerOrderId: this.cartModelBrasseler.id,
                frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                parentCustomerOrderId: this.cartModelBrasseler.id, //BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
                shipNow: false,
                isModified: true
            };
            this.smartSupplyService.postCartSubscriptionDto(this.cartSubscriptionDto);
            //BUSA - 762 Emails need to be triggered when the user modify the SS order from details page end.
        }

        responseFromUser(cart: CartModelBrasseler, param: string) {
            if (param == "yes") {
                this.shipNow(cart);
            }
            this.coreService.closeModal("#ShipNowConfirmationPopUp");
        }

        shipNow(cart: CartModelBrasseler) {
            this.spinnerService.show();
            var $popup = angular.element("#ShipNowPopup");
            this.coreService.displayModal($popup);
            this.cartModelBrasseler = cart;
            this.cartModelBrasseler.properties['ShipNow'] = 'true';
            this.cartService.updateCart(this.cartModelBrasseler).then(result => {
                //BUSA-858 : Next Ship Date change on 'Ship Now'
                this.$window.location.reload(true);
            });
        }

        //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts
        getPromotions(cart: CartModel) {
            this.promotionService.getCartPromotions(this.cartModelBrasseler.id).then((result: PromotionCollectionModel) => {
                this.promotions = result.promotions;
            });
        }

        // BUSA-463 : Subscription. Sorting frequency
        sortFilter(input: any) {
            return parseInt(input.value);
        }
    }

    angular
        .module("insite")
        .controller("SmartSupplyDetailController", SmartSupplyDetailController);
}