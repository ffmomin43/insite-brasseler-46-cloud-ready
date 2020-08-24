using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using System;
using System.Linq;
using Insite.Core.Interfaces.Data;
using Insite.Cart.Services.Parameters;
using Insite.Customers.Services;
using Insite.Customers.Services.Results;
using Insite.Customers.Services.Parameters;
using Insite.Core.Services;
using Insite.Data.Entities;
using Insite.Core.Context;
//GetCartCollectionHandler_Brasseler : GetCartsQuery
namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("GetCartsQuery")]
    public class GetCartsQuery_Override : HandlerBase<GetCartCollectionParameter, GetCartCollectionResult>
    {
        private readonly ICustomerService customerService;

        public GetCartsQuery_Override(ICustomerService customerService)
        {
            this.customerService = customerService;
        }

        public override int Order
        {
            get
            {
                return 499;
            }
        }

        public override GetCartCollectionResult Execute(IUnitOfWork unitOfWork, GetCartCollectionParameter parameter, GetCartCollectionResult result)
        {
            //BUSA-730: For BillTo having multiple Ship to show all orders waiting for approval
            if (parameter.Status.EqualsIgnoreCase("AwaitingApproval"))
            {
                result.CartsQuery = unitOfWork.GetRepository<CustomerOrder>().GetTable().Where(o => o.ApproverUserProfileId == SiteContext.Current.UserProfileDto.Id);
                return NextHandler.Execute(unitOfWork, parameter, result);
            }
            else
            {

                GetBillToResult getBillToResult = customerService.GetBillTo(new GetBillToParameter()
                {
                    BillToId = parameter.BillToId
                });
                if (getBillToResult.ResultCode != ResultCode.Success)
                    return CreateErrorServiceResult(result, getBillToResult.SubCode, getBillToResult.Message);
                result.CartsQuery = unitOfWork.GetRepository<CustomerOrder>().GetTable().Where(o => o.CustomerId == getBillToResult.BillTo.Id);
                return NextHandler.Execute(unitOfWork, parameter, result);
            }
        }
    }
}
