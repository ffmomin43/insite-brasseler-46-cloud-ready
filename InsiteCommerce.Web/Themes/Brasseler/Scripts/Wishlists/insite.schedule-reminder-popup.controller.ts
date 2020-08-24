module insite.wishlist {
    "use strict";
    import WishListModel = Insite.WishLists.WebApi.V1.ApiModels.WishListModel;
    import WishListEmailScheduleModel = Insite.WishLists.WebApi.V1.ApiModels.WishListEmailScheduleModel;

    export class ScheduleReminderPopupController {
        list: WishListModel;
        repeatPeriod: string;
        repeatInterval: number;
        sendDayOfWeek: any;
        sendDayOfMonth: any;
        startDate: string;
        hasEndDate: string;
        endDate: string;
        message: string;
        sendDayOfWeekPossibleValues: any;
        sendDayOfMonthPossibleValues: any;
        completed: boolean;
        cancelingReminder: boolean;
        inProgress: boolean;

        static $inject = ["$rootScope", "$scope", "productService", "spinnerService", "wishListService", "coreService", "scheduleReminderPopupService", "settingsService"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected $scope: ng.IScope,
            protected productService: catalog.IProductService,
            protected spinnerService: core.ISpinnerService,
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService,
            protected scheduleReminderPopupService: IScheduleReminderPopupService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.scheduleReminderPopupService.registerDisplayFunction(this.display.bind(this));

            this.$scope.$watch(() => this.hasEndDate, (newValue) => {
                if (newValue === "false") {
                    this.endDate = "";
                }
            });

            this.$scope.$watch(() => this.endDate, (newValue) => {
                if (newValue === "") {
                    this.hasEndDate = "false";
                } else {
                    this.hasEndDate = "true";
                }
            });

            this.$scope.$watch(() => this.repeatInterval, (newValue) => {
                if (!newValue || newValue <= 0) {
                    this.repeatInterval = 1;
                }

                this.repeatInterval = Math.floor(this.repeatInterval);
            });
        }

        protected display(list: WishListModel): void {
            this.list = list;
            if (this.list.schedule) {
                this.repeatPeriod = this.list.schedule.repeatPeriod;
                this.repeatInterval = this.list.schedule.repeatInterval;
                this.sendDayOfWeek = (this.list.sendDayOfWeekPossibleValues as any).find(o => o.key === this.list.schedule.sendDayOfWeek) || this.list.sendDayOfWeekPossibleValues[0];
                this.sendDayOfMonth = (this.list.sendDayOfMonthPossibleValues as any).find(o => o.key === this.list.schedule.sendDayOfMonth) || this.list.sendDayOfMonthPossibleValues[0];
                this.startDate = this.list.schedule.startDate.toString().split("T")[0];
                if (this.list.schedule.endDate) {
                    this.hasEndDate = "true";
                    this.endDate = this.list.schedule.endDate.toString().split("T")[0];
                } else {
                    this.hasEndDate = "false";
                    this.endDate = "";
                }

                this.message = this.list.schedule.message;
            } else {
                this.setDefaultValues();
            }

            this.completed = false;
            this.cancelingReminder = false;
            this.showModal();
        }

        protected showModal(): void {
            this.coreService.displayModal("#popup-schedule-reminder");

            setTimeout(() => {
                const pickerStart = (angular.element(".start-date-selector") as any).pickadate("picker");
                pickerStart.set("select", this.startDate, { format: "yyyy-mm-dd" });

                if (this.endDate) {
                    const pickerEnd = (angular.element(".end-date-selector") as any).pickadate("picker");
                    pickerEnd.set("select", this.endDate, { format: "yyyy-mm-dd" });
                }
            }, 100);
        }

        closeModal(): void {
            this.coreService.closeModal("#popup-schedule-reminder");
        }

        scheduleReminder(): void {
            this.spinnerService.show();
            this.inProgress = true;

            this.list.schedule = this.list.schedule || {} as WishListEmailScheduleModel;
            this.list.schedule.repeatPeriod = this.repeatPeriod;
            this.list.schedule.repeatInterval = this.repeatInterval;
            if (this.sendDayOfWeek) {
                this.list.schedule.sendDayOfWeek = this.sendDayOfWeek.key;
            }
            if (this.sendDayOfMonth) {
                this.list.schedule.sendDayOfMonth = this.sendDayOfMonth.key;
            }
            this.list.schedule.startDate = this.startDate as any;
            if (this.endDate) {
                this.list.schedule.endDate = this.endDate as any;
            } else {
                this.list.schedule.endDate = null;
            }
            this.list.schedule.message = this.message;

            this.wishListService.updateWishListSchedule(this.list).then(
                (listModel: WishListModel) => { this.updateListCompleted(listModel); },
                (error: any) => { this.updateListFailed(error); });
        }

        protected updateListCompleted(list: WishListModel): void {
            this.spinnerService.hide();
            this.inProgress = false;
            this.completed = true;
            setTimeout(() => {
                this.closeModal();
            }, 2000);
        }

        protected updateListFailed(error: any): void {
            this.spinnerService.hide();
            this.inProgress = false;
            this.closeModal();
        }

        openEndDatePicker($event: ng.IAngularEvent): void {
            $event.stopPropagation();
            $event.preventDefault();

            if (this.endDate === "" && this.hasEndDate === "true") {
                this.hasEndDate = "false";
            }

            const picker = (angular.element(".end-date-selector") as any).pickadate("picker");
            picker.open();
        }

        protected setDefaultValues(): void {
            this.repeatPeriod = "Weekly";
            this.repeatInterval = 1;
            this.sendDayOfWeek = this.list.sendDayOfWeekPossibleValues[0];
            this.sendDayOfMonth = this.list.sendDayOfMonthPossibleValues[0];
            this.startDate = new Date().toUTCString().split("T")[0];
            this.hasEndDate = "false";
            this.endDate = "";
            this.message = "";
        }

        changeSendDayOfWeek(sendDayOfWeek: string): void {
            this.sendDayOfWeek = sendDayOfWeek;
        }

        changeSendDayOfMonth(sendDayOfMonth: number): void {
            this.sendDayOfMonth = sendDayOfMonth;
        }

        showCancelReminder(): void {
            this.cancelingReminder = true;
        }

        hideCancelReminder(): void {
            this.cancelingReminder = false;
        }

        cancelReminder(): void {
            this.spinnerService.show();
            this.inProgress = true;

            this.list.schedule = null;

            this.wishListService.updateWishListSchedule(this.list).then(
                (listModel: WishListModel) => { this.updateListCompleted(listModel); },
                (error: any) => { this.updateListFailed(error); });
        }
    }

    export interface IScheduleReminderPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class ScheduleReminderPopupService extends base.BasePopupService<any> implements IScheduleReminderPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-schedule-reminder-popup></isc-schedule-reminder-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ScheduleReminderPopupController", ScheduleReminderPopupController)
        .service("scheduleReminderPopupService", ScheduleReminderPopupService)
        .directive("iscScheduleReminderPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ScheduleReminderPopup",
            controller: "ScheduleReminderPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}