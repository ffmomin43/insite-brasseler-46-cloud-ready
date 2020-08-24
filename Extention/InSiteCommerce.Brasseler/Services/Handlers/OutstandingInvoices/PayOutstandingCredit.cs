using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Payments.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
//Handler to process credit payment and post to infor

namespace InSiteCommerce.Brasseler.Services.Handlers.OutstandingInvoices
{
    [DependencyName("PayOutstandingCredit")]
    public class PayOutstandingCredit : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        protected CustomSettings customSettings;
        protected OutstandingInvoiceService outstandingInvoiceService;
        protected List<InvoiceList> invoiceList;
        protected readonly IUnitOfWorkFactory unitOfWork;
        protected CultureInfo culture;

        public override int Order
        {
            get
            {
                return 2290;
            }
        }

        public PayOutstandingCredit(OutstandingInvoiceService OutstandingInvoiceService, IUnitOfWorkFactory unitOfWorkFactory)
        {
            this.outstandingInvoiceService = OutstandingInvoiceService;
            this.unitOfWork = unitOfWorkFactory;

        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("PayCredit"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            CustomerOrder cart = null;
            result = this.ProcessInvoiceCredit(unitOfWork, cart, parameter, result);
            return result;
        }

        protected UpdateCartResult ProcessInvoiceCredit(IUnitOfWork unitOfWork, CustomerOrder cart, UpdateCartParameter parameter, UpdateCartResult result)
        {
            string orderTotalDue = "0";
            string invoiceNumber = string.Empty;
            decimal Amount = 0;
            culture = CultureInfo.CreateSpecificCulture("en-US");
            AddPaymentTransactionParameter parameter1 = new AddPaymentTransactionParameter();
            parameter.Properties.TryGetValue("creditAmount", out orderTotalDue);
            parameter.Properties.TryGetValue("creditInvoiceList", out invoiceNumber);
            invoiceList = JsonConvert.DeserializeObject<List<InvoiceList>>(invoiceNumber);

            if (parameter.Properties.Count() > 0 && parameter.Properties.ContainsKey("creditAmount"))
            {
                //BUSA-1152
                Amount = Math.Round(Convert.ToDecimal(orderTotalDue, culture), 2);
                if (Amount <= 0)
                {
                    return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.Forbidden, "The amount should be greater than zero");
                }

            }

            try
            {
                var response = PostCreditToInfor(Amount, invoiceNumber);
                if (!response)
                {
                    return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.GetPaymentProfileFailed, "Your invoice payment failed");
                }
            }
            catch (Exception ex)
            {
                return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.GeneralFailure, "Your invoice payment failed" + ex);
            }
            finally
            {
                unitOfWork.Save();
            }

            return result;
        }


        protected bool PostCreditToInfor(decimal Amount, string invoiceNumber)
        {
            //put logger ind app log  : also DB entry in infortable
            PayOpenInvoicesRequest payOpenInvoicesRequest = new PayOpenInvoicesRequest();
            customSettings = new CustomSettings();
            PayOpenInvoicesHead head = new PayOpenInvoicesHead();
            PayOpenInvoicesCreditCard creditCard = new PayOpenInvoicesCreditCard();
            payOpenInvoicesRequest.Invoice = new List<PayOpenInvoicesInvoice>();

            head.CompanyNumber = customSettings.CompanyNameIdentifier;
            head.CustomerNumber = SiteContext.Current.BillTo.CustomerNumber.Substring(1);
            head.SettlementDate = DateTime.Now.ToString("MMddyyyy");
            head.MonetaryAmount = Amount.ToString(culture);//BUSA-1152
            creditCard.CCCustomerID = "0" + head.CompanyNumber + head.CustomerNumber.PadLeft(10, '0');
            creditCard.CCPaymentType = "CENPOS";
            creditCard.CCCreditCardExp = "0000";
            creditCard.CCCardHolder = "NO CARD USED"; //to check for saved cards
            creditCard.CCAuthorizationAmount = "0.00";
            creditCard.CCMerchantId = customSettings.PaymentGateway_Cenpos_MerchantId.ToString();
            creditCard.CCMaskedCard = "************0000";
            creditCard.CCToken = "NOTOKEN";
            creditCard.CCCardType = "NOCARD";
            creditCard.CCAuthorizationNumber = "CREDIT";
            creditCard.CCReferenceNumber = "0000000000";
            creditCard.CCEmail = SiteContext.Current.ShipTo.Email;
            creditCard.CCCustomerCode = head.CustomerNumber.Substring(1).PadLeft(10, '0');
            creditCard.CCEND = "Y";
            payOpenInvoicesRequest.Head = head;
            payOpenInvoicesRequest.CreditCard = creditCard;
            payOpenInvoicesRequest.Name = "PayOpenInvoices";

            foreach (InvoiceList inv in invoiceList)
            {
                PayOpenInvoicesInvoice payOpenInvoicesInvoice = new PayOpenInvoicesInvoice();
                payOpenInvoicesInvoice.InvoiceNo = inv.InvoiceNo;
                payOpenInvoicesInvoice.DiscountTakenAmount = "";
                Amount = Amount * (-1);
                payOpenInvoicesInvoice.InvoiceNote = inv.InvoiceNote;
                payOpenInvoicesInvoice.PaymentAmount = Amount.ToString(culture);
                payOpenInvoicesRequest.Invoice.Add(payOpenInvoicesInvoice);
            }

            return this.outstandingInvoiceService.PayOpenInvoicesRequest(payOpenInvoicesRequest, invoiceNumber);

        }
    }

}
