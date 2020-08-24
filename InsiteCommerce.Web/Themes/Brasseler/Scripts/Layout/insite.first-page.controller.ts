module insite.layout {
    "use strict";

    export class FirstPageController {
        static $inject = ["$scope", "$rootScope"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: IAppRootScope) {
        }

        $onInit(): void {
            // properly destroy and remove first page content
            const removeListener = this.$rootScope.$on("$stateChangeStart", () => {
                this.$scope.$destroy();
                angular.element("#firstPageContainer").remove();
                removeListener();
            });
        }
    }

    angular
        .module("insite")
        .controller("FirstPageController", FirstPageController);
}