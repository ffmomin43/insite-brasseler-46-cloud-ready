module insite.catalog {
    "use strict";

    declare var grecaptcha: any;

    export class BrasselerProductImagesController extends ProductImagesController {

        static $inject = ["$scope", "cartService","coreService" ];
    
       constructor(protected $scope: ng.IScope,
           protected cartService: cart.ICartService,
           protected coreService: core.ICoreService
            ) {
           super($scope, coreService);
            this.init();
        }

        init() {
            super.$onInit();
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