using Insite.Account.Services;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Core.Plugins.PaymentGateway;
using Insite.Core.Plugins.PaymentGateway.Dtos;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Payments.Services;
using Insite.Payments.Services.Parameters;
using Insite.Payments.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.Services;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
//Handler to process invoice payment and post to infor
namespace InSiteCommerce.Brasseler.Services.Handlers.OutstandingInvoices
{
    [DependencyName("PayOutstandingInvoices")]
    public class PayOutstandingInvoices : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        protected readonly Lazy<IAuthenticationService> AuthenticationService;
        protected readonly ISessionService SessionService;
        protected CustomSettings customSettings;
        private readonly PaymentSettings paymentSettings;
        private readonly Lazy<IPaymentService> paymentService;
        protected AddPaymentTransactionResult transactionResult;
        protected AddPaymentTransactionResult specialForceresult;
        protected OutstandingInvoiceService outstandingInvoiceService;
        protected List<InvoiceList> invoiceList;
        protected readonly IUnitOfWorkFactory unitOfWork;
        protected CultureInfo culture;
        public override int Order
        {
            get
            {
                return 2285;
            }
        }

        public PayOutstandingInvoices(PaymentSettings paymentSettings, Lazy<IPaymentService> paymentService, OutstandingInvoiceService OutstandingInvoiceService, IUnitOfWorkFactory unitOfWorkFactory)
        {
            this.paymentService = paymentService;
            this.paymentSettings = paymentSettings;
            this.outstandingInvoiceService = OutstandingInvoiceService;
            this.unitOfWork = unitOfWorkFactory;

        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("PayInvoice"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            CustomerOrder cart = null;
            result = this.ProcessInvoicePayment(unitOfWork, cart, parameter, result);
            return result;
        }

        protected UpdateCartResult ProcessInvoicePayment(IUnitOfWork unitOfWork, CustomerOrder cart, UpdateCartParameter parameter, UpdateCartResult result)
        {
            string orderTotalDue = "0";
            string invoiceNumber = string.Empty;
            AddPaymentTransactionParameter parameter1 = new AddPaymentTransactionParameter();
            parameter.Properties.TryGetValue("payAmount", out orderTotalDue);
            parameter.Properties.TryGetValue("invoiceList", out invoiceNumber);
            invoiceList = JsonConvert.DeserializeObject<List<InvoiceList>>(invoiceNumber);
            culture = CultureInfo.CreateSpecificCulture("en-US");

            if (parameter.Properties.Count() > 0 && parameter.Properties.ContainsKey("payAmount"))
            {
                if (!invoiceList.Any())
                {
                    parameter1.ReferenceNumber = "OBAL";
                }
                else if (invoiceList.Count == 1)
                {
                    parameter1.ReferenceNumber = invoiceList.FirstOrDefault().InvoiceNo;
                }
                else
                {
                    parameter1.ReferenceNumber = "INV" + "-" + invoiceList.FirstOrDefault().InvoiceNo;
                }
                //BUSA-1144 : Creating US culture as amount is not coming as "," separated from UI for french.
                parameter1.Amount = Math.Round(Convert.ToDecimal(orderTotalDue, culture), 2); 
                if (parameter1.Amount <= 0)
                {
                    return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.Forbidden, "The amount should be greater than zero");
                }
                CurrencyDto currency = SiteContext.Current.CurrencyDto;
                string str = (currency != null ? currency.CurrencyCode : (string)null) ?? string.Empty;
                parameter1.CurrencyCode = str;
            }

            parameter1.CreditCard = parameter.CreditCard;

            if (parameter.PaymentProfileId != null)
            {
                parameter1.PaymentProfileId = parameter.PaymentProfileId;
                UserPaymentProfile userPaymentProfile = unitOfWork.GetRepository<UserPaymentProfile>().GetTable().FirstOrDefault(p => p.CardIdentifier == parameter.PaymentProfileId);
                if (userPaymentProfile != null)
                {
                    CreditCardDto cc = new CreditCardDto();
                    cc.CardNumber = userPaymentProfile.MaskedCardNumber;
                    cc.CardType = userPaymentProfile.CardType;
                    if (!string.IsNullOrEmpty(userPaymentProfile.ExpirationDate))
                    {
                        cc.ExpirationMonth = Convert.ToInt32(userPaymentProfile.ExpirationDate.Substring(0, 2));
                        cc.ExpirationYear = Convert.ToInt32(userPaymentProfile.ExpirationDate.Substring(2, 2));
                    }
                    parameter1.CreditCard = cc;
                }
            }

            parameter1.TransactionType = TransactionType.Capture;

            if (parameter.StorePaymentProfile)
            {
                transactionResult = this.paymentService.Value.AddPaymentTransaction(parameter1);

                if (transactionResult.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<UpdateCartResult>(result, transactionResult.SubCode, "The card transaction was declined. Please contact our customer support team.");

                this.paymentService.Value.AddPaymentProfile(new AddPaymentProfileParameter()
                {
                    CurrencyCode = parameter1.CurrencyCode,
                    BillToId = SiteContext.Current.BillTo.Id,
                    CreditCard = parameter.CreditCard
                });
            }
            else
            {
                //payment with saved card
                //if (parameter1.PaymentProfileId == null || parameter1.PaymentProfileId == "")
                //{
                //    parameter1.TransactionType = TransactionType.Sale;   //only payment with new card.
                //}
                parameter1.TransactionType = TransactionType.Sale;
                transactionResult = this.paymentService.Value.AddPaymentTransaction(parameter1);

                if (transactionResult.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<UpdateCartResult>(result, transactionResult.SubCode, "The card transaction was declined. Please contact our customer support team.");
            }

            if (transactionResult.CreditCardTransaction != null)
            {
                transactionResult.CreditCardTransaction.CustomerOrderId = null;
            }

            if (result.ResultCode != ResultCode.Success)
                return result;
            else
                try
                {
                    var response = PostPaymentToInfor(transactionResult, parameter1, invoiceNumber);
                    if (!response)
                    {
                        return this.CreateErrorServiceResult<UpdateCartResult>(result, transactionResult.SubCode, "Your invoice payment failed");
                    }
                }
                catch (Exception ex)
                {
                    return this.CreateErrorServiceResult<UpdateCartResult>(result, transactionResult.SubCode, "Your invoice payment failed" + ex);
                }
                finally
                {
                    unitOfWork.Save();
                }

            return result;
        }


        protected bool PostPaymentToInfor(AddPaymentTransactionResult transactionResult, AddPaymentTransactionParameter parameter1, string invoiceNumber)
        {
            //put logger in app log  : also DB entry in infortable
            PayOpenInvoicesRequest payOpenInvoicesRequest = new PayOpenInvoicesRequest();
            customSettings = new CustomSettings();
            PayOpenInvoicesHead head = new PayOpenInvoicesHead();
            PayOpenInvoicesCreditCard creditCard = new PayOpenInvoicesCreditCard();
            payOpenInvoicesRequest.Invoice = new List<PayOpenInvoicesInvoice>();

            head.CompanyNumber = transactionResult.CreditCardTransaction.CustomerNumber.Substring(0, 1);
            head.CustomerNumber = transactionResult.CreditCardTransaction.CustomerNumber.Substring(1);
            head.SettlementDate = transactionResult.CreditCardTransaction.TransactionDate.ToString("MMddyyyy");
            head.MonetaryAmount = transactionResult.CreditCardTransaction.Amount.ToString(culture);
            creditCard.CCCustomerID = "0" + head.CompanyNumber + transactionResult.CreditCardTransaction.CustomerNumber.Substring(1).PadLeft(10, '0');
            creditCard.CCPaymentType = "CENPOS";
            string expirationMonth = parameter1.CreditCard.ExpirationMonth.ToString("00");
            creditCard.CCCreditCardExp = string.Concat(expirationMonth, transactionResult.CreditCardTransaction.ExpirationDate.Remove(0, transactionResult.CreditCardTransaction.ExpirationDate.Length - 2));
            creditCard.CCCardHolder = transactionResult.CreditCardTransaction.Name; //to check for saved cards
            creditCard.CCAuthorizationAmount = transactionResult.CreditCardTransaction.Amount.ToString(culture);
            creditCard.CCMerchantId = customSettings.PaymentGateway_Cenpos_MerchantId.ToString();
            int cardnumberLength = parameter1.CreditCard.CardNumber.Length;
            creditCard.CCMaskedCard = parameter1.CreditCard.CardNumber.Remove(0, (parameter1.CreditCard.CardNumber.Length - 4)).PadLeft(cardnumberLength, '*');
            //creditCard.CCToken = transactionResult.CreditCardTransaction.PNRef.Substring(0, transactionResult.CreditCardTransaction.PNRef.IndexOf('|'));
            creditCard.CCToken = "NOTOKEN_"+ transactionResult.CreditCardTransaction.AuthCode.Substring(transactionResult.CreditCardTransaction.AuthCode.Length - 4);
            creditCard.CCCardType = parameter1.CreditCard.CardType == "AMERICAN EXPRESS" ? "AMEX" : parameter1.CreditCard.CardType;
            creditCard.CCAuthorizationNumber = transactionResult.CreditCardTransaction.AuthCode;
            creditCard.CCReferenceNumber = transactionResult.CreditCardTransaction.PNRef.Substring(transactionResult.CreditCardTransaction.PNRef.IndexOf('|') + 1);
            creditCard.CCEmail = SiteContext.Current.ShipTo.Email;
            creditCard.CCCustomerCode = transactionResult.CreditCardTransaction.CustomerNumber.Substring(1).PadLeft(10, '0');
            creditCard.CCEND = "Y";
            payOpenInvoicesRequest.Head = head;
            payOpenInvoicesRequest.CreditCard = creditCard;
            payOpenInvoicesRequest.Name = "PayOpenInvoices";

            foreach (InvoiceList inv in invoiceList)
            {
                PayOpenInvoicesInvoice payOpenInvoicesInvoice = new PayOpenInvoicesInvoice();
                payOpenInvoicesInvoice.InvoiceNo = inv.InvoiceNo;
                payOpenInvoicesInvoice.DiscountTakenAmount = "";
                payOpenInvoicesInvoice.InvoiceNote = inv.InvoiceNote;
                payOpenInvoicesInvoice.PaymentAmount = (invoiceList.Count() == 1) ? creditCard.CCAuthorizationAmount : inv.PaymentAmount;//when paying for single invoice
                payOpenInvoicesRequest.Invoice.Add(payOpenInvoicesInvoice);
            }

            return this.outstandingInvoiceService.PayOpenInvoicesRequest(payOpenInvoicesRequest, invoiceNumber);

        }

    }
}