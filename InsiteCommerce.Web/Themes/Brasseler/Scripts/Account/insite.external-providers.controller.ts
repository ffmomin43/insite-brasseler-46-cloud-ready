import ExternalProviderLinkModel = Insite.IdentityServer.Models.ExternalProviderLinkModel;

module insite.account {
    "use strict";

    export class ExternalProvidersController {
        externalProviders: ExternalProviderLinkModel[];

        static $inject = ["accountService"];

        constructor(protected accountService: IAccountService) {
        }

        $onInit(): void {
            this.accountService.getExternalProviders().then(
                (externalProviderLinkCollection: ExternalProviderLinkCollectionModel) => { this.getExternalProvidersCompleted(externalProviderLinkCollection); },
                (error: any) => {this.getExternalProvidersFailed(error); });
        }

        protected getExternalProvidersCompleted(externalProviderLinkCollection: ExternalProviderLinkCollectionModel): void {
            this.externalProviders = externalProviderLinkCollection.externalProviders;
        }

        protected getExternalProvidersFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("ExternalProvidersController", ExternalProvidersController);
}