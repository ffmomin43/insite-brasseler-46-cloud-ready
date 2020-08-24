using Insite.Account.Services;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Customers.Services;
using Insite.Data.Entities;
using System;
using System.Linq;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Interfaces.Data;
using Insite.Core.Context;
using Insite.Data.Repositories.Interfaces;
using System.Globalization;
using Insite.Catalog.Services.Dtos;
using System.Collections.Generic;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pricing;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    public class CartHelper_Brasseler
    {
        protected readonly Lazy<IAuthenticationService> AuthenticationService;
        protected readonly ICustomerService CustomerService;
        protected readonly ISessionService SessionService;

        protected IPricingPipeline pricingPipeline;
        protected decimal TotalQty = 0;
        protected string qtyBrCls = string.Empty;
        protected CustomSettings customSettings;

        public CartHelper_Brasseler(IPricingPipeline PricingPipeline)
        {
            this.pricingPipeline = PricingPipeline;
            customSettings = new CustomSettings();
        }



        public CustomerOrder UpdateVolumeGrpPricing(CustomerOrder cart, string QtyBrkCls, IUnitOfWork UnitofWork)
        {
            //var useVolumeGroupPricing = UnitofWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName<string>("UseVolumeGroupPricing", SiteContext.Current.Website.Id).ToString();
            var useVolumeGroupPricing = customSettings.UseVolumeGroupPricing;
            if (useVolumeGroupPricing.ToUpper() == "TRUE")
            {
                qtyBrCls = QtyBrkCls;
                if (cart != null && !string.IsNullOrEmpty(qtyBrCls))
                {
                    cart.OrderLines.ToList<OrderLine>().ForEach((Action<OrderLine>)(l => this.AddTotalQty(l)));
                    cart.OrderLines.ToList<OrderLine>().ForEach((Action<OrderLine>)(l => this.SaveTotalQty(l)));
                    this.GetPricingServiceResult((IEnumerable<OrderLine>) cart.OrderLines);
                    cart.RecalculateTax = true;
                }
                return cart;
            }

            else
            {
                return cart;
            }

        }


        protected void AddTotalQty(OrderLine ol)
        {
            if (ol.ConfigurationViewModel.ToUpper() == "TRUE")
            {
                if (!string.IsNullOrEmpty(ol.Product.PriceBasis) && ol.Product.PriceBasis == qtyBrCls)
                {
                    var altCnv = ol.Product.CustomProperties.FirstOrDefault(x => x.Name == "AltCnv")?.Value ?? "1"; // BUSA-804 Changes to Volume Discount
                    var AltCnv = Decimal.Parse(altCnv,CultureInfo.InvariantCulture);
                    TotalQty = TotalQty + (ol.QtyOrdered * AltCnv);
                }
            }
        }

        protected void SaveTotalQty(OrderLine ol)
        {
            if (ol.ConfigurationViewModel.ToUpper() == "TRUE")
            {
                if (!string.IsNullOrEmpty(ol.Product.PriceBasis) && ol.Product.PriceBasis == qtyBrCls)
                    ol.SmartPart = TotalQty.ToString();
            }
        }

        protected void GetPricingServiceResult(IEnumerable<OrderLine> orderLines)
        {
            GetProductPricingResult productPricing = this.pricingPipeline.GetProductPricing(new GetProductPricingParameter(true)
            {
                PricingServiceParameters = orderLines.ToDictionary(o => o.Id, o => new PricingServiceParameter(o.ProductId)
                {
                    OrderLine = o,
                    CustomerOrderId = o.CustomerOrderId                    
                })
            });
            PipelineHelper.VerifyResults((PipeResultBase)productPricing);

            foreach (OrderLine ol in orderLines)
            {
                ProductPriceDto productPriceDto = productPricing.ProductPriceDtos.First(o => o.Key == ol.Id).Value;
                ol.UnitListPrice = productPriceDto.UnitListPrice;
                ol.UnitRegularPrice = productPriceDto.UnitRegularPrice;
                ol.UnitNetPrice = productPriceDto.UnitNetPrice;
                //ol.CustomerOrder.ConversionRate = 
            }                      
        }    
    }
}