var insite;
(function (insite) {
    var dealers;
    (function (dealers) {
        "use strict";
        var DealerService = /** @class */ (function () {
            function DealerService($http, $q, httpWrapperService) {
                this.$http = $http;
                this.$q = $q;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/dealers";
            }
            DealerService.prototype.getGeoCodeFromLatLng = function (lat, lng) {
                var _this = this;
                var deferred = this.$q.defer();
                var latlng = new google.maps.LatLng(lat, lng);
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: "", latLng: latlng }, function (results, status) {
                    _this.getGeoCodeFromLatLngCompleted(results, status, deferred);
                });
                return deferred.promise;
            };
            DealerService.prototype.getGeoCodeFromLatLngCompleted = function (results, status, deferred) {
                if (status === google.maps.GeocoderStatus.OK) {
                    deferred.resolve(results);
                }
                else {
                    deferred.reject(status);
                }
            };
            DealerService.prototype.getGeoCodeFromAddress = function (address) {
                var _this = this;
                var deferred = this.$q.defer();
                if (address && address.trim()) {
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: address }, function (results, status) {
                        _this.getGeoCodeFromAddressCompleted(results, status, deferred);
                    });
                }
                else {
                    deferred.reject(google.maps.GeocoderStatus.ZERO_RESULTS);
                }
                return deferred.promise;
            };
            DealerService.prototype.getGeoCodeFromAddressCompleted = function (results, status, deferred) {
                if (status === google.maps.GeocoderStatus.OK) {
                    deferred.resolve(results);
                }
                else {
                    deferred.reject(status);
                }
            };
            DealerService.prototype.getGeoLocation = function () {
                var _this = this;
                var deferred = this.$q.defer();
                var response = new google.maps.LatLng(0, 0);
                // ok no geoCoder so grab the geolocation from the browser if available.
                if (!navigator.geolocation) {
                    deferred.resolve(response);
                    return deferred.promise;
                }
                navigator.geolocation.getCurrentPosition(function (position) { _this.getCurrentPositionCompleted(position, deferred); }, function (error) { _this.getCurrentPositionFailed(error, deferred); }, { timeout: 5500 });
                return deferred.promise;
            };
            DealerService.prototype.getCurrentPositionCompleted = function (position, getGeoLocationDeferred) {
                getGeoLocationDeferred.resolve(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
            };
            DealerService.prototype.getCurrentPositionFailed = function (error, getGeoLocationDeferred) {
                getGeoLocationDeferred.resolve(new google.maps.LatLng(0, 0));
            };
            DealerService.prototype.getDealers = function (filter) {
                var _this = this;
                var deferred = this.$q.defer();
                this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getDealersParams(filter) }), function (response) { _this.getDealersCompleted(response.data, deferred); }, function (error) { _this.getDealersFailed(error.data, deferred); });
                return deferred.promise;
            };
            DealerService.prototype.getDealersParams = function (filter) {
                return filter ? JSON.parse(JSON.stringify(filter)) : {};
            };
            DealerService.prototype.getDealersCompleted = function (dealerCollection, deferred) {
                var _this = this;
                this.getGeoCodeFromLatLng(dealerCollection.defaultLatitude, dealerCollection.defaultLongitude).then(function (results) { _this.getGeoCodeFromLatLngForDealersCompleted(results, dealerCollection, deferred); }, function (error) { _this.getGeoCodeFromLatLngForDealersFailed(error, dealerCollection, deferred); });
            };
            DealerService.prototype.getDealersFailed = function (error, deferred) {
                deferred.reject(error);
            };
            DealerService.prototype.getGeoCodeFromLatLngForDealersCompleted = function (results, dealerCollection, deferred) {
                dealerCollection.formattedAddress = results[0].formatted_address;
                deferred.resolve(dealerCollection);
            };
            DealerService.prototype.getGeoCodeFromLatLngForDealersFailed = function (error, dealerCollection, deferred) {
                deferred.resolve(dealerCollection);
            };
            DealerService.prototype.getDealer = function (dealerId) {
                var _this = this;
                var deferred = this.$q.defer();
                this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri + "/" + dealerId }), function (response) { _this.getDealerCompleted(response.data, deferred); }, function (error) { _this.getDealerFailed(error.data, deferred); });
                return deferred.promise;
            };
            DealerService.prototype.getDealerCompleted = function (dealer, deferred) {
                var _this = this;
                this.getGeoCodeFromLatLng(dealer.latitude, dealer.longitude).then(function (results) { _this.getGeoCodeFromLatLngForDealerCompleted(results, dealer, deferred); }, function (error) { _this.getGeoCodeFromLatLngForDealerFailed(error, deferred); });
            };
            DealerService.prototype.getDealerFailed = function (error, deferred) {
                deferred.reject(error);
            };
            DealerService.prototype.getGeoCodeFromLatLngForDealerCompleted = function (results, dealer, deferred) {
                deferred.resolve(dealer);
            };
            DealerService.prototype.getGeoCodeFromLatLngForDealerFailed = function (error, deferred) {
                deferred.reject(error);
            };
            DealerService.$inject = ["$http", "$q", "httpWrapperService"];
            return DealerService;
        }());
        dealers.DealerService = DealerService;
        angular
            .module("insite")
            .service("dealerService", DealerService);
    })(dealers = insite.dealers || (insite.dealers = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dealer.service.js.map