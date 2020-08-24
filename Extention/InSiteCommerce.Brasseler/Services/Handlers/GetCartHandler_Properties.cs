using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Cart;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.Plugins.Helper;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.Localization;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.Services.Handlers
{

    [DependencyName("GetCartHandler_Properties")]
    public class GetCartHandler_Properties : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly ICartOrderProviderFactory cartOrderProviderFactory;
        private readonly ICartPipeline cartPipeline;
        protected CustomSettings customSettings;
        private readonly IEntityTranslationService entityTranslationService;

        public GetCartHandler_Properties(ICartOrderProviderFactory cartOrderProviderFactory, ICartPipeline cartPipeline, IEntityTranslationService entityTranslationService)
        {
            this.cartOrderProviderFactory = cartOrderProviderFactory;
            this.cartPipeline = cartPipeline;
            this.entityTranslationService = entityTranslationService;

        }

        public override int Order
        {
            get
            {
                return 2950;
            }
        }

        public override GetCartResult Execute(IUnitOfWork unitOfWork, GetCartParameter parameter, GetCartResult result)
        {
            customSettings = new CustomSettings();
            bool isCustomerSubscriptionEligibleCheck = false;
            if (SiteContext.Current.UserProfileDto != null)
            {
                var currentCustomer = SiteContext.Current.BillTo;
                var shipViaResult = unitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault(sv => sv.ShipCode == currentCustomer.ShipCode);
                var defaultShipVia = unitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault(sv => sv.IsDefault);
                // ** Start Commented Code For BUSA-796  for ship code issue **//
                //if (shipViaResult != null)
                //{
                //    //var shipViaId = shipViaResult.Id;
                //    //if (defaultShipVia != null)
                //    //{
                //    //    var defaultShipViaId = defaultShipVia.Id;
                //    //    AddOrUpdateProperty(result, "defaultCarrierId", defaultShipViaId.ToString());
                //    //}
                //    //AddOrUpdateProperty(result, "custDefaultCarrierId", shipViaId.ToString());
                //    //AddOrUpdateProperty(result, "custDefaultCarrier", currentCustomer.ShipCode);
                //}
                //else
                //{
                //    AddOrUpdateProperty(result, "custDefaultCarrierId", "none");
                //    AddOrUpdateProperty(result, "custDefaultCarrier", "none");
                //}
                // ** END Commented Code For BUSA-796  for ship code issue **//
                AddOrUpdateProperty(result, "FOBCode", currentCustomer.GetProperty("FOBCode", string.Empty).Trim());
                AddOrUpdateProperty(result, "corpGroupId", string.IsNullOrEmpty(currentCustomer.GetProperty("CorporateGroupId", string.Empty)) ? "none" : currentCustomer.GetProperty("CorporateGroupId", string.Empty));

                //var newuserCustomerNumber = unitOfWork.GetTypedRepository<IApplicationSettingRepository>().GetOrCreateByName("Brasseler_GuestCustomerNumber", "1055357", "Guest customer number to be associated with the new user without a customer account.");
                var newuserCustomerNumber = customSettings.Brasseler_GuestCustomerNumber;

                //var companyNameIdentifier = unitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName<string>("companyNameIdentifier", SiteContext.Current.Website.Id);
                var companyNameIdentifier = customSettings.CompanyNameIdentifier;
                if (!SiteContext.Current.UserProfileDto.IsGuest && currentCustomer.CustomerNumber.EqualsIgnoreCase(companyNameIdentifier + newuserCustomerNumber))
                {
                    AddOrUpdateProperty(result, "GuestCustomerNumber", companyNameIdentifier + newuserCustomerNumber);
                    AddOrUpdateProperty(result, "IsNewUser", "true");
                    foreach (var userproperty in SiteContext.Current.UserProfile.CustomProperties)
                        AddOrUpdateProperty(result, userproperty.Name, userproperty.Value);
                }
                else
                {
                    result.Properties.Remove("IsNewUser");
                    result.Properties = new Dictionary<string, string>();
                }
            }

            if (result.Cart.Status.EqualsIgnoreCase("SubscriptionOrder"))
            {
                //BUSA-463 Subscription Show/Hide Subscription Payment method
                if (!string.IsNullOrEmpty(result.Cart.PlacedByUserName) && !result.Cart.PlacedByUserName.Equals(SiteContext.Current.UserProfileDto.UserName))
                {
                    var subscription = unitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().FirstOrDefault(x => x.CustomerOrderId == result.Cart.Id).PaymentMethod;
                    if (subscription != null)
                    {
                        if (subscription.EqualsIgnoreCase("CK"))
                        {
                            this.AddOrUpdateProperty(result, "MaskedCard", "On Account");
                        }
                        else
                        {
                            Guid paymentProfileId = Guid.Parse(subscription);
                            var MaskedCardNumber = unitOfWork.GetRepository<UserPaymentProfile>().GetTable().FirstOrDefault(x => x.Id == paymentProfileId).MaskedCardNumber;
                            this.AddOrUpdateProperty(result, "MaskedCard", MaskedCardNumber);
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(result.Cart.PlacedByUserName) && result.Cart.PlacedByUserName.Equals(SiteContext.Current.UserProfileDto.UserName))
                {
                    this.AddOrUpdateProperty(result, "MaskedCard", string.Empty);
                }
            }
            //BUSA-463 : Subscription : Commented below code and same is handled in GetCartHandlerBrasselerOverride file.
            //Start : BUSA-695 : Saved orders page should display with updated price if admin updates price list.
            //BUSA - 691: An approver should be able to edit the quantity or remove an item(AwaitingApproval).
            //if (result.Cart.Status == "Saved" || result.Cart.Status == "AwaitingApproval" || result.Cart.Status == "SubscriptionOrder")
            //{
            //    //this.RecalculatePricing(unitOfWork, parameter, result, result.Cart);
            //}
            //End : BUSA-695 : Saved orders page should display with updated price if admin updates price list.

            // Added Default credit cardId if exists

            if (SiteContext.Current.UserProfileDto != null)
            {

                var defaultCreditCard = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(x => x.ParentId == SiteContext.Current.UserProfileDto.Id && x.Name == "defaultCardId");
                // ** Start Code For BUSA-796  for ship code issue **//
                var currentCustomerflow = GetCurrentCustomerFlow(result.Cart);
                //var currentCustomerflow = SiteContext.Current.BillTo;
                var shipViaResult = unitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault(sv => sv.ShipCode == currentCustomerflow.ShipCode);
                var defaultShipVia = unitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault(sv => sv.IsDefault);

                if (shipViaResult != null)
                {
                    var shipViaId = shipViaResult.Id;
                    if (defaultShipVia != null)
                    {
                        var defaultShipViaId = defaultShipVia.Id;
                        if (!result.Properties.ContainsKey("defaultCarrierId"))
                            result.Properties.Add("defaultCarrierId", defaultShipViaId.ToString());
                    }
                    this.AddOrUpdateProperty(result, "custDefaultCarrierId", shipViaId.ToString());
                    //if (!result.Properties.ContainsKey("custDefaultCarrierId"))
                    //{ 
                    //    result.Properties.Add("custDefaultCarrierId", shipViaId.ToString());
                    //}

                    this.AddOrUpdateProperty(result, "custDefaultCarrier", currentCustomerflow.ShipCode);
                    //if (!result.Properties.ContainsKey("custDefaultCarrier"))
                    //    result.Properties.Add("custDefaultCarrier", currentCustomerflow.ShipCode);
                }
                else
                {
                    this.AddOrUpdateProperty(result, "custDefaultCarrierId", "none");
                    //if (!result.Properties.ContainsKey("custDefaultCarrierId"))
                    //{ 
                    //    result.Properties.Add("custDefaultCarrierId", "none");
                    //}

                    //if (!result.Properties.ContainsKey("custDefaultCarrier")) { 
                    //    result.Properties.Add("custDefaultCarrier", "none");
                    //}
                    this.AddOrUpdateProperty(result, "custDefaultCarrier", "none");
                }
                // ** END Code For BUSA-796  for ship code issue **//
                if (defaultCreditCard != null)
                {
                    this.AddOrUpdateProperty(result, "defaultCardId", defaultCreditCard.Value);
                    //if (!result.Properties.ContainsKey("defaultCardId")) {
                    //    result.Properties.Add("defaultCardId", defaultCreditCard.Value);             
                    //}
                }
                //BUSA - 660: To make PO number mandatory for a specific Customer Class start.
                var currentCustomer_po = SiteContext.Current.ShipTo;
                result.Properties.Add("PONumRequired", currentCustomer_po.GetProperty("PORequired", string.Empty) == "1" || currentCustomer_po.GetProperty("PORequired", string.Empty) == "true" ? "true" : "false");
                //BUSA - 660: To make PO number mandatory for a specific Customer Class end.
                //BUSA-717 :To Add Source Code to the Checkout Page
                if (SiteContext.Current.UserProfileDto.Salespersons.Count > 0)
                {
                    var salesSourceCode = SiteContext.Current.UserProfile.Salespersons.FirstOrDefault().GetProperty("SourceCode", " ");
                    result.Properties.Add("salesSourceCode", salesSourceCode);
                }
                // BUSA-463 : Subscription Starts


                // change the flow according to the customer change on Address checkout page.
                HelperUtility helperUtility = new HelperUtility();
                var currentCustomer = helperUtility.GetCurrentCustomerFlow(result.Cart);

                var isSubscriptionEligibleCount = currentCustomer.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsCustomerEligibleSubscription")).Count();

                if (isSubscriptionEligibleCount > 0)
                {
                    var IsCustomerEligibleSubscription = currentCustomer.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsCustomerEligibleSubscription"));
                    if (IsCustomerEligibleSubscription.Value.EqualsIgnoreCase("true"))
                    {
                        isCustomerSubscriptionEligibleCheck = true;
                        //if (!result.Properties.ContainsKey("IsCustomerEligibleSubscription"))
                        //{
                        //    result.Properties.Add("IsCustomerEligibleSubscription", IsCustomerEligibleSubscription.Value);
                        //}
                        this.AddOrUpdateProperty(result, "IsCustomerEligibleSubscription", IsCustomerEligibleSubscription.Value);
                    }
                    else
                    {
                        isCustomerSubscriptionEligibleCheck = false;
                        //if (!result.Properties.ContainsKey("IsCustomerEligibleSubscription"))
                        //{
                        //    result.Properties.Add("IsCustomerEligibleSubscription", "false");
                        //}
                        this.AddOrUpdateProperty(result, "IsCustomerEligibleSubscription", "false");
                    }
                }

                var subscriptionFrequencyOpted = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(x => x.Name.ToUpper() == "SUBSCRIPTIONFREQUENCYOPTED" && x.ParentId == parameter.CartId);
                if (subscriptionFrequencyOpted != null)
                {
                    this.AddOrUpdateProperty(result, "subscriptionFrequencyOpted", subscriptionFrequencyOpted.Value);
                }
                // BUSA-463 : Subscription Ends

                //BUSA-871: Adding shipdate to future ss order
                if (result.Cart.CustomProperties.Where(x => x.Name == "excludeInitialSS" && x.Value == "true").Count() > 0)
                {
                    var nextShipDate = unitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().FirstOrDefault(x => x.CustomerOrderId == parameter.CartId)?.NextDelieveryDate.ToString();
                    if (nextShipDate != null)
                    {
                        this.AddOrUpdateProperty(result, "checkoutNextShipDate", nextShipDate);
                    }
                    this.AddOrUpdateProperty(result, "excludeInitialSS", "true");
                }
                //BUSA-761 SS-Add name for Smart Supply order and force users enter a name while placing order start
                var IsCustomerEligibleSubscriptions = currentCustomer.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsCustomerEligibleSubscription"));
                var subscriptionname = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(x => x.Name.ToUpper() == "SUBSCRIPTIONNAME" && x.ParentId == parameter.CartId);
                if (IsCustomerEligibleSubscriptions != null)
                {
                    if (IsCustomerEligibleSubscriptions.Value.EqualsIgnoreCase("true") && subscriptionname != null)
                    {
                        //if (!result.Properties.ContainsKey("subscriptionName"))
                        //{
                        //    result.Properties.Add("subscriptionName", subscriptionname.Value);
                        //}
                        this.AddOrUpdateProperty(result, "subscriptionName", subscriptionname.Value);
                    }
                }
                //BUSA-761 SS-Add name for Smart Supply order and force users enter a name while placing order end
            }

            //BUSA-636 Pricing 2018 Sort product with volume grp on cart page
            //var useVolumeGroupPricing = unitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName<string>("UseVolumeGroupPricing", SiteContext.Current.Website.Id).ToString();
            var useVolumeGroupPricing = customSettings.UseVolumeGroupPricing;

            bool isSubscriptionOrder = false;

            if (useVolumeGroupPricing.ToUpper() == "TRUE")
            {
                if (result.CartLineResults.Count() > 0)
                {
                    foreach (var cartlineresult in result.CartLineResults)
                    {
                        // BUSA-463 : Subscription.
                        if (cartlineresult.CartLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
                        {
                            var IsSubscriptionOpted = cartlineresult.CartLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).FirstOrDefault().Value;
                            if (isCustomerSubscriptionEligibleCheck && IsSubscriptionOpted.EqualsIgnoreCase("TRUE"))
                            {
                                cartlineresult.CartLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).FirstOrDefault().Value = "true";
                                isSubscriptionOrder = true;
                            }
                            else
                            {
                                cartlineresult.CartLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).FirstOrDefault().Value = "false";
                                isSubscriptionOrder = isSubscriptionOrder ? isSubscriptionOrder : false;
                            }
                        }

                        if (cartlineresult.BreakPrices.Count() > 1 && cartlineresult.CartLine.ConfigurationViewModel.ToUpper().Equals("TRUE"))
                        {
                            var productId = cartlineresult.ProductDto.Id;
                            var product = unitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.Id == productId);
                            // BUSA-683 : Volume Discount Promotion -Issue when user cart qualifies add free product promotion & volume discount group.
                            this.AddOrUpdateProperty(cartlineresult, "GrpDescription", !string.IsNullOrEmpty(product.ModelNumber) ? product.ModelNumber : product.Name);
                            this.AddOrUpdateProperty(cartlineresult, "AltCnv", cartlineresult.ProductDto.Properties.ContainsKey("AltCnv") ? cartlineresult.ProductDto.Properties["AltCnv"] : "1"); // BUSA-804 Changes to Volume Discount
                        }

                        //Hide/show volume grp savings msgs on cart page
                        if (cartlineresult.BreakPrices.Count() > 1)
                        {
                            var productId = cartlineresult.ProductDto.Id;
                            var product = unitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.Id == productId);
                            if (!string.IsNullOrEmpty(product.PriceBasis))
                            {
                                if (!string.IsNullOrEmpty(cartlineresult.CartLine.SmartPart))//BUSA-671 : Unhandled exception processing error while viewing old saved orders.
                                {
                                    if (Decimal.Parse(cartlineresult.CartLine.SmartPart) >= cartlineresult.BreakPrices.Last().BreakQty)
                                    {
                                        this.AddOrUpdateProperty(cartlineresult, "isMaxVolumeDiscount", "true");
                                    }
                                    else if (Decimal.Parse(cartlineresult.CartLine.SmartPart) < cartlineresult.BreakPrices.Last().BreakQty)
                                    {
                                        this.AddOrUpdateProperty(cartlineresult, "isMaxVolumeDiscount", "false");
                                    }
                                }
                                //Hide savings callout msg if promotion is applied on product- BUSA-683
                                else
                                {
                                    this.AddOrUpdateProperty(cartlineresult, "isMaxVolumeDiscount", "true");
                                }
                            }
                            // Below else is for individual product that do not have pricebasis.
                            else if (cartlineresult.BreakPrices.Count() > 1)
                            {
                                if (!string.IsNullOrEmpty(cartlineresult.CartLine.ConfigurationViewModel) && cartlineresult.CartLine.ConfigurationViewModel.ToUpper().Equals("TRUE"))
                                {
                                    if ((cartlineresult.CartLine.QtyOrdered) >= cartlineresult.BreakPrices.Last().BreakQty)
                                    {
                                        this.AddOrUpdateProperty(cartlineresult, "isMaxVolumeDiscount", "true");
                                    }
                                    else if (cartlineresult.CartLine.QtyOrdered < cartlineresult.BreakPrices.Last().BreakQty)
                                    {
                                        this.AddOrUpdateProperty(cartlineresult, "isMaxVolumeDiscount", "false");
                                    }
                                }
                                //Hide savings callout msg if promotion is applied on product- BUSA-683
                                else
                                {
                                    this.AddOrUpdateProperty(cartlineresult, "isMaxVolumeDiscount", "true");
                                }
                            }
                        }
                    }
                }
            }
            if (isSubscriptionOrder)
            {
                var SubscriptionFrequency = from systemList in unitOfWork.GetRepository<SystemList>().GetTable()
                                            join systemListValue in unitOfWork.GetRepository<SystemListValue>().GetTable()
                                            on systemList.Id equals systemListValue.SystemListId
                                            where systemList.Name == "SubscriptionFrequency"
                                            orderby systemListValue.Name ascending
                                            select new { Value = systemListValue.Name, Name = systemListValue.Description };

                this.AddObjectToResultProperties(result, "SubscriptionFrequency", SubscriptionFrequency);
                var CancellationReason = (ICollection<string>)unitOfWork.GetTypedRepository<ISystemListRepository>().GetActiveSystemListValues("CancellationReason").Select<SystemListValue, string>((Func<SystemListValue, string>)(o => this.entityTranslationService.TranslateProperty<SystemListValue>(o, (Expression<Func<SystemListValue, string>>)(p => p.Description)))).ToList<string>();
                this.AddObjectToResultProperties(result, "CancellationReason", CancellationReason);

            }

            //BUSA - 833 : Source Code in Order Ingest
            if (!result.Properties.ContainsKey("OrderSourceCode"))
            {
                string currency = SiteContext.Current.CurrencyDto.Description;
                string site = string.Empty;
                if (currency.EqualsIgnoreCase("united states dollar"))
                {
                    site = "1";
                }
                else
                {
                    site = "3";
                }
                var SourceCodes = unitOfWork.GetRepository<OrderSourceCode>().GetTable().Where(x => x.CO == site).Select(x => new { x.OSCODE, x.OSC000001 }).OrderBy(x => x.OSCODE).ToList();
                var ParsedSourceCodes = JsonConvert.SerializeObject(SourceCodes);
                this.AddOrUpdateProperty(result, "OrderSourceCode", ParsedSourceCodes.ToString());
            }


            this.AddOrUpdateProperty(result, "SiteKey", customSettings.ReCaptcha);

            // BUSA-1319: Limit Qty Per Product
            foreach(var cartLine in result.CartLineResults.ToList())
            {
                var maxProductQty = cartLine.ProductDto?.Properties.Where(x => x.Key.EqualsIgnoreCase("maxProductQty")).Select(s => s.Value).FirstOrDefault();
                if (!string.IsNullOrEmpty(maxProductQty) && Convert.ToInt32(maxProductQty) != 0)
                {
                    if (cartLine.Properties.ContainsKey("maxProductQty"))
                    {
                        cartLine.Properties["maxProductQty"] = maxProductQty;
                    }
                    else
                    {
                        cartLine.Properties.Add("maxProductQty", maxProductQty);
                    }
                }
            }
            // BUSA-1319

            return this.NextHandler.Execute(unitOfWork, parameter, result); //GetCartPunchoutHandler call
        }

        private void AddOrUpdateProperty(GetCartLineResult result, string key, string value)
        {
            if (result.Properties.ContainsKey(key)) { result.Properties[key] = value; } else { result.Properties.Add(key, value); }
        }

        private void AddOrUpdateProperty(GetCartResult result, string key, string value)
        {
            if (result.Properties.ContainsKey(key)) { result.Properties[key] = value; } else { result.Properties.Add(key, value); }
        }

        public Customer GetCurrentCustomerFlow(CustomerOrder customerOrder)
        {
            bool isShipToAddressChange = false;
            if (customerOrder == null)
            {
                return null;
            }

            if (customerOrder != null)
            {
                if (!string.IsNullOrEmpty(customerOrder.BTPostalCode) || !string.IsNullOrEmpty(customerOrder.STPostalCode))
                {
                    if (customerOrder.BTPostalCode.EqualsIgnoreCase(customerOrder.STPostalCode) && string.IsNullOrEmpty(customerOrder.Customer.CustomerSequence))// Check if the flow is Bill To.
                    {
                        isShipToAddressChange = true;
                    }
                    else
                    {
                        isShipToAddressChange = false;
                    }
                }
            }

            var currentCustomer = customerOrder.ShipTo != null && !isShipToAddressChange && !string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence) ? customerOrder.ShipTo : SiteContext.Current.BillTo;

            return currentCustomer;
        }

    }
}