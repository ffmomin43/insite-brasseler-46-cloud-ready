var insite;
(function (insite) {
    var currency;
    (function (currency_1) {
        "use strict";
        var CurrencyController = /** @class */ (function () {
            function CurrencyController($scope, $window, $timeout, sessionService, websiteService) {
                this.$scope = $scope;
                this.$window = $window;
                this.$timeout = $timeout;
                this.sessionService = sessionService;
                this.websiteService = websiteService;
            }
            CurrencyController.prototype.$onInit = function () {
                var _this = this;
                angular.element(window.document).bind("click", function (event) {
                    if (_this.currencyButton && _this.currencyButton !== event.target && _this.currencyButton.find(event.target).length === 0) {
                        _this.showCurrenciesMenu = false;
                        _this.$scope.$apply();
                    }
                });
                this.getSession();
            };
            CurrencyController.prototype.getSession = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            CurrencyController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.getWebsite("currencies");
            };
            CurrencyController.prototype.getSessionFailed = function (error) {
            };
            CurrencyController.prototype.getWebsite = function (expand) {
                var _this = this;
                this.websiteService.getWebsite(expand).then(function (website) { _this.getWebsiteCompleted(website); }, function (error) { _this.getWebsitedFailed(error); });
            };
            CurrencyController.prototype.getWebsiteCompleted = function (website) {
                var _this = this;
                this.currencies = website.currencies.currencies;
                angular.forEach(this.currencies, function (currency) {
                    if (currency.id === _this.session.currency.id) {
                        _this.session.currency = currency;
                    }
                });
            };
            CurrencyController.prototype.getWebsitedFailed = function (error) {
            };
            CurrencyController.prototype.setCurrency = function (currencyId) {
                var _this = this;
                currencyId = currencyId ? currencyId : this.session.currency.id;
                this.sessionService.setCurrency(currencyId).then(function (session) { _this.setCurrencyCompleted(session); }, function (error) { _this.setCurrencyFailed(error); });
            };
            CurrencyController.prototype.setCurrencyCompleted = function (session) {
                this.$window.location.reload();
            };
            CurrencyController.prototype.setCurrencyFailed = function (error) {
            };
            CurrencyController.prototype.openCurrenciesMenu = function (event) {
                var _this = this;
                this.showCurrenciesMenu = !this.showCurrenciesMenu;
                this.$timeout(function () {
                    _this.currencyButton = angular.element(event.currentTarget);
                    var currenciesMenu = angular.element(event.currentTarget).children(".currencies-menu");
                    var eOffset = _this.currencyButton.offset();
                    var top = eOffset.top;
                    angular.element("body").append(currenciesMenu.detach());
                    if (top > currenciesMenu.height()) {
                        top = top - currenciesMenu.height();
                    }
                    else {
                        top = top + _this.currencyButton.height();
                    }
                    currenciesMenu.css({ "top": top, "left": eOffset.left, "visibility": "visible" });
                });
            };
            CurrencyController.$inject = ["$scope", "$window", "$timeout", "sessionService", "websiteService"];
            return CurrencyController;
        }());
        currency_1.CurrencyController = CurrencyController;
        angular
            .module("insite")
            .controller("CurrencyController", CurrencyController);
    })(currency = insite.currency || (insite.currency = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.currency.controller.js.map