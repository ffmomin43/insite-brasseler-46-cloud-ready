using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Results;
using Insite.Common.Logging;
using Insite.Common.Providers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Cart;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Core.SystemSetting.Groups.Shipping;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;


namespace Insite.Cart.Services.Handlers.UpdateCartHandler
{
    [DependencyName("SubmitCart_Brasseler")]
    public class SubmitCart_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly Lazy<ICartOrderProviderFactory> cartOrderProviderFactory;
        private readonly Lazy<IPromotionEngine> promotionEngine;
        private readonly Lazy<IProductUtilities> productUtilities;
        private readonly ICustomerOrderUtilities customerOrderUtilities;
        private readonly ICartPipeline cartPipeline;
        private readonly IPricingPipeline pricingPipeline;
        private readonly OrderManagementGeneralSettings orderManagementGeneralSettings;
        private readonly ShippingGeneralSettings shippingGeneralSettings;
        private readonly RfqSettings rfqSettings;
        private readonly CustomSettings customSettings;

        public SubmitCart_Brasseler(Lazy<IPromotionEngine> promotionEngine, Lazy<IProductUtilities> productUtilities, Lazy<ICartOrderProviderFactory> cartOrderProviderFactory, ICustomerOrderUtilities customerOrderUtilities, ICartPipeline cartPipeline, ShippingGeneralSettings shippingGeneralSettings, RfqSettings rfqSettings, IPricingPipeline pricingPipeline, OrderManagementGeneralSettings orderManagementGeneralSettings, CustomSettings customSettings)
        {
            this.promotionEngine = promotionEngine;
            this.productUtilities = productUtilities;
            this.cartOrderProviderFactory = cartOrderProviderFactory;
            this.customerOrderUtilities = customerOrderUtilities;
            this.cartPipeline = cartPipeline;
            this.shippingGeneralSettings = shippingGeneralSettings;
            this.rfqSettings = rfqSettings;
            this.pricingPipeline = pricingPipeline;
            this.orderManagementGeneralSettings = orderManagementGeneralSettings;
            this.customSettings = customSettings;
        }

        public override int Order
        {
            get
            {
                return 2280;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
            {
                //BUSA-1345: SS orders should start with S-series Requestor & Approver flow.
                if (result.GetCartResult.Cart != null && !string.IsNullOrEmpty(result.GetCartResult.Cart.OrderNumber) && !result.GetCartResult.Cart.OrderNumber.IsGuid())
                {
                    this.GetOrderNumberPrefix(result.GetCartResult.Cart);
                }
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            }
            this.SetCustomerOrderNumber(unitOfWork, result.GetCartResult.Cart);
            
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        public void SetCustomerOrderNumber(IUnitOfWork unitOfWork, CustomerOrder customerOrder)
        {
            if (!customerOrder.OrderNumber.IsGuid())
            {
                this.GetOrderNumberPrefix(customerOrder);
                return;
            }
                
            ICustomerOrderRepository typedRepository = unitOfWork.GetTypedRepository<ICustomerOrderRepository>();
            orderManagementGeneralSettings.OverrideCurrentWebsite(customerOrder.WebsiteId);

            //BUSA-1345: SS orders should start with S-series
            var isSubscriptionOrder = customerOrder.CustomProperties?.Where(x => x.Name.Equals("subscriptionFrequencyOpted")).Count();

            //BUSA-1223 : Punchout Orders should start with P-series
            if (customerOrder.Status.EqualsIgnoreCase("PunchOutOrderRequest"))
            {
                customerOrder.OrderNumber = typedRepository.GetNextOrderNumber(this.customSettings.PunchoutOrder_Prefix, this.orderManagementGeneralSettings.OrderNumberFormat);
            }
            else if (isSubscriptionOrder > 0) //BUSA-1345: SS orders should start with S-series
            {
                customerOrder.OrderNumber = typedRepository.GetNextOrderNumber(this.customSettings.SmartSupply_Prefix, this.orderManagementGeneralSettings.OrderNumberFormat);
            }
            else
            {
                customerOrder.OrderNumber = typedRepository.GetNextOrderNumber(this.orderManagementGeneralSettings.OrderNumberPrefix, this.orderManagementGeneralSettings.OrderNumberFormat);
            }
        }
        
        //BUSA-1345: SS orders should start with S-series Requestor & Approver flow.
        public void GetOrderNumberPrefix(CustomerOrder customerOrder)
        {
            bool isSubscriptionOrder = false;
            foreach (var orderLine in customerOrder.OrderLines.ToList())
            {
                if (orderLine.CustomProperties.Where(y => y.Name == "IsSubscriptionOpted").Count() > 0)
                {
                    var value = orderLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).FirstOrDefault().Value;
                    if (bool.Parse(value))
                    {
                        isSubscriptionOrder = true;
                        break;
                    }
                }
            }
            if (isSubscriptionOrder)
            {
                customerOrder.OrderNumber = this.customSettings.SmartSupply_Prefix + customerOrder.OrderNumber.Substring(1);
            }
        }
    }
}
