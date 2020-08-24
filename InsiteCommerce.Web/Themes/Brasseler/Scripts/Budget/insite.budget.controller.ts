import CostCodeModel = Insite.Customers.WebApi.V1.ApiModels.CostCodeModel;

module insite.budget {
    "use strict";

    export class BudgetController {
        billTo: BillToModel;
        enforcementLevel: string;
        budgetsFromOnlineOnly = false;

        calendar: BudgetCalendarModel;
        budgetEndPeriods: any;
        errorPeriods: Date[];
        sortDirection = 1;

        currentYear = new Date().getFullYear();
        budgetYears: number[] = [];
        accounts: AccountModel[];
        shipTos: ShipToModel[];

        maintenanceUser = {} as AccountModel;
        maintenanceShipTo = {} as ShipToModel;
        maintenanceBudgetYear: number;
        maintenanceInfo: BudgetModel;

        reviewUser = {} as AccountModel;
        reviewShipTo = {} as ShipToModel;
        reviewBudgetYear: number;
        reviewInfo: BudgetModel;

        selectedBudgetYear: number;

        isReady = false;

        protected periodCount = 13;

        static $inject = ["$scope", "$timeout", "coreService", "budgetService", "budgetCalendarService", "accountService", "customerService", "settingsService", "$q"];

        constructor(
            protected $scope: ng.IScope,
            protected $timeout: ng.ITimeoutService,
            protected coreService: core.ICoreService,
            protected budgetService: budget.IBudgetService,
            protected budgetCalendarService: budget.IBudgetCalendarService,
            protected accountService: account.IAccountService,
            protected customerService: customers.ICustomerService,
            protected settingsService: core.ISettingsService,
            protected $q: ng.IQService) {
        }

        $onInit(): void {
            this.$q.all([
                    this.getBudgetCalendar(),
                    this.getCostCodes(),
                    this.getAccounts(),
                    this.getShipTos(),
                    this.getSettings()
                ]).then(() => { this.initCompleted(); });

            this.fillBudgetYears(this.currentYear, 5);
            this.maintenanceBudgetYear = this.currentYear;
            this.reviewBudgetYear = this.currentYear;
        }

        protected initCompleted(): void {
            this.isReady = true;
            this.$timeout(() => {
                this.budgetCalendarLoaded();
            });
        }

        getBudgetCalendar(): ng.IPromise<void> {
            this.selectedBudgetYear = this.calendar ? this.calendar.fiscalYear : this.currentYear;

            return this.budgetCalendarService.getBudgetCalendar(this.selectedBudgetYear).then(
                (budgetCalendar: BudgetCalendarModel) => { this.getBudgetCalendarCompleted(budgetCalendar); },
                (error: any) => { this.getBudgetCalendarFailed(error); });
        }

        protected getBudgetCalendarCompleted(budgetCalendar: BudgetCalendarModel): void {
            this.calendar = budgetCalendar;
            if (this.isReady) {
                this.budgetCalendarLoaded();
            }
        }

        protected getBudgetCalendarFailed(error: any): void {
        }

        budgetCalendarLoaded(): void {
            angular.element("#FiscalYearEndDate")
                .attr("data-mindate", `1/1/${this.calendar.fiscalYear}`)
                .attr("data-maxdate", `12/31/${this.calendar.fiscalYear + 1}`);

            this.calendarCalculate();
            this.addPeriod();
        }

        getCostCodes(): ng.IPromise<void>  {
            return this.customerService.getBillTo("costcodes").then(
                (billTo: BillToModel) => { this.getBillToCompleted(billTo); },
                (error: any) => { this.getBillToFailed(error); });
        }

        protected getBillToCompleted(billTo: BillToModel): void {
            this.billTo = billTo;
            this.enforcementLevel = billTo.budgetEnforcementLevel;
        }

        protected getBillToFailed(error: any): void {
        }

        getAccounts(): ng.IPromise<void> {
            return this.accountService.getAccounts().then(
                (accountCollection: AccountCollectionModel) => { this.getAccountsCompleted(accountCollection); },
                (error: any) => { this.getAccountsFailed(error); });
        }

        protected getAccountsCompleted(accountCollection: AccountCollectionModel): void {
            this.accounts = accountCollection.accounts;
        }

        protected getAccountsFailed(error: any): void {
        }

        getShipTos(): ng.IPromise<void> {
            return this.customerService.getShipTos().then(
                (shipToCollection: ShipToCollectionModel) => { this.getShipTosCompleted(shipToCollection); },
                (error: any) => { this.getShipTosFailed(error); });
        }

        protected getShipTosCompleted(shipToCollection: ShipToCollectionModel): void {
            this.shipTos = shipToCollection.shipTos;
        }

        protected getShipTosFailed(error: any): void {
        }

        getSettings(): ng.IPromise<void> {
            return this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.budgetsFromOnlineOnly = settingsCollection.customerSettings.budgetsFromOnlineOnly;
        }

        protected getSettingsFailed(error: any): void {
        }

        fillBudgetYears(currentYear: number, years: number): void {
            for (let i = 0; i < years; i++) {
                this.budgetYears.push(currentYear + i);
            }
        }

        updateBudgetCalendar(): void {
            this.calendar.budgetPeriods = this.calendar.budgetPeriods.map((d) => { return d ? new Date(d.toString()) : undefined; });

            this.budgetCalendarService.updateBudgetCalendar(this.calendar).then(
                (budgetCalendar: BudgetCalendarModel) => { this.updateBudgetCalendarCompleted(budgetCalendar); },
                (error: any) => { this.updateBudgetCalendarFailed(error); });
        }

        protected updateBudgetCalendarCompleted(budgetCalendar: BudgetCalendarModel): void {
            this.displaySavedModel();
            this.calendarCalculate();
            this.addPeriod();
        }

        protected updateBudgetCalendarFailed(error: any): void {
        }

        displaySavedModel(): void {
            this.coreService.displayModal(angular.element("#budgets-saved-popup"));
        }

        updateBudgetEnforcementLevel(): void {
            this.customerService.updateEnforcementLevel({ budgetEnforcementLevel: this.billTo.budgetEnforcementLevel, uri: this.billTo.uri} as BillToModel).then(
                (billTo: BillToModel) => { this.updateEnforcementLevelCompleted(billTo); },
                (error: any) => { this.updateEnforcementLevelFailed(error); });
        }

        protected updateEnforcementLevelCompleted(billTo: BillToModel): void {
            this.enforcementLevel = this.billTo.budgetEnforcementLevel;
            this.displaySavedModel();
        }

        protected updateEnforcementLevelFailed(error: any): void {
        }

        addCostCode(): void {
            if (this.canAddCostCodeRow()) {
                this.billTo.costCodes.push({ costCode: "" } as CostCodeModel);
            }
        }

        canAddCostCodeRow(): boolean {
            if (!this.billTo) {
                return false;
            }

            for (let i = 0; i < this.billTo.costCodes.length; i++) {
                if (this.billTo.costCodes[i].costCode.length === 0) {
                    return false;
                }
            }

            return true;
        }

        sortStatusColumn(): void {
            this.sortDirection *= -1;

            this.billTo.costCodes.sort((a, b) => {
                const row1SortValue = a.isActive;
                const row2SortValue = b.isActive;

                if (b.costCode === "" || a.costCode === "") {
                    return 0;
                }

                if (row1SortValue < row2SortValue) {
                    return -1 * this.sortDirection;
                }

                if (row1SortValue > row2SortValue) {
                    return 1 * this.sortDirection;
                }

                return 0;
            });
        }

        updateCostCodes(): void {
            this.customerService.updateBillTo({ costCodeTitle: this.billTo.costCodeTitle, costCodes: this.billTo.costCodes, uri: this.billTo.uri} as BillToModel).then(
                (billTo: BillToModel) => { this.updateBillToCompleted(billTo); },
                (error: any) => { this.updateBillToFailed(error); });
        }

        protected updateBillToCompleted(billTo: BillToModel): void {
            this.displaySavedModel();
        }

        protected updateBillToFailed(error: any): void {
        }

        updatePeriods(): void {
            const tempDates: Date[] = jQuery.map($("input.txt.startdate"), (a) => { return a.value ? new Date(a.value) : undefined; });
            this.calendar.budgetPeriods = [];

            // removes flashing effect & fixing periods markup
            this.$scope.$apply();
            for (let i = 0; i < tempDates.length; i++) {
                if (typeof (tempDates[i]) !== "undefined") {
                    this.calendar.budgetPeriods.push(tempDates[i]);
                }
            }

            this.calendar.fiscalYearEndDate = $("input#FiscalYearEndDate").val();
            this.calendarCalculate();
            this.addPeriod();
            this.$scope.$apply();
        }

        canAddPeriod(): boolean {
            if (this.calendar && this.calendar.budgetPeriods) {
                for (let i = 0; i < this.calendar.budgetPeriods.length; i++) {
                    if (!this.calendar.budgetPeriods[i]) {
                        return false;
                    }
                }

                return this.calendar.budgetPeriods.length < 13;
            }

            return false;
        }

        assignCalendarMonths(): void {
            this.calendar.budgetPeriods = [];
            for (let i = 0; i < 12; i++) {
                this.calendar.budgetPeriods.push(new Date(this.calendar.fiscalYear, i, 1));
            }

            this.calendarCalculate();
            this.addDateTimePicker();
        }

        calendarCalculate(): void {
            this.budgetEndPeriods = this.calendar.budgetPeriods.filter((x) => { return typeof (x) !== "undefined"; });
            for (let i = 0; i < this.budgetEndPeriods.length; i++) {
                if ((i === this.budgetEndPeriods.length - 1)) {
                    this.budgetEndPeriods[i] = this.getYearEnd(this.calendar.fiscalYear, this.calendar.fiscalYearEndDate);
                } else {
                    const t = new Date(this.budgetEndPeriods[i + 1].toString());
                    t.setDate(t.getDate() - 1);
                    this.budgetEndPeriods[i] = t;
                }
            }
        }

        maintenanceViewBudget(): void {
            this.budgetService.getReviews(this.maintenanceUser.id, this.maintenanceShipTo.id, this.maintenanceBudgetYear, false).then(
                (budget: BudgetModel) => { this.getMaintenanceReviewsCompleted(budget); },
                (error: any) => { this.getMaintenanceReviewsFailed(error); });
        }

        protected getMaintenanceReviewsCompleted(budget: BudgetModel): void {
            this.maintenanceInfo = budget;
        }

        protected getMaintenanceReviewsFailed(error: any): void {
            this.maintenanceInfo = null;
        }

        updateBudgets(): void {
            this.budgetService.updateBudget(this.maintenanceInfo).then(
                (budget: BudgetModel) => { this.updateBudgetCompleted(budget); },
                (error: any) => { this.updateBudgetFailed(error); });
        }

        protected updateBudgetCompleted(budget: BudgetModel): void {
            this.displaySavedModel();
            this.maintenanceViewBudget();
        }

        protected updateBudgetFailed(error: any): void {
        }

        switchFilterInput(selectedValue: string, param: string, tab: string): void {
            if (selectedValue) {
                if (param === "user" && tab === "maintenance") {
                    this.maintenanceShipTo = ({} as ShipToModel);
                }

                if (param === "shipTo" && tab === "maintenance") {
                    this.maintenanceUser = ({} as AccountModel);
                }

                if (param === "user" && tab === "review") {
                    this.reviewShipTo = ({} as ShipToModel);
                }

                if (param === "shipTo" && tab === "review") {
                    this.reviewUser = ({} as AccountModel);
                }
            } else {
                if (tab === "maintenance") {
                    this.maintenanceShipTo = ({} as ShipToModel);
                    this.maintenanceUser = ({} as AccountModel);
                }

                if (tab === "review") {
                    this.reviewShipTo = ({} as ShipToModel);
                    this.reviewUser = ({} as AccountModel);
                }
            }
        }

        getEndDate(review): Date {
            if (review) {
                const date = new Date(review.startDate);
                date.setDate(date.getDate() - 1);
                return date;
            }

            return this.getYearEnd(this.maintenanceInfo.fiscalYear, this.maintenanceInfo.fiscalYearEndDate);
        }

        reviewViewBudget(): void {
            this.budgetService.getReviews(this.reviewUser.id, this.reviewShipTo.id, this.reviewBudgetYear, true).then(
                (budget: BudgetModel) => { this.getReviewsCompleted(budget); },
                (error: any) => { this.getReviewsFailed(error); });
        }

        protected getReviewsCompleted(budget: BudgetModel): void {
            this.reviewInfo = budget;
        }

        protected getReviewsFailed(error: any): void {
            this.reviewInfo = null;
        }

        removePeriod(value: number): void {
            this.calendar.budgetPeriods.splice(value, 1);
            this.calendarCalculate();
            this.addPeriod();
        }

        getCalendarPeriodFromDate(index: number): Date {
            let date: Date;
            if (index === 0) {
                date = new Date(this.calendar.fiscalYear - 1, 11, 31);
            } else {
                date = new Date(this.calendar.budgetPeriods[index - 1].toString());
            }

            date.setDate(date.getDate() + 1);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            return date;
        }

        getCalendarPeriodToDate(index: number): Date {
            let date: Date;
            if (index === this.calendar.budgetPeriods.length - 1 || !this.calendar.budgetPeriods[index + 1]) {
                date = this.calendar.fiscalYearEndDate ?
                    new Date(this.calendar.fiscalYearEndDate.toString()) :
                    new Date(this.calendar.fiscalYear + 1, 0, 1);
            } else {
                date = new Date(this.calendar.budgetPeriods[index + 1].toString());
            }

            date.setDate(date.getDate() - 1);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            return date;
        }

        protected addPeriod(): void {
            if (this.canAddPeriod()) {
                this.calendar.budgetPeriods.push(undefined);
            }

            this.addDateTimePicker();
        }

        protected addDateTimePicker(): void {
            this.$timeout(() => {
                this.datepicker(".datepicker", () => { this.updatePeriods(); });
                this.datepickerReset(".startdate, #FiscalYearEndDate");
            }, 0, false);
        }

        protected getYearEnd(fiscalYear: number, fiscalYearEndDate: Date): Date {
            if (!fiscalYearEndDate) {
                const date = new Date(fiscalYear, 11, 31);
                const offset = date.getTimezoneOffset();
                date.setMinutes(date.getMinutes() - offset * (offset < 0 ? 1 : -1));
                return date;
            }

            return fiscalYearEndDate;
        }

        /* date picker code is only used by this controller. others use the directive pick-a-date */
        pickadateMinMax(data: any): any {
            // pickadate allows min/max values of undefined, int (ie. 30 days), or a date which should be passed in according to javascript "new Date()" documentation
            if (typeof data === "undefined") {
                return data;
            }

            return isNaN(data) ? new Date(data) : Number(data);
        }

        datepicker(selector: any, onCloseCallback?: () => void, onSetCallback?: () => void): void {
            if (typeof (selector) === "string") {
                selector = $(selector);
            }

            const that = this;

            selector.each(function() {
                const $this = $(this);

                that.pickadateMinMax($this.attr("data-mindate"));

                ($this as any).pickadate({
                    format: "m/d/yyyy",
                    formatSubmit: "m/d/yyyy",
                    selectYears: true,
                    onOpen() {
                        $this.blur();
                    },
                    onClose() {
                        $this.blur();
                        if (typeof (onCloseCallback) === "function") {
                            onCloseCallback();
                        }
                    },
                    onSet() {
                        if (typeof (onSetCallback) === "function") {
                            onSetCallback();
                        }
                    },
                    min: that.pickadateMinMax($this.attr("data-mindate")),
                    max: that.pickadateMinMax($this.attr("data-maxdate"))
                });
            });
        }

        datepickerReset(selector: any): void {
            if (typeof (selector) === "string") {
                selector = $(selector);
            }

            const that = this;
            selector.each(function() {
                const $this = $(this);
                const picker = ($this as any).pickadate("picker");

                picker.set("min", that.pickadateMinMax($this.attr("data-mindate")));
                picker.set("max", that.pickadateMinMax($this.attr("data-maxdate")));

                if ($this.attr("value")) {
                    picker.set("select", that.pickadateMinMax($this.attr("value")));
                } else {
                    picker.clear();
                }
            });
        }
    }

    angular
        .module("insite")
        .controller("BudgetController", BudgetController);
}