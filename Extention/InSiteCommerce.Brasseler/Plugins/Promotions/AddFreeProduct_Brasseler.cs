using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Plugins.Pipelines.Inventory;
using Insite.Core.Plugins.Pipelines.Inventory.Parameters;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Inventory;
using Insite.Core.Plugins.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Utilities;
using Insite.Core.SystemSetting.Groups.Catalog;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.Services.Handlers;
using System;
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    [DependencyName("AddFreeProduct")]
    public class AddFreeProduct_Brasseler : PromotionResultServiceBase
    {        
        protected readonly ICustomerOrderUtilities CustomerOrderUtilities;        
        protected readonly IUnitOfWork UnitOfWork;
        private IPricingPipeline pricingPipeline;
        protected readonly ICartPipeline CartPipeline;
        protected readonly IOrderLineUtilities OrderLineUtilities;
        protected readonly InventorySettings InventorySettings;
        protected readonly Lazy<IInventoryPipeline> InventoryPipeline;
        protected readonly IProductUtilities ProductUtilities;

        public AddFreeProduct_Brasseler(ICartPipeline cartPipeline, IOrderLineUtilities orderLineUtilities,IPricingServiceFactory pricingServiceFactory, ICustomerOrderUtilities customerOrderUtilities, IUnitOfWorkFactory unitOfWorkFactory, IPricingPipeline PricingPipeline, IPromotionAmountProvider promotionProvider, InventorySettings inventorySettings, Lazy<IInventoryPipeline> inventoryPipeline, IProductUtilities productUtilities)
          : base(PricingPipeline,promotionProvider)
        {
            this.CustomerOrderUtilities = customerOrderUtilities;                      
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.pricingPipeline = PricingPipeline;
            this.ProductUtilities = productUtilities;
            this.CartPipeline = cartPipeline;
            this.OrderLineUtilities = orderLineUtilities;
            this.InventorySettings = inventorySettings;
            this.InventoryPipeline = inventoryPipeline;
        }

        public override string DisplayName
        {
            get
            {
                return "Add Free Product";
            }
        }

        public override Dictionary<string, PromotionResultParameter> ParameterDescriptions
        {
            get
            {
                Dictionary<string, PromotionResultParameter> dictionary = new Dictionary<string, PromotionResultParameter>();
                string key1 = "Amount";
                dictionary.Add(key1, new PromotionResultParameter()
                {
                    Label = "Quantity Ordered",
                    ValueType = "number"
                });
                string key2 = "ProductId";
                dictionary.Add(key2, new PromotionResultParameter()
                {
                    Label = "Product",
                    LookupObject = "Product"
                });
                return dictionary;
            }
        }

        //public override Decimal ProductDiscount(CustomerOrder customerOrder)
        //{
        //    return Decimal.Zero;
        //}

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            //BUSA- 463 Subscrition- Not include promotional product in subscrition order
            if (!customerOrder.Status.EqualsIgnoreCase("Saved") && !customerOrder.Status.EqualsIgnoreCase("SubscriptionOrder") && !customerOrder.Status.EqualsIgnoreCase("Return Requested"))
            {
                if (!this.PromotionResult.Amount.HasValue)
                    throw new ArgumentNullException("Amount");
                if (this.PromotionResult.Amount.Value <= Decimal.Zero)
                    throw new ArgumentOutOfRangeException("Amount");
                if (this.PromotionResult.Product == null)
                    throw new ArgumentNullException("Product");
                if (this.PromotionResult.Product.TrackInventory && (!this.InventorySettings.AllowBackOrder || this.PromotionResult.Product.IsDiscontinued))
                {
                    ProductInventory inventory = this.InventoryPipeline.Value.GetQtyOnHand(new GetQtyOnHandParameter(true)
                    {
                        GetInventoryParameter = new GetInventoryParameter()
                        {
                            ProductIds = new List<Guid>()
            {
              this.PromotionResult.Product.Id
            },
                            Products = new List<Product>()
            {
              this.PromotionResult.Product
            }
                        }
                    }).Inventories[this.PromotionResult.Product.Id];
                    if ((inventory != null ? inventory.QtyOnHand : Decimal.Zero) < this.PromotionResult.Amount.Value)
                        return;
                }
                IProductUtilities productUtilities = this.ProductUtilities;
                List<Product> products = new List<Product>();
                products.Add(this.PromotionResult.Product);
                Customer billTo = SiteContext.Current.BillTo;
                Customer shipTo = SiteContext.Current.ShipTo;
                if (productUtilities.GetRestrictedProductIds(products, billTo, shipTo).Any<Guid>())
                    return;
                OrderLine orderLine1 = new OrderLine();
                orderLine1.UnitOfMeasure = this.PromotionResult.Product.UnitOfMeasure;
                orderLine1.Id = Guid.NewGuid();
                // BUSA-1319: Limit Qty Per Product
                var maxProductQty = this.PromotionResult.Product.CustomProperties.Where(x => x.Name == "maxProductQty").Select(s => s.Value).FirstOrDefault() ?? "0";

                if (!string.IsNullOrEmpty(maxProductQty) && Convert.ToInt32(maxProductQty) != 0 && this.PromotionResult.Amount.Value > Convert.ToDecimal(maxProductQty))
                {
                    orderLine1.QtyOrdered = Convert.ToDecimal(maxProductQty);
                }
                else
                {
                    orderLine1.QtyOrdered = this.PromotionResult.Amount.Value;
                } // BUSA-1319: END
                OrderLine orderLine2 = orderLine1;
                this.OrderLineUtilities.SetProduct(orderLine2, this.PromotionResult.Product);
                PipelineHelper.VerifyResults((PipeResultBase)this.CartPipeline.AddCartLine(new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                {
                    Cart = customerOrder,
                    CartLine = orderLine2
                }));
                CustomerOrderPromotion customerOrderPromotion = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p => p.PromotionId == this.PromotionResult.PromotionId));
                if (customerOrderPromotion != null)
                {
                    customerOrderPromotion.OrderLineId = new Guid?(orderLine2.Id);
                    customerOrderPromotion.Amount = new Decimal?(new Decimal());
                }
                orderLine2.PromotionResult = this.PromotionResult;
                orderLine2.IsPromotionItem = true;
                orderLine2.UnitNetPrice = Decimal.Zero;
                orderLine2.UnitRegularPrice = this.PromotionResult.Product.BasicListPrice;

                // BUSA-683 : Volume Discount Promotion -Issue when user cart qualifies add free product promotion & volume discount group.
                var orderLineCount = customerOrder.OrderLines.Where(x => x.Id == new Guid()).Count();

                //start BUSA-683 Volume Discount Promotion -Issue when user's cart qualifies add free product promotion & volume discount group 
                if (this.PromotionResult.Promotion.RuleManager.RuleClauses.Where(x => x.CriteriaType == "OverideVolumeDiscount").Count() > 0)
                {
                    var vdgOverride = this.PromotionResult.Promotion.RuleManager.RuleClauses.Where(x => x.CriteriaType == "OverideVolumeDiscount").FirstOrDefault().CriteriaValue;
                    //check if override VDG
                    if (vdgOverride == "Yes")
                    {

                        var ruleProductId = this.PromotionResult.Promotion.RuleManager.RuleClauses.Where(x => x.CriteriaType == "OrderedProduct").Count() > 0 ? this.PromotionResult.Promotion.RuleManager.RuleClauses.Where(x => x.CriteriaType == "OrderedProduct").FirstOrDefault().SimpleValue : string.Empty;

                        var ruleOrderLine = customerOrder.OrderLines.Where(x => x.ProductId.ToString() == ruleProductId.ToString()).FirstOrDefault();
                        if (ruleOrderLine != null && !string.IsNullOrEmpty(ruleOrderLine.ConfigurationViewModel))
                        {
                            ruleOrderLine.UnitNetPrice = ruleOrderLine.UnitListPrice;
                            ruleOrderLine.SmartPart = string.Empty;

                            ruleOrderLine.ConfigurationViewModel = "false";
                            var grpDescription = ruleOrderLine.GetProperty("GrpDescription", "");

                            if (!string.IsNullOrEmpty(grpDescription))
                            {
                                ruleOrderLine.SetProperty("GrpDescription", " ");
                            }

                            CartHelper_Brasseler helper = new CartHelper_Brasseler(this.pricingPipeline);
                            helper.UpdateVolumeGrpPricing(customerOrder, ruleOrderLine.Product.PriceBasis, UnitOfWork);
                            if (orderLineCount == 0)
                            {
                                PipelineHelper.VerifyResults((PipeResultBase)this.CartPipeline.AddCartLine(new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                                {
                                    Cart = customerOrder,
                                    CartLine = orderLine1
                                }));
                                orderLine1.PromotionResult = this.PromotionResult;

                                orderLine1.IsPromotionItem = true;
                                orderLine1.UnitNetPrice = Decimal.Zero;
                                orderLine1.UnitRegularPrice = this.PromotionResult.Product.BasicListPrice;
                            }
                        }
                        else
                        {
                            if (orderLineCount == 0)
                            {
                                PipelineHelper.VerifyResults((PipeResultBase)this.CartPipeline.AddCartLine(new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                                {
                                    Cart = customerOrder,
                                    CartLine = orderLine1
                                }));
                                orderLine1.PromotionResult = this.PromotionResult;

                                orderLine1.IsPromotionItem = true;
                                orderLine1.UnitNetPrice = Decimal.Zero;
                                orderLine1.UnitRegularPrice = this.PromotionResult.Product.BasicListPrice;
                            }
                        }

                    }
                    else
                    {
                        //Do nothing
                    }

                }
                //end BUSA-683 Volume Discount Promotion -Issue when user's cart qualifies add free product promotion & volume discount group
                else
                {
                    PipelineHelper.VerifyResults((PipeResultBase)this.CartPipeline.AddCartLine(new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                    {
                        Cart = customerOrder,
                        CartLine = orderLine1
                    }));
                    orderLine1.PromotionResult = this.PromotionResult;

                    orderLine1.IsPromotionItem = true;
                    orderLine1.UnitNetPrice = Decimal.Zero;
                    orderLine1.UnitRegularPrice = this.PromotionResult.Product.BasicListPrice;
                }
            }
        }

        public override void ClearPromotionResult(CustomerOrder customerOrder)
        {
            //4.2 Code 
            //customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(o =>
            //{
            //    PromotionResult promotionResult = o.PromotionResult;
            //    Guid? nullable = promotionResult != null ? new Guid?(promotionResult.Id) : new Guid?();
            //    Guid id = this.PromotionResult.Id;
            //    if (!nullable.HasValue)
            //        return false;
            //    if (!nullable.HasValue)
            //        return true;
            //    return nullable.GetValueOrDefault() == id;
            //})).ToList<OrderLine>().ForEach((Action<OrderLine>)(orderLine =>
            //{
            //    // BUSA-683 : Volume Discount Promotion - Issue when user cart qualifies add free product promotion &volume discount group.
            //    this.UnitOfWork.Save();
            //    var id = this.UnitOfWork.GetRepository<OrderLine>().GetTable().Where(x => x.Id == orderLine.Id).Count();
            //    if (id > 0)
            //    {
            //        this.CustomerOrderUtilities.RemoveOrderLine(customerOrder, orderLine);
            //    }
            //}));

            foreach (OrderLine orderLine in customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(o =>
            {
                PromotionResult promotionResult = o.PromotionResult;
                Guid? nullable = promotionResult != null ? new Guid?(promotionResult.Id) : new Guid?();
                Guid id = this.PromotionResult.Id;
                if (!nullable.HasValue)
                    return false;
                if (!nullable.HasValue)
                    return true;
                return nullable.GetValueOrDefault() == id;
            })).ToList<OrderLine>())
                PipelineHelper.VerifyResults((PipeResultBase)this.CartPipeline.RemoveCartLine(new Insite.Cart.Services.Pipelines.Parameters.RemoveCartLineParameter()
                {
                    Cart = customerOrder,
                    CartLine = orderLine
                }));
        }
    }
}