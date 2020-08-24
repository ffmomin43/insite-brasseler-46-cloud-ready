var insite;
(function (insite) {
    var dealers;
    (function (dealers) {
        "use strict";
        var DealerCollectionController = /** @class */ (function () {
            function DealerCollectionController($scope, $q, dealerService, $compile) {
                this.$scope = $scope;
                this.$q = $q;
                this.dealerService = dealerService;
                this.$compile = $compile;
                this.markers = [];
                this.locationKnown = true;
            }
            DealerCollectionController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("mapInitialized", function () {
                    _this.onMapInitialized();
                });
                this.$scope.$on("$locationChangeStart", function () {
                    _this.removeAllMarkers();
                });
                Foundation.libs.dropdown.settings.align = "top";
                Foundation.libs.dropdown.settings.is_hover = true;
            };
            DealerCollectionController.prototype.onMapInitialized = function () {
                this.searchDealers();
            };
            DealerCollectionController.prototype.getDealers = function () {
                var _this = this;
                if (!this.$scope.dealerSearchForm.$valid) {
                    return;
                }
                if (this.pagination) {
                    this.pagination.page = 1;
                }
                if (this.addressSearchField && this.addressSearchField.trim()) {
                    // resolve an address
                    this.dealerService.getGeoCodeFromAddress(this.addressSearchField).then(function (geocoderResults) { _this.getGeoCodeFromAddressCompleted(geocoderResults); }, function (error) { _this.getGeoCodeFromAddressFailed(error); });
                }
                else {
                    // get from the browser
                    this.searchDealers();
                }
            };
            DealerCollectionController.prototype.getGeoCodeFromAddressCompleted = function (geocoderResults) {
                this.locationKnown = true;
                var geocoderResult = geocoderResults[0];
                var coords = new google.maps.LatLng(geocoderResult.geometry.location.lat(), geocoderResult.geometry.location.lng());
                this.getDealerCollection(coords);
            };
            DealerCollectionController.prototype.getGeoCodeFromAddressFailed = function (error) {
                this.locationKnown = false;
            };
            DealerCollectionController.prototype.getDealerCollection = function (coords) {
                var _this = this;
                var filter = this.getFilter(coords);
                this.dealerService.getDealers(filter).then(function (dealerCollection) { _this.getDealerCollectionCompleted(dealerCollection); }, function (error) { _this.getDealerCollectionFailed(error); });
            };
            DealerCollectionController.prototype.searchDealers = function () {
                var _this = this;
                this.getCurrentLocation().then(function (coords) { _this.getCurrentLocationCompleted(coords); }, function (error) { _this.getCurrentLocationFailed(error); });
            };
            DealerCollectionController.prototype.getCurrentLocationCompleted = function (coords) {
                this.getDealerCollection(coords);
            };
            DealerCollectionController.prototype.getCurrentLocationFailed = function (error) {
            };
            DealerCollectionController.prototype.getDealerCollectionCompleted = function (dealerCollection) {
                this.dealers = dealerCollection.dealers;
                this.pagination = dealerCollection.pagination;
                this.distanceUnitOfMeasure = dealerCollection.distanceUnitOfMeasure === "Metric" ? 1 : 0;
                if (!this.center || this.center.lat() === 0 && this.center.lng() === 0) {
                    this.center = new google.maps.LatLng(dealerCollection.defaultLatitude, dealerCollection.defaultLongitude);
                }
                this.setMap();
            };
            DealerCollectionController.prototype.getDealerCollectionFailed = function (error) {
            };
            DealerCollectionController.prototype.getCurrentLocation = function () {
                var deferred = this.$q.defer();
                if (this.center) {
                    deferred.resolve(this.center);
                }
                else {
                    this.dealerService.getGeoLocation().then(deferred.resolve, deferred.reject);
                }
                return deferred.promise;
            };
            DealerCollectionController.prototype.getFilter = function (coords) {
                this.center = coords;
                var filter = {
                    name: this.storeName,
                    latitude: coords.lat(),
                    longitude: coords.lng()
                };
                if (this.pagination) {
                    filter.pageSize = this.pagination.pageSize;
                    filter.page = this.pagination.page;
                }
                return filter;
            };
            DealerCollectionController.prototype.getDealerMarkerPopupHtml = function (dealer) {
                var markerPopupScope = this.$scope.$new();
                markerPopupScope.dealer = dealer;
                markerPopupScope.dealer.distanceUnitOfMeasure = this.distanceUnitOfMeasure.toString();
                var markerPopupRawHtml = angular.element("#dealerMarkerPopup").html();
                var markerPopup = this.$compile(markerPopupRawHtml)(markerPopupScope);
                markerPopupScope.$digest();
                return markerPopup[0].outerHTML;
            };
            DealerCollectionController.prototype.setHomeMarker = function () {
                var _this = this;
                var marker = this.createMarker(this.center.lat(), this.center.lng(), "<span class='home-marker'></span>");
                google.maps.event.addListener(marker, "click", function () {
                    _this.onHomeMarkerClick(marker);
                });
            };
            DealerCollectionController.prototype.onHomeMarkerClick = function (marker) {
                this.openMarker(marker, "Your current location.<br/>" + this.addressSearchField);
            };
            DealerCollectionController.prototype.setMap = function () {
                this.$scope.map.setCenter(this.center);
                this.removeAllMarkers();
                this.setHomeMarker();
                this.setDealersMarkers();
                this.fitBounds();
            };
            DealerCollectionController.prototype.removeAllMarkers = function () {
                for (var m = 0; m < this.markers.length; m++) {
                    this.markers[m].setMap(null);
                }
                this.markers = [];
            };
            DealerCollectionController.prototype.setDealersMarkers = function () {
                var _this = this;
                this.dealers.forEach(function (dealer, i) {
                    var marker = _this.createMarker(dealer.latitude, dealer.longitude, "<span class='loc-marker'><span>" + _this.getDealerNumber(i) + "</span></span>");
                    google.maps.event.addListener(marker, "click", function () {
                        _this.onDealerMarkerClick(marker, dealer);
                    });
                });
            };
            DealerCollectionController.prototype.createMarker = function (lat, lng, content) {
                var markerOptions = {
                    position: new google.maps.LatLng(lat, lng),
                    map: this.$scope.map,
                    flat: true,
                    draggable: false,
                    content: content
                };
                var marker = new RichMarker(markerOptions);
                this.markers.push(marker);
                return marker;
            };
            DealerCollectionController.prototype.onDealerMarkerClick = function (marker, dealer) {
                this.openMarker(marker, this.getDealerMarkerPopupHtml(dealer));
            };
            DealerCollectionController.prototype.openMarker = function (marker, content) {
                if (this.infoWindow) {
                    this.infoWindow.close();
                }
                this.infoWindow = new google.maps.InfoWindow();
                this.infoWindow.setContent(content);
                this.infoWindow.open(this.$scope.map, marker);
            };
            DealerCollectionController.prototype.getDealerNumber = function (index) {
                return index + 1 + (this.pagination.pageSize * (this.pagination.page - 1));
            };
            DealerCollectionController.prototype.fitBounds = function () {
                if (this.$scope.map != null) {
                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0, markersLength = this.markers.length; i < markersLength; i++) {
                        bounds.extend(this.markers[i].position);
                    }
                    // Extends the bounds when we have only one marker to prevent zooming in too far.
                    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                        var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.03, bounds.getNorthEast().lng() + 0.03);
                        var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.03, bounds.getNorthEast().lng() - 0.03);
                        bounds.extend(extendPoint1);
                        bounds.extend(extendPoint2);
                    }
                    if (bounds.getCenter().lat() === 0 && bounds.getCenter().lng() === -180) {
                        return;
                    }
                    this.$scope.map.setCenter(bounds.getCenter());
                    this.$scope.map.fitBounds(bounds);
                }
            };
            DealerCollectionController.prototype.onOpenHoursClick = function ($event) {
                $event.preventDefault();
            };
            DealerCollectionController.$inject = ["$scope", "$q", "dealerService", "$compile"];
            return DealerCollectionController;
        }());
        dealers.DealerCollectionController = DealerCollectionController;
        angular
            .module("insite")
            .controller("DealerCollectionController", DealerCollectionController);
    })(dealers = insite.dealers || (insite.dealers = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dealer-list.controller.js.map