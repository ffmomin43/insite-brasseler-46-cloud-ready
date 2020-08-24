using Insite.Common.Logging;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.Integration;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using Insite.Integration.WebService.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Threading;
//BUSA: 754- Emails need to be triggered for Smart Supply subscription.
namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("SubscriptionCreditCardExpiryPostProcessor")]
    class SubscriptionCreditCardExpiryPostProcessor : IntegrationBase, IJobPostprocessor
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;
        string SmartSupplyCCNotification = string.Empty;
        string emailTo = string.Empty;
        public DateTimeKind CCExpiryDate { get; set; }
        public string OrderNumber { get; set; }
        public Guid CustomerOrderId { get; set; }
        public string CardType { get; set; }
        public string CardNumber { get; set; }
        public Guid InitiatedByUserProfileId { get; set; }

        public SubscriptionCreditCardExpiryPostProcessor(Insite.Data.Entities.IntegrationJob intr, IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, IEmailService emailService)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.IntegrationJobSchedulingService = integrationJobSchedulingService;
            this.EmailService = emailService;
            this.IntegrationJob = intr;
        }

        public void Cancel()
        {
            throw new NotImplementedException();
        }

        public IJobLogger JobLogger { get; set; }

        public IntegrationJob IntegrationJob { get; set; }

        protected readonly IEmailService EmailService;

        public void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            try
            {
                //SmartSupplyCCNotification = this.UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("SmartSupplyCreditCardNotification", SiteContext.Current.Website.Id);
                SmartSupplyCCNotification = customSettings.Value.SmartSupplyCreditCardNotification;
                int priorMonths = !string.IsNullOrEmpty(SmartSupplyCCNotification) ? int.Parse(SmartSupplyCCNotification) : 0;

                var notifyDate = DateTimeOffset.Now.Date.AddMonths(priorMonths).ToString("MMyy");

                var expiredCreditCards = this.UnitOfWork.GetRepository<UserPaymentProfile>().GetTable().Where(x => x.ExpirationDate == notifyDate);

                if (expiredCreditCards.Count() == 0)
                {
                    return;
                }
                this.UnitOfWork.BeginTransaction();
                var userProfileRepository = this.UnitOfWork.GetRepository<UserProfile>().GetTable();

                var emailList = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyCreditCardExpiryNotification", "SmartSupply Credit Card Expiry Notification");

                foreach (var creditCard in expiredCreditCards)
                {
                    dynamic emailModel = new ExpandoObject();
                    emailTo = creditCard.CreatedBy;
                    emailModel.cardType = creditCard.CardType;
                    emailModel.cardMaskedNumber = (creditCard.MaskedCardNumber.Length > 3) ? creditCard.MaskedCardNumber.Substring(creditCard.MaskedCardNumber.Length - 5, 5) : creditCard.MaskedCardNumber;
                    EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject, this.UnitOfWork);
                }
            }
            catch (Exception ex)
            {
                LogHelper.For(this).Error(ex);
                throw;
            }
        }
    }
}