var insite;
(function (insite) {
    var dealers;
    (function (dealers) {
        "use strict";
        var DealerController = /** @class */ (function () {
            function DealerController($scope, dealerService, $sce, queryString, $templateCache, $location) {
                this.$scope = $scope;
                this.dealerService = dealerService;
                this.$sce = $sce;
                this.queryString = queryString;
                this.$templateCache = $templateCache;
                this.$location = $location;
            }
            DealerController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("mapInitialized", function () {
                    _this.onMapInitialized();
                });
                this.$scope.$on("$locationChangeStart", function () {
                    if (_this.dealerMarker) {
                        _this.dealerMarker.setMap(null);
                    }
                });
            };
            DealerController.prototype.onMapInitialized = function () {
                var _this = this;
                this.$templateCache.remove(this.$location.path());
                this.dealerService.getDealer(this.queryString.get("dealerId")).then(function (dealer) { _this.getDealerCompleted(dealer); }, function (error) { _this.getDealerFailed(error); });
            };
            DealerController.prototype.getDealerCompleted = function (dealer) {
                this.dealer = dealer;
                this.dealer.htmlContent = this.$sce.trustAsHtml(this.dealer.htmlContent);
                var latlong = new google.maps.LatLng(this.dealer.latitude, this.dealer.longitude);
                this.dealerMarker = new RichMarker({ position: latlong, map: this.$scope.map, flat: true, draggable: false, content: "<span class=\"home-marker\"></span>" });
                this.$scope.map.setCenter(latlong);
            };
            DealerController.prototype.getDealerFailed = function (error) {
                if (error === 404) {
                    this.notFound = true;
                }
            };
            DealerController.$inject = ["$scope", "dealerService", "$sce", "queryString", "$templateCache", "$location"];
            return DealerController;
        }());
        dealers.DealerController = DealerController;
        angular
            .module("insite")
            .controller("DealerController", DealerController);
    })(dealers = insite.dealers || (insite.dealers = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dealer.controller.js.map