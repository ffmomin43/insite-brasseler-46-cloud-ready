import WebsiteModel = Insite.Websites.WebApi.V1.ApiModels.WebsiteModel;
import CountryCollectionModel = Insite.Websites.WebApi.V1.ApiModels.CountryCollectionModel;
import AddressFieldCollectionModel = Insite.Websites.WebApi.V1.ApiModels.AddressFieldCollectionModel;

module insite.websites {
    "use strict";

    export interface IWebsiteService {
        getWebsite(expand: string): ng.IPromise<WebsiteModel>;
        getCountries(expand: string): ng.IPromise<CountryCollectionModel>;
        getAddressFields(): ng.IPromise<AddressFieldCollectionModel>;
    }

    export class WebsiteService implements IWebsiteService {
        serviceUri = "/api/v1/websites/current";
        languageId: System.Guid;

        static $inject = ["$http", "httpWrapperService", "sessionService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService,
            protected sessionService: account.ISessionService) {
            this.init();
        }

        init(): void {
            const context = this.sessionService.getContext();
            if (context) {
                this.languageId = context.languageId;
            } else {
                // if called before context is set, just set to empty, this is only used to vary the cache by language and not server side
                this.languageId = guidHelper.emptyGuid();
            }
        }

        getWebsite(expand: string): ng.IPromise<WebsiteModel> {
            const uri = this.serviceUri;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getWebsiteParams(expand) }),
                this.getWebsiteCompleted,
                this.getWebsiteFailed
            );
        }

        protected getWebsiteParams(expand: string): any {
            return expand ? { languageId: this.languageId, expand: expand } : {languageId: this.languageId};
        }

        protected getWebsiteCompleted(response: ng.IHttpPromiseCallbackArg<WebsiteModel>): void {
        }

        protected getWebsiteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getCountries(expand: string): ng.IPromise<CountryCollectionModel> {
            const uri = `${this.serviceUri}/countries`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getCountriesParams(expand) }),
                this.getCountriesCompleted,
                this.getCountriesFailed
            );
        }

        protected getCountriesParams(expand: any): any {
            return expand ? { languageId: this.languageId, expand: expand } : { languageId: this.languageId };
        }

        protected getCountriesCompleted(response: ng.IHttpPromiseCallbackArg<CountryCollectionModel>): void {
        }

        protected getCountriesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getAddressFields(): ng.IPromise<AddressFieldCollectionModel> {
            const uri = `${this.serviceUri}/addressfields`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(uri),
                this.getAddressFieldsCompleted,
                this.getAddressFieldsFailed
            );
        }

        protected getAddressFieldsCompleted(response: ng.IHttpPromiseCallbackArg<AddressFieldCollectionModel>): void {
        }

        protected getAddressFieldsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("websiteService", WebsiteService);
}