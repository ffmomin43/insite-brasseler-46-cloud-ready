module insite.requisitions {
    "use strict";

    export interface IRequisitionsControllerAttributes extends ng.IAttributes {
        updateItemMessage: string;
        deleteItemMessage: string;
        deleteOrderLineMessage: string;
    }

    export class RequisitionsController {
        requisitionCollection: RequisitionCollectionModel;
        requisition: RequisitionModel;
        pagination: PaginationModel;
        updateItemMessage: string;
        deleteItemMessage: string;
        deleteOrderLineMessage: string;
        message: string;

        private requireQuote = {};
        private approvedRequisitionCollection = {};
        paginationStorageKey = "DefaultPagination-Requisitions";
        showAddToCartConfirmationDialog: boolean;

        static $inject = ["requisitionService", "cartService", "paginationService", "coreService", "$attrs", "spinnerService"];

        constructor(
            protected requisitionService: IRequisitionService,
            protected cartService: cart.ICartService,
            protected paginationService: core.IPaginationService,
            protected coreService: core.ICoreService,
            protected $attrs: IRequisitionsControllerAttributes,
            protected spinnerService: core.ISpinnerService) {
        }

        $onInit(): void {
            this.updateItemMessage = this.$attrs.updateItemMessage;
            this.deleteItemMessage = this.$attrs.deleteItemMessage;
            this.deleteOrderLineMessage = this.$attrs.deleteOrderLineMessage;
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.getRequisitions();
        }

        getRequisitions(): void {
            this.spinnerService.show();
            this.requisitionService.getRequisitions(this.pagination).then(
                (requisitionCollection: RequisitionCollectionModel) => { this.getRequisitionsCompleted(requisitionCollection); },
                (error: any) => { this.getRequisitionsFailed(error); });
        }

        protected getRequisitionsCompleted(requisitionCollection: RequisitionCollectionModel): void {
            this.requisitionCollection = requisitionCollection;
            this.pagination = requisitionCollection.pagination;
            this.requisitionCollection.requisitions.forEach(requisition => {
                if (this.approvedRequisitionCollection[requisition.id]) {
                    requisition.isApproved = true;
                }
            });
            this.spinnerService.hide();
        }

        protected getRequisitionsFailed(error: any): void {
            this.spinnerService.hide();
        }

        openRequisition(requisitionId: System.Guid): void {
            this.message = "";
            this.requisitionService.getRequisition(requisitionId).then(
                (requisition: RequisitionModel) => { this.getRequisitionCompleted(requisition); },
                (error: any) => { this.getRequisitionFailed(error); });
        }

        protected getRequisitionCompleted(requisition: RequisitionModel): void {
            this.requisition = requisition;
            this.displayRequisition();
        }

        protected getRequisitionFailed(error: any): void {
        }

        patchRequisitionLine(requisitionLine: RequisitionLineModel): void {
            this.message = "";
            this.requisitionService.patchRequisitionLine(requisitionLine).then(
                (requisition: RequisitionModel) => { this.patchRequisitionLineCompleted(requisitionLine, requisition); },
                (error: any) => { this.patchRequisitionLineFailed(error); });
        }

        protected patchRequisitionLineCompleted(requisitionLine: RequisitionLineModel, requisition: RequisitionModel): void {
            this.getRequisitions();

            if (requisition === null) {
                this.requisition.requisitionLineCollection = null;
            } else {
                this.requisition = requisition;
            }

            if (requisitionLine.qtyOrdered <= 0) {
                this.message = this.deleteItemMessage;
            } else {
                this.message = this.updateItemMessage;
            }
        }

        protected patchRequisitionLineFailed(error: any): void {
        }

        deleteRequisitionLine(requisitionLine: RequisitionLineModel): void {
            this.message = "";
            this.spinnerService.show();
            this.requisitionService.deleteRequisitionLine(requisitionLine).then(
                (requisition: RequisitionModel) => { this.deleteRequisitionLineCompleted(requisitionLine, requisition); },
                (error: any) => { this.deleteRequisitionLineFailed(error); });
        }

        protected deleteRequisitionLineCompleted(requisitionLine: RequisitionLineModel, requisition: RequisitionModel): void {
            this.spinnerService.show();
            this.getRequisitions();

            this.requisition.requisitionLineCollection.requisitionLines = this.requisition.requisitionLineCollection.requisitionLines.filter(o => o.id !== requisitionLine.id);
            if (this.requisition.requisitionLineCollection.requisitionLines.length === 0) {
                this.message = this.deleteOrderLineMessage;
                return;
            }

            this.requisitionService.getRequisition(this.requisition.id).then(
                (requisition: RequisitionModel) => { this.getRequisitionAfterDeleteCompleted(requisition); },
                (error: any) => { this.getRequisitionAfterDeleteFailed(error); });
        }

        protected getRequisitionAfterDeleteCompleted(requisition: RequisitionModel): void {
            this.requisition = requisition;

            if (this.requisition.requisitionLineCollection.requisitionLines.length === 0) {
                this.message = this.deleteOrderLineMessage;
            } else {
                this.message = this.deleteItemMessage;
            }
        }

        protected getRequisitionAfterDeleteFailed(error: any): void {
        }

        protected deleteRequisitionLineFailed(error: any): void {
        }

        displayRequisition(): void {
            this.coreService.displayModal(angular.element("#popup-requisition"));
        }

        addAllToCart(): void {
            const cartLines: Array<CartLineModel> = [];
            angular.forEach(this.approvedRequisitionCollection, (value: CartLineModel) => {
                cartLines.push(value);
            });

            if (cartLines.length > 0) {
                this.cartService.addLineCollection(cartLines).then(
                    (cartLineCollection: CartLineCollectionModel) => { this.addLineCollectionCompleted(cartLineCollection); },
                    (error: any) => { this.addLineCollectionFailed(error); });
            }
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
            this.getRequisitions();
        }

        protected addLineCollectionFailed(error: any): void {
        }

        convertForPrice(requisition: RequisitionModel): any {
            if (!requisition.quoteRequired) {
                return requisition;
            }

            if (this.requireQuote[requisition.id]) {
                return this.requireQuote[requisition.id];
            }

            const product = {} as ProductDto;
            product.id = (requisition.productId as string);
            product.quoteRequired = requisition.quoteRequired;
            this.requireQuote[requisition.id] = product;

            return product;
        }

        changeApprovedList(requisition: RequisitionModel): void {
            if (requisition.isApproved) {
                this.approvedRequisitionCollection[requisition.id] = requisition;
            } else {
                delete this.approvedRequisitionCollection[requisition.id];
            }
        }
    }

    angular
        .module("insite")
        .controller("RequisitionsController", RequisitionsController);
}