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
    var core;
    (function (core) {
        "use strict";
        var ApiErrorPopupController = /** @class */ (function () {
            function ApiErrorPopupController($scope, coreService, apiErrorPopupService) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.apiErrorPopupService = apiErrorPopupService;
            }
            ApiErrorPopupController.prototype.$onInit = function () {
                var _this = this;
                this.apiErrorPopupService.registerDisplayFunction(function (data) {
                    var $popup = angular.element(".api-error-popup");
                    if ($popup.length > 0) {
                        if (typeof (data) === "string") {
                            _this.errorMessage = data;
                        }
                        else if (data.message && Object.keys(data).length === 1) {
                            _this.errorMessage = data.message;
                        }
                        else {
                            var lines = [];
                            for (var key in data) {
                                if (!data.hasOwnProperty(key)) {
                                    continue;
                                }
                                lines.push("<b>" + key + ":</b> " + data[key]);
                            }
                            _this.errorMessage = lines.join("<br/>");
                        }
                        _this.coreService.displayModal($popup);
                    }
                });
            };
            ApiErrorPopupController.$inject = ["$scope", "coreService", "apiErrorPopupService"];
            return ApiErrorPopupController;
        }());
        core.ApiErrorPopupController = ApiErrorPopupController;
        var ApiErrorPopupService = /** @class */ (function (_super) {
            __extends(ApiErrorPopupService, _super);
            function ApiErrorPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ApiErrorPopupService.prototype.init = function () {
                var _this = this;
                this.$rootScope.$on("displayApiErrorPopup", function (event, data) {
                    _this.display(data);
                });
            };
            ApiErrorPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-api-error-popup></isc-api-error-popup>";
            };
            return ApiErrorPopupService;
        }(base.BasePopupService));
        core.ApiErrorPopupService = ApiErrorPopupService;
        angular
            .module("insite")
            .controller("ApiErrorPopupController", ApiErrorPopupController)
            .service("apiErrorPopupService", ApiErrorPopupService)
            .directive("iscApiErrorPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Core-ApiErrorPopup",
            scope: {},
            controller: "ApiErrorPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.api-error.controller.js.map