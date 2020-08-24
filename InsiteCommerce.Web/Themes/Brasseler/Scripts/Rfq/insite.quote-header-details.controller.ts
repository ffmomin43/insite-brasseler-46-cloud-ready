module insite.rfq {
    "use strict";

    export class QuoteHeaderDetailsController {
        quote: QuoteModel;
        quoteExpireDays: number;

        static $inject = ["rfqService", "settingsService"];

        constructor(
            protected rfqService: rfq.IRfqService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.quoteExpireDays = settingsCollection.quoteSettings.quoteExpireDays;
        }

        protected getSettingsFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("QuoteHeaderDetailsController", QuoteHeaderDetailsController);
}