module insite.account {
    import IWishListService = wishlist.IWishListService;
    "use strict";
    declare var grecaptcha: any;

    export class BrasselerSignInController extends SignInController {
        homePageUrl: string;
        changeCustomerPageUrl: string;
        dashboardUrl: string;
        password: string;
        returnUrl: string;
        checkoutAddressUrl: string;
        reviewAndPayUrl: string;
        settings: AccountSettingsModel;
        signInError = "";
        disableSignIn = false;
        userName: string;
        cart: CartModel;
        signInForm: any;
        isFromReviewAndPay: boolean;
        pageSkipper: boolean = true;
        migratedUser: boolean = false;
        static $inject = ["$scope",
            "$window",
            "accountService",
            "sessionService",
            "customerService",
            "coreService",
            "spinnerService",
            "$attrs",
            "settingsService",
            "cartService",
            "queryString",
            "accessToken",
            "$timeout",
            "$localStorage",
            "wishListService",
            "$q"];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected accountService: IAccountService,
            protected sessionService: ISessionService,
            protected customerService: customers.ICustomerService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected $attrs: ISignInControllerAttributes,
            protected settingsService: core.ISettingsService,
            protected cartService: cart.ICartService,
            protected queryString: common.IQueryStringService,
            protected accessToken: common.IAccessTokenService,
            protected $timeout: ng.ITimeoutService,
            protected $localStorage: common.IWindowStorage,
            protected wishListService: IWishListService,
            protected $q: ng.IQService) {
            super($scope, $window, accountService, sessionService, customerService, coreService, spinnerService, $attrs, settingsService, cartService, queryString, accessToken, $timeout, $localStorage, wishListService, $q);
            super.resetPassword.bind(this);
            super.$onInit();
        }

        resetForgotPasswordPopup(): boolean {
            //Get SiteKey for reset Password
            this.cartService.getCart();
            this.migratedUser = false;
            
            grecaptcha.render('lblrecapResultp', {
                'sitekey': this.cart.properties['siteKey']
                });
                    
            return super.resetForgotPasswordPopup();
        }

       resetPassword() {
            var recaptchaResponse = grecaptcha.getResponse();
            if (recaptchaResponse.length === 0) {
                $("#lblrecapResultp span").html("Incorrect Recaptcha answer.");
                $("#lblrecapResultp span").css("color", "red");
                $("#lblrecapResultp span").show();
                return false;
            } else {
                $("#lblrecapResultp span").hide();
            }
           grecaptcha.reset(); 
            this.userNameToReset = this.email;
            super.resetPassword();
        }

        signIn(errorMessage: string) {
            this.signInError = "";

            if (this.signInForm.$invalid) {
                return;
            }

            this.disableSignIn = true;
            this.spinnerService.showAll();

            var account = <AccountModel><any>{ isGuest: true, userName: this.userName, password: "1" };
            this.accountService.createAccount(account).catch((result:any) => {
                if (result.message == "IsMigratedUser") {
                    this.email = "";
                    this.migratedUser = true;
                    this.resetPasswordSuccess = false;
                    this.disableSignIn = false;
                    this.coreService.displayModal(angular.element("#forgotPasswordPopup"));
                } else {
                    this.migratedUser = false;
                    this.signOutIfGuestSignedIn().then(
                        (signOutResult: string) => { this.signOutIfGuestSignedInCompleted(signOutResult); },
                        (error: any) => { this.signOutIfGuestSignedInFailed(error); }
                        );
                }
            });
        }

        protected generateAccessTokenOnSignInCompleted(accessTokenDto: common.IAccessTokenDto): void {
            this.accessTokenString = accessTokenDto.accessToken;
            this.isSkip();
            this.signUserIn();
        }


        selectCustomer(session: SessionModel): void {
            session.redirectToChangeCustomerPageOnSignIn = this.pageSkipper;
            if (session.redirectToChangeCustomerPageOnSignIn) {
                const shouldAddReturnUrl = this.returnUrl && this.returnUrl !== this.homePageUrl;
                this.$window.location.href = this.changeCustomerPageUrl + (shouldAddReturnUrl ? `?returnUrl=${encodeURIComponent(this.returnUrl) }` : "");
            } else {
                this.cartService.expand = "cartlines";
                this.cartService.getCart(this.cart.id).then(
                    (cart: CartModel) => { this.getCartCompleted(session, cart); },
                    (error: any) => { this.getCartFailed(error); });
            }
        }

        isSkip() {
            this.customerService.getBillTos("shiptos,state").then(billToResult => {
                if (billToResult.billTos.length === 1) {
                    var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
                    var shipTos = billToResult.billTos[0].shipTos.filter(shipTo => {
                        return !(chkIfOneTimeShipTo.test(shipTo.customerSequence))
                    });
                    if (shipTos.length == 1) {
                        this.pageSkipper = false;
                    }
                }
            });
        }

        protected signInCompleted(session: SessionModel): void {
            this.spinnerService.showAll();
            this.accountService.getAccount().then(account => {
                this.sessionService.setContextFromSession(session);

                var languageId = account.properties["userLanguage"];
                languageId = languageId ? languageId : session.language.id;

                this.sessionService.setLanguage(languageId).then(x => {
                    session.language = x.language;   //Set language null to get updated user language 
                    this.selectCustomer(session);
                });
            }).finally(() => {
                this.spinnerService.hideAll();
            });
            if (session.isRestrictedProductExistInCart) {
                this.$localStorage.set("hasRestrictedProducts", true.toString());
            }

            if (this.invitedToList) {
                const inviteParam = "invite=";
                const lowerCaseReturnUrl = this.returnUrl.toLowerCase();
                const invite = lowerCaseReturnUrl.substr(lowerCaseReturnUrl.indexOf(inviteParam) + inviteParam.length);
                this.wishListService.activateInvite(invite).then(
                    (wishList: WishListModel) => { this.selectCustomer(session); },
                    (error: any) => { this.selectCustomer(session); });
            } else {
                this.accountService.getAccount().then(account => {
                    this.sessionService.setContextFromSession(session);

                    var languageId = account.properties["userLanguage"];
                    languageId = languageId ? languageId : session.language.id;

                    this.sessionService.setLanguage(languageId).then(x => {
                        session.language = x.language;   //Set language null to get updated user language
                        this.selectCustomer(session);
                    });
                });
            }
        }

        // BUSA-1092 Added eye icon on password field to show/hide password on click
        togglePasswordField(fieldId, iconId): void {
            if ($("#" + fieldId).attr("type") == "password") {
                $("#" + fieldId).attr("type", "text");
                $("#" + iconId).removeClass("fa-eye-slash").addClass("fa-eye");
            } else {
                $("#" + fieldId).attr("type", "password");
                $("#" + iconId).removeClass("fa-eye").addClass("fa-eye-slash");
            }
        }


    }
    angular
        .module("insite")
        .controller("SignInController", BrasselerSignInController);
}