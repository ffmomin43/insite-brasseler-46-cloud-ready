module insite.dealers {
    "use strict";

    export interface IDealerScope extends ng.IScope {
        map: google.maps.Map;
    }

    declare function RichMarker(options: any): void;

    export class DealerController {
        dealer: DealerModel;
        dealerMarker: any;
        notFound: boolean;

        static $inject = ["$scope", "dealerService", "$sce", "queryString", "$templateCache", "$location"];

        constructor(
            protected $scope: IDealerScope,
            protected dealerService: IDealerService,
            protected $sce: ng.ISCEService,
            protected queryString: common.IQueryStringService,
            protected $templateCache: ng.ITemplateCacheService,
            protected $location: ng.ILocationService) {
        }

        $onInit(): void {
            this.$scope.$on("mapInitialized", () => {
                this.onMapInitialized();
            });
            this.$scope.$on("$locationChangeStart", () => {
                if (this.dealerMarker) {
                    this.dealerMarker.setMap(null);
                }
            });
        }

        protected onMapInitialized(): void {
            this.$templateCache.remove(this.$location.path());
            this.dealerService.getDealer(this.queryString.get("dealerId")).then(
                (dealer: DealerModel) => { this.getDealerCompleted(dealer); },
                (error: any) => { this.getDealerFailed(error); });
        }

        protected getDealerCompleted(dealer: DealerModel): void {
            this.dealer = dealer;
            this.dealer.htmlContent = this.$sce.trustAsHtml(this.dealer.htmlContent);

            const latlong = new google.maps.LatLng(this.dealer.latitude, this.dealer.longitude);
            this.dealerMarker = new RichMarker({ position: latlong, map: this.$scope.map, flat: true, draggable: false, content: "<span class=\"home-marker\"></span>" });
            this.$scope.map.setCenter(latlong);
        }

        protected getDealerFailed(error: any): void {
            if (error === 404) {
                this.notFound = true;
            }
        }
    }

    angular
        .module("insite")
        .controller("DealerController", DealerController);
}