using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.Integration;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Services;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using Newtonsoft.Json;

//BUSA: PIO Job to retry all PayOpenInvoices API calls.
namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("PostToInforPostProcessor")]
    public class PostToInforPostProcessor : IntegrationBase, IJobPostprocessor
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;
        protected OutstandingInvoiceService outstandingInvoiceService;
        protected List<InvoiceList> invoiceList;


        public PostToInforPostProcessor(IntegrationJob integrationJob, IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, OutstandingInvoiceService OutstandingInvoiceService)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.IntegrationJobSchedulingService = integrationJobSchedulingService;
            this.IntegrationJob = integrationJob;
            this.outstandingInvoiceService = OutstandingInvoiceService;
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
                var failedInforTransactions = (from it in this.UnitOfWork.GetRepository<InvoiceInforTransaction>().GetTable()
                                               join cc in this.UnitOfWork.GetRepository<CreditCardTransaction>().GetTable()
                                               on it.AuthCode equals cc.AuthCode
                                               where it.PostedToInfor == false
                                               select new
                                               {
                                                   InvoiceInforTransaction = it,
                                                   CreditCardTransaction = cc
                                               }
                                                  ).ToList();



                if (failedInforTransactions.Count() == 0)
                {
                    return;
                }
                this.UnitOfWork.BeginTransaction();

                foreach (var failedTransaction in failedInforTransactions)
                {
                    PayOpenInvoicesRequest payOpenInvoicesRequest = new PayOpenInvoicesRequest();
                    PayOpenInvoicesHead head = new PayOpenInvoicesHead();
                    PayOpenInvoicesCreditCard creditCard = new PayOpenInvoicesCreditCard();
                    payOpenInvoicesRequest.Invoice = new List<PayOpenInvoicesInvoice>();
                    //head.CompanyNumber = customSettings.CompanyNameIdentifier;
                    head.CompanyNumber = failedTransaction.CreditCardTransaction.CustomerNumber.Substring(0, 1);
                    head.CustomerNumber = failedTransaction.CreditCardTransaction.CustomerNumber.Substring(1);
                    head.SettlementDate = failedTransaction.CreditCardTransaction.TransactionDate.Date.ToString("MMddyyyy");
                    head.MonetaryAmount = failedTransaction.CreditCardTransaction.Amount.ToString();
                    creditCard.CCCustomerID = "0" + head.CompanyNumber + failedTransaction.CreditCardTransaction.CustomerNumber.Substring(1).PadLeft(10, '0');
                    creditCard.CCPaymentType = "CENPOS";
                    //string expirationMonth = parameter1.CreditCard.ExpirationMonth.ToString("00");
                    string expiryYear = failedTransaction.CreditCardTransaction.ExpirationDate.Remove(0, failedTransaction.CreditCardTransaction.ExpirationDate.Length - 2);
                    creditCard.CCCreditCardExp = string.Concat(failedTransaction.CreditCardTransaction.ExpirationDate.Substring(0, 2), expiryYear);
                    creditCard.CCCardHolder = failedTransaction.CreditCardTransaction.Name; //to check for saved cards
                    creditCard.CCAuthorizationAmount = failedTransaction.CreditCardTransaction.Amount.ToString();
                    creditCard.CCMerchantId = customSettings.Value.PaymentGateway_Cenpos_MerchantId.ToString();
                    creditCard.CCMaskedCard = failedTransaction.InvoiceInforTransaction.CCMaskedCard;
                    //creditCard.CCToken = failedTransaction.CreditCardTransaction.PNRef.Substring(0, failedTransaction.CreditCardTransaction.PNRef.IndexOf('|'));
                    creditCard.CCToken = "NOTOKEN_" + failedTransaction.CreditCardTransaction.AuthCode.Substring(failedTransaction.CreditCardTransaction.AuthCode.Length - 4);
                    creditCard.CCCardType = failedTransaction.InvoiceInforTransaction.CardType;
                    creditCard.CCAuthorizationNumber = failedTransaction.CreditCardTransaction.AuthCode;
                    creditCard.CCReferenceNumber = failedTransaction.InvoiceInforTransaction.CCReferenceNumber;
                    var CCEmail = this.UnitOfWork.GetRepository<Customer>().GetTableAsNoTracking().Where(customer => customer.CustomerNumber == failedTransaction.CreditCardTransaction.CustomerNumber).FirstOrDefault().Email;
                    creditCard.CCEmail = CCEmail; //check the mail
                    creditCard.CCCustomerCode = failedTransaction.CreditCardTransaction.CustomerNumber.Substring(1).PadLeft(10, '0');
                    creditCard.CCEND = "Y";
                    payOpenInvoicesRequest.Head = head;
                    payOpenInvoicesRequest.CreditCard = creditCard;
                    payOpenInvoicesRequest.Name = "PayOpenInvoices";
                    invoiceList = JsonConvert.DeserializeObject<List<InvoiceList>>(failedTransaction.InvoiceInforTransaction.InvoiceNumber);

                    foreach (InvoiceList inv in invoiceList)
                    {
                        PayOpenInvoicesInvoice payOpenInvoicesInvoice = new PayOpenInvoicesInvoice();
                        payOpenInvoicesInvoice.InvoiceNo = inv.InvoiceNo;//
                        payOpenInvoicesInvoice.DiscountTakenAmount = "";
                        payOpenInvoicesInvoice.InvoiceNote = inv.InvoiceNote;
                        payOpenInvoicesInvoice.PaymentAmount = (invoiceList.Count() > 1) ? inv.PaymentAmount : head.MonetaryAmount;//when paying for single
                        payOpenInvoicesRequest.Invoice.Add(payOpenInvoicesInvoice);

                    }
                    var response = this.outstandingInvoiceService.PayOpenInvoicesJob(payOpenInvoicesRequest);
                    if (!response.IsSuccessStatusCode)
                    {

                        JobLogger.Error("Post to infor for " + creditCard.CCAuthorizationNumber + " failed :" + response);
                    }
                    else
                    {
                        failedTransaction.InvoiceInforTransaction.PostedToInfor = true;
                        JobLogger.Error("Post to infor for " + creditCard.CCAuthorizationNumber + " successful :" + response);
                    }

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

    }
}
