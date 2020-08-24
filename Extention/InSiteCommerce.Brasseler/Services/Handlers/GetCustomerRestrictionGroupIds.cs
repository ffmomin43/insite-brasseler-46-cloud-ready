using Insite.Core.Plugins.Search.Enums;
using Insite.Search.Elasticsearch.DocumentTypes.Product.Query.Pipelines.Parameters;
using Insite.Search.Elasticsearch.DocumentTypes.Product.Query.Pipelines.Results;
using Nest;
using Insite.Search.Elasticsearch;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Insite.Data.Entities;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Interfaces.Data;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    public class GetCustomerRestrictionGroupIds : IPipe<FormRestrictionGroupFilterParameter, FormRestrictionGroupFilterResult>, IMultiInstanceDependency, IDependency, IExtension
    {
        public int Order
        {
            get
            {
                return 499;
            }
        }

        public FormRestrictionGroupFilterResult Execute(IUnitOfWork unitOfWork, FormRestrictionGroupFilterParameter parameter, FormRestrictionGroupFilterResult result)
        {
            if (parameter.SiteContext.BillTo == null)
                return result;
            if (parameter.SiteContext.BillTo != null && parameter.SiteContext.ShipTo != null)
                result.CustomerRestrictionGroupIds = new HashSet<Guid>(result.WebsiteRestrictionGroupQuery.Where(o => o.Customers.Any(p => p.Id == parameter.SiteContext.ShipTo.Id)).Select(o => o.Id));
            else if (parameter.SiteContext.BillTo != null)
                result.CustomerRestrictionGroupIds = new HashSet<Guid>(result.WebsiteRestrictionGroupQuery.Where(o => o.Customers.Any(p => p.Id == parameter.SiteContext.BillTo.Id)).Select(o => o.Id));
            return result;
        }
    }
}
