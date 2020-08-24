using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common.DynamicLinq;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("ApplySort")]
    public sealed class ApplySort : HandlerBase<GetCartCollectionParameter, GetCartCollectionResult>
    {
        private readonly ICustomerOrderUtilities customerOrderUtilities;

        public ApplySort(ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }

        public override int Order
        {
            get
            {
                return 700;
            }
        }

        public override GetCartCollectionResult Execute(
          IUnitOfWork unitOfWork,
          GetCartCollectionParameter parameter,
          GetCartCollectionResult result)
        {
            if (parameter.Sort.IsBlank())
            {
                result.CartsQuery = (IQueryable<CustomerOrder>)result.CartsQuery.OrderByDescending<CustomerOrder, DateTimeOffset>((Expression<Func<CustomerOrder, DateTimeOffset>>)(x => x.ModifiedOn));
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            }
            if (parameter.Sort.ContainsCaseInsensitive("ordergrandtotal"))
            {
                bool flag = parameter.Sort.EndsWithIgnoreCase("DESC");
                List<CustomerOrder> list = result.CartsQuery.ToList<CustomerOrder>();
                Dictionary<Guid, Decimal> cartsDictionary = list.ToDictionary<CustomerOrder, Guid, Decimal>((Func<CustomerOrder, Guid>)(cart => cart.Id), (Func<CustomerOrder, Decimal>)(cart => this.customerOrderUtilities.GetOrderTotal(cart)));
                result.CartsQuery = flag ? list.OrderByDescending<CustomerOrder, Decimal>((Func<CustomerOrder, Decimal>)(x => cartsDictionary[x.Id])).AsQueryable<CustomerOrder>() : list.OrderBy<CustomerOrder, Decimal>((Func<CustomerOrder, Decimal>)(x => cartsDictionary[x.Id])).AsQueryable<CustomerOrder>();
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            }
            if (parameter.Sort.ContainsCaseInsensitive("ordersubtotal"))
            {
                bool flag = parameter.Sort.EndsWithIgnoreCase("DESC");
                List<CustomerOrder> list = result.CartsQuery.ToList<CustomerOrder>();
                Dictionary<Guid, Decimal> cartsDictionary = list.ToDictionary<CustomerOrder, Guid, Decimal>((Func<CustomerOrder, Guid>)(cart => cart.Id), (Func<CustomerOrder, Decimal>)(cart => this.customerOrderUtilities.GetOrderSubTotal(cart)));
                result.CartsQuery = flag ? list.OrderByDescending<CustomerOrder, Decimal>((Func<CustomerOrder, Decimal>)(x => cartsDictionary[x.Id])).AsQueryable<CustomerOrder>() : list.OrderBy<CustomerOrder, Decimal>((Func<CustomerOrder, Decimal>)(x => cartsDictionary[x.Id])).AsQueryable<CustomerOrder>();
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            }
            if (parameter.Sort.ContainsCaseInsensitive("initiatedbyusername"))
            {
                bool flag = parameter.Sort.EndsWithIgnoreCase("DESC");
                parameter.Sort = "InitiatedByUserProfile.UserName" + (flag ? " DESC" : string.Empty);
            }
            result.CartsQuery = result.CartsQuery.OrderBy<CustomerOrder>(parameter.Sort);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
