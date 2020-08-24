import UserPaymentProfileModel = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.UserPaymentProfileModel;
import UserPaymentProfileCollectionModel = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.UserPaymentProfileCollectionModel;

module insite.paymentoptions {
    "use strict";



    export interface IUserPaymentProfileService {
        updateUserPaymentProfile(userPaymentProfile: UserPaymentProfileModel, refresh: boolean): ng.IPromise<UserPaymentProfileModel>;
        getUserPaymentProfiles(): ng.IHttpPromise<UserPaymentProfileCollectionModel>;
        deleteUserPaymentProfile(userPaymentProfile: UserPaymentProfileModel): ng.IHttpPromise<any>;
    }

    export class UserPaymentProfileService implements IUserPaymentProfileService {

        serviceUri = "/api/v1/userpaymentprofile";
        expand = "";

        static $inject = ["$http", "$q", "coreService", "$window", "httpWrapperService"];

        constructor(protected $http: ng.IHttpService,
            protected $q: ng.IQService,
            protected coreService: core.ICoreService,
            protected $window: ng.IWindowService,
            protected httpWrapperService: core.HttpWrapperService) {

        }

        getUserPaymentProfiles(): ng.IHttpPromise<UserPaymentProfileCollectionModel> {
            var uri = this.serviceUri;
            var params = <any>{};

            return this.$http({
                url: uri,
                method: "GET",
                params: params,
                bypassErrorInterceptor: true,
                headers: { 'Cache-Control': 'no-cache' } //BUSA-605 : Set Default functionality is not working when user reloads the page from "Manage Payment Options" page.
            });
        }

        deleteUserPaymentProfile(userPaymentProfile: UserPaymentProfileModel): ng.IHttpPromise<any> {
            var deferred = this.$q.defer();

            return this.$http.delete(userPaymentProfile.uri, { bypassErrorInterceptor: true })
                .success((result) => {
                    return deferred.resolve(result);
                });

        }

        //BUSA-1122 Allowing user to update expiry date of existing CC start.
        updateUserPaymentProfile(userPaymentProfile: UserPaymentProfileModel, refresh: boolean): ng.IPromise<UserPaymentProfileModel> {
            var deferred = this.$q.defer();
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: userPaymentProfile.uri, data: userPaymentProfile }),
                (response: ng.IHttpPromiseCallbackArg<UserPaymentProfileModel>) => { this.updateCardCompleted(response, refresh); },
                this.updateCartFailed);
        }

        protected updateCardCompleted(response: ng.IHttpPromiseCallbackArg<UserPaymentProfileModel>, refresh: boolean): void {
            if (refresh) {
                //this.getCart();
                //this.$rootScope.$broadcast("cartChanged");
            }
        }

        protected updateCartFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
        //BUSA-1122 Allowing user to update expiry date of existing CC end.
    }
    angular
        .module("insite")
        .service("userPaymentProfileService", UserPaymentProfileService);
}
