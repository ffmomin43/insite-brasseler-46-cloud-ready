using Insite.Cart.Services.Pipelines;
using Insite.Common.Helpers;
using Insite.Common.Logging;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Utilities;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Core.SystemSetting.Groups.SiteConfigurations;
using Insite.Data.Entities;
using Insite.Plugins.EntityUtilities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.EntityUtilities
{
    public class CustomerOrderUtilities_Brasseler : CustomerOrderUtilities
    {
        private bool isShipToAddressChange;
        private string defaultCarrierId = "none";
        private string custDefaultCarrierId = "none";
        private string custDefaultCarrier = "none";
        private string FOBCode = "none";
        private string corpGroupId = "none";
        private List<Tuple<string, int>> _corporateGroupThresholds = new List<Tuple<string, int>>();

        public CustomerOrderUtilities_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, Lazy<IPromotionAmountProvider> promotionAmountProvider, Lazy<IOrderLineUtilities> orderLineUtilities, Lazy<IProductUtilities> productUtilities, TaxesSettings taxesSettings, GiftCardsSettings giftCardsSettings, IPricingPipeline pricingPipeline, ICartPipeline cartPipeline) : base(unitOfWorkFactory, promotionAmountProvider, orderLineUtilities, productUtilities, taxesSettings, giftCardsSettings, pricingPipeline, cartPipeline) {}
        
        public override decimal GetShippingAndHandling(CustomerOrder customerOrder)
        {


            // BUSA-475 : Shipping Terms Starts
            // Added condition to take updated ship to account from address check out page. Also if the bill to account postal address is similar to ship to account postal address and customer sequence is empty, then bill to takes the precedence for the condition mentioned in line # 179.
            if (customerOrder != null)
            {
                if (!string.IsNullOrEmpty(customerOrder.BTPostalCode) || !string.IsNullOrEmpty(customerOrder.STPostalCode))
                {
                    //BUSA-730 : Tax & Shipping were getting calculated wrong
                    if (customerOrder.Status.EqualsIgnoreCase("AwaitingApproval"))
                    {
                        isShipToAddressChange = false;
                    } //BUSA-730 : Tax & Shipping were getting calculated wrong
                    else if (customerOrder.BTPostalCode.EqualsIgnoreCase(customerOrder.STPostalCode) && string.IsNullOrEmpty(customerOrder.Customer.CustomerSequence))
                    {
                        isShipToAddressChange = true;
                    }
                    else
                    {
                        isShipToAddressChange = false;
                    }
                }
            }

            CustomSettings customSettings = new CustomSettings();

            if (SiteContext.Current.UserProfile != null)
            {

                var corpGroupThresholdSetting = customSettings.CorporateGroupThresholds;

                if (!string.IsNullOrEmpty(corpGroupThresholdSetting))
                {
                    var thresholdList = corpGroupThresholdSetting.Split(';').ToList();
                    _corporateGroupThresholds.AddRange(from groupThreshold in thresholdList select groupThreshold.Split(',').ToList() into values let groupName = values[0] let item2 = values[1] let thresholdValue = !string.IsNullOrEmpty(item2) ? int.Parse(item2) : 0 select Tuple.Create(groupName, thresholdValue));
                }
                else
                {
                    LogHelper.For(this).Error(string.Format("Application Setting CorporateGroupThresholds is Empty, Please assign value."));
                }

                // BUSA-475 : Shipping Terms Starts
                // Commented to add additional condition if ship to is not null then take fob code of ship to rather than bill to.
                //var currentCustomer = SiteContext.Current.BillTo;

                var currentCustomer = customerOrder.ShipTo != null && !isShipToAddressChange ? customerOrder.ShipTo : SiteContext.Current.BillTo;

                // BUSA-475 : Shipping Terms Ends

                var shipViaResult = UnitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault(sv => sv.ShipCode == currentCustomer.ShipCode);
                var defaultShipVia = UnitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault(sv => sv.IsDefault);
                if (shipViaResult != null)
                {
                    var shipViaId = shipViaResult.Id;
                    if (defaultShipVia != null)
                    {
                        var defaultShipViaId = defaultShipVia.Id;
                        defaultCarrierId = defaultShipViaId.ToString();
                    }
                    custDefaultCarrierId = shipViaId.ToString();
                    custDefaultCarrier = currentCustomer.ShipCode;
                }
                else
                {
                    custDefaultCarrierId = "none";
                    custDefaultCarrier = "none";
                }
                var subTotal = GetOrderSubTotal(customerOrder);
                FOBCode = string.IsNullOrEmpty(currentCustomer.GetProperty("FOBCode", string.Empty).Trim()) ? "none"
                    : currentCustomer.GetProperty("FOBCode", string.Empty).Trim();
                corpGroupId = string.IsNullOrEmpty(currentCustomer.GetProperty("CorporateGroupId", string.Empty))
                    ? "none"
                    : currentCustomer.GetProperty("CorporateGroupId", string.Empty);

                var selectedShipVia = "";
                if (customerOrder.ShipVia != null)
                {
                    selectedShipVia = customerOrder.ShipViaId.ToString();
                }
                var defaultSelected = selectedShipVia == defaultCarrierId ||
                                        selectedShipVia == custDefaultCarrierId;

                if (FOBCode == "02" && defaultSelected)
                {
                    customerOrder.ShippingCharges = 0;
                    RemoveAppliedPromotion(customerOrder);//BUSA-486 : FobCode interpretation on ShippingChargeAmount
                }
                else if (subTotal > 0 && FOBCode != string.Empty)
                {
                    if (corpGroupId != "none")
                    {
                        var firstOrDefault = _corporateGroupThresholds.FirstOrDefault(cg => cg.Item1.Equals(corpGroupId));
                        if (firstOrDefault != null)
                        {
                            var corpGroupThreshold = firstOrDefault.Item2;
                            if (subTotal >= (corpGroupThreshold) && defaultSelected)
                            {
                                customerOrder.ShippingCharges = 0;
                            }
                        }
                    }
                }
                else if (subTotal == 0 && defaultSelected)
                {
                    // BUSA-800: Shipping set to '0' if order total is '0' and with default carrier.
                    //   customerOrder.Shipping = 0;
                }
            }

            return customerOrder.ShippingCharges + customerOrder.HandlingCharges;
        }

        // Temporary Fix to remove shipping promotion if FOB Code = 02 Starts
        private void RemoveAppliedPromotion(CustomerOrder customerOrder)
        {
            if (customerOrder.CustomerOrderPromotions != null && customerOrder.CustomerOrderPromotions.Count > 0)
            {
                foreach (var promo in customerOrder.CustomerOrderPromotions)
                {
                    if (promo.Promotion.PromotionResults.FirstOrDefault().PromotionResultType.ToUpper().Equals("AMOUNTOFFSHIPPING"))
                    {
                        customerOrder.CustomerOrderPromotions.Remove(promo);
                        customerOrder.RecalculatePromotions = true;
                        this.UnitOfWork.GetRepository<CustomerOrderPromotion>().Delete(promo);
                        break;
                    }
                }
            }
        }

        public override Decimal GetOrderSubTotalWithOutProductDiscounts(CustomerOrder customerOrder)
        {
            return NumberHelper.RoundCurrency(this.GetOrderLinesForSubTotal(customerOrder, true, true, true).Sum<OrderLine>((Func<OrderLine, Decimal>)(o => this.OrderLineUtilities.Value.GetTotalListPrice(o))));
        }
    }
}
