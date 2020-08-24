module insite.email {
    "use strict";

    export class ShareEntityPopupController {
        shareEntityModel = {} as ShareEntityModel;
        entityId: string;
        entityName: string;
        url: string;
        fileLink: string;
        headerText: string;
        isSuccess: boolean;
        isError: boolean;
        message: string;
        subject: string;
        fileName: string;
        currentUserEmail: string;
        submitButtonText: string;
        extraProperties: {};

        static $inject = ["$scope", "emailService", "sessionService"];

        constructor(
            protected $scope: ng.IScope,
            protected emailService: email.IEmailService,
            protected sessionService: account.ISessionService) {
        }

        $onInit(): void {
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.$scope.$watch("vm.entityId", (entityId) => {
                this.onEntityIdChanged(entityId);
            });

            angular.element(".share-entity-modal").on("closed", () => {
                this.onShareEntityPopupClosed();
            });
        }

        protected onEntityIdChanged(entityId: string): void {
            if (entityId) {
                this.resetPopup();
            }
        }

        protected onShareEntityPopupClosed(): void {
            this.resetPopup();
            this.$scope.$apply();
        }

        protected resetPopup(): void {
            this.shareEntityModel = this.shareEntityModel || {} as ShareEntityModel;
            this.shareEntityModel.emailTo = "";
            this.shareEntityModel.emailFrom = this.currentUserEmail;
            this.shareEntityModel.subject = this.subject;
            this.shareEntityModel.message = this.message;
            this.isSuccess = false;
            this.isError = false;
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.currentUserEmail = this.shareEntityModel.emailFrom = session.email;
        }

        protected getSessionFailed(error: any): void {
        }

        closeModal(): void {
            (angular.element("#shareEntityPopupContainer") as any).foundation("reveal", "close");
        }

        shareEntity(): void {
            const valid = angular.element(".shareEntityForm:visible").validate().form();
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

            this.emailService.shareEntity(this.shareEntityModel, this.url).then(
                (shareEntityModel: ShareEntityModel) => { this.shareEntityCompleted(shareEntityModel); },
                (error: any) => { this.shareEntityFailed(error); }
            );
        }

        protected shareEntityCompleted(shareEntityModel: ShareEntityModel): void {
            this.isSuccess = true;
            this.isError = false;
        }

        protected shareEntityFailed(error: any): void {
            this.isSuccess = false;
            this.isError = true;
        }
    }

    angular
        .module("insite")
        .controller("ShareEntityPopupController", ShareEntityPopupController)
        .directive("iscShareEntityPopup", () => ({
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
        }))
        .directive("iscShareEntityField", () => ({
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
        }));
}