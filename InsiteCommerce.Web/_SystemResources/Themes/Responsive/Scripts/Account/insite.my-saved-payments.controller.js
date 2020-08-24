var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var MySavedPaymentsController = /** @class */ (function () {
            function MySavedPaymentsController(coreService, spinnerService, accountService, editSavedPaymentPopupService, addSavedPaymentPopupService) {
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.accountService = accountService;
                this.editSavedPaymentPopupService = editSavedPaymentPopupService;
                this.addSavedPaymentPopupService = addSavedPaymentPopupService;
            }
            MySavedPaymentsController.prototype.$onInit = function () {
                this.getPaymentProfiles();
            };
            MySavedPaymentsController.prototype.getPaymentProfiles = function () {
                var _this = this;
                this.spinnerService.show();
                this.accountService.getPaymentProfiles().then(function (accountPaymentProfileCollection) { _this.getPaymentProfilesCompleted(accountPaymentProfileCollection); }, function (error) { _this.getPaymentProfilesFailed(error); });
            };
            MySavedPaymentsController.prototype.getPaymentProfilesCompleted = function (accountPaymentProfileCollection) {
                this.savedPayments = accountPaymentProfileCollection.accountPaymentProfiles;
            };
            MySavedPaymentsController.prototype.getPaymentProfilesFailed = function (error) {
            };
            MySavedPaymentsController.prototype.makeDefault = function (savedPayment) {
                var _this = this;
                savedPayment.isDefault = true;
                this.accountService.updatePaymentProfile(savedPayment.id, savedPayment).then(function (accountPaymentProfile) { _this.makeDefaultCompleted(accountPaymentProfile); }, function (error) { _this.makeDefaultFailed(error); });
            };
            MySavedPaymentsController.prototype.makeDefaultCompleted = function (accountPaymentProfile) {
                this.getPaymentProfiles();
            };
            MySavedPaymentsController.prototype.makeDefaultFailed = function (error) {
            };
            MySavedPaymentsController.prototype.setSavedPaymentForDelete = function (savedPayment) {
                this.savedPaymentForDelete = savedPayment;
            };
            MySavedPaymentsController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            MySavedPaymentsController.prototype.deleteSavedPayment = function () {
                var _this = this;
                if (!this.savedPaymentForDelete) {
                    return;
                }
                this.closeModal("#popup-delete-card");
                this.spinnerService.show();
                this.accountService.deletePaymentProfiles(this.savedPaymentForDelete.id).then(function () { _this.deletePaymentProfilesCompleted(); }, function (error) { _this.deletePaymentProfilesFailed(error); });
            };
            MySavedPaymentsController.prototype.deletePaymentProfilesCompleted = function () {
                this.getPaymentProfiles();
            };
            MySavedPaymentsController.prototype.deletePaymentProfilesFailed = function (error) {
            };
            MySavedPaymentsController.prototype.openEditPopup = function (savedPayment) {
                var _this = this;
                this.editSavedPaymentPopupService.display({ savedPayment: savedPayment, savedPayments: this.savedPayments, afterSaveFn: function () { _this.getPaymentProfiles(); } });
            };
            MySavedPaymentsController.prototype.openAddPopup = function () {
                var _this = this;
                this.addSavedPaymentPopupService.display({ savedPayments: this.savedPayments, afterSaveFn: function () { _this.getPaymentProfiles(); } });
            };
            MySavedPaymentsController.$inject = ["coreService", "spinnerService", "accountService", "editSavedPaymentPopupService", "addSavedPaymentPopupService"];
            return MySavedPaymentsController;
        }());
        account.MySavedPaymentsController = MySavedPaymentsController;
        angular
            .module("insite")
            .controller("MySavedPaymentsController", MySavedPaymentsController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-saved-payments.controller.js.map