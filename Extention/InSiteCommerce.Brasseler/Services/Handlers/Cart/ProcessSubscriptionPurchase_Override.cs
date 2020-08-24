using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Results;
using Insite.Catalog.Services.Dtos;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Plugins.Pricing;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("ProcessSubscriptionPurchase")]
    public sealed class ProcessSubscriptionPurchase_Override : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly Lazy<IProductUtilities> productUtilities;
        private readonly IPricingPipeline pricingPipeline;
        private readonly IOrderLineUtilities orderLineUtilities;
        private readonly ICartPipeline cartPipeline;

        public override int Order
        {
            get
            {
                return 2499;
            }
        }

        public ProcessSubscriptionPurchase_Override(Lazy<IProductUtilities> productUtilities, IPricingPipeline pricingPipeline, IOrderLineUtilities orderLineUtilities, ICartPipeline cartPipeline)
        {
            this.productUtilities = productUtilities;
            this.pricingPipeline = pricingPipeline;
            this.orderLineUtilities = orderLineUtilities;
            this.cartPipeline = cartPipeline;
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            CustomerOrder cart = result.GetCartResult.Cart;
            for (int index = cart.OrderLines.Count - 1; index >= 0; --index)
            {
                OrderLine orderLine = cart.OrderLines.ElementAt<OrderLine>(index);
                if (orderLine.Product.IsSubscription && (!this.productUtilities.Value.IsQuoteRequired(orderLine.Product) || !(cart.Status != "QuoteProposed")))
                    this.ProcessSubscription(unitOfWork, cart, orderLine);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
       
        private void ProcessSubscription(IUnitOfWork unitOfWork, CustomerOrder customerOrder, OrderLine orderLine)
        {
            ProductSubscriptionDto productSubscriptionDto = this.GetProductSubscriptionDto(orderLine);
            Subscription subscription = this.GetSubscription(customerOrder, orderLine, productSubscriptionDto);
            unitOfWork.GetRepository<Subscription>().Insert(subscription);
            Dictionary<Guid, PricingServiceParameter> dictionary = new Dictionary<Guid, PricingServiceParameter>();
            foreach (SubscriptionProduct subscriptionProduct in (IEnumerable<SubscriptionProduct>)orderLine.Product.SubscriptionProducts)
            {
                PricingServiceParameter serviceParameter = new PricingServiceParameter(subscriptionProduct.Product.Id)
                {
                    Product = subscriptionProduct.Product,
                    QtyOrdered = subscriptionProduct.QtyOrdered * orderLine.QtyOrdered
                };
                dictionary.Add(subscriptionProduct.Product.Id, serviceParameter);
            }
            GetProductPricingResult productPricing = this.pricingPipeline.GetProductPricing(new GetProductPricingParameter(true)
            {
                PricingServiceParameters = (IDictionary<Guid, PricingServiceParameter>)dictionary
            });
            PipelineHelper.VerifyResults((PipeResultBase)productPricing);
            foreach (SubscriptionProduct subscriptionProduct1 in (IEnumerable<SubscriptionProduct>)orderLine.Product.SubscriptionProducts)
            {
                SubscriptionProduct subscriptionProduct = subscriptionProduct1;
                SubscriptionLine subscriptionLine = new SubscriptionLine()
                {
                    Product = unitOfWork.GetRepository<Product>().Get(subscriptionProduct.Product.Id),
                    QtyOrdered = subscriptionProduct.QtyOrdered * orderLine.QtyOrdered
                };
                ProductPriceDto productPriceDto = productPricing.ProductPriceDtos.First<KeyValuePair<Guid, ProductPriceDto>>((Func<KeyValuePair<Guid, ProductPriceDto>, bool>)(o => o.Key == subscriptionProduct.Product.Id)).Value;
                subscriptionLine.Price = productPriceDto.UnitRegularPrice;
                subscription.SubscriptionLines.Add(subscriptionLine);
                //if (subscription.IncludeInInitialOrder)
                //{
                //    OrderLine orderLine1 = new OrderLine()
                //    {
                //        Description = subscriptionLine.Product.ErpDescription,
                //        UnitListPrice = productPriceDto.UnitListPrice,
                //        UnitRegularPrice = productPriceDto.UnitRegularPrice,
                //        UnitNetPrice = subscription.FixedPrice ? subscriptionLine.Price : productPriceDto.UnitNetPrice
                //    };
                //    this.orderLineUtilities.SetProduct(orderLine1, subscriptionLine.Product);
                //    this.orderLineUtilities.SetQtyOrdered(orderLine1, subscriptionLine.QtyOrdered);
                //    PipelineHelper.VerifyResults((PipeResultBase)this.cartPipeline.AddCartLine(new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                //    {
                //        Cart = customerOrder,
                //        CartLine = orderLine1
                //    }));
                //}
            }
            if (!subscription.IncludeInInitialOrder)
                return;
            subscription.CustomerOrders.Add(customerOrder);
        }

        private Subscription GetSubscription(CustomerOrder customerOrder, OrderLine orderLine, ProductSubscriptionDto productSubscriptionDto)
        {
            return new Subscription()
            {
                CustomerOrder = customerOrder,
                Customer = customerOrder.Customer,
                ShipTo = customerOrder.ShipTo,
                Product = orderLine.Product,
                Website = customerOrder.Website,
                UserProfile = customerOrder.PlacedByUserProfile,
                ShipViaId = productSubscriptionDto.SubscriptionShipViaId ?? customerOrder.ShipVia.Id,
                CyclePeriod = productSubscriptionDto.SubscriptionCyclePeriod,
                PeriodsPerCycle = productSubscriptionDto.SubscriptionPeriodsPerCycle,
                TotalCycles = productSubscriptionDto.SubscriptionTotalCycles,
                FixedPrice = productSubscriptionDto.SubscriptionFixedPrice,
                IncludeInInitialOrder = productSubscriptionDto.SubscriptionAddToInitialOrder,
                AllMonths = productSubscriptionDto.SubscriptionAllMonths,
                January = productSubscriptionDto.SubscriptionJanuary,
                February = productSubscriptionDto.SubscriptionFebruary,
                March = productSubscriptionDto.SubscriptionMarch,
                April = productSubscriptionDto.SubscriptionApril,
                May = productSubscriptionDto.SubscriptionMay,
                June = productSubscriptionDto.SubscriptionJune,
                July = productSubscriptionDto.SubscriptionJuly,
                August = productSubscriptionDto.SubscriptionAugust,
                September = productSubscriptionDto.SubscriptionSeptember,
                October = productSubscriptionDto.SubscriptionOctober,
                November = productSubscriptionDto.SubscriptionNovember,
                December = productSubscriptionDto.SubscriptionDecember
            };
        }

        private ProductSubscriptionDto GetProductSubscriptionDto(OrderLine orderLine)
        {
            ProductSubscriptionDto productSubscriptionDto = new ProductSubscriptionDto()
            {
                SubscriptionShipViaId = orderLine.Product.SubscriptionShipViaId,
                SubscriptionCyclePeriod = orderLine.Product.SubscriptionCyclePeriod,
                SubscriptionPeriodsPerCycle = orderLine.Product.SubscriptionPeriodsPerCycle,
                SubscriptionTotalCycles = orderLine.Product.SubscriptionTotalCycles,
                SubscriptionFixedPrice = orderLine.Product.SubscriptionFixedPrice,
                SubscriptionAddToInitialOrder = orderLine.Product.SubscriptionAddToInitialOrder,
                SubscriptionAllMonths = orderLine.Product.SubscriptionAllMonths,
                SubscriptionJanuary = orderLine.Product.SubscriptionJanuary,
                SubscriptionFebruary = orderLine.Product.SubscriptionFebruary,
                SubscriptionMarch = orderLine.Product.SubscriptionMarch,
                SubscriptionApril = orderLine.Product.SubscriptionApril,
                SubscriptionMay = orderLine.Product.SubscriptionMay,
                SubscriptionJune = orderLine.Product.SubscriptionJune,
                SubscriptionJuly = orderLine.Product.SubscriptionJuly,
                SubscriptionAugust = orderLine.Product.SubscriptionAugust,
                SubscriptionSeptember = orderLine.Product.SubscriptionSeptember,
                SubscriptionOctober = orderLine.Product.SubscriptionOctober,
                SubscriptionNovember = orderLine.Product.SubscriptionNovember,
                SubscriptionDecember = orderLine.Product.SubscriptionDecember
            };
            CustomProperty customProperty = orderLine.CustomProperties.FirstOrDefault<CustomProperty>((Func<CustomProperty, bool>)(o => o.Name.Equals("ProductSubscription", StringComparison.OrdinalIgnoreCase)));
            if (customProperty != null)
            {
                if (!customProperty.Value.IsBlank())
                {
                    try
                    {
                        productSubscriptionDto = JsonConvert.DeserializeObject<ProductSubscriptionDto>(customProperty.Value);
                    }
                    catch (Exception ex)
                    {
                        LogHelper.For((object)this).Info((object)ex.Message, (Exception)null, (string)null);
                    }
                    return productSubscriptionDto;
                }
            }
            return productSubscriptionDto;
        }
    }
}
