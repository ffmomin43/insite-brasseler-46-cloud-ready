var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var ExternalProvidersController = /** @class */ (function () {
            function ExternalProvidersController(accountService) {
                this.accountService = accountService;
            }
            ExternalProvidersController.prototype.$onInit = function () {
                var _this = this;
                this.accountService.getExternalProviders().then(function (externalProviderLinkCollection) { _this.getExternalProvidersCompleted(externalProviderLinkCollection); }, function (error) { _this.getExternalProvidersFailed(error); });
            };
            ExternalProvidersController.prototype.getExternalProvidersCompleted = function (externalProviderLinkCollection) {
                this.externalProviders = externalProviderLinkCollection.externalProviders;
            };
            ExternalProvidersController.prototype.getExternalProvidersFailed = function (error) {
            };
            ExternalProvidersController.$inject = ["accountService"];
            return ExternalProvidersController;
        }());
        account.ExternalProvidersController = ExternalProvidersController;
        angular
            .module("insite")
            .controller("ExternalProvidersController", ExternalProvidersController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.external-providers.controller.js.map