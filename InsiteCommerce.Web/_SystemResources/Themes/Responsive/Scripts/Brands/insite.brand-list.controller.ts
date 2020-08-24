module insite.brands {
    "use strict";

    import BrandAlphabetModel = Insite.Brands.WebApi.V1.ApiModels.BrandAlphabetModel;
    import BrandAlphabetLetterModel = Insite.Brands.WebApi.V1.ApiModels.BrandAlphabetLetterModel;
    import BrandCollectionModel = Insite.Brands.WebApi.V1.ApiModels.BrandCollectionModel;
    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;

    export class BrandListController {
        alphabetString: string = "abcdefghijklmnopqrstuvwxyz";
        alphabet: BrandAlphabetLetterModel[] = [];
        brandLettersMap: { [key: string]: BrandModel[] } = {};
        pageSize: number = 500;
        brandListElement: ng.IAugmentedJQuery;
        brandListWidth: number = 0;
        heightMap: { [count: number]: number } = {};
        clearInterval: ng.IPromise<any>;

        static $inject = [
            "spinnerService",
            "brandService",
            "$window",
            "$interval"
        ];

        constructor(
            protected spinnerService: core.ISpinnerService,
            protected brandService: IBrandService,
            protected $window: ng.IWindowService,
            protected $interval: ng.IIntervalService) {
        }

        $onInit(): void {
            this.getBrandAlphabet();
            this.initWindowResize();
        }

        initWindowResize(): void {
            this.brandListElement = angular.element(".brand-list");
            this.brandListWidth = this.brandListElement.width();
            angular.element(window).resize(() => {
                this.$interval.cancel(this.clearInterval);
                this.clearInterval = this.$interval(() => {
                    this.brandListWidth = this.brandListElement.width();
                    this.heightMap = {};
                }, 200);
            });
        }

        calcHeight(brandsCount: number): number {
            if (this.heightMap[brandsCount]) {
                return this.heightMap[brandsCount];
            }
            this.heightMap[brandsCount] = Math.ceil(brandsCount / Math.floor(this.brandListWidth / 235)) * 24;
            return this.heightMap[brandsCount];
        }

        getBrandAlphabet(): void {
            this.spinnerService.show();
            this.brandService.getBrandAlphabet().then(
                (brandAlphabet: BrandAlphabetModel) => { this.getBrandAlphabetCompleted(brandAlphabet); },
                (error: any) => { this.getBrandAlphabetFailed(error); });
        }

        protected getBrandAlphabetCompleted(brandAlphabet: BrandAlphabetModel): void {
            this.generateAlphabet(brandAlphabet);
        }

        protected getBrandAlphabetFailed(error: any): void {
            this.spinnerService.hide();
        }

        isNumeric(input: string): boolean {
            const num = parseFloat(input);
            return !isNaN(num) && isFinite(num);
        }

        generateAlphabet(brandAlphabet: BrandAlphabetModel): void {
            let numbers: BrandAlphabetLetterModel[] = [];
            let fromAlphabetString: BrandAlphabetLetterModel[] = [];
            let other: BrandAlphabetLetterModel[] = [];

            if (!brandAlphabet || !brandAlphabet.alphabet) {
                return;
            }

            const alphabetStringMap: { [key: string]: boolean } = {};
            this.alphabetString.split("").forEach(o => alphabetStringMap[o] = true);

            for (let i = 0; i < brandAlphabet.alphabet.length; i++) {
                if (!brandAlphabet.alphabet[i].letter) {
                    continue;
                }

                brandAlphabet.alphabet[i].letter = brandAlphabet.alphabet[i].letter.toLowerCase();
                if (alphabetStringMap[brandAlphabet.alphabet[i].letter]) {
                    delete alphabetStringMap[brandAlphabet.alphabet[i].letter];
                    fromAlphabetString.push(brandAlphabet.alphabet[i]);
                } else if (this.isNumeric(brandAlphabet.alphabet[i].letter)) {
                    if (numbers.length === 0) {
                        brandAlphabet.alphabet[i].letter = "#";
                        numbers.push(brandAlphabet.alphabet[i]);
                    } else {
                        numbers[0].count += brandAlphabet.alphabet[i].count;
                    }
                } else {
                    other.push(brandAlphabet.alphabet[i]);
                }

                this.brandLettersMap[brandAlphabet.alphabet[i].letter] = [];
            }

            const customSort = (a: BrandAlphabetLetterModel, b: BrandAlphabetLetterModel) => a.letter.localeCompare(b.letter);

            for (let key in alphabetStringMap) {
                if (alphabetStringMap.hasOwnProperty(key)) {
                    fromAlphabetString.push({ letter: key, count: 0 });
                }
            }
            fromAlphabetString.sort(customSort);
            other.sort(customSort);

            this.alphabet = numbers.concat(fromAlphabetString).concat(other);
            this.getBrands();
        }

        getBrands(page: number = 1): void {
            const pagination = {
                page: page,
                pageSize: this.pageSize
            } as PaginationModel;

            this.brandService.getBrands({ sort: "name asc", pagination: pagination, select: "detailPagePath,name" }).then(
                (brandCollection: BrandCollectionModel) => { this.getBrandsCompleted(page, brandCollection); },
                (error: any) => { this.getBrandsFailed(error); });
        }

        protected getBrandsCompleted(page: number, brandCollection: BrandCollectionModel): void {
            let letter: string;
            for (let i = 0; i < brandCollection.brands.length; i++) {
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
            } else {
                this.heightMap = {};
                this.spinnerService.hide();
                if (this.brandLettersMap.hasOwnProperty("#")) {
                    this.brandLettersMap["#"].sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));
                }
            }
        }

        protected getBrandsFailed(error: any): void {
            this.spinnerService.hide();
        }

        gotoAnchor(selector: string): void {
            if (selector) {
                this.$window.scrollTo(0, angular.element(selector).offset().top);
            } else {
                this.$window.scrollTo(0, 0);
            }
        }
    }

    angular
        .module("insite")
        .controller("BrandListController", BrandListController);
}