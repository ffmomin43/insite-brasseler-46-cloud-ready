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
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{

    [DependencyName("ValidateAvailability")]
    public class ValidateAvailability : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly Lazy<ICustomerService> customerService;
        private readonly IAuthenticationService authenticationService;
     

        public ValidateAvailability(Lazy<ICustomerService> customerService, IAuthenticationService authenticationService)
        {
            this.customerService = customerService;
            this.authenticationService = authenticationService;
        }

        public override int Order
        {
            get
            {
                return 690;
            }
        }

        public override GetCartResult Execute(IUnitOfWork unitOfWork, GetCartParameter parameter, GetCartResult result)
        {
            if (!parameter.CartId.HasValue)
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            UserProfileDto userProfile = SiteContext.Current.UserProfileDto ?? SiteContext.Current.RememberedUserProfileDto;
            if (userProfile == null)
                return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
            if (!result.Cart.PlacedByUserName.IsBlank() && result.Cart.PlacedByUserName.Equals(userProfile.UserName))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            Guid? nullable = result.Cart.PlacedByUserProfileId;
            if (!result.Cart.Status.EqualsIgnoreCase("Return Requested"))
            {
                if (!nullable.HasValue)
                    return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
                nullable = result.Cart.PlacedByUserProfileId;
                if (nullable.Equals((object)userProfile.Id))
                    return this.NextHandler.Execute(unitOfWork, parameter, result);
                nullable = result.Cart.PlacedByUserProfile.ApproverUserProfileId;
                if (nullable.HasValue)
                {
                    nullable = result.Cart.PlacedByUserProfile.ApproverUserProfileId;
                    if (nullable.Equals((object)userProfile.Id))
                        return this.NextHandler.Execute(unitOfWork, parameter, result);
                }
            }
            if ((result.Cart.Status.EqualsIgnoreCase("AwaitingApproval") || result.Cart.Status.EqualsIgnoreCase("Submitted")) && this.authenticationService.IsUserInRole(userProfile.UserName, "Administrator"))
            {
                if (!result.Cart.Customer.UserProfiles.Any<UserProfile>((Func<UserProfile, bool>)(up => up.Id.Equals(userProfile.Id))))
                    return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
                ICustomerService customerService = this.customerService.Value;
                GetShipToCollectionParameter parameter1 = new GetShipToCollectionParameter();
                parameter1.BillToId = new Guid?(result.Cart.Customer.Id);
                parameter1.AssignedOnly = true;
                parameter1.ExcludeBillTo = true;
                parameter1.ExcludeShowAll = true;
                parameter1.Page = new int?(1);
                parameter1.PageSize = new int?(1);
                GetShipToCollectionResult shipToCollection = customerService.GetShipToCollection(parameter1);
                if (shipToCollection.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<GetCartResult>(result, shipToCollection.SubCode, shipToCollection.Message);
                if (shipToCollection.TotalCount == 0)
                    return this.NextHandler.Execute(unitOfWork, parameter, result);
                GetShipToResult shipTo = this.customerService.Value.GetShipTo(new GetShipToParameter()
                {
                    BillToId = new Guid?(result.Cart.Customer.Id),
                    ShipToId = new Guid?(result.Cart.ShipTo.Id)
                });
                if (shipTo.ResultCode == ResultCode.Success)
                    return this.NextHandler.Execute(unitOfWork, parameter, result);
                if (shipTo.SubCode != SubCode.NotFound)
                    return this.CreateErrorServiceResult<GetCartResult>(result, shipTo.SubCode, shipTo.Message);
                return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
            }
            // BUSA-463 : To allow other user see subscription order.
            // Added "Retur Requested" condition for RMA.
            if (result.Cart.Status.EqualsIgnoreCase("SubscriptionOrder") || result.Cart.Status.EqualsIgnoreCase("Return Requested"))
            {
              return this.NextHandler.Execute(unitOfWork, parameter, result);
            }
            if (result.Cart.Type == "Order")
                return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
            nullable = (Guid?)result.Cart.Salesperson?.UserProfileId;
            Guid id1 = userProfile.Id;
            if ((nullable.HasValue ? (nullable.HasValue ? (nullable.GetValueOrDefault() != id1 ? 1 : 0) : 0) : 1) != 0)
            {
                nullable = (Guid?)result.Cart.Salesperson?.SalesManager?.UserProfileId;
                Guid id2 = userProfile.Id;
                if ((nullable.HasValue ? (nullable.HasValue ? (nullable.GetValueOrDefault() != id2 ? 1 : 0) : 0) : 1) != 0)
                    return this.CreateErrorServiceResult<GetCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}