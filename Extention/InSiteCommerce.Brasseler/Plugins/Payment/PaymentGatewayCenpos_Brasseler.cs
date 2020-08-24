using Insite.Core.Context;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.PaymentGateway;
using Insite.Core.Plugins.PaymentGateway.Dtos;
using Insite.Core.Plugins.PaymentGateway.Parameters;
using Insite.Core.Plugins.PaymentGateway.Results;
using Insite.PaymentGateway.Cenpos.AdministrationWebService;
using Insite.PaymentGateway.Cenpos.TransactionalWebService;
using System;
using System.Collections.Generic;
using System.Linq;
using Insite.Data.Entities; //Added for BUSA-450 Cenpos - address for New Web Customer is not being populated correctly 
using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using InSiteCommerce.Brasseler.Plugins.Payment;

namespace Insite.PaymentGateway.Cenpos
{
    [DependencyName("Cenpos")]
    public class PaymentGatewayCenpos : IPaymentGateway, IDependency
    {
        protected bool PaymentTokenizationEnabled;
        protected readonly IUnitOfWork UnitOfWork;
        protected CustomSettings customSettings;


        protected int MerchantId
        {
            get;
            set;
        }

        protected string recurringToken
        {
            get;
            set;
        }

        protected string Password
        {
            get;
            set;
        }

        public bool SupportsStoredPaymentProfiles
        {
            get
            {
                return this.PaymentTokenizationEnabled;
            }
        }

        protected string UserId
        {
            get;
            set;
        }

        public PaymentGatewayCenpos( IUnitOfWorkFactory unitOfWorkFactory, CenposSettings cenposSettings)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            customSettings = new CustomSettings();
            if (string.IsNullOrEmpty(this.UserId))
            {
                this.UserId = customSettings.PaymentGateway_Cenpos_UserId;
            }
            if (string.IsNullOrEmpty(this.Password))
            {
                this.Password = customSettings.PaymentGateway_Cenpos_Password;
            }
            if (this.MerchantId <= 0)
            {
                this.MerchantId = customSettings.PaymentGateway_Cenpos_MerchantId;
            }
            this.PaymentTokenizationEnabled = cenposSettings.PaymentTokenizationEnabled;
        }

        protected virtual ProcessCreditCardRequest GetCardRequest(SubmitTransactionParameter parameter)
        {
            ProcessCreditCardRequest processCardRequest;//BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users 
            ProcessCreditCardRequest request;
            int expirationMonth;
            if (parameter.PaymentProfileId != null)
            {
                ProcessCreditCardRequest processCardRecurringSaleRequest = new ProcessCreditCardRequest()
                {
                    UserId = this.UserId,
                    Password = this.Password,
                    MerchantId = this.MerchantId,
                    Amount = parameter.Amount
                };
                expirationMonth = parameter.CreditCard.ExpirationMonth;
                string str = expirationMonth.ToString("00");
                expirationMonth = parameter.CreditCard.ExpirationYear;
                processCardRecurringSaleRequest.CardExpirationDate = string.Concat(str, expirationMonth.ToString().Substring(2));
                processCardRecurringSaleRequest.CustomerCode = parameter.CustomerNumber;
                processCardRecurringSaleRequest.CustomerBillingAddress = parameter.BillToAddress.Address1;

                //BUSA-296  Changes Start
                if (string.IsNullOrEmpty(parameter.BillToAddress.Email))
                {
                    var userInfo = SiteContext.Current.UserProfileDto;
                    if (userInfo != null)
                    {
                        processCardRecurringSaleRequest.CustomerEmailAddress = userInfo.UserName;
                    }
                }
                else { processCardRecurringSaleRequest.CustomerEmailAddress = parameter.BillToAddress.Email; }
                //BUSA-296  Changes end

                processCardRecurringSaleRequest.CustomerZipCode = parameter.BillToAddress.PostalCode;
                processCardRecurringSaleRequest.InvoiceNumber = parameter.ReferenceNumber;
                processCardRecurringSaleRequest.CurrencyCode = parameter.CurrencyCode;
                processCardRecurringSaleRequest.TransactionType = "RecurringAuth";
                // processCardRecurringSaleRequest.RecurringSaleTokenId = string.Concat(parameter.PaymentProfileId, "|", this.MerchantId);

                //BUSA-450 Cenpos - address for New Web Customer is not being populated correctly start
                var companyNameIdentifier = customSettings.CompanyNameIdentifier;
                bool isNewUser = (SiteContext.Current.UserProfileDto != null && !SiteContext.Current.UserProfileDto.IsGuest && processCardRecurringSaleRequest.CustomerCode == companyNameIdentifier + "1055357");
                if (isNewUser)
                {
                    UserProfile userProfile = this.UnitOfWork.GetRepository<UserProfile>().Get(SiteContext.Current.UserProfileDto.Id);
                    processCardRecurringSaleRequest.CustomerBillingAddress = string.IsNullOrEmpty(parameter.CreditCard.PostalCode) ? GetCurrentUserPropertyValue(userProfile.CustomProperties, "NewUsrBTAddress1") : parameter.CreditCard.Address1;
                    processCardRecurringSaleRequest.CustomerZipCode = string.IsNullOrEmpty(parameter.CreditCard.PostalCode) ?GetCurrentUserPropertyValue(userProfile.CustomProperties, "NewUsrBTPostalCode") : parameter.CreditCard.PostalCode;
                }
                //BUSA-450 Cenpos - address for New Web Customer is not being populated correctly end
                request = processCardRecurringSaleRequest;
            }
            else if (parameter.TransactionType != TransactionType.Void)
            {
                //BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users Starts
                processCardRequest = new ProcessCreditCardRequest()
                {
                    UserId = this.UserId,
                    Password = this.Password,
                    MerchantId = this.MerchantId,
                    //// setting SpecialForce for sale transaction type for invoice amount
                    //TransactionType =  parameter.TransactionType == TransactionType.Sale ? "RecurringSale" : "RecurringAuth",
                    TerminalCapabilities = "Manual",
                    NameOnCard = parameter.CreditCard.CardHolderName,
                    Amount = parameter.Amount
                };

                switch (parameter.TransactionType)
                {
                    case TransactionType.Authorization:
                        processCardRequest.TransactionType = "RecurringAuth";
                        break;
                    case TransactionType.Capture:
                        processCardRequest.TransactionType = "RecurringSale2";   //saving card through invoice
                        break;
                    case TransactionType.Sale:
                        processCardRequest.TransactionType = "Sale";             // payment through invoicing without saving card
                        break;
                    case TransactionType.Void:
                        processCardRequest.TransactionType = "Void";
                        break;
                    case TransactionType.Credit:
                        processCardRequest.TransactionType = "Refund";
                        break;

                    default:
                        processCardRequest.TransactionType = "RecurringAuth";
                        break;

                }

                //BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users Ends
                expirationMonth = parameter.CreditCard.ExpirationMonth;
                string str1 = expirationMonth.ToString("00");
                expirationMonth = parameter.CreditCard.ExpirationYear;
                processCardRequest.CardExpirationDate = string.Concat(str1, expirationMonth.ToString().Substring(2));
                processCardRequest.CardNumber = parameter.CreditCard.CardNumber;
                string lastfourdigit = parameter.CreditCard.CardNumber.Substring(parameter.CreditCard.CardNumber.Length - 4);
                processCardRequest.CardLastFourDigits = lastfourdigit;
                processCardRequest.InvoiceNumber = parameter.ReferenceNumber;
                processCardRequest.CurrencyCode = parameter.CurrencyCode;
                processCardRequest.CustomerBillingAddress = parameter.BillToAddress.Address1;
                processCardRequest.CustomerCity = parameter.BillToAddress.City;
                processCardRequest.CustomerCode = parameter.CustomerNumber;

                //BUSA-296  Changes Start
                if (string.IsNullOrEmpty(parameter.BillToAddress.Email))
                {
                    var userInfo = SiteContext.Current.UserProfileDto;
                    if (userInfo != null)
                    {
                        processCardRequest.CustomerEmailAddress = userInfo.UserName;
                    }
                }
                else { processCardRequest.CustomerEmailAddress = parameter.BillToAddress.Email; }
                //BUSA-296  Changes end

                processCardRequest.CustomerPhone = parameter.BillToAddress.Phone;
                processCardRequest.CustomerState = parameter.BillToAddress.State;
                processCardRequest.CustomerZipCode = parameter.BillToAddress.PostalCode;

                //BUSA-450 Cenpos - address for New Web Customer is not being populated correctly start
                var companyNameIdentifier = customSettings.CompanyNameIdentifier;
                bool isNewUser = (SiteContext.Current.UserProfileDto != null && !SiteContext.Current.UserProfileDto.IsGuest && processCardRequest.CustomerCode == companyNameIdentifier + "1055357");
                if (isNewUser)
                {
                    var userProfile = SiteContext.Current.UserProfileDto;
                    var userProperties = UnitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == userProfile.Id).ToList();
                    //processCardRequest.CustomerBillingAddress = GetCurrentUserPropertyValue(userProperties, "NewUsrBTAddress1");
                    //processCardRequest.CustomerZipCode = GetCurrentUserPropertyValue(userProperties, "NewUsrBTPostalCode");

                    processCardRequest.CustomerBillingAddress = string.IsNullOrEmpty(parameter.CreditCard.Address1) ? GetCurrentUserPropertyValue(userProperties, "NewUsrBTAddress1") : parameter.CreditCard.Address1;
                    processCardRequest.CustomerZipCode = string.IsNullOrEmpty(parameter.CreditCard.PostalCode) ? GetCurrentUserPropertyValue(userProperties, "NewUsrBTPostalCode") : parameter.CreditCard.PostalCode;
                }
                //BUSA-450 Cenpos - address for New Web Customer is not being populated correctly end
                request = processCardRequest;
            }
            else
            {
                request = new ProcessCreditCardRequest()
                {
                    TransactionType = this.GetTransactionType(parameter.TransactionType),
                    ReferenceNumber = parameter.OriginalRequestToken
                };
            }
            return request;
        }

        public GetStoredPaymentProfileResult GetStoredPaymentProfile(GetStoredPaymentProfileParameter parameter)
        {
            GetAllRecurringSaleInformationRequest getAllRecurringSaleInformationRequest = new GetAllRecurringSaleInformationRequest()
            {
                UserId = this.UserId,
                Password = this.Password,
                MerchantId = this.MerchantId,
                CustomerCode = parameter.CustomerNumber
            };
            GetAllRecurringSaleInformationResponse reply = (new AdministrationClient()).GetAllRecurringSaleInformation(getAllRecurringSaleInformationRequest);
            GetStoredPaymentProfileResult result = new GetStoredPaymentProfileResult();
            if (reply.Result == 0)
            {
                RecurringAllSaleInformation paymentProfile = reply.RecurringSaleInformationList.FirstOrDefault<RecurringAllSaleInformation>((RecurringAllSaleInformation x) => x.RecurringSaleTokenId == parameter.PaymentProfileId);
                if (paymentProfile == null)
                {
                    return result;
                }
                result.PaymentProfile = new PaymentProfileDto()
                {
                    PaymentProfileId = paymentProfile.RecurringSaleTokenId,
                    MaskedCardNumber = paymentProfile.ProtectedCardNumber,
                    Expiration = paymentProfile.CardExpirationDate,
                    CardType = paymentProfile.CardType
                };
                result.Success = true;
            }
            else
            {
                result.ResponseMessages.Add(string.Format("Transaction Failed: {0}", reply.Message));
            }
            return result;
        }

        protected virtual string GetTransactionType(TransactionType transactionType)
        {
            string validTransactionType = string.Empty;
            switch (transactionType)
            {
                case TransactionType.Authorization:
                    {
                        validTransactionType = "Auth";
                        break;
                    }
                case TransactionType.Capture:
                    {
                        validTransactionType = "Capture";
                        break;
                    }
                case TransactionType.Sale:
                    {
                        validTransactionType = "Sale";
                        break;
                    }
                case TransactionType.Void:
                    {
                        validTransactionType = "Void";
                        break;
                    }
                case TransactionType.Credit:
                    {
                        validTransactionType = "Credit";
                        break;
                    }
            }
            return validTransactionType;
        }

        public RemoveStoredPaymentProfileResult RemoveStoredPaymentProfile(RemoveStoredPaymentProfileParameter parameter)
        {
            DeleteRecurringSaleInformationRequest deleteRecurringSaleInformationRequest = new DeleteRecurringSaleInformationRequest()
            {
                UserId = this.UserId,
                Password = this.Password,
                MerchantId = this.MerchantId,
                RecurringSaleTokenId = parameter.PaymentProfileId
            };
            DeleteRecurringSaleInformationResponse reply = (new AdministrationClient()).DeleteRecurringSaleInformation(deleteRecurringSaleInformationRequest);
            RemoveStoredPaymentProfileResult result = new RemoveStoredPaymentProfileResult()
            {
                Success = reply.Result == 0
            };
            if (!result.Success)
            {
                result.ResponseMessages.Add(string.Format("Transaction Failed: {0}", reply.Message));
            }
            return result;
        }

        public StorePaymentProfileResult StorePaymentProfile(StorePaymentProfileParameter parameter)
        {
            AddRecurringSaleInformationRequest addRecurringSaleInformationRequest = new AddRecurringSaleInformationRequest()
            {
                UserId = this.UserId,
                MerchantId = this.MerchantId,
                Password = this.Password,
                CardNumber = parameter.CreditCard.CardNumber
            };
            int expirationMonth = parameter.CreditCard.ExpirationMonth;
            string str = expirationMonth.ToString("00");
            expirationMonth = parameter.CreditCard.ExpirationYear;
            addRecurringSaleInformationRequest.CardExpirationDate = string.Concat(str, expirationMonth.ToString().Substring(2));
            addRecurringSaleInformationRequest.NameOnCard = parameter.CreditCard.CardHolderName;
            addRecurringSaleInformationRequest.CardLastFourDigit = parameter.CreditCard.CardNumber.Substring(parameter.CreditCard.CardNumber.Length - 4);
            addRecurringSaleInformationRequest.CustomerZipCode = parameter.BillToAddress.PostalCode;
            addRecurringSaleInformationRequest.CustomerEmail = parameter.BillToAddress.Email;
            addRecurringSaleInformationRequest.CustomerBillingAddress = parameter.BillToAddress.Address1;
            addRecurringSaleInformationRequest.CustomerCode = parameter.CustomerNumber;
            /*AddRecurringSaleInformationResponse reply = (new AdministrationClient()).AddRecurringSaleInformation(addRecurringSaleInformationRequest); */// since RecurringAuth already gives tokenId
            StorePaymentProfileResult result = new StorePaymentProfileResult()
            {
                Success = true // reply.Result == 0
            };
            if (!result.Success)
            {
                //result.ResponseMessages.Add(string.Format("Transaction Failed: {0}", reply.Message));
            }
            else
            {
                result.CustomerProfileId = "Cenpos";
                result.PaymentProfileId = this.recurringToken; //reply.Message.Substring(reply.Message.Length - 8);//this.recurringToken;
            }
            return result;
        }

        public virtual SubmitTransactionResult SubmitTransaction(SubmitTransactionParameter parameter)
        {
            TransactionalClient transactionalClient = new TransactionalClient();
            TokensClient tokenClient = new TokensClient();
            SubmitTransactionResult result = new SubmitTransactionResult();
            if (parameter.PaymentProfileId != null)
            {
                UseTokenRequest cardRequest = this.GetCardRequestForToken(parameter);
                UseTokenResponse reply1 = tokenClient.UseToken(cardRequest);
                result.Success = reply1.Result == 0;
                result.ResponseNumber = reply1.AuthorizationNumber ?? string.Empty;
                result.ResponseToken = parameter.PaymentProfileId + "|" + reply1.ReferenceNumber ?? string.Empty;

                if (!result.Success)
                {
                    result.ResponseMessages.Add(string.Format("Transaction Failed: {0} Reference: {1}", reply1.Message, reply1.ReferenceNumber));
                }
            }
            else
            {
                //  ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;//BUSA-669 : change Protocol to TLS v1.2 in CenPos calls

                ProcessCreditCardResponse reply = transactionalClient.ProcessCreditCard(this.GetCardRequest(parameter));
                result.Success = reply.Result == 0;
                result.ResponseNumber = reply.AutorizationNumber ?? string.Empty;
                result.ResponseToken = ((ProcessRecurringSaleResponse)reply).RecurringSaleTokenId + "|" + reply.ReferenceNumber ?? string.Empty;
                this.recurringToken = ((ProcessRecurringSaleResponse)reply).RecurringSaleTokenId;
                if (!result.Success)
                {
                    result.ResponseMessages.Add(string.Format("Transaction Failed: {0} Reference: {1}", reply.Message, reply.ReferenceNumber));
                }
            }
            return result;
        }

        //BUSA-450 Cenpos - address for New Web Customer is not being populated correctly start
        public string GetCurrentUserPropertyValue(ICollection<CustomProperty> properties, string name)
        {
            string propertyValue = string.Empty;
            if (properties != null && properties.Count > 0)
            {
                var userProperty = properties.Where(p => p.Name.EqualsIgnoreCase(name)).FirstOrDefault();
                if (userProperty != null && !string.IsNullOrEmpty(userProperty.Value))
                    return userProperty.Value;
            }
            return propertyValue;
        }
        //BUSA-450 Cenpos - address for New Web Customer is not being populated correctly end

        //protected virtual ProcessCardRequest GetCardRequestForToken(SubmitTransactionParameter parameter)
        //{
        //    customSettings.OverrideCurrentWebsite(SiteContext.Current.WebsiteDto.Id);
        //    ProcessCardRequest processCardRequest1 = null;
        //    if (parameter.PaymentProfileId != null)
        //    {
        //        ProcessCardRecurringSaleRequest recurringSaleRequest = new ProcessCardRecurringSaleRequest();
        //        string userId = customSettings.PaymentGateway_Cenpos_UserId;
        //        recurringSaleRequest.UserId = userId;
        //        string password = customSettings.PaymentGateway_Cenpos_Password;
        //        recurringSaleRequest.Password = password;
        //        int merchantId = customSettings.PaymentGateway_Cenpos_MerchantId;
        //        recurringSaleRequest.MerchantId = merchantId;
        //        Decimal amount = parameter.Amount;
        //        recurringSaleRequest.Amount = amount;
        //        string str1 = parameter.CreditCard.ExpirationMonth.ToString("00") + parameter.CreditCard.ExpirationYear.ToString().Substring(2);
        //        recurringSaleRequest.CardExpirationDate = str1;
        //        string customerNumber = parameter.CustomerNumber;
        //        recurringSaleRequest.CustomerCode = customerNumber;
        //        string address1 = parameter.BillToAddress.Address1;
        //        recurringSaleRequest.CustomerBillingAddress = address1;
        //        string email = parameter.BillToAddress.Email;
        //        recurringSaleRequest.CustomerEmailAddress = email;
        //        string postalCode = parameter.BillToAddress.PostalCode;
        //        recurringSaleRequest.CustomerZipCode = postalCode;
        //        string referenceNumber = parameter.ReferenceNumber;
        //        recurringSaleRequest.InvoiceNumber = referenceNumber; // the invoicenumber in SpForce will be same as original transaction reference number?
        //        string currencyCode = parameter.CurrencyCode;
        //        recurringSaleRequest.CurrencyCode = currencyCode;
        //        // setting SpecialForce for sale transaction type for invoice amount
        //        //recurringSaleRequest.TransactionType = parameter.TransactionType == TransactionType.Sale ? "RecurringSale2" : "RecurringAuth";

        //        switch (parameter.TransactionType)
        //        {
        //            case TransactionType.Authorization:
        //                recurringSaleRequest.TransactionType = "RecurringAuth";
        //                break;
        //            case TransactionType.Capture:
        //                recurringSaleRequest.TransactionType = "RecurringSale2";   //saving card through invoice
        //                break;
        //            case TransactionType.Sale:
        //                recurringSaleRequest.TransactionType = "Sale";             //only payment through invoicing
        //                break;
        //            case TransactionType.Void:
        //                recurringSaleRequest.TransactionType = "Void";
        //                break;
        //            case TransactionType.Credit:
        //                recurringSaleRequest.TransactionType = "Refund";
        //                break;

        //            default : recurringSaleRequest.TransactionType = "RecurringAuth";
        //                break;

        //        }

        //        string str3 = parameter.PaymentProfileId + "|" + (object)merchantId;
        //        recurringSaleRequest.RecurringSaleTokenId = str3;
        //        processCardRequest1 = (ProcessCardRequest)recurringSaleRequest;
        //    }
        //    return processCardRequest1;
        //}

        protected virtual UseTokenRequest GetCardRequestForToken(SubmitTransactionParameter parameter)
        {
            customSettings.OverrideCurrentWebsite(SiteContext.Current.WebsiteDto.Id);
            UseTokenRequest processCardRequest1 = new UseTokenRequest();
            if (parameter.PaymentProfileId != null)
            {

                string userId = customSettings.PaymentGateway_Cenpos_UserId;
                processCardRequest1.UserId = userId;
                string password = customSettings.PaymentGateway_Cenpos_Password;
                processCardRequest1.Password = password;
                int merchantId = customSettings.PaymentGateway_Cenpos_MerchantId;
                processCardRequest1.MerchantId = merchantId;
                Decimal amount = parameter.Amount;
                processCardRequest1.Amount = amount;
                string referenceNumber = parameter.ReferenceNumber;
                processCardRequest1.InvoiceNumber = referenceNumber; // the invoicenumber in SpForce will be same as original transaction reference number?
                string currencyCode = parameter.CurrencyCode;
                processCardRequest1.CurrencyCode = currencyCode;
                // setting SpecialForce for sale transaction type for invoice amount
                //recurringSaleRequest.TransactionType = parameter.TransactionType == TransactionType.Sale ? "RecurringSale2" : "RecurringAuth";
                switch (parameter.TransactionType)
                {
                    case TransactionType.Authorization:
                        processCardRequest1.TransactionType = "Auth";
                        break;
                    case TransactionType.Capture:
                        processCardRequest1.TransactionType = "RecurringSale2";   //saving card through invoice
                        break;
                    case TransactionType.Sale:
                        processCardRequest1.TransactionType = "Sale";             //only payment through invoicing
                        break;
                    case TransactionType.Void:
                        processCardRequest1.TransactionType = "Void";
                        break;
                    case TransactionType.Credit:
                        processCardRequest1.TransactionType = "Refund";
                        break;

                    default:
                        processCardRequest1.TransactionType = "Auth";
                        break;

                }

                string str3 = parameter.PaymentProfileId + "|" + (object)merchantId;
                processCardRequest1.TokenId = str3;
            }
            return processCardRequest1;
        }
    }
}