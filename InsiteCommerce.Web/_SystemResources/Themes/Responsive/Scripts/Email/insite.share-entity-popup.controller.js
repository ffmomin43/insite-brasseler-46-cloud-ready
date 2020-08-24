var insite;
(function (insite) {
    var email;
    (function (email) {
        "use strict";
        var ShareEntityPopupController = /** @class */ (function () {
            function ShareEntityPopupController($scope, emailService, sessionService) {
                this.$scope = $scope;
                this.emailService = emailService;
                this.sessionService = sessionService;
                this.shareEntityModel = {};
            }
            ShareEntityPopupController.prototype.$onInit = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.$scope.$watch("vm.entityId", function (entityId) {
                    _this.onEntityIdChanged(entityId);
                });
                angular.element(".share-entity-modal").on("closed", function () {
                    _this.onShareEntityPopupClosed();
                });
            };
            ShareEntityPopupController.prototype.onEntityIdChanged = function (entityId) {
                if (entityId) {
                    this.resetPopup();
                }
            };
            ShareEntityPopupController.prototype.onShareEntityPopupClosed = function () {
                this.resetPopup();
                this.$scope.$apply();
            };
            ShareEntityPopupController.prototype.resetPopup = function () {
                this.shareEntityModel = this.shareEntityModel || {};
                this.shareEntityModel.emailTo = "";
                this.shareEntityModel.emailFrom = this.currentUserEmail;
                this.shareEntityModel.subject = this.subject;
                this.shareEntityModel.message = this.message;
                this.isSuccess = false;
                this.isError = false;
            };
            ShareEntityPopupController.prototype.getSessionCompleted = function (session) {
                this.currentUserEmail = this.shareEntityModel.emailFrom = session.email;
            };
            ShareEntityPopupController.prototype.getSessionFailed = function (error) {
            };
            ShareEntityPopupController.prototype.closeModal = function () {
                angular.element("#shareEntityPopupContainer").foundation("reveal", "close");
            };
            ShareEntityPopupController.prototype.shareEntity = function () {
                var _this = this;
                var valid = angular.element(".shareEntityForm:visible").validate().form();
                if (!valid) {
                    return;
                }
                this.shareEntityModel.entityId = this.entityId;
                this.shareEntityModel.entityName = this.entityName;
                if (typeof (this.extraProperties) === "object") {
                    for (var propertyName in this.extraProperties) {
                        if (this.extraProperties.hasOwnProperty(propertyName)) {
                            this.shareEntityModel[propertyName] = this.extraProperties[propertyName];
                        }
                    }
                }
                this.emailService.shareEntity(this.shareEntityModel, this.url).then(function (shareEntityModel) { _this.shareEntityCompleted(shareEntityModel); }, function (error) { _this.shareEntityFailed(error); });
            };
            ShareEntityPopupController.prototype.shareEntityCompleted = function (shareEntityModel) {
                this.isSuccess = true;
                this.isError = false;
            };
            ShareEntityPopupController.prototype.shareEntityFailed = function (error) {
                this.isSuccess = false;
                this.isError = true;
            };
            ShareEntityPopupController.$inject = ["$scope", "emailService", "sessionService"];
            return ShareEntityPopupController;
        }());
        email.ShareEntityPopupController = ShareEntityPopupController;
        angular
            .module("insite")
            .controller("ShareEntityPopupController", ShareEntityPopupController)
            .directive("iscShareEntityPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                entityId: "=",
                entityName: "@",
                url: "@",
                fileLink: "@",
                headerText: "@",
                fileName: "@",
                subject: "@",
                message: "@",
                submitButtonText: "@",
                extraProperties: "="
            },
            templateUrl: "/PartialViews/Common-ShareEntityModal",
            controller: "ShareEntityPopupController",
            controllerAs: "vm",
            bindToController: true
        }); })
            .directive("iscShareEntityField", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Common-ShareEntityField",
            scope: {
                fieldLabel: "@",
                fieldName: "@",
                isRequired: "@",
                isEmail: "@",
                fieldValue: "="
            }
        }); });
    })(email = insite.email || (insite.email = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.share-entity-popup.controller.js.map