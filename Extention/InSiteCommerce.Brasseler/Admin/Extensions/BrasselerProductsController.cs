using Insite.Admin.Attributes;
using Insite.Admin.Controllers.OData;
using Insite.Admin.ODataExtensions;
using Insite.Core.ApplicationDictionary;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.EnumTypes;
using Insite.Data.Entities;
using Insite.Data.Extensions;
using Microsoft.AspNet.OData.Routing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.OData;
//using System.Web.OData.Routing;

namespace InSiteCommerce.Brasseler.Admin.Extensions
{
    [ODataRoutePrefix("products")]
    [AdminApiAuthorization(typeof(Insite.Data.Entities.Product))]
    public class BrasselerProductsController : ProductsController
    {
        public BrasselerProductsController(IUnitOfWorkFactory unitOfWorkFactory, Lazy<IEntityDefinitionProvider> entityDefinitionProvider)
      : base(unitOfWorkFactory, entityDefinitionProvider)
        {
        }
    }
}
