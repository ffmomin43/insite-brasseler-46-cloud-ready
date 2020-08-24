using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Linq;
using System.Linq.Expressions;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Insite.Common.Providers;
using Insite.Order.SystemSettings;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("ApplyFilteringToStoredCollectionQuery")]
    public class OrderHistory_ApplyFilteringToStoredCollectionQuery_Override : HandlerBase<GetOrderCollectionParameter, GetOrderCollectionResult>
    {
        private readonly OrderHistorySettings orderHistorySettings;

        public OrderHistory_ApplyFilteringToStoredCollectionQuery_Override(OrderHistorySettings orderHistorySettings) 
        {
            this.orderHistorySettings = orderHistorySettings;
        }
        public override int Order
        {
            get
            {
                return 999;
            }
        }

        public override GetOrderCollectionResult Execute(
          IUnitOfWork unitOfWork,
          GetOrderCollectionParameter parameter,
          GetOrderCollectionResult result)
        {
            if (result.IsRealTime)
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (parameter.StatusCollection != null && parameter.StatusCollection.Any<string>())
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => parameter.StatusCollection.Contains(o.Status));
            if (!parameter.OrderNumber.IsBlank())
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.ErpOrderNumber.Equals(parameter.OrderNumber, StringComparison.OrdinalIgnoreCase) || o.WebOrderNumber.Equals(parameter.OrderNumber, StringComparison.OrdinalIgnoreCase));
            if (!parameter.CustomerPO.IsBlank())
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.CustomerPO.Equals(parameter.CustomerPO, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(parameter.CustomerSequence) && parameter.CustomerSequence != "-1") // check for null condition in order to show all orders when customer is set to bill to
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.CustomerSequence == (parameter.CustomerSequence ?? string.Empty));
            DateTime? nullable = parameter.ToDate;
            if (nullable.HasValue)
            {
                nullable = parameter.ToDate;
                DateTime date = nullable.Value;
                date = date.Date;
                DateTime toDate = date.AddDays(1.0).AddMinutes(-1.0);
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.OrderDate <= toDate);
            }
            nullable = parameter.FromDate;
            if (nullable.HasValue)
            {
                //nullable = parameter.FromDate;
                //DateTime fromDate = nullable.Value.Date;

                DateTime fromDate = DateTimeProvider.Current.Now.DateTime;
                fromDate = fromDate.AddDays((double)(-this.orderHistorySettings.LookBackDays)); // LookBackDays was introduced in 4.4 so not using introducing custom property used in 4.2 by us
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.OrderDate >= fromDate);
            }
            if (!parameter.OrderTotalOperator.IsBlank())
            {
                if (parameter.OrderTotalOperator.Equals("Less Than", StringComparison.OrdinalIgnoreCase))
                    result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.OrderTotal <= parameter.OrderTotal);
                else if (parameter.OrderTotalOperator.Equals("Greater Than", StringComparison.OrdinalIgnoreCase))
                    result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.OrderTotal >= parameter.OrderTotal);
                else if (parameter.OrderTotalOperator.Equals("Equal To", StringComparison.OrdinalIgnoreCase))
                    result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.OrderTotal == parameter.OrderTotal);
            }
            if (!parameter.Search.IsBlank())
            {
                string search = parameter.Search.Trim();
                result.OrdersQuery = result.OrdersQuery.Where<OrderHistory>(o => o.CustomerPO.Contains(search) || o.ErpOrderNumber.Contains(search) || o.WebOrderNumber.Contains(search) || o.STCompanyName.Contains(search));
            }

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
