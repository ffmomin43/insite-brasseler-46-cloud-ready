module insite.account {
    import IWishListService = wishlist.IWishListService;
    "use strict";

    export interface ISignInControllerAttributes extends ng.IAttributes {
        homePageUrl: string;
        changeCustomerPageUrl: string;
        dashboardUrl: string;
        addressesUrl: string;
        checkoutAddressUrl: string;
        reviewAndPayUrl: string;
        myListDetailUrl: string;
        staticListUrl: string;
        cartUrl: string;
        orderConfirmationUrl: string;
    }

    export class SignInController {
        accessTokenString = "";
        changePasswordError: string;
        email: string;
        homePageUrl: string;
        changeCustomerPageUrl: string;
        dashboardUrl: string;
        newPassword: string;
        password: string;
        resetPasswordError: string;
        resetPasswordSuccess: boolean;
        returnUrl: string;
        checkoutAddressUrl: string;
        reviewAndPayUrl: string;
        myListDetailUrl: string;
        staticListUrl: string;
        cartUrl: string;
        addressesUrl: string;
        orderConfirmationUrl: string;
        settings: AccountSettingsModel;
        signInError = "";
        disableSignIn = true;
        userName: string;
        userNameToReset: string;
        cart: CartModel;
        signInForm: any;
        isFromReviewAndPay: boolean;
        rememberMe: boolean;
        invitedToList: boolean;
        navigatedFromStaticList: boolean;
        listOwner: string;
        listId: string;
        isFromCheckoutAddress: boolean;
        session: SessionModel;

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
            "$q"
        ];

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
        }

        $onInit() {
            this.homePageUrl = this.$attrs.homePageUrl;
            this.changeCustomerPageUrl = this.$attrs.changeCustomerPageUrl;
            this.dashboardUrl = this.$attrs.dashboardUrl;
            this.addressesUrl = this.$attrs.addressesUrl;
            this.checkoutAddressUrl = this.$attrs.checkoutAddressUrl;
            this.reviewAndPayUrl = this.$attrs.reviewAndPayUrl;
            this.myListDetailUrl = this.$attrs.myListDetailUrl;
            this.staticListUrl = this.$attrs.staticListUrl;
            this.cartUrl = this.$attrs.cartUrl;
            this.orderConfirmationUrl = this.$attrs.orderConfirmationUrl;

            this.returnUrl = this.queryString.get("returnUrl");
            if (!this.returnUrl || this.returnUrl.indexOf(this.orderConfirmationUrl) !== -1) {
                this.returnUrl = this.homePageUrl;
            }

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.cart = this.cartService.getLoadedCurrentCart();
            if (!this.cart) {
                this.$scope.$on("cartLoaded", (event: ng.IAngularEvent, cart: CartModel) => { this.onCartLoaded(cart); });
            }

            const lowerCaseReturnUrl = this.returnUrl.toLowerCase();
            if (lowerCaseReturnUrl.indexOf(this.reviewAndPayUrl.toLowerCase()) > -1) {
                this.isFromReviewAndPay = true;
            }

            if (lowerCaseReturnUrl.indexOf(this.myListDetailUrl.toLowerCase()) > -1 && lowerCaseReturnUrl.indexOf("invite") > -1) {
                this.invitedToList = true;
            }

            const idParam = "?id=";
            if (lowerCaseReturnUrl.indexOf(this.staticListUrl.toLowerCase()) > -1 && !this.queryString.get("clientRedirect") && lowerCaseReturnUrl.indexOf(idParam) > -1) {
                this.listId = lowerCaseReturnUrl.substr(lowerCaseReturnUrl.indexOf(idParam) + idParam.length, 36);
                this.navigatedFromStaticList = true;
            }

            this.isFromCheckoutAddress = lowerCaseReturnUrl.indexOf(this.checkoutAddressUrl.toLowerCase()) > -1;
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.disableSignIn = false;
            if (session.isAuthenticated && !session.isGuest) {
                this.$window.location.href = this.dashboardUrl;
            } else if (this.invitedToList) {
                this.coreService.displayModal("#popup-sign-in-required");
            } else if (this.navigatedFromStaticList) {
                this.getList();
            }
        }

        protected getSessionFailed(error: any): void {
        }

        getList(): void {
            this.spinnerService.show();
            this.wishListService.getListById(this.listId, "excludelistlines,staticlist").then(
                (list: WishListModel) => { this.getListCompleted(list); },
                (error: any) => { this.getListFailed(error); });
        }

        protected getListCompleted(list: WishListModel): void {
            this.spinnerService.hide();
            this.listOwner = list.sharedByDisplayName;
            this.coreService.displayModal("#popup-sign-in-required");
        }

        protected getListFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected onCartLoaded(cart: CartModel): void {
            this.cart = cart;
        }

        signIn(errorMessage: string): void {
            if (this.disableSignIn) {
                return;
            }

            this.signInError = "";

            if (this.signInForm.$invalid) {
                return;
            }

            this.disableSignIn = true;
            this.spinnerService.show("mainLayout", true);

            this.signOutIfGuestSignedIn().then(
                (signOutResult: string) => { this.signOutIfGuestSignedInCompleted(signOutResult); },
                (error: any) => { this.signOutIfGuestSignedInFailed(error); }
            );
        }

        protected unassignCartFromGuest(): ng.IPromise<CartModel> {
            if (this.cart && this.cart.lineCount > 0) {
                this.cart.unassignCart = true;
                return this.cartService.updateCart(this.cart);
            }

            const defer = this.$q.defer<CartModel>();
            defer.resolve();
            return defer.promise;
        }

        protected signOutIfGuestSignedIn(): ng.IPromise<string> {
            if (this.session.isAuthenticated && this.session.isGuest) {
                return this.unassignCartFromGuest().then(
                    (result) => { return this.sessionService.signOut(); }
                );
            }

            const defer = this.$q.defer<string>();
            defer.resolve();
            return defer.promise;
        }

        protected signOutIfGuestSignedInCompleted(signOutResult: string): void {
            this.accessToken.remove();
            this.accessToken.generate(this.userName, this.password).then(
                (accessTokenDto: common.IAccessTokenDto) => { this.generateAccessTokenOnSignInCompleted(accessTokenDto); },
                (error: any) => { this.generateAccessTokenOnSignInFailed(error); });
        }

        protected signOutIfGuestSignedInFailed(error: any): void {
            this.signInError = error.message;
            this.disableSignIn = false;
            this.spinnerService.hide("mainLayout");
        }

        protected generateAccessTokenOnSignInCompleted(accessTokenDto: common.IAccessTokenDto): void {
            this.accessTokenString = accessTokenDto.accessToken;
            this.signUserIn();
        }

        protected generateAccessTokenOnSignInFailed(error: any): void {
            this.signInError = error.message;
            this.disableSignIn = false;
            this.spinnerService.hide("mainLayout");
        }

        selectCustomer(session: SessionModel): void {
            if (session.redirectToChangeCustomerPageOnSignIn) {
                const shouldAddReturnUrl = this.returnUrl && this.returnUrl !== this.homePageUrl;
                this.$window.location.href = this.changeCustomerPageUrl + (shouldAddReturnUrl ? `?returnUrl=${encodeURIComponent(this.returnUrl)}` : "");
            } else {
                this.cartService.expand = "cartlines,hiddenproducts";
                this.cartService.getCart(this.cart.id).then(
                    (cart: CartModel) => { this.getCartCompleted(session, cart); },
                    (error: any) => { this.getCartFailed(error); });
            }
        }

        encodeUriComponent(url): string {
            return (this.$window as any).encodeURIComponent(url);
        }

        protected getCartCompleted(session: SessionModel, cart: CartModel): void {
            this.cartService.expand = "";
            this.sessionService.redirectAfterSelectCustomer(
                session,
                this.cart.canBypassCheckoutAddress,
                this.dashboardUrl,
                this.returnUrl,
                this.checkoutAddressUrl,
                this.reviewAndPayUrl,
                this.addressesUrl,
                this.cartUrl,
                this.cart.canCheckOut);
        }

        protected getCartFailed(error: any): void {
            this.cartService.expand = "";
        }

        showGuestCheckout(): boolean {
            return this.settings && this.settings.allowGuestCheckout && this.session && !this.session.isAuthenticated && this.isFromCheckoutAddress;
        }

        guestCheckout(): void {
            const account = { isGuest: true } as AccountModel;

            if (this.session) {
                account.defaultFulfillmentMethod = this.session.fulfillmentMethod;
                if (this.session.pickUpWarehouse) {
                    account.defaultWarehouseId = this.session.pickUpWarehouse.id;
                }
            }

            this.spinnerService.show("mainLayout", true);
            this.accountService.createAccount(account).then(
                (createdAccount: AccountModel) => { this.createAccountCompleted(createdAccount); },
                (error: any) => { this.createAccountFailed(error); });
        }

        protected createAccountCompleted(account: AccountModel): void {
            this.accessToken.generate(account.userName, account.password).then(
                (accessTokenDto: common.IAccessTokenDto) => { this.generateAccessTokenForAccountCreationCompleted(accessTokenDto); },
                (error: any) => { this.generateAccessTokenForAccountCreationFailed(error); });
        }

        protected createAccountFailed(error: any): void {
            this.signInError = error.message;
        }

        protected generateAccessTokenForAccountCreationCompleted(accessTokenDto: common.IAccessTokenDto): void {
            this.accessToken.set(accessTokenDto.accessToken);
            this.$window.location.href = this.returnUrl;
        }

        protected generateAccessTokenForAccountCreationFailed(error: any): void {
            this.signInError = error.message;
        }

        resetForgotPasswordPopup(): boolean {
            this.email = "";
            this.userNameToReset = "";
            this.resetPasswordSuccess = false;
            return true;
        }

        changePassword(): void {
            this.changePasswordError = "";

            const valid = $("#changePasswordForm").validate().form();
            if (!valid) {
                return;
            }

            const session = {
                userName: this.userName,
                password: this.password,
                newPassword: this.newPassword
            } as SessionModel;

            this.sessionService.changePassword(session, this.accessTokenString).then(
                (sessionResult: SessionModel) => { this.changePasswordCompleted(sessionResult); },
                (error: any) => { this.changePasswordFailed(error); });
        }

        protected changePasswordCompleted(session: SessionModel): void {
            this.password = this.newPassword;
            this.signUserIn();
        }

        protected changePasswordFailed(error: any): void {
            this.changePasswordError = error.message;
        }

        resetPassword(): void {
            this.resetPasswordError = "";

            const valid = $("#resetPasswordForm").validate().form();
            if (!valid) {
                return;
            }

            this.sessionService.sendResetPasswordEmail(this.userNameToReset).then(
                (session: SessionModel) => { this.sendResetPasswordEmailCompleted(session); },
                (error: any) => { this.sendResetPasswordEmailFailed(error); });
        }

        protected sendResetPasswordEmailCompleted(session: SessionModel): void {
            this.resetPasswordSuccess = true;
        }

        protected sendResetPasswordEmailFailed(error: any): void {
            this.resetPasswordError = error.message;
        }

        signUserIn(): void {
            this.sessionService.signIn(this.accessTokenString, this.userName, this.password, this.rememberMe).then(
                (session: SessionModel) => { this.signInCompleted(session); },
                (error: any) => { this.signInFailed(error); });
        }

        protected signInCompleted(session: SessionModel): void {
            this.sessionService.setContextFromSession(session);
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
                this.selectCustomer(session);
            }
        }

        protected signInFailed(error: any): void {
            this.disableSignIn = false;

            if (error.status === 422) {
                this.coreService.displayModal(angular.element("#changePasswordPopup"));
            } else {
                if (error.message) {
                    this.signInError = error.message;
                } else {
                    this.signInError = error;
                }
            }
        }

        protected closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }
    }

    angular
        .module("insite")
        .controller("SignInController", SignInController);
}