using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Integration;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using Insite.Integration.WebService.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Threading;
//BUSA: 754- Emails need to be triggered for Smart Supply subscription.
namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("SmartSupplyModifiedOrdersPostProcessor")]
    class SmartSupplyModifiedOrdersPostProcessor : IntegrationBase, IJobPostprocessor
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly ICurrencyFormatProvider CurrencyFormatProvider;
        protected readonly IOrderLineUtilities OrderLineUtilities;

        string emailTo = string.Empty;
        string companyName = string.Empty;

        public SmartSupplyModifiedOrdersPostProcessor(IntegrationJob integrationJob, IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, IEmailService emailService, ICurrencyFormatProvider currencyFormatProvider, IOrderLineUtilities OrderLineUtilities)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.IntegrationJobSchedulingService = integrationJobSchedulingService;
            this.EmailService = emailService;
            this.IntegrationJob = integrationJob;
            this.CurrencyFormatProvider = currencyFormatProvider;
            this.OrderLineUtilities = OrderLineUtilities;
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
                var subscriptionModifiedOrders = (from sb in this.UnitOfWork.GetRepository<SubscriptionBrasseler>().GetTable()
                                                  join co in this.UnitOfWork.GetRepository<CustomerOrder>().GetTable()
                                                  on sb.CustomerOrderId equals co.Id
                                                  where sb.IsModified == true && co.Status.ToUpper() == "SUBSCRIPTIONORDER"
                                                  select new
                                                  {
                                                      SubscriptionBrasseler = sb,
                                                      CustomerOrder = co
                                                  }
                                                  ).ToList();

                if (subscriptionModifiedOrders.Count() == 0)
                {
                    return;
                }
                this.UnitOfWork.BeginTransaction();
                var emailList = UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyModificationEmailList", "SmartSupply Modification");
                foreach (var subscriptionOrder in subscriptionModifiedOrders)
                {
                    dynamic emailModel = new ExpandoObject();
                    PopulateEmailModel(subscriptionOrder, emailModel);
                    EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject, this.UnitOfWork);

                    //BUSA-765: Need to trigger SS modify emails to both Approver and Requester start
                    string requesteremailid = Convert.ToString(subscriptionOrder.CustomerOrder.InitiatedByUserProfileId); //BUSA-845 SS modified job failed
                    string approver_ID = Convert.ToString(this.UnitOfWork.GetRepository<UserProfile>().GetTable().FirstOrDefault(x => x.Id.ToString() == requesteremailid).ApproverUserProfileId);
                    if (!string.IsNullOrEmpty(approver_ID))
                    {
                        string approver_email = this.UnitOfWork.GetRepository<UserProfile>().GetTable().FirstOrDefault(x => x.Id.ToString() == approver_ID).Email;
                        EmailService.SendEmailList(emailList.Id, approver_email, emailModel, emailList.Subject, this.UnitOfWork);
                    }
                    //BUSA-765: Need to trigger SS modify emails to both Approver and Requester end
                    subscriptionOrder.SubscriptionBrasseler.IsModified = false; //BUSA - 762.
                    this.UnitOfWork.Save();
                }
                this.UnitOfWork.CommitTransaction();
            }
            catch (Exception ex)
            {
                LogHelper.For(this).Error(ex);
                throw;
            }
        }

        public void PopulateEmailModel(dynamic subscriptionOrder, dynamic emailModel)
        {

            List<ExpandoObject> expandoObjectList = new List<ExpandoObject>();

            emailTo = subscriptionOrder.CustomerOrder.PlacedByUserName;
            emailModel.OrderNumber = subscriptionOrder.CustomerOrder.OrderNumber;
            emailModel.SmartSupplyFrequency = subscriptionOrder.SubscriptionBrasseler.Frequency / 7;
            companyName = String.IsNullOrEmpty(subscriptionOrder.CustomerOrder.STCompanyName) ? string.Concat(subscriptionOrder.CustomerOrder.STFirstName, " ", subscriptionOrder.CustomerOrder.STLastName).Trim() : subscriptionOrder.CustomerOrder.STCompanyName;
            emailModel.STDisplayName = companyName;
            emailModel.STAddress1 = subscriptionOrder.CustomerOrder.STAddress1;
            emailModel.STAddress2 = subscriptionOrder.CustomerOrder.STAddress2;
            emailModel.STAddress3 = subscriptionOrder.CustomerOrder.STAddress3;
            emailModel.STCity = subscriptionOrder.CustomerOrder.STCity;
            emailModel.STState = subscriptionOrder.CustomerOrder.STState;
            emailModel.STZip = subscriptionOrder.CustomerOrder.STPostalCode;
            emailModel.STPostalCode = subscriptionOrder.CustomerOrder.STPostalCode;
            emailModel.CustomerNumber = subscriptionOrder.CustomerOrder.CustomerNumber;
            if (subscriptionOrder.CustomerOrder.ShipTo != null && !string.IsNullOrEmpty(subscriptionOrder.CustomerOrder.ShipTo.CustomerSequence))
            {

                emailModel.CustomerShipToNumber = subscriptionOrder.CustomerOrder.ShipTo.CustomerSequence;
            }
            else
            {
                emailModel.CustomerShipToNumber = string.Empty;
            }
            foreach (OrderLine orderLine in (IEnumerable<OrderLine>)subscriptionOrder.CustomerOrder.OrderLines)
            {
                dynamic obj1 = new ExpandoObject();
                obj1.ProductName = orderLine.Product.Name;
                obj1.Description = orderLine.Description;
                obj1.QtyOrdered = decimal.Round(orderLine.QtyOrdered, 2);
                obj1.QtyOrderedDisplay = obj1.QtyOrdered.ToString("0.##");
                expandoObjectList.Add(obj1);
            }
            emailModel.OrderLines = expandoObjectList;
        }
    }
}
