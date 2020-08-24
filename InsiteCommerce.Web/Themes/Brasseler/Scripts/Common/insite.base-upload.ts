module insite.common {
    "use strict";

    export enum UploadError {
        None,
        NotEnough,
        ConfigurableProduct,
        StyledProduct,
        Unavailable,
        InvalidUnit,
        NotFound,
        OutOfStock
    }

    export class BaseUploadController {
        fileName: string = null;
        file: any = null;
        XLSX: any;
        Papa: any;
        firstRowHeading = false;
        badFile = false;
        uploadLimitExceeded = false;
        uploadCancelled = false;
        allowCancel = true;

        errorProducts: any[] = null;
        products: ProductDto[];
        itemsToSearch: any[] = null;
        uploadedItemsCount = 0;

        static $inject = ["$scope", "productService", "coreService", "settingsService"];

        constructor(
            protected $scope: ng.IScope,
            protected productService: catalog.IProductService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            if (typeof(XLSX) === "undefined") {
                $.getScript("/SystemResources/Scripts/Libraries/xlsx/0.8.0/xlsx.full.min.js", () => {
                    this.XLSX = XLSX;
                });
            }
            else {
                this.XLSX = XLSX;
            }
            if (typeof(Papa) === "undefined") {
                $.getScript("/SystemResources/Scripts/Libraries/papaparse/4.1/papaparse.min.js", () => {
                    this.Papa = Papa;
                })
            }
            else {
                this.Papa = Papa;
            }

            angular.element("#hiddenFileUpload").data("_scope", this.$scope);
        }

        onButtonFileUploadClick(): void {
            $("#hiddenFileUpload").val(null).click();
        }

        setFile(arg): void {
            if (arg.files.length > 0) {
                this.file = arg.files[0];
                this.fileName = this.file.name;
                const fileExtension = this.getFileExtension(this.file.name);
                this.badFile = ["xls", "xlsx", "csv"].indexOf(fileExtension) === -1;
                this.uploadLimitExceeded = false;

                setTimeout(() => {
                    this.$scope.$apply();
                });
            }
        }

        uploadFile(): void {
            this.uploadCancelled = false;

            const reader = new FileReader();
            reader.onload = this.onReaderLoad(this.getFileExtension(this.file.name));
            reader.readAsArrayBuffer(this.file);
        }

        protected onReaderLoad(fileExtension: string) {
            return (e: Event) => {
                const data = (e.target as any).result;
                const arr = this.fixData(data);
                try {
                    if (fileExtension === "xls" || fileExtension === "xlsx") {
                        const wb = this.XLSX.read(btoa(arr), {type: "base64"});
                        if (wb) {
                            this.processWb(wb);
                        }
                    } else if (fileExtension === "csv") {
                        this.processCsv(arr);
                    } else {
                        this.badFile = true;
                    }
                } catch (error) {
                    this.badFile = true;
                }

                if (!this.badFile && !this.uploadLimitExceeded) {
                    this.allowCancel = true;
                    this.showUploadingPopup();
                } else {
                    this.$scope.$apply();
                }
            };
        }

        protected processWb(wb): void {
            this.itemsToSearch = [];
            wb.SheetNames.forEach((sheetName) => {
                const opts = {header: 1};
                let roa = this.XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName], opts);
                if (roa.length > 0) {
                    if (this.firstRowHeading) {
                        roa = roa.slice(1, roa.length);
                    }
                    roa = roa.filter(r => r[0] != null && r[0].length > 0);
                    if (this.limitExceeded(roa.length)) {
                        return;
                    }
                    this.itemsToSearch = roa.map(r => ({Name: r[0], Qty: r[1], UM: r[2]}));
                }
            });
            this.batchGetProducts();
        }

        protected processCsv(data: string): void {
            this.itemsToSearch = [];
            const newLineIndex = data.lastIndexOf("\r\n");
            if (newLineIndex + 2 === data.length) {
                data = data.substr(0, newLineIndex);
            }
            const results = Papa.parse(data);
            if (results.errors.length > 0) {
                this.badFile = true;
                return;
            }
            let rows = results.data;
            if (this.firstRowHeading) {
                rows = rows.slice(1, rows.length);
            }
            if (this.limitExceeded(rows.length)) {
                return;
            }
            rows.forEach((s) => {
                if (s[0] == null || s[0].length === 0) {
                    return;
                }
                const objectToAdd: any = {};
                objectToAdd.Name = s[0];
                if (s[1]) {
                    objectToAdd.Qty = s[1];
                }
                if (s[2]) {
                    objectToAdd.UM = s[2];
                }
                this.itemsToSearch.push(objectToAdd);
            });
            this.batchGetProducts();
        }

        protected batchGetProducts(): void {
            this.errorProducts = [];
            this.products = [];

            if (this.itemsToSearch.length === 0) {
                this.badFile = true;
                return;
            }

            const extendedNames = this.itemsToSearch.map(item => item.Name);
            this.productService.batchGet(extendedNames).then(
                (products: ProductDto[]) => {
                    this.batchGetCompleted(products);
                },
                (error: any) => {
                    this.batchGetFailed(error);
                });
        }

        protected batchGetCompleted(products: ProductDto[]): void {
            if (this.uploadCancelled) {
                return;
            }

            this.processProducts(products);

            this.checkCompletion();
        }

        protected batchGetFailed(error: any): void {
        }

        protected processProducts(products: ProductDto[]) {
            for (let i = 0; i < products.length; i++) {
                const item = this.itemsToSearch[i];
                const index = this.firstRowHeading ? i + 2 : i + 1;
                if (products[i] != null) {
                    const product = products[i];
                    const error = this.validateProduct(product);

                    if (error === UploadError.None) {
                        product.qtyOrdered = (!item.Qty || item.Qty === "0") ? 1 : item.Qty;

                        const isErrorProduct = this.setProductUnitOfMeasure(product, item, index);

                        if (!isErrorProduct) {
                            this.addProductToList(product, item, index);
                        }
                    } else {
                        this.errorProducts.push(this.mapProductErrorInfo(index, error, item.Name, product));
                    }
                } else {
                    this.errorProducts.push(this.mapProductErrorInfo(index, UploadError.NotFound, item.Name, <ProductDto>{
                        qtyOrdered: item.Qty,
                        unitOfMeasureDisplay: item.UM
                    }));
                }
            }
        }

        protected checkCompletion(): void {
            if (this.uploadCancelled) {
                return;
            }

            if (this.itemsToSearch.length === this.products.length && this.errorProducts.length === 0) {
                this.uploadProducts();
            } else {
                this.hideUploadingPopup();
                setTimeout(() => {
                    this.showUploadingIssuesPopup();
                }, 250); // Foundation.libs.reveal.settings.animation_speed
            }
        }

        protected validateProduct(product: ProductDto): UploadError {
            if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                return UploadError.ConfigurableProduct;
            }

            if (product.isStyleProductParent) {
                return UploadError.StyledProduct;
            }

            if (product.qtyOnHand === 0 && product.trackInventory && !product.canBackOrder) {
                return UploadError.OutOfStock;
            }

            if (!product.canAddToCart) {
                return UploadError.Unavailable;
            }

            return UploadError.None;
        }

        protected fixData(data): string {
            let o = "";
            let l = 0;
            const w = 10240;

            for (; l < data.byteLength / w; ++l) {
                o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
            }

            o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));

            return o;
        }

        cancelUpload(): void {
            this.uploadCancelled = true;
            this.hideUploadingPopup();
            this.cleanupUploadData();
            this.fileName = null;
            this.file = null;
            this.firstRowHeading = false;
        }

        closeIssuesPopup(): void {
            this.hideUploadingIssuesPopup();
            this.cleanupUploadData();
        }

        protected uploadingCompleted(data: any): void {
            this.hideUploadingPopup();
            this.uploadedItemsCount = this.products.length;

            setTimeout(() => {
                this.showUploadSuccessPopup();
                this.cleanupUploadData();
            }, 250);
        }

        protected uploadingFailed(error: any): void {
        }

        protected getFileExtension(fileName: string): string {
            const splitFileName = fileName.split(".");
            return splitFileName.length > 0 ? splitFileName[splitFileName.length - 1].toLowerCase() : "";
        }

        protected cleanupUploadData(): void {
            this.errorProducts = null;
            this.products = null;
        }

        protected mapProductErrorInfo(index: number, error: UploadError, name: string, product: ProductDto): any {
            return {
                index: index,
                error: UploadError[error],
                name: name,
                qtyRequested: product.qtyOrdered,
                umRequested: product.unitOfMeasureDisplay,
                qtyOnHands: product.qtyOnHand
            };
        }

        protected limitExceeded(rowsCount: number): boolean {
            this.uploadLimitExceeded = rowsCount > 500;
            return this.uploadLimitExceeded;
        }

        protected getProductUnitOfMeasures(product: ProductDto, item: any): ProductUnitOfMeasureDto[] {
            const lowerCaseItemUm = item.UM ? item.UM.toLowerCase() : "";

            return lowerCaseItemUm ? product.productUnitOfMeasures.filter(u => u.unitOfMeasure.toLowerCase() === lowerCaseItemUm
                || u.unitOfMeasureDisplay.toLowerCase() === lowerCaseItemUm
                || u.description.toLowerCase() === lowerCaseItemUm) : [];
        }

        protected setProductUnitOfMeasure(product: ProductDto, item: any, index: any): boolean {
            const uoms = this.getProductUnitOfMeasures(product, item);

            if (uoms.length > 0) {
                const um = uoms[0];
                product.selectedUnitOfMeasure = um.unitOfMeasure;
                product.selectedUnitOfMeasureDisplay = um.unitOfMeasureDisplay;
                product.unitOfMeasure = um.unitOfMeasure;
                product.unitOfMeasureDisplay = um.unitOfMeasureDisplay;

                return false;
            } else if (item.UM) {
                const errorProduct = this.mapProductErrorInfo(index, UploadError.InvalidUnit, item.Name, product);
                errorProduct.umRequested = item.UM;
                this.errorProducts.push(errorProduct);

                return true;
            }

            return false;
        }

        protected getDefaultProductUnitOfMeasureDto(): ProductUnitOfMeasureDto {
            return {
                productUnitOfMeasureId: "",
                unitOfMeasure: "",
                unitOfMeasureDisplay: "",
                description: "",
                qtyPerBaseUnitOfMeasure: 1,
                roundingRule: "",
                isDefault: false,
                availability: null
            };
        }

        protected getBaseUnitOfMeasure(product: ProductDto): ProductUnitOfMeasureDto {
            const defaultUnitOfMeasure = this.getDefaultProductUnitOfMeasureDto();

            let baseUnitOfMeasure = product.productUnitOfMeasures.filter(u => u.isDefault)[0];
            if (!baseUnitOfMeasure) {
                baseUnitOfMeasure = defaultUnitOfMeasure;
            }

            return baseUnitOfMeasure;
        }

        protected getCurrentUnitOfMeasure(product: ProductDto): ProductUnitOfMeasureDto {
            const defaultUnitOfMeasure = this.getDefaultProductUnitOfMeasureDto();

            let currentUnitOfMeasure = product.productUnitOfMeasures.filter(u => u.unitOfMeasure === product.unitOfMeasure)[0];
            if (!currentUnitOfMeasure) {
                currentUnitOfMeasure = defaultUnitOfMeasure;
            }

            return currentUnitOfMeasure;
        }

        protected addProductToList(product: ProductDto, item: any, index: any): void {
            this.products.push(product);
        }

        protected uploadProducts(popupSelector?: string): void {
            if (popupSelector) {
                this.coreService.closeModal(popupSelector);
            }

            this.allowCancel = false;

            setTimeout(() => {
                this.showUploadingPopup();
            }, 250);
        }

        protected showUploadingPopup() {

        }

        protected hideUploadingPopup() {

        }

        protected showUploadSuccessPopup() {

        }

        protected hideUploadSuccessPopup() {

        }

        protected showUploadingIssuesPopup() {

        }

        protected hideUploadingIssuesPopup() {

        }
    }
}