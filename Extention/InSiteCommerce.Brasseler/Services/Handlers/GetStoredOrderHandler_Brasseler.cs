using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using System;
using System.Linq;
//GetStoredOrderHandler_Brasseler 
namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("CopyCustomPropertiesToResult")]
    public class GetStoredOrderHandler_Brasseler : HandlerBase<GetOrderParameter, GetOrderResult>
    {
        public override int Order
        {
            get
            {
                return 1450;
            }
        }

        public GetStoredOrderHandler_Brasseler()
        {
        }

        public override GetOrderResult Execute(IUnitOfWork unitOfWork, GetOrderParameter parameter, GetOrderResult result)
        {
            if (result.OrderHistory == null)
            {
                return base.NextHandler.Execute(unitOfWork, parameter, result);
            }
            string isHazardousProductInOrderLine = string.Empty;
            //BUSA-760:SS - Order details page should display with smart supply image
            var webOrderNumber = result.OrderHistory.WebOrderNumber;
            CustomerOrder order = unitOfWork.GetRepository<CustomerOrder>().GetTable().Where(x => x.OrderNumber == webOrderNumber).FirstOrDefault();

            foreach (var item in result.GetOrderLineResults)
            {
                if (item.ProductDto != null)
                {
                    if (item.ProductDto.IsHazardousGood)
                    {
                        isHazardousProductInOrderLine += item.ProductDto.Id + ",";
                    }
                }
                //BUSA-760:SS - Order details page should display with smart supply image start
                if (order != null)
                {

                    foreach (var ol in order.OrderLines)
                    {
                        if (item.ProductDto != null)
                        {
                            if (item.ProductDto.Id == ol.ProductId)
                            {
                                if (ol.CustomProperties.Where(x => x.Name == "IsSubscriptionOpted").Count() > 0)
                                {
                                    var Value = ol.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).FirstOrDefault().Value;
                                    this.AddOrUpdateProperty(item, "IsSubscriptionOpted", Value);
                                }
                            }
                        }
                    }
                }
                //BUSA-760:SS - Order details page should display with smart supply image end
            }
            isHazardousProductInOrderLine.Trim();

            result.Properties.Add("isHazardousProductInOrderLine", isHazardousProductInOrderLine);

            // To retrieve RMA custom properties
            if (!string.IsNullOrEmpty(parameter.OrderNumber))
            {
                if (result.OrderHistory.Status.EqualsIgnoreCase("Return Requested"))
                {
                    //Add request submitted property to disable the Send Request Button
                    result.Properties.Add("requestSubmitted", "true");

                    RmaResponse rmaProperties = unitOfWork.GetRepository<RmaResponse>().GetTable().Where(x => x.WebOrderNumber == parameter.OrderNumber || x.ErpOrderNumber == parameter.OrderNumber).OrderByDescending<RmaResponse, DateTimeOffset>((Func<RmaResponse, DateTimeOffset>)(desc => desc.ModifiedOn)).FirstOrDefault();
                    if (rmaProperties != null)
                    {
                        result.Properties.Add("rmaGraphicImage", rmaProperties.GraphicImage);
                        result.Properties.Add("rmaHtmlImage", rmaProperties.HtmlImage);

                        if (!string.IsNullOrEmpty(rmaProperties.ErpOrderNumber))
                        {
                            var erpNumber = rmaProperties.ErpOrderNumber.Split('-')[0];
                            var invoiceQuery = (from ih in unitOfWork.GetRepository<InvoiceHistory>().GetTable()
                                                join ihl in unitOfWork.GetRepository<InvoiceHistoryLine>().GetTable()
                                                on ih.Id equals ihl.InvoiceHistoryId
                                                where ihl.ErpOrderNumber == erpNumber
                                                select ih.InvoiceNumber);
                            if (!string.IsNullOrEmpty(invoiceQuery.FirstOrDefault()))
                            {
                                result.Properties.Add("invoiceNumber", invoiceQuery.FirstOrDefault().Split('-')[0].ToString());
                            }
                        }
                    }
                }
            }
            //BUSA-1070: Attach RMA custom property to each line item.
            foreach (var orderLine in result.GetOrderLineResults)
            {
                if(orderLine != null && orderLine.ProductDto != null)
                {
                    if (orderLine.ProductDto.Properties.ContainsKey("RMAthreshold"))
                    {
                        var value = "";
                        orderLine.ProductDto.Properties.TryGetValue("RMAthreshold", out value);
                        orderLine.Properties.Add("RMAthreshold", value);
                    }
                }
            }

            // Getting the Invoice Number
            bool IsOrderInvoiced = false;
            if (!string.IsNullOrEmpty(result.OrderHistory.ErpOrderNumber))
            {
                var erpNumber = result.OrderHistory.ErpOrderNumber.Split('-')[0];
                var invoiceQuery = (from ih in unitOfWork.GetRepository<InvoiceHistory>().GetTable()
                                    join ihl in unitOfWork.GetRepository<InvoiceHistoryLine>().GetTable()
                                    on ih.Id equals ihl.InvoiceHistoryId
                                    where ihl.ErpOrderNumber == erpNumber
                                    select ih.InvoiceNumber);
                if (!string.IsNullOrEmpty(invoiceQuery.FirstOrDefault()))
                {
                    IsOrderInvoiced = true;
                }
            }
            result.Properties.Add("IsOrderInvoiced", IsOrderInvoiced.ToString());

            // To disable RMA for Free or Sample Prodcuts
            bool isSampleOrFreeProd = false;
            if(order != null)
            {
                foreach(var property in order.CustomProperties.ToList())
                {
                    if (property.Name.EqualsIgnoreCase("isSampleOrder"))
                    {
                        isSampleOrFreeProd = bool.Parse(property.Value);
                    }
                }
                foreach(var ol in order.OrderLines.ToList())
                {
                    if (ol.IsPromotionItem.Equals(true))
                    {
                        isSampleOrFreeProd = true;
                    }
                }
            }
            result.Properties.Add("isSampleOrFreeProd", isSampleOrFreeProd.ToString());

            return base.NextHandler.Execute(unitOfWork, parameter, result);
        }

        private void AddOrUpdateProperty(GetOrderLineResult result, string key, string value)
        {
            if (result.ProductDto.Properties.ContainsKey(key)) { result.Properties[key] = value; } else { result.Properties.Add(key, value); }
        }
    }
}
