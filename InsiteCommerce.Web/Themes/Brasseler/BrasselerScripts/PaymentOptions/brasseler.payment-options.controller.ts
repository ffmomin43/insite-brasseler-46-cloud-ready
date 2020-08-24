module insite.paymentoptions {
    "use strict";

    export interface IUpdateCardPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class PaymentOptionsController {
        cart: CartModel;
        cartId: string;
        UserPaymentProfileCollectionModel: UserPaymentProfileCollectionModel;
        userPaymentProfile: UserPaymentProfileModel;
        userPaymentProfileCollection: UserPaymentProfileModel[];
        userProfileId: string;
        validationMessage: string;
        defaultCard: string;
        account: AccountModel;
        dateFormat: string;
        updateCardError: boolean = false;
        expiryCardError: boolean = false;
        canEditNextExpiryDate: boolean;

        static $inject = [
            "$scope"
            , "$window"
            , "$rootScope"
            , "accountService"
            , "sessionService"
            , "spinnerService"
            , "userPaymentProfileService"
            , "coreService"
            , "cartService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected $rootScope: ng.IRootScopeService,
            protected accountService: account.IAccountService,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected userPaymentProfileService: paymentoptions.IUserPaymentProfileService,
            protected coreService: core.ICoreService,
            protected cartService: cart.ICartService) {
            this.init();
        }

        init() {
            this.getPaymentProfile();
            this.accountService.getAccount().then(
                (model) => {
                    this.account = model;
                });

            this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
            this.cartService.getCart(this.cartId).then(cart => {
                this.cart = cart;
            });

        }

        getPaymentProfile() {
            this.userPaymentProfileService.getUserPaymentProfiles().success(data => {
                this.UserPaymentProfileCollectionModel = data;
                this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
                this.defaultCard = data.properties["defaultCardId"];
                data.properties["defaultCardId"] = 'newcard';

            }).error(error => {
                this.validationMessage = error.exceptionMessage;
            });
        }

        deleteCard(cardId: System.Guid): void {
            this.spinnerService.show("mainLayout", true);
            this.userPaymentProfile = this.userPaymentProfileCollection.filter(x => x.id === cardId)[0];
            this.userPaymentProfileService.deleteUserPaymentProfile(this.userPaymentProfile).success(() => {
                this.getPaymentProfile();
                this.spinnerService.hide();
            }).error(error => {
                if (error == 'Resource is Forbidden.') {
                    var $popup = angular.element("#removeCardErrorPopup");
                    this.coreService.displayModal($popup);
                }
            });
        }

        saveDefaultCard(cardId: System.Guid): void {
            this.account.properties["defaultCardId"] = cardId.toString();
            this.accountService.updateAccount(this.account);
            this.UserPaymentProfileCollectionModel.properties["defaultCardId"] = cardId.toString();
            this.defaultCard = cardId.toString();
        }

        calculateExpiryDate(expiryDate: string) {

            var today = new Date(); // gets the current date
            var today_mm = today.getMonth() + 1; // extracts the month portion
            var today_yy = today.getFullYear() % 100; // extracts the year portion and changes it from yyyy to yy format
            var cc_month = parseInt(expiryDate.substring(0, 2));
            var cc_year = parseInt(expiryDate.substring(4, 2));

            if (cc_month < 10) {
                this.dateFormat = "0" + cc_month + "/20" + cc_year;
            }
            else {
                this.dateFormat = cc_month + "/20" + cc_year;
            }
            if (cc_year > today_yy || (cc_year == today_yy && cc_month > today_mm)) {
                return false;
            }
            else {
                return true;
            }
        }

        editCard(userPaymentProfileId: string) {
            $("#editCard_" + userPaymentProfileId).attr("style", "display:none");
            $("#editDate_" + userPaymentProfileId).attr("style", "display:block");
            $("#saveCard_" + userPaymentProfileId).attr("style", "display:block");
            $("#cancelCard_" + userPaymentProfileId).attr("style", "display:block");
            $("#expired-date_" + userPaymentProfileId).attr("style", "display:none");
            $("#setDefaultCard_" + userPaymentProfileId).attr("style", "display:none");
            $("#defaultCard_" + userPaymentProfileId).attr("style", "display:none");
            $("#expires-date_" + userPaymentProfileId).attr("style", "display:none");
            $("#cardImages_" + userPaymentProfileId).attr("class", "edit-click");
        }

        cancelCard(userPaymentProfileId: string) {
            $("#editCard_" + userPaymentProfileId).attr("style", "display:inline-block");
            $("#editDate_" + userPaymentProfileId).attr("style", "display:none");
            $("#saveCard_" + userPaymentProfileId).attr("style", "display:none");
            $("#cancelCard_" + userPaymentProfileId).attr("style", "display:none");
            $("#expired-date_" + userPaymentProfileId).attr("style", "display:block");
            $("#setDefaultCard_" + userPaymentProfileId).attr("style", "display:inline-block");
            $("#defaultCard_" + userPaymentProfileId).attr("style", "display:inline-block");
            $("#expires-date_" + userPaymentProfileId).attr("style", "display:inline-block");
            $("#cardImages_" + userPaymentProfileId).attr("class", "");
        }

        //BUSA-1122 Allowing user to update expiry date of existing CC.
        updateCard(userPaymentProfileId: System.Guid): void {
            this.expiryCardError = false;
            var now = new Date();
            if (this.cart.paymentOptions.creditCard.expirationMonth <= (now.getMonth() + 1)) {
                if ((this.cart.paymentOptions.creditCard.expirationYear < now.getFullYear()) || (this.cart.paymentOptions.creditCard.expirationYear == now.getFullYear())) {
                    this.expiryCardError = true;
                }
                else {
                    this.expiryCardError = false;
                }
            }
            else {
                this.expiryCardError = false;
            }

            if (this.expiryCardError) {
                $("html, body").animate({
                    scrollTop: $("#paymentErrors").offset().top
                }, 3000);
                return;
            }
            this.spinnerService.show("mainLayout", true);
            this.userPaymentProfile = this.userPaymentProfileCollection.filter(x => x.id === userPaymentProfileId)[0];
            this.userPaymentProfile.expirationDate = ("0" + this.cart.paymentOptions.creditCard.expirationMonth.toString()).slice(-2) + this.cart.paymentOptions.creditCard.expirationYear.toString().slice(2);
            this.userPaymentProfileService.updateUserPaymentProfile(this.userPaymentProfile, true).then(
                (response: UserPaymentProfileModel) => {
                    this.init();
                    this.spinnerService.hide();
                },
                (error: any) => {
                    this.updateCardError = true;
                    this.spinnerService.hide();
                    $("html, body").animate({
                        scrollTop: $("#paymentErrors").offset().top
                    }, 3000);
                });
        }
    }

    angular
        .module("insite")
        .controller("PaymentOptionsController", PaymentOptionsController);
}