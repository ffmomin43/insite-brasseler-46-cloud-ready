using Insite.Core.Services.Handlers;
using Insite.Core.Interfaces.Dependency;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using Insite.Core.Plugins.PaymentGateway.Results;
using Insite.PaymentGateway.Cenpos.AdministrationWebService;
using Insite.Common.DynamicLinq;
using Insite.Core.Services;
using System.Linq;
using Insite.Core.Providers;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Handlers
{
    [DependencyName("RemoveUserPaymentProfileHandler")]
    public class RemoveUserPaymentProfileHandler : HandlerBase<RemoveUserPaymentProfileParameter, RemoveUserPaymentProfileResult>
    {
        //BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users Starts

        protected readonly Lazy<CustomSettings> customSettings;

        public RemoveUserPaymentProfileHandler()
        {
            this.customSettings = new Lazy<CustomSettings>();

            if (string.IsNullOrEmpty(this.UserId))
            {
                //this.UserId = this.websiteConfigurationRepository.GetOrCreateByName<string>("PaymentGateway_Cenpos_UserId", SiteContext.Current.Website.Id);
                this.UserId = customSettings.Value.PaymentGateway_Cenpos_UserId;

            }
            if (string.IsNullOrEmpty(this.Password))
            {
                //this.Password = this.websiteConfigurationRepository.GetOrCreateByName<string>("PaymentGateway_Cenpos_Password", SiteContext.Current.Website.Id);                
                this.Password = customSettings.Value.PaymentGateway_Cenpos_Password;

            }
            if (this.MerchantId <= 0)
            {
                //this.MerchantId = this.websiteConfigurationRepository.GetOrCreateByName<int>("PaymentGateway_Cenpos_MerchantId", SiteContext.Current.Website.Id);/*Generic website level merchant ID.*/
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

        public override RemoveUserPaymentProfileResult Execute(IUnitOfWork unitOfWork, RemoveUserPaymentProfileParameter parameter, RemoveUserPaymentProfileResult result)
        {
            IRepository<UserPaymentProfile> repository = unitOfWork.GetRepository<UserPaymentProfile>();
            string userPaymentProfileId = parameter.UserPaymentProfileId;
            UserPaymentProfile deleted = repository.Get(userPaymentProfileId);
            //BUSA-463 Subscription: Restrict to delete CC if its saved in Subscription Order 

            var subscription = from sb in unitOfWork.GetRepository<SubscriptionBrasseler>().GetTable() join
	                                co in unitOfWork.GetRepository<CustomerOrder>().GetTable() on sb.ParentCustomerOrderId equals co.Id
	                                where co.Status != "SubscriptionCancelled" && sb.PaymentMethod == deleted.Id.ToString()
                               		&& sb.CustomerOrderId == sb.ParentCustomerOrderId
                               select sb;

            if (subscription.Count() > 0)
            {
                return this.CreateErrorServiceResult<RemoveUserPaymentProfileResult>(result, SubCode.NotFound, MessageProvider.Current.Forbidden);
            }
            this.RemoveStoredPaymentProfile(deleted.CardIdentifier); //BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users
            repository.Delete(deleted);
            return result;
        }

        //BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users Starts
        public RemoveStoredPaymentProfileResult RemoveStoredPaymentProfile(string tokenID)
        {
            DeleteRecurringSaleInformationRequest request = new DeleteRecurringSaleInformationRequest
            {
                UserId = this.UserId,
                Password = this.Password,
                MerchantId = this.MerchantId,
                RecurringSaleTokenId = tokenID
            };
            DeleteRecurringSaleInformationResponse deleteRecurringSaleInformationResponse = new AdministrationClient().DeleteRecurringSaleInformation(request);
            RemoveStoredPaymentProfileResult removeStoredPaymentProfileResult = new RemoveStoredPaymentProfileResult
            {
                Success = (deleteRecurringSaleInformationResponse.Result == 0)
            };
            if (!removeStoredPaymentProfileResult.Success)
            {
                removeStoredPaymentProfileResult.ResponseMessages.Add(string.Format("Transaction Failed: {0}", deleteRecurringSaleInformationResponse.Message));
            }
            return removeStoredPaymentProfileResult;
        }
        //BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users Ends
    }
}