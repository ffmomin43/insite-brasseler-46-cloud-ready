using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Core.Interfaces.Data;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Data.Entities;
using Insite.PunchOut.HttpHandlers;
using Insite.PunchOut.HttpHandlers.Interfaces;
using System;
using System.Linq;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.Punchout
{
    public class PunchOutSetupRequestService_Brasseler : PunchOutSetupRequestService
    {
        private readonly ICartPipeline cartPipeline;

        public PunchOutSetupRequestService_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, IPunchOutSetupRequestParser punchOutSetupRequestParser, IPunchOutProviderMessageFactory messageFactory, IPunchOutRequestValidator requestValidator, IPunchOutHandlerAddresses punchOutHandlerAddresses, IArgumentContract argumentContract, IPunchOutSetupRequestMessageFormatValidator cXmlMessageFormatValidator, IPunchOutCustomerOrderFactory customerOrderFactory, IPunchOutUserProfileProvider punchOutUserProfileProvider, IPunchOutRequestObfuscator punchOutRequestObfuscator, IPunchOutSessionUtilities punchOutSessionUtilities, ICartPipeline cartPipeline) : base( unitOfWorkFactory,  punchOutSetupRequestParser,  messageFactory,  requestValidator,  punchOutHandlerAddresses,  argumentContract,  cXmlMessageFormatValidator,  customerOrderFactory,  punchOutUserProfileProvider,  punchOutRequestObfuscator,  punchOutSessionUtilities)
        {      
            this.cartPipeline = cartPipeline;
        }
          
        
        protected override string HandleCreateNewPunchOutSetupRequestSession(string currentDomain, PunchOutSetupRequest punchOutSetupRequest, PunchOutSession punchOutSession)
        {
            IRepository<PunchOutSetupRequest> repository1 = this.UnitOfWork.GetRepository<PunchOutSetupRequest>();
            IRepository<PunchOutSession> repository2 = this.UnitOfWork.GetRepository<PunchOutSession>();
            UserProfile userProfile = this.PunchOutUserProfileProvider.GetUserProfile(punchOutSession);
            Website webSite = this.UnitOfWork.GetRepository<Website>().GetTable().FirstOrDefault<Website>((Expression<Func<Website, bool>>)(x => x.DomainName.Contains(currentDomain)));
            repository1.Insert(punchOutSetupRequest);
            this.UnitOfWork.Save();
            if (userProfile == null || webSite == null)
            {
                string createErrorResponse = this.PunchOutProviderMessageFactory.CreateSetupRequestCreateErrorResponse("Can not punch session", currentDomain);
                punchOutSetupRequest.SetupRequestResponse = createErrorResponse;
                this.UnitOfWork.Save();
                return createErrorResponse;
            }
            this.PunchOutSessionUtilities.AddPunchOutSetupRequest(punchOutSession, punchOutSetupRequest);
            CustomerOrder customerOrder = this.CustomerOrderFactory.CreateCustomerOrder(userProfile, webSite, punchOutSession);
            this.UnitOfWork.GetRepository<CustomerOrder>().Insert(customerOrder);
            punchOutSession.CustomerOrder = customerOrder;
            // Added method to assign address for customerOrder to calculate Tax
            if (string.IsNullOrEmpty(customerOrder.BTAddress1) || string.IsNullOrEmpty(customerOrder.STAddress1))
            {
                this.SetCustomerOrderAddress(customerOrder, customerOrder.Customer, customerOrder.ShipTo);
            }
            punchOutSession.UserProfileId = userProfile.Id;
            repository2.Insert(punchOutSession);            
            this.UnitOfWork.Save();
            punchOutSetupRequest.PunchOutSessionId = new Guid?(punchOutSession.Id);
            string requestSuccessResponse = this.PunchOutProviderMessageFactory.CreateSetupRequestSuccessResponse(this.TransformPunchOutHandlerAddress(currentDomain, punchOutSetupRequest), currentDomain);
            punchOutSetupRequest.SetupRequestResponse = requestSuccessResponse;
            this.UnitOfWork.Save();
            return requestSuccessResponse;
        }

        // Added method to assign address for customerOrder to calculate Tax
        protected virtual void SetCustomerOrderAddress(CustomerOrder customerOrder, Customer billTo, Customer shipTo)
        {
            customerOrder.Customer = billTo;
            customerOrder.CustomerId = billTo.Id;
            this.cartPipeline.SetBillTo(new SetBillToParameter()
            {
                Cart = customerOrder,
                BillTo = billTo
            });
            customerOrder.ShipTo = shipTo;
            customerOrder.ShipToId = shipTo.Id;
            this.cartPipeline.SetShipTo(new SetShipToParameter()
            {
                Cart = customerOrder,
                ShipTo = shipTo
            });
            customerOrder.ShipVia = this.UnitOfWork.GetRepository<ShipVia>().GetTable().FirstOrDefault<ShipVia>((Expression<Func<ShipVia, bool>>)(x => x.ErpShipCode == billTo.ShipCode));
            if (customerOrder.ShipVia == null)
                return;
            CustomerOrder customerOrder1 = customerOrder;
            customerOrder1.ShipViaId = new Guid?(customerOrder1.ShipVia.Id);
        }

    }
}
