module insite.wishlist {
    "use strict";

    export class CharactersLeftCounterController {
        formElement: any;
        fieldModel: string;
        charactersLeft: number;
        limit: number;

        static $inject = ["$scope"];

        constructor(
            protected $scope: ng.IScope) {
        }

        $onInit(): void {
            this.calculateCharacters();
            this.$scope.$watch(() => this.fieldModel, (newValue) => {
                this.calculateCharacters();
            }, true);
        }

        calculateCharacters(): void {
            if (this.fieldModel || this.fieldModel === "") {
                this.charactersLeft = this.limit - this.fieldModel.length;
            } else if (this.formElement) {
                this.charactersLeft = this.formElement.$error.maxlength ? 0 : this.limit;
            }

            if (this.charactersLeft < 0) {
                this.charactersLeft = 0;
            }
        }
    }

    angular
        .module("insite")
        .controller("CharactersLeftCounterController", CharactersLeftCounterController)
        .directive("iscCharactersLeftCounter", () => ({
            restrict: "E",
            replace: true,
            template: "<span ng-bind='vm.charactersLeft'></span>",
            scope: {
                formElement: "=",
                fieldModel: "=",
                limit: "="
            },
            controller: "CharactersLeftCounterController",
            controllerAs: "vm",
            bindToController: true
        }));
}