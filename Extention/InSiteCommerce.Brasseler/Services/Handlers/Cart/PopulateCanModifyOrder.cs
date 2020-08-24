using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Customers.Services;
using Insite.Customers.Services.Parameters;
using Insite.Customers.Services.Results;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{

    [DependencyName("PopulateCanModifyOrder")]
    public class PopulateCanModifyOrder : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly Lazy<ICustomerService> customerService;
        private readonly IAuthenticationService authenticationService;

        public List<string> CanModifyOrderStatuses
        {
            get
            {
                return new List<string>()
        {
          "Cart",
          "Saved",
          "AwaitingApproval",
          "QuoteProposed",
          "QuoteRejected",
          "QuoteRequested",
          "QuoteCreated",
          "PunchOut",
          "PunchOutOrderRequest",
          "SubscriptionOrder",
          "Return Requested" //BUSA-1070: Added "Return Requested" Status for RMA
        };
            }
        }

        public PopulateCanModifyOrder(Lazy<ICustomerService> customerService, IAuthenticationService authenticationService)
        {
            this.customerService = customerService;
            this.authenticationService = authenticationService;
        }

        public override int Order
        {
            get
            {
                return 1399;
            }
        }

        public override GetCartResult Execute(IUnitOfWork unitOfWork, GetCartParameter parameter, GetCartResult result)
        {
            result.CanModifyOrder = this.CanModifyOrderStatuses.Contains(result.Cart.Status);
            if (parameter.ForModification && !result.CanModifyOrder)
                return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Cart_CartCantBeModified);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}