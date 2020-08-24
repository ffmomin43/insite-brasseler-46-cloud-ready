using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Invoice.Services.Parameters;
using Insite.Invoice.Services.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("ApplyFilteringToStoredCollectionQuery")]
    class Invoice_ApplyFilteringToStoredCollectionQuery_Override : HandlerBase<GetInvoiceCollectionParameter, GetInvoiceCollectionResult>
    {
        public override int Order
        {
            get
            {
                return 999;
            }
        }

        public override GetInvoiceCollectionResult Execute(
          IUnitOfWork unitOfWork,
          GetInvoiceCollectionParameter parameter,
          GetInvoiceCollectionResult result)
        {
            if (result.IsRealTime)
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (parameter.StatusCollection != null && parameter.StatusCollection.Any<string>())
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => parameter.StatusCollection.Contains(o.Status));
            if (!parameter.InvoiceNumber.IsBlank())
                result.InvoicesQuery = result.InvoicesQuery.    Where<InvoiceHistory>(o => o.InvoiceNumber.Equals(parameter.InvoiceNumber, StringComparison.OrdinalIgnoreCase));
            if (!parameter.OrderNumber.IsBlank())
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => o.InvoiceHistoryLines.Any<InvoiceHistoryLine>(l => l.ErpOrderNumber.Equals(parameter.OrderNumber, StringComparison.OrdinalIgnoreCase)));
            if (!parameter.CustomerPO.IsBlank())
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => o.CustomerPO.Equals(parameter.CustomerPO, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(parameter.CustomerSequence) && parameter.CustomerSequence != "-1")
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => o.CustomerSequence == (parameter.CustomerSequence ?? string.Empty));
            DateTime? nullable = parameter.ToDate;
            if (nullable.HasValue)
            {
                nullable = parameter.ToDate;
                DateTime date = nullable.Value;
                date = date.Date;
                DateTime toDate = date.AddDays(1.0).AddMinutes(-1.0);
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => o.InvoiceDate <= toDate);
            }
            if (parameter.ShowOpenOnly)
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => o.IsOpen);
            nullable = parameter.FromDate;
            if (nullable.HasValue)
            {
                nullable = parameter.FromDate;
                DateTime fromDate = nullable.Value.Date;
                result.InvoicesQuery = result.InvoicesQuery.Where<InvoiceHistory>(o => o.InvoiceDate >= fromDate);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
