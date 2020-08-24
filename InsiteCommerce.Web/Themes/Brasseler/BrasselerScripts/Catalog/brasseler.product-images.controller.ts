module insite.catalog {
    "use strict";

    declare var grecaptcha: any;

    export class BrasselerProductImagesController extends ProductImagesController {

        static $inject = ["$scope", "cartService" ];
    
       constructor(protected $scope: ng.IScope,
            protected cartService: cart.ICartService
            ) {
            super($scope);
            this.init();
        }

        init() {
            super.init();
            if (this.cartService != undefined) {
                this.cartService.getCart().then(result => {
                    grecaptcha.render('lblrecapResultp', {
                        'sitekey': result.properties['siteKey']
                    });
                });
            }
        }
       
    }

    angular
        .module("insite")
        .controller("ProductImagesController", BrasselerProductImagesController);
}