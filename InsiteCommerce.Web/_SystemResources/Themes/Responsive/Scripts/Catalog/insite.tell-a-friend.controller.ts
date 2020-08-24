module insite.catalog {
    "use strict";

    export class TellAFriendController {
        tellAFriendModel: TellAFriendModel;
        product: ProductDto;
        isSuccess: boolean;
        isError: boolean;
        inProgress: boolean;

        static $inject = ["$scope", "emailService", "$timeout", "coreService", "tellAFriendPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected emailService: email.IEmailService,
            protected $timeout: ng.ITimeoutService,
            protected coreService: core.ICoreService,
            protected tellAFriendPopupService: ITellAFriendPopupService) {
        }

        $onInit(): void {
            this.tellAFriendPopupService.registerDisplayFunction((data) => {
                this.product = data.product;
                this.resetPopup();
                this.coreService.displayModal("#popup-tell-a-friend");
            });
        }

        protected resetPopup(): void {
            this.tellAFriendModel = this.tellAFriendModel || {} as TellAFriendModel;
            this.tellAFriendModel.friendsName = "";
            this.tellAFriendModel.friendsEmailAddress = "";
            this.tellAFriendModel.yourName = "";
            this.tellAFriendModel.yourEmailAddress = "";
            this.tellAFriendModel.yourMessage = "";
            this.isSuccess = false;
            this.isError = false;
            this.inProgress = false;

            angular.element("#tellAFriendForm").validate().resetForm();
            angular.element("#tellAFriendForm input.error, #tellAFriendForm textarea.error").removeClass("error");
        }

        shareWithFriend(): void {
            const valid = angular.element("#tellAFriendForm").validate().form();
            if (!valid) {
                return;
            }

            this.tellAFriendModel.productId = this.product.id.toString();
            this.tellAFriendModel.productImage = this.product.mediumImagePath;
            this.tellAFriendModel.productShortDescription = this.product.shortDescription;
            this.tellAFriendModel.altText = this.product.altText;
            this.tellAFriendModel.productUrl = this.product.productDetailUrl;

            this.inProgress = true;
            this.emailService.tellAFriend(this.tellAFriendModel).then(
                (tellAFriendModel: TellAFriendModel) => { this.tellAFriendCompleted(tellAFriendModel); },
                (error: any) => { this.tellAFriendFailed(error); });
        }

        protected tellAFriendCompleted(tellAFriendModel: TellAFriendModel): void {
            this.isSuccess = true;
            this.isError = false;
            this.inProgress = false;
            this.$timeout(() => {
                this.closeModal();
            }, 1000);
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-tell-a-friend");
        }

        protected tellAFriendFailed(error: any): void {
            this.isSuccess = false;
            this.isError = true;
            this.inProgress = false;
        }
    }

    export interface ITellAFriendPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class TellAFriendPopupService extends base.BasePopupService<any> implements ITellAFriendPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-tell-a-friend-popup></isc-tell-a-friend-popup>";
        }
    }

    angular
        .module("insite")
        .controller("TellAFriendController", TellAFriendController)
        .service("tellAFriendPopupService", TellAFriendPopupService);
}