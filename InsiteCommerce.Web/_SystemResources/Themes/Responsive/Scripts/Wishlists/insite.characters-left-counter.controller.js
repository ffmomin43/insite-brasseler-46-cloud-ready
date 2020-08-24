var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var CharactersLeftCounterController = /** @class */ (function () {
            function CharactersLeftCounterController($scope) {
                this.$scope = $scope;
            }
            CharactersLeftCounterController.prototype.$onInit = function () {
                var _this = this;
                this.calculateCharacters();
                this.$scope.$watch(function () { return _this.fieldModel; }, function (newValue) {
                    _this.calculateCharacters();
                }, true);
            };
            CharactersLeftCounterController.prototype.calculateCharacters = function () {
                if (this.fieldModel || this.fieldModel === "") {
                    this.charactersLeft = this.limit - this.fieldModel.length;
                }
                else if (this.formElement) {
                    this.charactersLeft = this.formElement.$error.maxlength ? 0 : this.limit;
                }
                if (this.charactersLeft < 0) {
                    this.charactersLeft = 0;
                }
            };
            CharactersLeftCounterController.$inject = ["$scope"];
            return CharactersLeftCounterController;
        }());
        wishlist.CharactersLeftCounterController = CharactersLeftCounterController;
        angular
            .module("insite")
            .controller("CharactersLeftCounterController", CharactersLeftCounterController)
            .directive("iscCharactersLeftCounter", function () { return ({
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
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.characters-left-counter.controller.js.map