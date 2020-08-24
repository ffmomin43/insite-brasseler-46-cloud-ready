using Insite.Core.Interfaces.Dependency;
using Insite.Integration.WebService.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using Insite.Data.Entities;
using System.Data;
using System.Threading;
using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using Insite.Common.Logging;
using System.Dynamic;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Utilities;
using System.Data.Entity;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("SmartSupplyShippingNotification")]
    class SubscriptionShippingNotificationPostProcessor : IntegrationBase, IJobPostprocessor
    {
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IEmailService EmailService;
        protected readonly IContentManagerUtilities ContentManagerUtilities;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly ICurrencyFormatProvider CurrencyFormatProvider;
        protected readonly IOrderLineUtilities OrderLineUtilities;

        public IJobLogger JobLogger { get; set; }
        public IntegrationJob IntegrationJob { get; set; }

        string SubscriptionShippingNotificationDays = string.Empty;
        string emailTo = string.Empty;
        string companyName = string.Empty;

        public SubscriptionShippingNotificationPostProcessor(IUnitOfWorkFactory unitOfWorkFactory, IEmailService emailService, IEmailTemplateUtilities emailTemplateUtilities, IContentManagerUtilities contentManagerUtilities, ICurrencyFormatProvider currencyFormatProvider, IOrderLineUtilities OrderLineUtilities)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.EmailService = emailService;
            this.ContentManagerUtilities = contentManagerUtilities;
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.CurrencyFormatProvider = currencyFormatProvider;
            this.OrderLineUtilities = OrderLineUtilities;
        }

        public void Cancel()
        {
            throw new NotImplementedException();
        }

        public void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            try
            {
                //SubscriptionShippingNotificationDays = this.UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("SmartSupplyShippingNotification", SiteContext.Current.Website.Id);
                SubscriptionShippingNotificationDays = customSettings.Value.SmartSupplyShippingNotification;
                int priorDays = !string.IsNullOrEmpty(SubscriptionShippingNotificationDays) ? int.Parse(SubscriptionShippingNotificationDays) : 0;
                //BUSA-1168 : Added status check on SubscriptionBrasseler row to avoid cancelled smartsupply.
                var notifyDate = DateTimeOffset.Now.AddDays(priorDays);

                var subscriptionOrders = from sb in this.UnitOfWork.GetRepository<SubscriptionBrasseler>().GetTable()
                                         join co in this.UnitOfWork.GetRepository<CustomerOrder>().GetTable()
                                         on sb.CustomerOrderId equals co.Id
                                         where co.Status == "SubscriptionOrder" && (DbFunctions.TruncateTime(sb.NextDelieveryDate) == DbFunctions.TruncateTime(notifyDate))
                                         select sb;

                if (subscriptionOrders.Count() == 0)
                {
                    return;
                }
                this.UnitOfWork.BeginTransaction();
                var repository = this.UnitOfWork.GetRepository<CustomerOrder>().GetTable();

                if (repository != null)
                {
                    var emailList = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyShippingNotificationEmailList", "SmartSupply Shipping Notification");
                    foreach (var subscriptionOrder in subscriptionOrders)
                    {
                        JobLogger.Info("id" + subscriptionOrder.Id +" /n   custmrordrid"+subscriptionOrder.CustomerOrderId+ "  parentid"
                            +subscriptionOrder.ParentCustomerOrderId);
                        dynamic emailModel = new ExpandoObject();
                        PopulateEmailModel(subscriptionOrder, emailModel, repository);
                        EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject + " " + subscriptionOrder.NextDelieveryDate.ToString("MM-dd-yy"), this.UnitOfWork);
                    }
                }
            }
            catch (Exception ex)
            {
                LogHelper.For(this).Error(ex);
                throw;
            }
        }

        public void PopulateEmailModel(SubscriptionBrasseler subscriptionOrder, dynamic emailModel, IQueryable<CustomerOrder> repository)
        {
            var customerOrder = repository.Where(x => x.Id == subscriptionOrder.CustomerOrderId).FirstOrDefault();

            Currency currency = (Insite.Data.Entities.Currency)null;
            if (customerOrder.CurrencyId.HasValue)
                currency = this.UnitOfWork.GetTypedRepository<ICurrencyRepository>().Get(customerOrder.CurrencyId.Value);

            List<ExpandoObject> expandoObjectList = new List<ExpandoObject>();

            emailModel.ShippingDate = string.Format("{0:D}", subscriptionOrder.NextDelieveryDate);
            emailTo = subscriptionOrder.CreatedBy; //BUSA-1120 User received an SS email though he didn't opt for SmartSupply.
            emailModel.OrderNumber = customerOrder.OrderNumber;
            emailModel.SubscriptionShippingNotificationDays = SubscriptionShippingNotificationDays;

            companyName = (customerOrder.STCompanyName.IsBlank() ? string.Concat(customerOrder.STFirstName, " ", customerOrder.STLastName).Trim() : customerOrder.STCompanyName);
            emailModel.STDisplayName = companyName;
            emailModel.STAddress1 = customerOrder.STAddress1;
            emailModel.STAddress2 = customerOrder.STAddress2;
            emailModel.STAddress3 = customerOrder.STAddress3;
            emailModel.STCity = customerOrder.STCity;
            emailModel.STState = customerOrder.STState;
            emailModel.STZip = customerOrder.STPostalCode;
            emailModel.STPostalCode = customerOrder.STPostalCode;
            emailModel.CustomerNumber = customerOrder.CustomerNumber;
            if (customerOrder != null && !string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence))
            {
                emailModel.CustomerShipToNumber = customerOrder.ShipTo.CustomerSequence;
            }
            else
            {
                emailModel.CustomerShipToNumber = string.Empty;
            }
            foreach (OrderLine orderLine in (IEnumerable<OrderLine>)customerOrder.OrderLines)
            {
                dynamic obj1 = new ExpandoObject();
                obj1.ProductName = orderLine.Product.Name;
                obj1.Description = orderLine.Description;
                obj1.QtyOrdered = decimal.Round(orderLine.QtyOrdered, 2);
                obj1.QtyOrderedDisplay = obj1.QtyOrdered.ToString("0.##");
                obj1.ActualPrice = this.CurrencyFormatProvider.GetString(orderLine.UnitNetPrice, currency);
                obj1.ExtPrice = this.CurrencyFormatProvider.GetString(this.OrderLineUtilities.GetTotalNetPrice(orderLine), currency);
                expandoObjectList.Add(obj1);
            }
            emailModel.OrderLines = expandoObjectList;
        }
    }
}
