using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.PaymentGateway.Cenpos.AdministrationWebService;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Handlers
{
   
    [DependencyName("PatchUserPaymentProfileHandler")]
    public class PatchUserPaymentProfileHandler : HandlerBase<PatchUserPaymentProfileParameter, PatchUserPaymentProfileResult>
    {
        //BUSA-1122 updating existing payment profile

        protected readonly Lazy<CustomSettings> customSettings;

        public PatchUserPaymentProfileHandler()
        {
            this.customSettings = new Lazy<CustomSettings>();

            if (string.IsNullOrEmpty(this.UserId))
            {
                this.UserId = customSettings.Value.PaymentGateway_Cenpos_UserId;
            }
            if (string.IsNullOrEmpty(this.Password))
            {         
                this.Password = customSettings.Value.PaymentGateway_Cenpos_Password;
            }
            if (this.MerchantId <= 0)
            {
                this.MerchantId = customSettings.Value.PaymentGateway_Cenpos_MerchantId;
            }
        }

        public override int Order
        {
            get
            {
                return 500;
            }
        }

        protected string UserId
        {
            get;
            set;
        }

        protected int MerchantId
        {
            get;
            set;
        }

        protected string Password
        {
            get;
            set;
        }

 

        public override PatchUserPaymentProfileResult Execute(IUnitOfWork unitOfWork, PatchUserPaymentProfileParameter parameter, PatchUserPaymentProfileResult result)
        {
            IRepository<UserPaymentProfile> repository = unitOfWork.GetRepository<UserPaymentProfile>();
            UserPaymentProfile updated = repository.Get(parameter.Id);
            updated.ExpirationDate = parameter.ExpirationDate;
            unitOfWork.Save();

            ModifyRecurringSaleInformationRequest request = new ModifyRecurringSaleInformationRequest
            {
                UserId = this.UserId,
                Password = this.Password,
                MerchantId = this.MerchantId,
                RecurringSaleTokenIdToModify = parameter.CardIdentifier,
                CardExpirationDate = parameter.ExpirationDate,
                CustomerCode = SiteContext.Current.BillTo.CustomerNumber
            };
            ModifyRecurringSaleInformationResponse modifyRecurringSaleInformationResponse = new AdministrationClient().ModifyRecurringSaleInformation(request);  //BUSA-1122 Cenpos call to modify existing stored payment profile
            
            if(modifyRecurringSaleInformationResponse.Result == 0)
            {
                return result;

            }
            else
            {
                return this.CreateErrorServiceResult<PatchUserPaymentProfileResult>(result, SubCode.GeneralFailure, "Error occured while processing the card");
            }
           
        }

       
    }
}
