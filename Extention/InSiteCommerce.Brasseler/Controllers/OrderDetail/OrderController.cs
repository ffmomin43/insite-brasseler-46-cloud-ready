using Insite.Common.Helpers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Services;
using Insite.Data.Entities;
using Insite.Order.Services;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using Insite.Order.WebApi.V1.ApiModels;
using Insite.Order.WebApi.V1.Mappers.Interfaces;
using Insite.WebFramework.Mvc;
using Insite.WebFramework.Templating;
using Insite.WebFramework.Theming;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections;
using System.IO;
using System.Web.Mvc;

namespace InSiteCommerce.Brasseler.Controllers.OrderDetail
{
    public class OrderController : BaseController
    {

        protected readonly IGetOrderMapper GetOrderMapper;

        protected readonly IOrderService OrderService;

        protected readonly IThemeContentProvider ThemeContentProvider;

        protected readonly IEmailTemplateRenderer EmailTemplateRenderer;

        public OrderController(IUnitOfWorkFactory unitOfWorkFactory, IGetOrderMapper getOrderMapper, IOrderService orderService, IThemeContentProvider themeContentProvider, IEmailTemplateRenderer emailTemplateRenderer) : base(unitOfWorkFactory)
        {
            this.GetOrderMapper = getOrderMapper;
            this.OrderService = orderService;
            this.ThemeContentProvider = themeContentProvider;
            this.EmailTemplateRenderer = emailTemplateRenderer;
        }

        public OrderController()
        {
        }

        public void GeneratePdf(string orderNumber, string stEmail, string stPostalCode, Stream pdfStream)
        {
            string name;
            string str;
            object shortDateString;
            GetOrderResult getOrderResult = this.OrderService.GetOrder(new GetOrderParameter(orderNumber)
            {
                GetOrderLines = true,
                GetShipments = true,
                STPostalCode = stPostalCode,
                STEmail = stEmail
            });
            if (getOrderResult.ResultCode != ResultCode.Success)
            {
                return;
            }
            OrderModel orderModel = this.GetOrderMapper.MapResult(getOrderResult, null);
            Theme theme = base.UnitOfWork.GetRepository<Theme>().Get(SiteContext.Current.WebsiteDto.ThemeId);
            if (theme.ThemeSource == null)
            {
                name = (theme.IsSystemTheme ? "System" : "User");
            }
            else
            {
                name = theme.ThemeSource.Name;
            }
            string frontEndResourcePath = string.Format("~/frontendresources/{0}/{1}/pdfviews/orderdetails.cshtml", name, theme.Name);
            ThemeContentDto themeContentDto = this.ThemeContentProvider.GetByPath(frontEndResourcePath);
            dynamic model = orderModel.ToJson(false).ToExpando();
            decimal totalDiscount = this.GetTotalDiscount(orderModel);
            dynamic obj = model;
            str = (totalDiscount > decimal.Zero ? totalDiscount.ToString("0.00") : string.Empty);
            obj.TotalDiscountDisplay = str;
            DateTime orderDate = orderModel.OrderDate;
            model.OrderDateDisplay = orderDate.ToShortDateString();
            dynamic obj1 = model;
            DateTime? requestedDeliveryDateDisplay = orderModel.RequestedDeliveryDateDisplay;
            if (requestedDeliveryDateDisplay.HasValue)
            {
                shortDateString = requestedDeliveryDateDisplay.GetValueOrDefault().ToShortDateString();
            }
            else
            {
                shortDateString = null;
            }
            if (shortDateString == null)
            {
                shortDateString = string.Empty;
            }
            obj1.RequestedDeliveryDate = (string)shortDateString;
            foreach (dynamic shipmentPackage in (IEnumerable)model.ShipmentPackages)
            {
                dynamic obj2 = shipmentPackage;
                obj2.ShipmentDateDisplay = Convert.ToDateTime(shipmentPackage.ShipmentDate).ToShortDateString();
            }
            foreach (dynamic orderLine in (IEnumerable)model.OrderLines)
            {
                orderLine.QtyOrderedDisplay = orderLine.QtyOrdered.ToString("0");
            }

            //Display Company logo based on website
            CustomSettings customSettings = new CustomSettings();
            model.CompanyIdentifier = customSettings.CompanyNameIdentifier;

            PdfGeneratorHelper.GeneratePdf(this.EmailTemplateRenderer.Render(themeContentDto.Content, model), pdfStream);
        }

        public ActionResult GetPdf(string orderNumber, string stEmail, string stPostalCode)
        {
            ActionResult actionResult;
            using (MemoryStream pdfStream = new MemoryStream())
            {
                this.GeneratePdf(orderNumber, stEmail, stPostalCode, pdfStream);
                string fileName = string.Format("order_{0}.pdf", orderNumber);
                base.Response.AppendHeader("Content-Disposition", string.Concat("inline; filename=", fileName));
                actionResult = base.File(pdfStream.ToArray(), "application/pdf");
            }
            return actionResult;
        }

        private decimal GetTotalDiscount(OrderModel order)
        {
            decimal discount = new decimal();
            foreach (OrderPromotionModel promotion in order.OrderPromotions)
            {
                if (!(promotion.PromotionResultType == "AmountOffOrder") && !(promotion.PromotionResultType == "PercentOffOrder") && !(promotion.PromotionResultType == "AmountOffShipping") && !(promotion.PromotionResultType == "PercentOffShipping"))
                {
                    continue;
                }
                decimal num = discount;
                decimal? amount = promotion.Amount;
                discount = num + (amount.HasValue ? amount.GetValueOrDefault() : decimal.Zero);
            }
            return discount;
        }
    }
}
