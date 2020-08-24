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
    var wishlist;
    (function (wishlist) {
        "use strict";
        var ScheduleReminderPopupController = /** @class */ (function () {
            function ScheduleReminderPopupController($rootScope, $scope, productService, spinnerService, wishListService, coreService, scheduleReminderPopupService, settingsService) {
                this.$rootScope = $rootScope;
                this.$scope = $scope;
                this.productService = productService;
                this.spinnerService = spinnerService;
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.scheduleReminderPopupService = scheduleReminderPopupService;
                this.settingsService = settingsService;
            }
            ScheduleReminderPopupController.prototype.$onInit = function () {
                var _this = this;
                this.scheduleReminderPopupService.registerDisplayFunction(this.display.bind(this));
                this.$scope.$watch(function () { return _this.hasEndDate; }, function (newValue) {
                    if (newValue === "false") {
                        _this.endDate = "";
                    }
                });
                this.$scope.$watch(function () { return _this.endDate; }, function (newValue) {
                    if (newValue === "") {
                        _this.hasEndDate = "false";
                    }
                    else {
                        _this.hasEndDate = "true";
                    }
                });
                this.$scope.$watch(function () { return _this.repeatInterval; }, function (newValue) {
                    if (!newValue || newValue <= 0) {
                        _this.repeatInterval = 1;
                    }
                    _this.repeatInterval = Math.floor(_this.repeatInterval);
                });
            };
            ScheduleReminderPopupController.prototype.display = function (list) {
                var _this = this;
                this.list = list;
                if (this.list.schedule) {
                    this.repeatPeriod = this.list.schedule.repeatPeriod;
                    this.repeatInterval = this.list.schedule.repeatInterval;
                    this.sendDayOfWeek = this.list.sendDayOfWeekPossibleValues.find(function (o) { return o.key === _this.list.schedule.sendDayOfWeek; }) || this.list.sendDayOfWeekPossibleValues[0];
                    this.sendDayOfMonth = this.list.sendDayOfMonthPossibleValues.find(function (o) { return o.key === _this.list.schedule.sendDayOfMonth; }) || this.list.sendDayOfMonthPossibleValues[0];
                    this.startDate = this.list.schedule.startDate.toString().split("T")[0];
                    if (this.list.schedule.endDate) {
                        this.hasEndDate = "true";
                        this.endDate = this.list.schedule.endDate.toString().split("T")[0];
                    }
                    else {
                        this.hasEndDate = "false";
                        this.endDate = "";
                    }
                    this.message = this.list.schedule.message;
                }
                else {
                    this.setDefaultValues();
                }
                this.completed = false;
                this.cancelingReminder = false;
                this.showModal();
            };
            ScheduleReminderPopupController.prototype.showModal = function () {
                var _this = this;
                this.coreService.displayModal("#popup-schedule-reminder");
                setTimeout(function () {
                    var pickerStart = angular.element(".start-date-selector").pickadate("picker");
                    pickerStart.set("select", _this.startDate, { format: "yyyy-mm-dd" });
                    if (_this.endDate) {
                        var pickerEnd = angular.element(".end-date-selector").pickadate("picker");
                        pickerEnd.set("select", _this.endDate, { format: "yyyy-mm-dd" });
                    }
                }, 100);
            };
            ScheduleReminderPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-schedule-reminder");
            };
            ScheduleReminderPopupController.prototype.scheduleReminder = function () {
                var _this = this;
                this.spinnerService.show();
                this.inProgress = true;
                this.list.schedule = this.list.schedule || {};
                this.list.schedule.repeatPeriod = this.repeatPeriod;
                this.list.schedule.repeatInterval = this.repeatInterval;
                if (this.sendDayOfWeek) {
                    this.list.schedule.sendDayOfWeek = this.sendDayOfWeek.key;
                }
                if (this.sendDayOfMonth) {
                    this.list.schedule.sendDayOfMonth = this.sendDayOfMonth.key;
                }
                this.list.schedule.startDate = this.startDate;
                if (this.endDate) {
                    this.list.schedule.endDate = this.endDate;
                }
                else {
                    this.list.schedule.endDate = null;
                }
                this.list.schedule.message = this.message;
                this.wishListService.updateWishListSchedule(this.list).then(function (listModel) { _this.updateListCompleted(listModel); }, function (error) { _this.updateListFailed(error); });
            };
            ScheduleReminderPopupController.prototype.updateListCompleted = function (list) {
                var _this = this;
                this.spinnerService.hide();
                this.inProgress = false;
                this.completed = true;
                setTimeout(function () {
                    _this.closeModal();
                }, 2000);
            };
            ScheduleReminderPopupController.prototype.updateListFailed = function (error) {
                this.spinnerService.hide();
                this.inProgress = false;
                this.closeModal();
            };
            ScheduleReminderPopupController.prototype.openEndDatePicker = function ($event) {
                $event.stopPropagation();
                $event.preventDefault();
                if (this.endDate === "" && this.hasEndDate === "true") {
                    this.hasEndDate = "false";
                }
                var picker = angular.element(".end-date-selector").pickadate("picker");
                picker.open();
            };
            ScheduleReminderPopupController.prototype.setDefaultValues = function () {
                this.repeatPeriod = "Weekly";
                this.repeatInterval = 1;
                this.sendDayOfWeek = this.list.sendDayOfWeekPossibleValues[0];
                this.sendDayOfMonth = this.list.sendDayOfMonthPossibleValues[0];
                this.startDate = new Date().toUTCString().split("T")[0];
                this.hasEndDate = "false";
                this.endDate = "";
                this.message = "";
            };
            ScheduleReminderPopupController.prototype.changeSendDayOfWeek = function (sendDayOfWeek) {
                this.sendDayOfWeek = sendDayOfWeek;
            };
            ScheduleReminderPopupController.prototype.changeSendDayOfMonth = function (sendDayOfMonth) {
                this.sendDayOfMonth = sendDayOfMonth;
            };
            ScheduleReminderPopupController.prototype.showCancelReminder = function () {
                this.cancelingReminder = true;
            };
            ScheduleReminderPopupController.prototype.hideCancelReminder = function () {
                this.cancelingReminder = false;
            };
            ScheduleReminderPopupController.prototype.cancelReminder = function () {
                var _this = this;
                this.spinnerService.show();
                this.inProgress = true;
                this.list.schedule = null;
                this.wishListService.updateWishListSchedule(this.list).then(function (listModel) { _this.updateListCompleted(listModel); }, function (error) { _this.updateListFailed(error); });
            };
            ScheduleReminderPopupController.$inject = ["$rootScope", "$scope", "productService", "spinnerService", "wishListService", "coreService", "scheduleReminderPopupService", "settingsService"];
            return ScheduleReminderPopupController;
        }());
        wishlist.ScheduleReminderPopupController = ScheduleReminderPopupController;
        var ScheduleReminderPopupService = /** @class */ (function (_super) {
            __extends(ScheduleReminderPopupService, _super);
            function ScheduleReminderPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ScheduleReminderPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-schedule-reminder-popup></isc-schedule-reminder-popup>";
            };
            return ScheduleReminderPopupService;
        }(base.BasePopupService));
        wishlist.ScheduleReminderPopupService = ScheduleReminderPopupService;
        angular
            .module("insite")
            .controller("ScheduleReminderPopupController", ScheduleReminderPopupController)
            .service("scheduleReminderPopupService", ScheduleReminderPopupService)
            .directive("iscScheduleReminderPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ScheduleReminderPopup",
            controller: "ScheduleReminderPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.schedule-reminder-popup.controller.js.map