module insite.core {
    "use strict";

    export class ApiErrorPopupController {
        errorMessage: string;

        static $inject = ["$scope", "coreService", "apiErrorPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected coreService: ICoreService,
            protected apiErrorPopupService: IApiErrorPopupService) {
        }

        $onInit(): void {
            this.apiErrorPopupService.registerDisplayFunction((data: any) => {
                const $popup = angular.element(".api-error-popup");
                if ($popup.length > 0) {
                    if (typeof (data) === "string") {
                        this.errorMessage = data;
                    }
                    else if (data.message && Object.keys(data).length === 1) {
                        this.errorMessage = data.message;
                    } else {
                        const lines = [];
                        for (let key in data) {
                            if (!data.hasOwnProperty(key)) {
                                continue;
                            }

                            lines.push(`<b>${key}:</b> ${data[key]}`);
                        }

                        this.errorMessage = lines.join("<br/>");
                    }

                    this.coreService.displayModal($popup);
                }
            });
        }
    }

    export interface IApiErrorPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class ApiErrorPopupService extends base.BasePopupService<any> implements IApiErrorPopupService {
        init(): void {
            this.$rootScope.$on("displayApiErrorPopup", (event, data) => {
                this.display(data);
            });
        }

        protected getDirectiveHtml(): string {
            return "<isc-api-error-popup></isc-api-error-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ApiErrorPopupController", ApiErrorPopupController)
        .service("apiErrorPopupService", ApiErrorPopupService)
        .directive("iscApiErrorPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Core-ApiErrorPopup",
            scope: {},
            controller: "ApiErrorPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}