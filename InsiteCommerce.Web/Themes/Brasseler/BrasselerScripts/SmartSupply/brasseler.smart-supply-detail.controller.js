//import CartSettingsModel = Insite.Cart.WebApi.V1.ApiModels.CartSettingsModel;
var insite;
(function (insite) {
    var smartsupply;
    (function (smartsupply) {
        "use strict";
        var SmartSupplyDetailController = /** @class */ (function () {
            function SmartSupplyDetailController($scope, $window, cartService, userPaymentProfileService, coreService, queryString, spinnerService, smartSupplyService, sessionService, promotionService, settingsService) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.userPaymentProfileService = userPaymentProfileService;
                this.coreService = coreService;
                this.queryString = queryString;
                this.spinnerService = spinnerService;
                this.smartSupplyService = smartSupplyService;
                this.sessionService = sessionService;
                this.promotionService = promotionService;
                this.settingsService = settingsService;
                this.cart = null;
                this.cartModelBrasseler = null;
                this.ifOtherUser = false;
                this.showInventoryAvailability = false;
                this.requiresRealTimeInventory = false;
                this.init();
            }
            SmartSupplyDetailController.prototype.init = function () {
                this.initEvents();
            };
            SmartSupplyDetailController.prototype.initEvents = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
                this.getSmartSupply();
            };
            SmartSupplyDetailController.prototype.getSmartSupply = function () {
                var _this = this;
                this.spinnerService.show("mainLayout");
                this.cartService.expand = "cartLines,paymentoptions,shipping,tax";
                this.smartSupplyService.expand = "cartLines,paymentoptions,shipping,tax";
                var cartId = this.queryString.get("cartid");
                this.smartSupplyService.getSmartSupplyCart(cartId).then(function (cart) {
                    _this.cart = cart;
                    _this.sessionService.getSession().then(function (x) {
                        if (x.userName != _this.cart.initiatedByUserName) {
                            _this.ifOtherUser = true;
                        }
                    });
                    _this.cartModelBrasseler = cart;
                    _this.paymentMethod = angular.copy(_this.cartModelBrasseler.paymentOptions.paymentMethods);
                    if (_this.cartModelBrasseler.properties["subscriptionFrequency"] != null) {
                        _this.frequencyMap = JSON.parse(_this.cartModelBrasseler.properties["subscriptionFrequency"]);
                    }
                    if (_this.cartModelBrasseler.properties["cancellationReason"] != null) {
                        _this.cancellationReasons = JSON.parse(_this.cartModelBrasseler.properties["cancellationReason"]);
                    }
                    _this.getPromotions(_this.cartModelBrasseler);
                    _this.getPaymentDetails();
                    _this.nextShipDate = new Date(_this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate.toString());
                });
            };
            SmartSupplyDetailController.prototype.getSettingsFailed = function (error) {
            };
            SmartSupplyDetailController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.cartSettings;
                this.showInventoryAvailability = settingsCollection.productSettings.showInventoryAvailability;
                this.requiresRealTimeInventory = settingsCollection.productSettings.realTimeInventory;
            };
            SmartSupplyDetailController.prototype.getPaymentDetails = function () {
                var _this = this;
                this.userPaymentProfileService.getUserPaymentProfiles().success(function (data) {
                    _this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
                    _this.cartModelBrasseler.paymentOptions.paymentMethods.forEach(function (y) {
                        if (y.name == "CC") {
                            var ax = _this.cartModelBrasseler.paymentOptions.paymentMethods.indexOf(y);
                            if (ax != -1) {
                                _this.cartModelBrasseler.paymentOptions.paymentMethods.splice(ax, 1);
                            }
                        }
                    });
                    if (_this.cartModelBrasseler.cartSubscriptionDto.paymentMethod == 'CK') {
                        _this.selectedPayment = 'CK';
                    }
                    else {
                        _this.userPaymentProfileCollection.forEach(function (x) {
                            if (x.id == _this.cartModelBrasseler.cartSubscriptionDto.paymentMethod) {
                                _this.cartModelBrasseler.paymentOptions.paymentMethods.forEach(function (z) {
                                    if (z.name == x.cardIdentifier) {
                                        _this.selectedPayment = x;
                                    }
                                });
                            }
                        });
                    }
                });
            };
            SmartSupplyDetailController.prototype.changePaymentMethod = function () {
                var _this = this;
                var subscriptionPayment;
                if (this.selectedPayment != null) {
                    if (this.selectedPayment != 'CK') {
                        this.userPaymentProfileCollection.forEach(function (x) {
                            if (x.cardIdentifier == _this.selectedPayment) {
                                subscriptionPayment = x.id;
                                _this.selectedPayment = x;
                            }
                        });
                    }
                    else {
                        subscriptionPayment = 'CK';
                    }
                    var cartSubscriptionDTO = {
                        customerOrderId: this.cartModelBrasseler.id,
                        frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                        activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                        deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                        nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                        paymentMethod: subscriptionPayment,
                        parentCustomerOrderId: this.cartModelBrasseler.id,
                        shipNow: false,
                        isModified: true
                    };
                    this.smartSupplyService.postCartSubscriptionDto(cartSubscriptionDTO).then(function (data) {
                        var $popup = angular.element("#changeSavedPopup");
                        _this.coreService.displayModal($popup);
                    });
                    this.canEditPayment = false;
                }
            };
            SmartSupplyDetailController.prototype.updateLine = function (cartLine, refresh, redirectURI) {
                var _this = this;
                if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                    if (this.cart.lineCount == 1) {
                        this.cartService.removeCart(this.cartModelBrasseler).then(function () {
                            _this.spinnerService.show();
                            _this.$window.location.href = redirectURI + "?returnUrl=" + _this.$window.location.href;
                        });
                    }
                    else {
                        this.cartService.removeLine(cartLine).then(function (result) {
                            _this.getPromotions(_this.cartModelBrasseler);
                            _this.getPaymentDetails();
                        });
                        this.spinnerService.show();
                    }
                }
                else {
                    this.cartService.updateLine(cartLine, refresh).then(function (result) {
                        _this.smartSupplyService.getSmartSupplyCart(_this.cart.id).then(function (x) {
                            _this.cartModelBrasseler = x;
                            _this.getPromotions(_this.cartModelBrasseler);
                            _this.getPaymentDetails();
                        });
                    });
                    this.spinnerService.show();
                }
            };
            SmartSupplyDetailController.prototype.quantityKeyPress = function (keyEvent, cartLine) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                    this.spinnerService.show();
                }
            };
            //Cancel SmartSupply Order.
            SmartSupplyDetailController.prototype.cancelSmartSupplyOrder = function (redirectUri) {
                //BUSA-1085 : Cancel SmartSupply
                var $popup = angular.element("#CancellationPopup");
                this.coreService.displayModal($popup);
            };
            SmartSupplyDetailController.prototype.updateCart = function (redirectUri) {
                var _this = this;
                var valid = $("#CancellationSS").validate().form();
                if (!valid) {
                    return;
                }
                $('#Cancel_SmartSupply_Submit').attr('disabled', 'disabled');
                $('#smartSupplyDetailViewCancelSmartSupplyOrderButton').attr('disabled', 'disabled');
                this.cartModelBrasseler.status = 'SubscriptionCancelled';
                if (this.selectedReason == 'Other' || this.selectedReason == 'Autre') {
                    this.cartModelBrasseler.notes = this.selectedReason + ": " + this.othersReason;
                }
                else {
                    this.cartModelBrasseler.notes = this.selectedReason;
                }
                this.cartService.updateCart(this.cartModelBrasseler).then(function (x) {
                    _this.$window.location.href = redirectUri;
                });
            };
            SmartSupplyDetailController.prototype.updateFrequency = function () {
                var _this = this;
                if (this.cartModelBrasseler.cartSubscriptionDto.frequency != null) {
                    var cartSubscriptionDTO = {
                        customerOrderId: this.cartModelBrasseler.id,
                        frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                        activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                        deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                        nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                        paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                        parentCustomerOrderId: this.cartModelBrasseler.id,
                        shipNow: false,
                        isModified: true
                    };
                    this.smartSupplyService.postCartSubscriptionDto(cartSubscriptionDTO).then(function (data) {
                        var $popup = angular.element("#changeSavedPopup");
                        _this.coreService.displayModal($popup);
                    });
                    this.canEditFrequency = false;
                }
            };
            SmartSupplyDetailController.prototype.updateNextDelieveryDate = function () {
                var _this = this;
                if (this.nextShipDate.toString() == "") {
                    this.error = "Next Ship Date Cannot Be Empty.";
                    return;
                }
                var currentDate = new Date();
                var deActivationDate = new Date(this.cartModelBrasseler.cartSubscriptionDto.deActivationDate.toString());
                if (new Date(this.nextShipDate.toString()) <= currentDate) {
                    this.error = "Next Ship Date Cannot Be Less Than Or Equals To Current Date.";
                    return;
                }
                else if (new Date(this.nextShipDate.toString()) > deActivationDate) {
                    this.error = "Next Ship Date Cannot Exceed SmartSupply End Date.";
                    return;
                }
                var cartSubscriptionDTO = {
                    customerOrderId: this.cartModelBrasseler.id,
                    frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                    activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                    deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                    nextDelieveryDate: this.nextShipDate,
                    paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                    parentCustomerOrderId: this.cartModelBrasseler.id,
                    shipNow: false,
                    isModified: true
                };
                this.smartSupplyService.postCartSubscriptionDto(cartSubscriptionDTO).then(function (data) {
                    var $popup = angular.element("#changeSavedPopup");
                    _this.coreService.displayModal($popup);
                });
                this.canEditNextDelieveryDate = false;
                this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate = this.nextShipDate;
                this.error = "";
            };
            //BUSA-761 SS- Add name for Smart Supply order and force users enter a name while placing order start
            SmartSupplyDetailController.prototype.updateSubscriptionName = function (Name) {
                var _this = this;
                if (Name == "") {
                    this.error = "Smart Supply Name Cannot Be Empty.";
                    return;
                }
                this.cartService.updateCart(this.cartModelBrasseler).then(function (data) {
                    var $popup = angular.element("#changeSavedPopup");
                    _this.coreService.displayModal($popup);
                });
                this.canEditSubscriptionName = false;
                this.cartModelBrasseler.properties['subscriptionName'] = Name;
                this.error = "";
            };
            //BUSA - 761 SS- Add name for Smart Supply order and force users enter a name while placing order end
            SmartSupplyDetailController.prototype.removeLine = function (cartLine, redirectURI) {
                var _this = this;
                this.spinnerService.show();
                this.cartService.removeLine(cartLine).then(function (result) {
                    _this.spinnerService.show();
                    _this.smartSupplyService.getSmartSupplyCart(_this.cartModelBrasseler.id).then(function (x) {
                        _this.cart = x;
                        _this.cartModelBrasseler = x;
                        _this.getPromotions(_this.cartModelBrasseler);
                        _this.getPaymentDetails();
                        _this.spinnerService.show();
                        //BUSA - 762 Emails need to be triggered when the user modify the SS order from details page start.
                        _this.cartSubscriptionDto = {
                            customerOrderId: _this.cartModelBrasseler.id,
                            frequency: _this.cartModelBrasseler.cartSubscriptionDto.frequency,
                            activationDate: _this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                            deActivationDate: _this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                            nextDelieveryDate: _this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                            paymentMethod: _this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                            parentCustomerOrderId: _this.cartModelBrasseler.id,
                            shipNow: false,
                            isModified: true
                        };
                        _this.spinnerService.show();
                        _this.smartSupplyService.postCartSubscriptionDto(_this.cartSubscriptionDto);
                        if (_this.cart.lineCount == 0) {
                            _this.cartModelBrasseler.status = 'SubscriptionCancelled';
                            _this.cartService.updateCart(_this.cartModelBrasseler).then(function (x) {
                                _this.spinnerService.show();
                                _this.$window.location.href = redirectURI + "?returnUrl=" + _this.$window.location.href;
                            });
                        }
                        //BUSA -762 Emails need to be triggered when the user modify the SS order from details page end.
                        _this.spinnerService.show();
                    });
                });
            };
            SmartSupplyDetailController.prototype.updateNotes = function () {
                var _this = this;
                this.cartService.updateCart(this.cartModelBrasseler).then(function (data) {
                    var $popup = angular.element("#changeSavedPopup");
                    _this.coreService.displayModal($popup);
                });
                //BUSA - 762 Emails need to be triggered when the user modify the SS order from details page start.
                this.cartSubscriptionDto = {
                    customerOrderId: this.cartModelBrasseler.id,
                    frequency: this.cartModelBrasseler.cartSubscriptionDto.frequency,
                    activationDate: this.cartModelBrasseler.cartSubscriptionDto.activationDate,
                    deActivationDate: this.cartModelBrasseler.cartSubscriptionDto.deActivationDate,
                    nextDelieveryDate: this.cartModelBrasseler.cartSubscriptionDto.nextDelieveryDate,
                    paymentMethod: this.cartModelBrasseler.cartSubscriptionDto.paymentMethod,
                    parentCustomerOrderId: this.cartModelBrasseler.id,
                    shipNow: false,
                    isModified: true
                };
                this.smartSupplyService.postCartSubscriptionDto(this.cartSubscriptionDto);
                //BUSA - 762 Emails need to be triggered when the user modify the SS order from details page end.
            };
            SmartSupplyDetailController.prototype.responseFromUser = function (cart, param) {
                if (param == "yes") {
                    this.shipNow(cart);
                }
                this.coreService.closeModal("#ShipNowConfirmationPopUp");
            };
            SmartSupplyDetailController.prototype.shipNow = function (cart) {
                var _this = this;
                this.spinnerService.show();
                var $popup = angular.element("#ShipNowPopup");
                this.coreService.displayModal($popup);
                this.cartModelBrasseler = cart;
                this.cartModelBrasseler.properties['ShipNow'] = 'true';
                this.cartService.updateCart(this.cartModelBrasseler).then(function (result) {
                    //BUSA-858 : Next Ship Date change on 'Ship Now'
                    _this.$window.location.reload(true);
                });
            };
            //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts
            SmartSupplyDetailController.prototype.getPromotions = function (cart) {
                var _this = this;
                this.promotionService.getCartPromotions(this.cartModelBrasseler.id).then(function (result) {
                    _this.promotions = result.promotions;
                });
            };
            // BUSA-463 : Subscription. Sorting frequency
            SmartSupplyDetailController.prototype.sortFilter = function (input) {
                return parseInt(input.value);
            };
            SmartSupplyDetailController.$inject = [
                "$scope",
                "$window",
                "cartService",
                "userPaymentProfileService",
                "coreService",
                "queryString",
                "spinnerService",
                "smartSupplyService",
                "sessionService",
                "promotionService",
                "settingsService"
            ];
            return SmartSupplyDetailController;
        }());
        smartsupply.SmartSupplyDetailController = SmartSupplyDetailController;
        angular
            .module("insite")
            .controller("SmartSupplyDetailController", SmartSupplyDetailController);
    })(smartsupply = insite.smartsupply || (insite.smartsupply = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.smart-supply-detail.controller.js.map