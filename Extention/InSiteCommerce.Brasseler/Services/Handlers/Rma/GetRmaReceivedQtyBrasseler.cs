using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

//BUSA-1309 Added code to fetch RMAQty for each product in orders.
namespace InSiteCommerce.Brasseler.Services.Handlers
{

    [DependencyName("GetRmaReceivedQtyBrasseler")]
    public class GetRmaReceivedQtyBrasseler : HandlerBase<GetOrderParameter, GetOrderResult>
    {
        public override int Order
        {
            get
            {
                return 1460;
            }
        }

        public GetRmaReceivedQtyBrasseler()
        {
        }

        public override GetOrderResult Execute(IUnitOfWork unitOfWork, GetOrderParameter parameter, GetOrderResult result)
        {
            List<int> returnQty = new List<int>();
            if (result.OrderHistory.OrderHistoryLines != null)
            {
                foreach (OrderHistoryLine orderLine in result.OrderHistory.OrderHistoryLines)
                {
                    orderLine.RmaQtyReceived = unitOfWork.GetRepository<ReturnRequest>().GetTable().Where(rmaProduct => rmaProduct.WebOrderNumber == result.OrderHistory.WebOrderNumber && rmaProduct.ErpOrderNumber == result.OrderHistory.ErpOrderNumber && rmaProduct.ProductNumber == orderLine.ProductErpNumber).Select(x => (decimal?)x.QtyToReturn).Sum() ?? decimal.Zero;
                    if (orderLine.RmaQtyReceived > 0)
                    {
                        returnQty.Add(Convert.ToInt32(orderLine.RmaQtyReceived));
                    }
                }
            }

            if (!string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber))
            {
                CustomerOrder order = unitOfWork.GetRepository<CustomerOrder>().GetTable().Where(x => x.OrderNumber == result.OrderHistory.WebOrderNumber).FirstOrDefault();
                if (order != null)
                {
                    var orderedQty = order.OrderLines.Where(x => x.Product.ErpNumber != "WEBDISCOUNT" && !x.IsPromotionItem.Equals(true) && (x.UnitNetPrice > 0 || x.QtyShipped < x.QtyOrdered)).Select(qty => qty.QtyOrdered).Sum();
                    if (returnQty.Sum() >= orderedQty && !result.Properties.ContainsKey("isOrderReturned"))
                    {
                        result.Properties.Add("isOrderReturned", bool.TrueString);
                    }
                }
                else if (result.OrderHistory.OrderHistoryLines != null) // for ERP orders that deos have the WebOrderNumber but not the CustomerOrder Record
                {
                    var orderedQty = result.OrderHistory.OrderHistoryLines.Where(x => x.ProductErpNumber != "WEBDISCOUNT").Select(qty => qty.QtyOrdered).Sum();
                    if (returnQty.Sum() >= orderedQty && !result.Properties.ContainsKey("isOrderReturned"))
                    {
                        result.Properties.Add("isOrderReturned", bool.TrueString);
                    }
                }
            }
            else // for ERP orders that deosnt have the WebOrderNumber
            {
                if (result.OrderHistory.OrderHistoryLines != null)
                {
                    var orderedQty = result.OrderHistory.OrderHistoryLines.Where(x => x.ProductErpNumber != "WEBDISCOUNT").Select(qty => qty.QtyOrdered).Sum();
                    if (returnQty.Sum() >= orderedQty && !result.Properties.ContainsKey("isOrderReturned"))
                    {
                        result.Properties.Add("isOrderReturned", bool.TrueString);
                    }
                }
            }

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }

}
