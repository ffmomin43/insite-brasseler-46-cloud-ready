using Insite.Account.Services;
using Insite.Account.Services.Parameters;
using Insite.Account.Services.Results;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Core.Plugins.Cart;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.PaymentGateway;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Customers.Services;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Payments.Services;
using Insite.Payments.Services.Parameters;
using Insite.Payments.Services.Results;
using System;
using System.Linq;


namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("UpdateCartAddNewCard")]
    public class UpdateCartAddNewCard : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        protected readonly Lazy<IAuthenticationService> AuthenticationService;
        protected readonly ICartOrderProviderFactory CartOrderProviderFactory;
        protected readonly ICustomerService CustomerService;
        protected readonly Lazy<IEmailService> EmailService;
        protected readonly ISessionService SessionService;
        protected readonly Lazy<ICustomerOrderUtilities> CustomerOrderUtilities;

        private readonly PaymentSettings paymentSettings;
        private readonly Lazy<IPaymentService> paymentService;
        private readonly ICustomerOrderUtilities customerOrderUtilities;
        public override int Order
        {
            get
            {
                return 2275;
            }
        }

        public UpdateCartAddNewCard(PaymentSettings paymentSettings, Lazy<IPaymentService> paymentService, ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
            this.paymentService = paymentService;
            this.paymentSettings = paymentSettings;
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("SaveNewCard"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            CustomerOrder cart = null;
            parameter.StorePaymentProfile = true;

            result = this.ProcessCreditCardTransaction(unitOfWork, cart, parameter, result);
            if (result.ResultCode != ResultCode.Success)
                return result;
            else
                try
                {
                    unitOfWork.Save();
                }
                finally
                { }
            return result;
        }



        protected UpdateCartResult ProcessCreditCardTransaction(IUnitOfWork unitOfWork, CustomerOrder cart, UpdateCartParameter parameter, UpdateCartResult result)
        {
            AddPaymentTransactionParameter parameter1 = new AddPaymentTransactionParameter();
            if (parameter.Properties.Count() > 0 && parameter.Properties.ContainsKey("AddNewCard") && parameter.Status.EqualsIgnoreCase("SaveNewCard"))
            {
                parameter1.ReferenceNumber = string.Empty;
                parameter1.Amount = 0;
                CurrencyDto currency = SiteContext.Current.CurrencyDto;
                string str = (currency != null ? currency.CurrencyCode : (string)null) ?? string.Empty;
                parameter1.CurrencyCode = str;               
            }            

            parameter1.TransactionType = this.paymentSettings.SubmitSaleTransaction ? TransactionType.Sale : TransactionType.Authorization;

            parameter1.CreditCard = parameter.CreditCard;
            string paymentProfileId = parameter.PaymentProfileId;
            parameter1.PaymentProfileId = paymentProfileId;

            AddPaymentTransactionResult transactionResult = this.paymentService.Value.AddPaymentTransaction(parameter1);
            if (transactionResult.CreditCardTransaction != null)
            {
                if (parameter.Properties.Count() > 0 && parameter.Properties.ContainsKey("AddNewCard"))
                    transactionResult.CreditCardTransaction.CustomerOrderId = null;
                else
                    transactionResult.CreditCardTransaction.CustomerOrderId = new Guid?(cart.Id);
            }
            if (transactionResult.ResultCode != ResultCode.Success)
                return this.CreateErrorServiceResult<UpdateCartResult>(result, transactionResult.SubCode, transactionResult.Message);
            if (parameter.StorePaymentProfile)
            {
                if (parameter.Properties.Count() > 0 && parameter.Properties.ContainsKey("AddNewCard"))
                {
                    this.paymentService.Value.AddPaymentProfile(new AddPaymentProfileParameter()
                    {
                        CurrencyCode = parameter1.CurrencyCode,
                        BillToId = SiteContext.Current.BillTo.Id,
                        CreditCard = parameter.CreditCard
                    });
                }
                else
                    this.paymentService.Value.AddPaymentProfile(new AddPaymentProfileParameter()
                    {
                        CurrencyCode = cart.Currency.CurrencyCode,
                        BillToId = new Guid?(cart.Customer.Id),
                        CreditCard = parameter.CreditCard
                    });
            }
            return result;
        }


    }
}