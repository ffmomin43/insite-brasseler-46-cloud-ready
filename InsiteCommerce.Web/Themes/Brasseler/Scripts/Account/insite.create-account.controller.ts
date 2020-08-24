module insite.account {
    "use strict";

    export class CreateAccountController {
        createError: string;
        email: string;
        isSubscribed: boolean;
        password: string;
        returnUrl: string;
        settings: AccountSettingsModel;
        userName: string;
        session: SessionModel;

        static $inject = [
            "accountService",
            "cartService",
            "sessionService",
            "coreService",
            "settingsService",
            "queryString",
            "accessToken",
            "spinnerService",
            "$q"
        ];

        constructor(
            protected accountService: IAccountService,
            protected cartService: cart.ICartService,
            protected sessionService: ISessionService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected accessToken: common.IAccessTokenService,
            protected spinnerService: core.SpinnerService,
            protected $q: ng.IQService) {
        }

        $onInit(): void {
            this.returnUrl = this.queryString.get("returnUrl");

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
        }

        protected getSessionFailed(error: any): void {
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        createAccount(): void {
            this.createError = "";
            const trimRule = {
                required: true,
                normalizer: function(value) {
                    return $.trim(value);
                }
            };

            const valid = $("#createAccountForm").validate({
                    rules: {
                        "CreateNewAccountInfo.UserName": trimRule,
                        "CreateNewAccountInfo.Password": trimRule,
                        "CreateNewAccountInfo.ConfirmPassword": trimRule
                    }
                }
            ).form();
            if (!valid) {
                return;
            }

            this.spinnerService.show("mainLayout", true);

            this.signOutIfGuestSignedIn().then(
                (signOutResult: string) => { this.signOutIfGuestSignedInCompleted(signOutResult); },
                (error: any) => { this.signOutIfGuestSignedInFailed(error); }
            );
        }

        protected unassignCartFromGuest(): ng.IPromise<CartModel> {
            const cart = this.cartService.getLoadedCurrentCart();

            if (cart && cart.lineCount > 0) {
                cart.unassignCart = true;
                return this.cartService.updateCart(cart);
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
            const account = {
                email: this.email,
                userName: this.userName,
                password: this.password,
                isSubscribed: this.isSubscribed
            } as AccountModel;

            this.accountService.createAccount(account).then(
                (createdAccount: AccountModel) => { this.createAccountCompleted(createdAccount); },
                (error: any) => { this.createAccountFailed(error); });
        }

        protected signOutIfGuestSignedInFailed(error: any): void {
            this.createError = error.message;
        }

        protected createAccountCompleted(account: AccountModel): void {
            this.accessToken.generate(account.userName, this.password).then(
                (accessToken: common.IAccessTokenDto) => { this.generateAccessTokenCompleted(account, accessToken); },
                (error: any) => { this.generateAccessTokenFailed(error); });
        }

        protected createAccountFailed(error: any): void {
            this.createError = error.message;
        }

        protected generateAccessTokenCompleted(account: AccountModel, accessToken: common.IAccessTokenDto): void {
            this.accessToken.set(accessToken.accessToken);
            const currentContext = this.sessionService.getContext();
            currentContext.billToId = account.billToId;
            currentContext.shipToId = account.shipToId;
            this.sessionService.setContext(currentContext);
            this.coreService.redirectToPathAndRefreshPage(this.returnUrl);
        }

        protected generateAccessTokenFailed(error: any): void {
            this.createError = error.message;
        }
    }

    angular
        .module("insite")
        .controller("CreateAccountController", CreateAccountController);
}