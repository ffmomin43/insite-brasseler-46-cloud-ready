using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Order.Services.Dtos;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
//AddRMAHandler : PopulateUserInfoData
namespace InSiteCommerce.Brasseler.Services.Handlers.Rma
{
    [DependencyName("PopulateEmailModel")]
    public class PopulateEmailModel_Brasseler : HandlerBase<AddRmaParameter, AddRmaResult>
    {
        public override int Order
        {
            get
            {
                return 700;
            }
        }

        public PopulateEmailModel_Brasseler()
        {
        }

        public override AddRmaResult Execute(IUnitOfWork unitOfWork, AddRmaParameter parameter, AddRmaResult result)
        {
            CustomSettings customSettings = new CustomSettings();
            dynamic emailModel = new ExpandoObject();
            List<RmaLineDto> lstRmaLine = new List<RmaLineDto>();
            dynamic lstProduct = new ExpandoObject();

            emailModel.CustomerNumber = !string.IsNullOrEmpty(SiteContext.Current.ShipTo.CustomerSequence) ? SiteContext.Current.ShipTo.CustomerSequence : SiteContext.Current.BillTo.CustomerNumber;
            emailModel.BTEmail = SiteContext.Current.BillTo.Email;
            emailModel.OrderNumber = result.OrderHistory.WebOrderNumber;
            emailModel.OrderDate = result.OrderHistory.OrderDate;
            emailModel.PONumber = result.OrderHistory.CustomerPO;
            emailModel.BTDisplayName = result.OrderHistory.BTCompanyName;
            emailModel.Address = result.OrderHistory.BTAddress1 + Environment.NewLine + result.OrderHistory.BTAddress2 + Environment.NewLine + result.OrderHistory.BTCity + ", " + result.OrderHistory.BTState + ", " + result.OrderHistory.BTPostalCode + Environment.NewLine + result.OrderHistory.BTCountry;

            // adding the returned webordernumber in email 
            var returnNumber = string.Empty;
            result.Properties.TryGetValue("ReturnNumber", out returnNumber);
            emailModel.ReturnNumber = returnNumber;

            // Getting the Invoice Number
            var invoiceNumber = string.Empty;
            result.Properties.TryGetValue("InvoiceNumber", out invoiceNumber);
            emailModel.InvoiceNumber = invoiceNumber;

            emailModel.shortDescription = new List<ExpandoObject>();
            foreach (var orderHistoryLines in result.OrderHistory.OrderHistoryLines)
            {
                dynamic products = new ExpandoObject();
                var description = unitOfWork.GetRepository<Product>().GetTable().Where(x => x.Name == orderHistoryLines.ProductErpNumber).FirstOrDefault();
                if(description != null) // BUSA-1270 : RMA button does not function when there is a WEBDISCOUNT 
                {
                    products.Name = description.Name;
                    products.ShortDescription = description.ShortDescription;
                    emailModel.shortDescription.Add(products);
                }
            }
            emailModel.OrderLines = new List<ExpandoObject>();
            foreach (OrderHistoryLine orderHistoryLine in result.OrderHistory.OrderHistoryLines)
            {
                RmaLineDto rmaLineDto = parameter.RmaLines.FirstOrDefault<RmaLineDto>((RmaLineDto r) => r.Line.Equals(orderHistoryLine.LineNumber)) ?? new RmaLineDto();
                if(rmaLineDto.RmaQtyRequested != 0)
                {
                    dynamic productErpNumber = new ExpandoObject();
                    productErpNumber.Name = orderHistoryLine.ProductErpNumber;
                    productErpNumber.ShortDescription = orderHistoryLine.Description;
                    productErpNumber.QtyOrdered = decimal.ToInt32(orderHistoryLine.QtyOrdered);
                    productErpNumber.RMAQtyRequested = rmaLineDto.RmaQtyRequested;
                    productErpNumber.RMAReturnReason = rmaLineDto.RmaReasonCode;
                    productErpNumber.LineNumber = orderHistoryLine.LineNumber;
                    emailModel.OrderLines.Add(productErpNumber);
                }
            }
            emailModel.RmaLines = new List<ExpandoObject>();
            foreach (var rma in result.OrderHistory.OrderHistoryLines)
            {
                dynamic lines = new ExpandoObject();
                var RmaLines = parameter.RmaLines.Where(x => x.Line == rma.LineNumber).FirstOrDefault();
                if (RmaLines != null)
                {
                    lines.Line = RmaLines.Line;
                    emailModel.RmaLines.Add(lines);
                }
            }

            //add rma email flag to identify different email notification
            emailModel.IsRmaEmail = true;
       
            emailModel.Notes = parameter.Notes;
            result.EmailModel = (ExpandoObject)emailModel;
            return base.NextHandler.Execute(unitOfWork, parameter, result);
        }

    }
}
