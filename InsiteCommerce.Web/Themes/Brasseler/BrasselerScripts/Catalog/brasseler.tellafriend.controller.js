var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        //grecaptcha is the javascript reference to the google/api.js for the recaptcha validation
        var BrasselerTellAFriendController = /** @class */ (function (_super) {
            __extends(BrasselerTellAFriendController, _super);
            function BrasselerTellAFriendController($scope, emailService) {
                var _this = _super.call(this, $scope, emailService) || this;
                _this.$scope = $scope;
                _this.emailService = emailService;
                _this.init();
                return _this;
            }
            BrasselerTellAFriendController.prototype.init = function () {
                _super.prototype.init.call(this);
            };
            BrasselerTellAFriendController.prototype.shareWithFriend = function () {
                var _this = this;
                var recaptchaResponse = grecaptcha.getResponse();
                if (recaptchaResponse.length === 0) {
                    $("#lblrecapResultp").html("Incorrect Recaptcha answer.");
                    $("#lblrecapResultp").css("color", "red");
                    $("#lblrecapResultp").show();
                    return false;
                }
                else {
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
                this.emailService.tellAFriend(this.tellAFriendModel).then(function (tellAFriendModel) { _this.tellAFriendCompleted(tellAFriendModel); }, function (error) { _this.tellAFriendFailed(error); });
                // Changes made for BUSA-379 Ends
            };
            BrasselerTellAFriendController.prototype.tellAFriendCompleted = function (tellAFriendModel) {
                this.isSuccess = true;
                this.isError = false;
                angular.element("#TellAFriendDialogContainer").foundation('reveal', 'close');
            };
            BrasselerTellAFriendController.$inject = ["$scope", "emailService"];
            return BrasselerTellAFriendController;
        }(catalog.TellAFriendController));
        catalog.BrasselerTellAFriendController = BrasselerTellAFriendController;
        angular
            .module("insite")
            .controller("TellAFriendController", BrasselerTellAFriendController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.tellafriend.controller.js.map