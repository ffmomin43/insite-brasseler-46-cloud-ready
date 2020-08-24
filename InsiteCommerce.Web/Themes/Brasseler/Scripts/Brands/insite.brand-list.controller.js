var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandListController = /** @class */ (function () {
            function BrandListController(spinnerService, brandService, $window, $interval) {
                this.spinnerService = spinnerService;
                this.brandService = brandService;
                this.$window = $window;
                this.$interval = $interval;
                this.alphabetString = "abcdefghijklmnopqrstuvwxyz";
                this.alphabet = [];
                this.brandLettersMap = {};
                this.pageSize = 500;
                this.brandListWidth = 0;
                this.heightMap = {};
            }
            BrandListController.prototype.$onInit = function () {
                this.getBrandAlphabet();
                this.initWindowResize();
            };
            BrandListController.prototype.initWindowResize = function () {
                var _this = this;
                this.brandListElement = angular.element(".brand-list");
                this.brandListWidth = this.brandListElement.width();
                angular.element(window).resize(function () {
                    _this.$interval.cancel(_this.clearInterval);
                    _this.clearInterval = _this.$interval(function () {
                        _this.brandListWidth = _this.brandListElement.width();
                        _this.heightMap = {};
                    }, 200);
                });
            };
            BrandListController.prototype.calcHeight = function (brandsCount) {
                if (this.heightMap[brandsCount]) {
                    return this.heightMap[brandsCount];
                }
                this.heightMap[brandsCount] = Math.ceil(brandsCount / Math.floor(this.brandListWidth / 235)) * 24;
                return this.heightMap[brandsCount];
            };
            BrandListController.prototype.getBrandAlphabet = function () {
                var _this = this;
                this.spinnerService.show();
                this.brandService.getBrandAlphabet().then(function (brandAlphabet) { _this.getBrandAlphabetCompleted(brandAlphabet); }, function (error) { _this.getBrandAlphabetFailed(error); });
            };
            BrandListController.prototype.getBrandAlphabetCompleted = function (brandAlphabet) {
                this.generateAlphabet(brandAlphabet);
            };
            BrandListController.prototype.getBrandAlphabetFailed = function (error) {
                this.spinnerService.hide();
            };
            BrandListController.prototype.isNumeric = function (input) {
                var num = parseFloat(input);
                return !isNaN(num) && isFinite(num);
            };
            BrandListController.prototype.generateAlphabet = function (brandAlphabet) {
                var numbers = [];
                var fromAlphabetString = [];
                var other = [];
                if (!brandAlphabet || !brandAlphabet.alphabet) {
                    return;
                }
                var alphabetStringMap = {};
                this.alphabetString.split("").forEach(function (o) { return alphabetStringMap[o] = true; });
                for (var i = 0; i < brandAlphabet.alphabet.length; i++) {
                    if (!brandAlphabet.alphabet[i].letter) {
                        continue;
                    }
                    brandAlphabet.alphabet[i].letter = brandAlphabet.alphabet[i].letter.toLowerCase();
                    if (alphabetStringMap[brandAlphabet.alphabet[i].letter]) {
                        delete alphabetStringMap[brandAlphabet.alphabet[i].letter];
                        fromAlphabetString.push(brandAlphabet.alphabet[i]);
                    }
                    else if (this.isNumeric(brandAlphabet.alphabet[i].letter)) {
                        if (numbers.length === 0) {
                            brandAlphabet.alphabet[i].letter = "#";
                            numbers.push(brandAlphabet.alphabet[i]);
                        }
                        else {
                            numbers[0].count += brandAlphabet.alphabet[i].count;
                        }
                    }
                    else {
                        other.push(brandAlphabet.alphabet[i]);
                    }
                    this.brandLettersMap[brandAlphabet.alphabet[i].letter] = [];
                }
                var customSort = function (a, b) { return a.letter.localeCompare(b.letter); };
                for (var key in alphabetStringMap) {
                    if (alphabetStringMap.hasOwnProperty(key)) {
                        fromAlphabetString.push({ letter: key, count: 0 });
                    }
                }
                fromAlphabetString.sort(customSort);
                other.sort(customSort);
                this.alphabet = numbers.concat(fromAlphabetString).concat(other);
                this.getBrands();
            };
            BrandListController.prototype.getBrands = function (page) {
                var _this = this;
                if (page === void 0) { page = 1; }
                var pagination = {
                    page: page,
                    pageSize: this.pageSize
                };
                this.brandService.getBrands({ sort: "name asc", pagination: pagination, select: "detailPagePath,name" }).then(function (brandCollection) { _this.getBrandsCompleted(page, brandCollection); }, function (error) { _this.getBrandsFailed(error); });
            };
            BrandListController.prototype.getBrandsCompleted = function (page, brandCollection) {
                var letter;
                for (var i = 0; i < brandCollection.brands.length; i++) {
                    letter = brandCollection.brands[i].name[0] ? brandCollection.brands[i].name[0].toLowerCase() : "";
                    if (this.isNumeric(letter)) {
                        letter = "#";
                    }
                    if (this.brandLettersMap[letter]) {
                        this.brandLettersMap[letter].push(brandCollection.brands[i]);
                    }
                }
                if (brandCollection.pagination.totalItemCount > page * this.pageSize) {
                    this.getBrands(page + 1);
                }
                else {
                    this.heightMap = {};
                    this.spinnerService.hide();
                    if (this.brandLettersMap.hasOwnProperty("#")) {
                        this.brandLettersMap["#"].sort(function (a, b) { return parseInt(a.name, 10) - parseInt(b.name, 10); });
                    }
                }
            };
            BrandListController.prototype.getBrandsFailed = function (error) {
                this.spinnerService.hide();
            };
            BrandListController.prototype.gotoAnchor = function (selector) {
                if (selector) {
                    this.$window.scrollTo(0, angular.element(selector).offset().top);
                }
                else {
                    this.$window.scrollTo(0, 0);
                }
            };
            BrandListController.$inject = [
                "spinnerService",
                "brandService",
                "$window",
                "$interval"
            ];
            return BrandListController;
        }());
        brands.BrandListController = BrandListController;
        angular
            .module("insite")
            .controller("BrandListController", BrandListController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand-list.controller.js.map