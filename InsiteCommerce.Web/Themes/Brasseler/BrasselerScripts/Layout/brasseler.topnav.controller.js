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
    var layout;
    (function (layout) {
        "use strict";
        var BrasselerTopNavController = /** @class */ (function (_super) {
            __extends(BrasselerTopNavController, _super);
            function BrasselerTopNavController($scope, $window, $attrs, sessionService, websiteService, coreService, ipCookie) {
                var _this = _super.call(this, $scope, $window, $attrs, sessionService, websiteService, coreService) || this;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.$attrs = $attrs;
                _this.sessionService = sessionService;
                _this.websiteService = websiteService;
                _this.coreService = coreService;
                _this.ipCookie = ipCookie;
                return _this;
                //this.init();// BUSA-1350: No need to call init() method, increases api call for api/v1/website on Home Page
            }
            BrasselerTopNavController.prototype.setLanguage = function (languageId) {
                var _this = this;
                this.ipCookie("siteHit", true, { path: "/" });
                languageId = languageId ? languageId : this.session.language.id;
                this.sessionService.setLanguage(languageId).then(function (session) { _this.setLanguageCompleted(session); }, function (error) { _this.setLanguageFailed(error); });
            };
            BrasselerTopNavController.prototype.checkCurrentPageForMessages = function () {
                var currentUrl = this.coreService.getCurrentPath();
                if (this.dashboardUrl != null && this.dashboardUrl != "") {
                    var index = currentUrl.indexOf(this.dashboardUrl.toLowerCase());
                    var show = index === -1 || (index + this.dashboardUrl.length !== currentUrl.length);
                    if (!show && this.session.hasRfqUpdates) {
                        this.closeQuoteInformation();
                    }
                }
            };
            BrasselerTopNavController.$inject = ["$scope", "$window", "$attrs", "sessionService", "websiteService", "coreService", "ipCookie",];
            return BrasselerTopNavController;
        }(layout.TopNavController));
        layout.BrasselerTopNavController = BrasselerTopNavController;
        angular
            .module("insite")
            .controller("TopNavController", BrasselerTopNavController);
    })(layout = insite.layout || (insite.layout = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.topnav.controller.js.map