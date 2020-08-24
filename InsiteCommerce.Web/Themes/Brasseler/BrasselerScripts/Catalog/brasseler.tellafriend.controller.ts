module insite.catalog {
    "use strict";
    declare var grecaptcha: any;
    //grecaptcha is the javascript reference to the google/api.js for the recaptcha validation
    export class BrasselerTellAFriendController extends TellAFriendController {

        shareModel: any;
        product: ProductDto;
        isSuccess: boolean;
        isError: boolean;

        public static $inject = ["$scope", "emailService", "$timeout", "coreService", "tellAFriendPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected emailService: email.IEmailService,
            protected $timeout: ng.ITimeoutService,
            protected coreService: core.ICoreService,
            protected tellAFriendPopupService: ITellAFriendPopupService) {
            super($scope, emailService, $timeout, coreService, tellAFriendPopupService);
            this.init();

        }

        init(): void {
            super.$onInit();
        }

        shareWithFriend() {
            var recaptchaResponse = grecaptcha.getResponse();
            if (recaptchaResponse.length === 0) {
                $("#lblrecapResultp").html("Incorrect Recaptcha answer.");
                $("#lblrecapResultp").css("color", "red");
                $("#lblrecapResultp").show();
                return false;
            } else {
                $("#lblrecapResultp span").hide();
            }

            // Changes made for BUSA-379 Starts
            //super.shareWithFriend();
            var valid = angular.element("#tellAFriendForm").validate().form();
            if (!valid) {
                return;
            }
            
            this.tellAFriendModel.productId = this.product.id.toString();
            this.tellAFriendModel.productImage = this.product.mediumImagePath;
            this.tellAFriendModel.productShortDescription = this.product.shortDescription;
            this.tellAFriendModel.altText = this.product.altText;
            this.tellAFriendModel.productUrl = this.product.productDetailUrl;

            this.emailService.tellAFriend(this.tellAFriendModel).then(
                (tellAFriendModel: TellAFriendModel) => { this.tellAFriendCompleted(tellAFriendModel); },
                (error: any) => { this.tellAFriendFailed(error); });

            // Changes made for BUSA-379 Ends
        }

        protected tellAFriendCompleted(tellAFriendModel: TellAFriendModel): void {
            this.isSuccess = true;
            this.isError = false;
            (<any>angular.element("#TellAFriendDialogContainer")).foundation('reveal', 'close');
        }
    }

    angular
        .module("insite")
        .controller("TellAFriendController", BrasselerTellAFriendController);
} 