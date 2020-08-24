using Insite.Core.Attributes;
using Insite.Core.Services.Handlers;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Data;

namespace InSiteCommerce.Brasseler.CustomAPI.Services
{
    //[ModuleService("UserPaymentProfileService", "CustomAPIs", null)]  //Removed in 4.4
    public class UserPaymentProfileService : Insite.Core.Services.ServiceBase, IUserPaymentProfileService, IInterceptable, IDependency
    {
        private readonly IHandlerFactory handlerFactory;

        public UserPaymentProfileService(IUnitOfWorkFactory unitOfWorkFactory, IHandlerFactory handlerFactory)
      : base(unitOfWorkFactory)
        {
            this.handlerFactory = handlerFactory;
        }

        [Transaction]
        public GetUserPaymentProfileCollectionResult GetUserPaymentProfileCollection(GetUserPaymentProfileCollectionParameter parameter)
        {
            return this.handlerFactory.GetHandler<IHandler<GetUserPaymentProfileCollectionParameter, GetUserPaymentProfileCollectionResult>>().Execute(this.UnitOfWork, parameter, new GetUserPaymentProfileCollectionResult());

        }

        [Transaction]
        public RemoveUserPaymentProfileResult RemoveUserPaymentProfile(RemoveUserPaymentProfileParameter parameter)
        {
            return this.handlerFactory.GetHandler<IHandler<RemoveUserPaymentProfileParameter,RemoveUserPaymentProfileResult>>().Execute(this.UnitOfWork, parameter, new RemoveUserPaymentProfileResult());
        }

        [Transaction] //BUSA-1122 updating existing payment profile
        public PatchUserPaymentProfileResult PatchUserPaymentProfile(PatchUserPaymentProfileParameter parameter)
        {
            return this.handlerFactory.GetHandler<IHandler<PatchUserPaymentProfileParameter, PatchUserPaymentProfileResult>>().Execute(this.UnitOfWork, parameter, new PatchUserPaymentProfileResult());
        }


    }
}
