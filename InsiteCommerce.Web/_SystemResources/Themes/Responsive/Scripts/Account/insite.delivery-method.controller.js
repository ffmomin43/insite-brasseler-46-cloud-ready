var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var DeliveryMethodController = /** @class */ (function () {
            function DeliveryMethodController($scope, $rootScope, sessionService, selectPickUpLocationPopupService, spinnerService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.sessionService = sessionService;
                this.selectPickUpLocationPopupService = selectPickUpLocationPopupService;
                this.spinnerService = spinnerService;
            }
            DeliveryMethodController.prototype.$onInit = function () {
                var _this = this;
                if (!this.session) {
                    this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                }
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
            };
            DeliveryMethodController.prototype.onSessionUpdated = function (session) {
                if (this.updateSessionOnChange) {
                    this.session = session;
                    this.fulfillmentMethod = session.fulfillmentMethod;
                    this.pickUpWarehouse = session.pickUpWarehouse;
                }
            };
            DeliveryMethodController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.fulfillmentMethod = this.fulfillmentMethod ? this.fulfillmentMethod : session.fulfillmentMethod;
                this.pickUpWarehouse = this.pickUpWarehouse ? this.pickUpWarehouse : session.pickUpWarehouse;
            };
            DeliveryMethodController.prototype.getSessionFailed = function (error) {
            };
            DeliveryMethodController.prototype.changeFulfillmentMethod = function () {
                if (angular.isFunction(this.onChange)) {
                    this.onChange();
                }
                if (this.updateSessionOnChange) {
                    this.updateSession(this.pickUpWarehouse);
                }
            };
            DeliveryMethodController.prototype.updateSession = function (warehouse, onSessionUpdate) {
                var _this = this;
                var currentContext = this.sessionService.getContext();
                currentContext.fulfillmentMethod = this.fulfillmentMethod;
                currentContext.pickUpWarehouseId = warehouse.id;
                this.sessionService.setContext(currentContext);
                this.session.fulfillmentMethod = this.fulfillmentMethod;
                this.session.pickUpWarehouse = warehouse;
                var session = {};
                session.fulfillmentMethod = this.fulfillmentMethod;
                session.pickUpWarehouse = warehouse;
                this.spinnerService.show();
                this.sessionService.updateSession(session).then(function (updatedSession) { _this.updateSessionCompleted(updatedSession, onSessionUpdate); }, function (error) { _this.updateSessionFailed(error); });
            };
            DeliveryMethodController.prototype.updateSessionCompleted = function (session, onSessionUpdate) {
                this.session = session;
                this.$rootScope.$broadcast("fulfillmentMethodChanged");
                if (angular.isFunction(onSessionUpdate)) {
                    onSessionUpdate();
                }
            };
            DeliveryMethodController.prototype.updateSessionFailed = function (error) {
            };
            DeliveryMethodController.prototype.openWarehouseSelectionModal = function () {
                var _this = this;
                this.selectPickUpLocationPopupService.display({
                    session: this.session,
                    updateSessionOnSelect: this.updateSessionOnChange,
                    selectedWarehouse: this.pickUpWarehouse,
                    onSelectWarehouse: function (warehouse, onSessionUpdate) { return _this.updateSession(warehouse, onSessionUpdate); }
                });
            };
            DeliveryMethodController.$inject = ["$scope", "$rootScope", "sessionService", "selectPickUpLocationPopupService", "spinnerService"];
            return DeliveryMethodController;
        }());
        account.DeliveryMethodController = DeliveryMethodController;
        angular
            .module("insite")
            .controller("DeliveryMethodController", DeliveryMethodController)
            .directive("iscDeliveryMethod", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                session: "=",
                fulfillmentMethod: "=",
                pickUpWarehouse: "=",
                prefix: "@",
                onChange: "&",
                updateSessionOnChange: "=",
                showPickUpTitle: "="
            },
            templateUrl: "/PartialViews/Account-DeliveryMethod",
            controller: "DeliveryMethodController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.delivery-method.controller.js.map