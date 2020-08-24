using Insite.Common.Logging;
using Insite.Common.Providers;
using Insite.Core.Attributes;
using Insite.Core.Context;
using Insite.Core.Exceptions;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Cart;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.PaymentGateway;
using Insite.Core.Plugins.PaymentGateway.Dtos;
using Insite.Core.Plugins.PaymentGateway.Parameters;
using Insite.Core.Plugins.PaymentGateway.Results;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Customers.Services;
using Insite.Customers.Services.Parameters;
using Insite.Customers.Services.Results;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Data.Extensions;
using Insite.Data.Repositories;
using Insite.Data.Repositories.Interfaces;
using Insite.Payments.Services;
using Insite.Payments.Services.Parameters;
using Insite.Payments.Services.Results;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.Services
{

    public class PaymentService_Brasseler : ServiceBase, IPaymentService, IInterceptable, IDependency
    {
        public const string StoredCustomerProfileIdKey = "StoredCustomerProfileId";

        private readonly ICustomerService customerService;
        private readonly CustomSettings customSettings;
        private readonly IPaymentGatewayFactory paymentGatewayFactory;

        private readonly IUserProfileUtilities userProfileUtilities;
        private readonly PaymentSettings paymentSettings;
        private readonly ICartOrderProviderFactory cartOrderProviderFactory;

        public PaymentService_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, IPaymentGatewayFactory paymentGatewayFactory, ICustomerService customerService, IUserProfileUtilities userProfileUtilities, PaymentSettings paymentSettings, ICartOrderProviderFactory cartOrderProviderFactory, CustomSettings customSettings) : base(unitOfWorkFactory)
        {
            this.paymentGatewayFactory = paymentGatewayFactory;
            this.customerService = customerService;
            this.userProfileUtilities = userProfileUtilities;
            this.paymentSettings = paymentSettings;
            this.cartOrderProviderFactory = cartOrderProviderFactory;
            this.customSettings = customSettings;
        }

        [Transaction]
        public AddPaymentProfileResult AddPaymentProfile(AddPaymentProfileParameter parameter)
        {
            UserProfileDto userProfileDto = SiteContext.Current.UserProfileDto;
            if (userProfileDto == null)
            {
                return this.CreateErrorServiceResult<AddPaymentProfileResult>(SubCode.Forbidden, MessageProvider.Current.Forbidden);
            }
            UserProfile userProfile = this.UnitOfWork.GetRepository<UserProfile>().Get(userProfileDto.Id);
            IPaymentGateway paymentGateway = this.GetPaymentGateway();
            if (!paymentGateway.SupportsStoredPaymentProfiles)
            {
                return this.CreateErrorServiceResult<AddPaymentProfileResult>(SubCode.NotSupported, string.Format(MessageProvider.Current.Not_Supported, "Stored Payment Profiles"));
            }
            GetBillToResult billToResult = this.GetBillTo(parameter.BillToId);
            if (billToResult.ResultCode != ResultCode.Success)
            {
                return this.CreateErrorServiceResult<AddPaymentProfileResult>(billToResult.SubCode, billToResult.Message);
            }
            Customer billTo = billToResult.BillTo;            

            StorePaymentProfileResult storePaymentProfileResult = paymentGateway.StorePaymentProfile(new StorePaymentProfileParameter()
            {
                CustomerProfileId = userProfile.GetProperty("StoredCustomerProfileId", string.Empty),
                CustomerNumber = billTo.CustomerNumber,
                CurrencyCode = parameter.CurrencyCode,
                BillToAddress = CreateCreditCardAddress(billTo),
                CreditCard = parameter.CreditCard
            });
            if (!storePaymentProfileResult.Success)
            {
                return this.CreateErrorServiceResult<AddPaymentProfileResult>(SubCode.StorePaymentProfileFailed, string.Join(Environment.NewLine, storePaymentProfileResult.ResponseMessages));
            }
            userProfile.SetProperty("StoredCustomerProfileId", storePaymentProfileResult.CustomerProfileId);
            GetStoredPaymentProfileResult getStoredPaymentProfileResult = paymentGateway.GetStoredPaymentProfile(new GetStoredPaymentProfileParameter()
            {
                CustomerNumber = billTo.CustomerNumber,
                CustomerProfileId = storePaymentProfileResult.CustomerProfileId,
                PaymentProfileId = storePaymentProfileResult.PaymentProfileId
            });
            if (getStoredPaymentProfileResult.Success)
            {
                this.AddUserPaymentProfile(userProfile, new UserPaymentProfile()
                {
                    CardIdentifier = getStoredPaymentProfileResult.PaymentProfile.PaymentProfileId,
                    Description = parameter.CreditCard.CardHolderName,//BUSA-462 : Ability to save Credit Cards (in CenPos) and offer it to users.
                    CardType = parameter.CreditCard.CardType,
                    MaskedCardNumber = getStoredPaymentProfileResult.PaymentProfile.MaskedCardNumber,
                    ExpirationDate = getStoredPaymentProfileResult.PaymentProfile.Expiration
                });
            }
            return new AddPaymentProfileResult();
        }

        [Transaction]
        public AddPaymentTransactionResult AddPaymentTransaction(AddPaymentTransactionParameter parameter)
        {
            if (SiteContext.Current.UserProfileDto == null)
            {
                return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.Forbidden, MessageProvider.Current.Forbidden);
            }
            if (parameter.TransactionType != TransactionType.Authorization && parameter.TransactionType != TransactionType.Sale && parameter.TransactionType != TransactionType.Capture)
            {
                return this.SubmitReferenceTransaction(parameter);
            }
            return this.SubmitNewTransaction(parameter);
        }

        protected void AddUserPaymentProfile(UserProfile userProfile, UserPaymentProfile value)
        {
            UserProfile userProfileToUpdate = null;
            if (userProfile.Id != Guid.Empty)
            {
                userProfileToUpdate = this.UnitOfWork.GetTypedRepository<IUserProfileRepository>().GetTable().Expand<UserProfile, ICollection<UserPaymentProfile>>((UserProfile x) => x.UserPaymentProfiles).FirstOrDefault<UserProfile>((UserProfile x) => x.Id == userProfile.Id);
            }
            if (userProfileToUpdate == null)
            {
                userProfileToUpdate = userProfile;
                userProfileToUpdate.Id = Guid.Empty;
            }
            if (userProfileToUpdate.UserPaymentProfiles.Any<UserPaymentProfile>((UserPaymentProfile x) => x.Id == value.Id))
            {
                return;
            }
            if (userProfileToUpdate.UserPaymentProfiles.Any<UserPaymentProfile>((UserPaymentProfile x) => x.CardIdentifier == value.CardIdentifier))
            {
                return;
            }
            value.UserProfile = userProfileToUpdate;
            userProfileToUpdate.UserPaymentProfiles.Add(value);
            if (userProfileToUpdate.Id != Guid.Empty)
            {
                this.UnitOfWork.GetRepository<UserPaymentProfile>().Insert(value);
            }
        }

        private CreditCardAddressDto CreateCreditCardAddress(Customer customer, CreditCardDto creditCard = null)
        {            
            CreditCardAddressDto creditCardAddressDto1 = new CreditCardAddressDto()
            {
                Company = customer.CompanyName,
                FirstName = customer.FirstName,
                MiddleName = customer.MiddleName,
                LastName = customer.LastName,
                Email = customer.Email,
                Phone = customer.Phone
            };
            if (creditCard != null && !creditCard.UseBillingAddress)
            {
                creditCardAddressDto1.Address1 = creditCard.Address1;
                creditCardAddressDto1.City = creditCard.City;
                creditCardAddressDto1.State = creditCard.StateAbbreviation;
                creditCardAddressDto1.PostalCode = creditCard.PostalCode;
                creditCardAddressDto1.Country = creditCard.CountryAbbreviation;
            }
            else
            {
                bool isNewUser = false;
                if (SiteContext.Current.UserProfile != null)
                {
                    isNewUser = (SiteContext.Current.UserProfileDto != null && !SiteContext.Current.UserProfileDto.IsGuest &&
                        customer.CustomerNumber.ContainsIgnoreCase("1055357"));
                }

                creditCardAddressDto1.Address1 = isNewUser ? SiteContext.Current.UserProfile.CustomProperties.Where(x => x.Name == "NewUsrBTAddress1").Select(x => x.Value).FirstOrDefault().ToString() : customer.Address1;
                creditCardAddressDto1.Address2 = isNewUser ? SiteContext.Current.UserProfile.CustomProperties.Where(x => x.Name == "NewUsrBTAddress2").Select(x => x.Value).FirstOrDefault().ToString() : customer.Address2;
                creditCardAddressDto1.City = isNewUser ? SiteContext.Current.UserProfile.CustomProperties.Where(x => x.Name == "NewUsrBTCity").Select(x => x.Value).FirstOrDefault().ToString() : customer.City;
                CreditCardAddressDto creditCardAddressDto2 = creditCardAddressDto1;

                var customerState = isNewUser ? SiteContext.Current.UserProfile.CustomProperties.Where(x => x.Name == "NewUsrBTState").Select(x => x.Value).FirstOrDefault().ToString() : string.Empty;

                State state = isNewUser ? UnitOfWork.GetRepository<State>().GetTable().FirstOrDefault(s => s.Name == customerState)?? customer.State : customer.State;
                string str1 = (state != null ? state.Abbreviation : (string)null) ?? string.Empty;
                creditCardAddressDto2.State = str1;
                creditCardAddressDto1.PostalCode = isNewUser ? SiteContext.Current.UserProfile.CustomProperties.Where(x => x.Name == "NewUsrBTPostalCode").Select(x => x.Value).FirstOrDefault().ToString() : customer.PostalCode;
                CreditCardAddressDto creditCardAddressDto3 = creditCardAddressDto1;

                var customerCountry = isNewUser ? SiteContext.Current.UserProfile.CustomProperties.Where(x => x.Name == "NewUsrBTCountry").Select(x => x.Value).FirstOrDefault().ToString() : string.Empty;

                Country country = isNewUser ? UnitOfWork.GetRepository<Country>().GetTable().FirstOrDefault(s => s.Name == customerCountry) ?? customer.Country : customer.Country;
                string str2 = (country != null ? country.Abbreviation : (string)null) ?? string.Empty;
                creditCardAddressDto3.Country = str2;
            }
            return creditCardAddressDto1;
        }

        private CreditCardTransaction CreateCreditCardTransaction(SubmitTransactionParameter submitTransactionParameter)
        {
            CreditCardTransaction creditCardTransaction = this.UnitOfWork.GetRepository<CreditCardTransaction>().Create();
            creditCardTransaction.TransactionType = submitTransactionParameter.TransactionType == TransactionType.Authorization ? "A" : (submitTransactionParameter.TransactionType == TransactionType.Sale ? "S" : (submitTransactionParameter.TransactionType == TransactionType.Capture ? "D" : (submitTransactionParameter.TransactionType == TransactionType.Void ? "V" : (submitTransactionParameter.TransactionType == TransactionType.Reversal ? "R" : "C"))));
            creditCardTransaction.TransactionDate = DateTimeProvider.Current.Now;
            creditCardTransaction.Amount = submitTransactionParameter.Amount;
            creditCardTransaction.CustomerNumber = submitTransactionParameter.CustomerNumber;
            creditCardTransaction.OrderNumber = submitTransactionParameter.ReferenceNumber;
            CreditCardDto creditCard1 = submitTransactionParameter.CreditCard;
            creditCardTransaction.Name = (creditCard1 != null ? creditCard1.CardHolderName : (string)null) ?? string.Empty;
            creditCardTransaction.AvsAddr = this.GetAvsAddr(submitTransactionParameter);
            CreditCardAddressDto billToAddress = submitTransactionParameter.BillToAddress;
            creditCardTransaction.AvsZip = (billToAddress != null ? billToAddress.PostalCode : (string)null) ?? string.Empty;
            CreditCardDto creditCard2 = submitTransactionParameter.CreditCard;
            string str1 = (creditCard2 != null ? creditCard2.CardNumber : (string)null) ?? string.Empty;
            CreditCardDto creditCard3 = submitTransactionParameter.CreditCard;
            int num;
            string str2;
            if (creditCard3 == null)
            {
                str2 = (string)null;
            }
            else
            {
                num = creditCard3.ExpirationMonth;
                str2 = num.ToString("00");
            }
            if (str2 == null)
                str2 = string.Empty;
            string str3 = "/";
            CreditCardDto creditCard4 = submitTransactionParameter.CreditCard;
            string str4;
            if (creditCard4 == null)
            {
                str4 = (string)null;
            }
            else
            {
                num = creditCard4.ExpirationYear;
                str4 = num.ToString();
            }
            if (str4 == null)
                str4 = string.Empty;
            creditCardTransaction.ExpirationDate = str2 + str3 + str4;
            string str5;
            if (str1.Length <= 4)
            {
                str5 = str1;
            }
            else
            {
                string str6 = str1;
                str5 = str6.Substring(str6.Length - 4);
            }
            creditCardTransaction.CreditCardNumber = str5;
            creditCardTransaction.OrigId = submitTransactionParameter.OriginalRequestNumber;
            creditCardTransaction.Site = SiteContext.Current.WebsiteDto.Name;
            return creditCardTransaction;
        }

        private CreditCardTransaction UpdateCreditCardTransaction(CreditCardTransaction creditCardTransaction, SubmitTransactionParameter submitTransactionParameter, SubmitTransactionResult submitTransactionResult)
        {
            creditCardTransaction.Result = submitTransactionResult.Success ? "0" : "1";
            creditCardTransaction.AuthCode = submitTransactionResult.ResponseNumber;
            creditCardTransaction.RequestId = submitTransactionResult.ResponseNumber;
            creditCardTransaction.PNRef = submitTransactionResult.ResponseToken ?? string.Empty;
            creditCardTransaction.Status = !submitTransactionResult.Success ? "Error" : (submitTransactionParameter.TransactionType == TransactionType.Authorization ? "Open" : "Submitted");
            //Save CC last 4 digit and CardType
            string ccNumber = (submitTransactionParameter.CreditCard.CardNumber.Length > 3) ? submitTransactionParameter.CreditCard.CardNumber.Substring(submitTransactionParameter.CreditCard.CardNumber.Length - 4, 4) : submitTransactionParameter.CreditCard.CardNumber;
            creditCardTransaction.CreditCardNumber = ccNumber;
            creditCardTransaction.CardType = this.GetCardType(submitTransactionParameter.CreditCard.CardType);
            //End
            this.UnitOfWork.GetRepository<CreditCardTransaction>().Insert(creditCardTransaction);
            if (!submitTransactionResult.Success)
            {
                creditCardTransaction.RespText = string.Join(Environment.NewLine, (IEnumerable<string>)submitTransactionResult.ResponseMessages);
                return creditCardTransaction;
            }
            if (submitTransactionParameter.TransactionType == TransactionType.Capture || submitTransactionParameter.TransactionType == TransactionType.Void)
            {
                CreditCardTransaction creditCardTransaction1 = this.UnitOfWork.GetRepository<CreditCardTransaction>().GetTable().FirstOrDefault<CreditCardTransaction>((Expression<Func<CreditCardTransaction, bool>>)(c => c.RequestId.Equals(submitTransactionParameter.OriginalRequestNumber)));
                if (creditCardTransaction1 != null)
                    creditCardTransaction1.Status = submitTransactionParameter.TransactionType == TransactionType.Capture ? "Captured" : "Voided";
            }
            return creditCardTransaction;
        }

        private string GetCardType(string card)
        {
            string cardType = string.Empty;

            switch (card)
            {
                case "VISA":
                    {
                        cardType = "VI";
                        break;
                    }
                case "AMERICAN EXPRESS":
                    {
                        cardType = "AM";
                        break;
                    }
                case "DISCOVER":
                    {
                        cardType = "DC";
                        break;
                    }
                case "MASTERCARD":
                    {
                        cardType = "MC";
                        break;
                    }
                default:
                    {
                        cardType = string.Empty;
                        break;
                    }
            }
            return cardType;
        }

        private T CreateErrorServiceResult<T>(SubCode subCode, string message = null)
        where T : ResultBase, new()
        {
            T t = Activator.CreateInstance<T>();
            t.ResultCode = ResultCode.Error;
            t.SubCode = subCode;
            T result = t;
            if (message != null)
            {
                result.Messages.Add(new ResultMessage()
                {
                    Message = message
                });
            }
            return result;
        }

        private GetBillToResult GetBillTo(Guid? billToId)
        {
            if (!billToId.HasValue)
            {
                return new GetBillToResult()
                {
                    BillTo = SiteContext.Current.BillTo
                };
            }
            return this.customerService.GetBillTo(new GetBillToParameter()
            {
                BillToId = billToId                
            });
        }

        private IPaymentGateway GetPaymentGateway()
        {
            return this.paymentGatewayFactory.GetPaymentGateway(this.paymentSettings.Gateway);
        }

        [Transaction]
        public GetPaymentProfileCollectionResult GetPaymentProfileCollection(GetPaymentProfileCollectionParameter parameter)
        {
            UserProfileDto userProfileDto = SiteContext.Current.UserProfileDto;
            if (userProfileDto == null)
                return this.CreateErrorServiceResult<GetPaymentProfileCollectionResult>(SubCode.Forbidden, MessageProvider.Current.Forbidden);
            return new GetPaymentProfileCollectionResult()
            {
                PaymentProfiles = (ICollection<PaymentProfileDto>)userProfileDto.UserPaymentProfiles.Select<UserPaymentProfileDto, PaymentProfileDto>((Func<UserPaymentProfileDto, PaymentProfileDto>)(u => new PaymentProfileDto()
                {
                    PaymentProfileId = u.CardIdentifier,
                    CardType = u.CardType,
                    MaskedCardNumber = u.MaskedCardNumber,
                    Expiration = u.ExpirationDate
                })).ToList<PaymentProfileDto>()
            };
        }

        public GetPaymentSettingsResult GetPaymentSettings(GetPaymentSettingsParameter parameter)
        {
            return new GetPaymentSettingsResult()
            {
                SupportsStoredPaymentProfiles = this.GetPaymentGateway().SupportsStoredPaymentProfiles
            };
        }

        private GetShipToResult GetShipTo(Guid? billToId, Guid? shipToId)
        {
            if (!shipToId.HasValue)
            {
                return new GetShipToResult()
                {
                    ShipTo = SiteContext.Current.ShipTo
                };
            }
            return this.customerService.GetShipTo(new GetShipToParameter()
            {
                BillToId = billToId,
                ShipToId = shipToId,                
            });
        }

        [Transaction]
        public RemovePaymentProfileResult RemovePaymentProfile(RemovePaymentProfileParameter parameter)
        {
            UserProfileDto userProfileDto = SiteContext.Current.UserProfileDto;
            UserProfile userProfile = this.UnitOfWork.GetRepository<UserProfile>().Get(SiteContext.Current.UserProfileDto.Id);
            if (userProfile == null)
            {
                return this.CreateErrorServiceResult<RemovePaymentProfileResult>(SubCode.Forbidden, MessageProvider.Current.Forbidden);
            }
            GetBillToResult billToResult = this.GetBillTo(parameter.BillToId);
            if (billToResult.ResultCode != ResultCode.Success)
            {
                return this.CreateErrorServiceResult<RemovePaymentProfileResult>(billToResult.SubCode, billToResult.Message);
            }
            Customer billTo = billToResult.BillTo;
            RemoveStoredPaymentProfileResult removeStoredPaymentProfileResult = this.GetPaymentGateway().RemoveStoredPaymentProfile(new RemoveStoredPaymentProfileParameter()
            {
                CustomerProfileId = userProfile.GetProperty("StoredCustomerProfileId", string.Empty),
                PaymentProfileId = parameter.PaymentProfileId,
                CustomerNumber = billTo.CustomerNumber
            });
            if (!removeStoredPaymentProfileResult.Success)
            {
                return this.CreateErrorServiceResult<RemovePaymentProfileResult>(SubCode.StorePaymentProfileFailed, string.Join(Environment.NewLine, removeStoredPaymentProfileResult.ResponseMessages));
            }
            UserPaymentProfile userPaymentProfile = userProfile.UserPaymentProfiles.FirstOrDefault<UserPaymentProfile>((UserPaymentProfile u) => u.CardIdentifier.Equals(parameter.PaymentProfileId));
            if (userPaymentProfile != null)
            {
                this.RemoveUserPaymentProfile(userProfile, userPaymentProfile);
            }
            return new RemovePaymentProfileResult();
        }

        private RemovePaymentProfileResult RemoveUserPaymentProfile(UserProfile userProfile, UserPaymentProfile value)
        {
            UserProfile userProfile1 = this.UnitOfWork.GetTypedRepository<IUserProfileRepository>().GetTable().Expand<UserProfile, ICollection<UserPaymentProfile>>(x => x.UserPaymentProfiles).FirstOrDefault<UserProfile>(x => x.Id == userProfile.Id);
            if (userProfile1 == null)
                return this.CreateErrorServiceResult<RemovePaymentProfileResult>(SubCode.NotFound, string.Format(MessageProvider.Current.Not_Found, (object)"UserProfile"));
            if (userProfile1.UserPaymentProfiles.All<UserPaymentProfile>(x => x.Id != value.Id))
                return new RemovePaymentProfileResult();
            userProfile1.UserPaymentProfiles.Remove(userProfile1.UserPaymentProfiles.First<UserPaymentProfile>((Func<UserPaymentProfile, bool>)(x => x.Id == value.Id)));
            return new RemovePaymentProfileResult();
        }

        private void ResetContext()
        {
            SiteContext.SetSiteContext((ISiteContext)null);
            this.cartOrderProviderFactory.GetCartOrderProvider().ClearCache();
        }

        Customer NewAddressBillto = new Customer();

        private AddPaymentTransactionResult SubmitNewTransaction(AddPaymentTransactionParameter parameter)
        {
            Customer billTo1;
            Customer shipTo1;
            if (parameter.IsAdmin)
            {
                ICustomerRepository typedRepository = this.UnitOfWork.GetTypedRepository<ICustomerRepository>();
                if (!parameter.BillToId.HasValue)
                    return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.NotFound, "BillToId is empty");
                Guid? nullable = parameter.ShipToId;
                if (!nullable.HasValue)
                    return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.NotFound, "ShipToId is empty");
                ICustomerRepository customerRepository1 = typedRepository;
                nullable = parameter.BillToId;
                Guid id1 = nullable.Value;
                billTo1 = customerRepository1.Get(id1);
                ICustomerRepository customerRepository2 = typedRepository;
                nullable = parameter.ShipToId;
                Guid id2 = nullable.Value;
                shipTo1 = customerRepository2.Get(id2);
            }
            else
            {
                GetBillToResult billTo2 = this.GetBillTo(parameter.BillToId);
                if (billTo2.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<AddPaymentTransactionResult>(billTo2.SubCode, billTo2.Message);
                billTo1 = billTo2.BillTo;
                GetShipToResult shipTo2 = this.GetShipTo(parameter.BillToId, parameter.ShipToId);
                if (shipTo2.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<AddPaymentTransactionResult>(shipTo2.SubCode, shipTo2.Message);
                shipTo1 = shipTo2.ShipTo;
            }
            SubmitTransactionParameter transactionParameter = new SubmitTransactionParameter()
            {
                TransactionType = parameter.TransactionType,
                CustomerNumber = billTo1.CustomerNumber,
                ReferenceNumber = parameter.ReferenceNumber,
                CurrencyCode = parameter.CurrencyCode,
                BillToAddress = CreateCreditCardAddress(billTo1, parameter.CreditCard),
                ShipToAddress = CreateCreditCardAddress(shipTo1, (CreditCardDto)null),
                PaymentProfileId = parameter.PaymentProfileId,
                CreditCard = parameter.CreditCard,
                Amount = parameter.Amount,
                WebsiteId = parameter.WebsiteId
            };
            if (!parameter.PaymentProfileId.IsBlank())
            {
                UserProfile userProfile = this.UnitOfWork.GetRepository<UserProfile>().Get(SiteContext.Current.UserProfileDto.Id);
                transactionParameter.CustomerProfileId = userProfile.GetProperty("StoredCustomerProfileId", string.Empty);
            }
            CreditCardTransaction creditCardTransaction = this.CreateCreditCardTransaction(transactionParameter);
            transactionParameter.CreditCardTransactionId = new Guid?(creditCardTransaction.Id);
            SubmitTransactionResult submitTransactionResult = (parameter.CreditCard.CardType == "PayPal" ? this.paymentGatewayFactory.GetPaymentGateway("PaypalExpress") : this.GetPaymentGateway()).SubmitTransaction(transactionParameter);
            if(submitTransactionResult.ResponseMessages.Count >0)
            { 
            LogHelper.For(this).Error(transactionParameter.CustomerNumber + submitTransactionResult.ResponseMessages.FirstOrDefault() + submitTransactionResult.Success, "CenposResponse");
            }
            if (!submitTransactionResult.Success)
            {
                this.UnitOfWork.RollbackTransaction();
                this.UnitOfWork.Clear(true);
                this.UnitOfWork.BeginTransaction();
                this.ResetContext();
                this.UpdateCreditCardTransaction(creditCardTransaction, transactionParameter, submitTransactionResult);
                if (submitTransactionResult.IsConnectionError)
                    this.SubmitReversalTransaction(transactionParameter, submitTransactionResult);
                return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.CreditCardFailed, string.Join(Environment.NewLine, (IEnumerable<string>)submitTransactionResult.ResponseMessages));
            }
            return new AddPaymentTransactionResult()
            {
                CreditCardTransaction = this.UpdateCreditCardTransaction(creditCardTransaction, transactionParameter, submitTransactionResult)
            };
        }

        private AddPaymentTransactionResult SubmitReferenceTransaction(AddPaymentTransactionParameter parameter)
        {
            if (parameter.OriginalRequestNumber.IsBlank() || parameter.OriginalRequestToken.IsBlank())
                return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.CreditCardFailed, "Original Request Number and Original Reference Number required");
            SubmitTransactionParameter transactionParameter = new SubmitTransactionParameter()
            {
                TransactionType = parameter.TransactionType,
                ReferenceNumber = parameter.ReferenceNumber,
                OriginalRequestNumber = parameter.OriginalRequestNumber,
                OriginalRequestToken = parameter.OriginalRequestToken,
                Amount = parameter.Amount,
                WebsiteId = parameter.WebsiteId
            };
            CreditCardTransaction creditCardTransaction = this.CreateCreditCardTransaction(transactionParameter);
            transactionParameter.CreditCardTransactionId = new Guid?(creditCardTransaction.Id);
            SubmitTransactionResult submitTransactionResult = this.GetPaymentGateway().SubmitTransaction(transactionParameter);
            if (!submitTransactionResult.Success)
            {
                this.UpdateCreditCardTransaction(creditCardTransaction, transactionParameter, submitTransactionResult);
                if (submitTransactionResult.IsConnectionError)
                    return this.ResendTransaction(transactionParameter);
                return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.CreditCardFailed, string.Join(Environment.NewLine, (IEnumerable<string>)submitTransactionResult.ResponseMessages));
            }
            return new AddPaymentTransactionResult()
            {
                CreditCardTransaction = this.UpdateCreditCardTransaction(creditCardTransaction, transactionParameter, submitTransactionResult)
            };
        }

        private void SubmitReversalTransaction(SubmitTransactionParameter submitTransactionParameter, SubmitTransactionResult submitTransactionResult)
        {
            SubmitTransactionParameter transactionParameter = new SubmitTransactionParameter()
            {
                TransactionType = TransactionType.Reversal,
                CustomerNumber = submitTransactionParameter.CustomerNumber,
                ReferenceNumber = submitTransactionParameter.ReferenceNumber,
                CurrencyCode = submitTransactionParameter.CurrencyCode,
                BillToAddress = submitTransactionParameter.BillToAddress,
                ShipToAddress = submitTransactionParameter.ShipToAddress,
                PaymentProfileId = submitTransactionParameter.PaymentProfileId,
                CreditCard = submitTransactionParameter.CreditCard,
                Amount = submitTransactionParameter.Amount,
                WebsiteId = submitTransactionParameter.WebsiteId,
                OriginalRequestToken = submitTransactionResult.ResponseToken
            };
            CreditCardTransaction creditCardTransaction = this.CreateCreditCardTransaction(transactionParameter);
            submitTransactionParameter.OriginalRequestToken = submitTransactionResult.ResponseToken;
            SubmitTransactionResult submitTransactionResult1 = this.GetPaymentGateway().SubmitTransaction(transactionParameter);
            this.UpdateCreditCardTransaction(creditCardTransaction, transactionParameter, submitTransactionResult1);
        }

        private AddPaymentTransactionResult ResendTransaction(SubmitTransactionParameter submitTransactionParameter)
        {
            SubmitTransactionParameter transactionParameter = new SubmitTransactionParameter()
            {
                TransactionType = submitTransactionParameter.TransactionType,
                ReferenceNumber = submitTransactionParameter.ReferenceNumber,
                OriginalRequestNumber = submitTransactionParameter.OriginalRequestNumber,
                OriginalRequestToken = submitTransactionParameter.OriginalRequestToken,
                Amount = submitTransactionParameter.Amount,
                WebsiteId = submitTransactionParameter.WebsiteId,
                IsResentTransaction = true
            };
            CreditCardTransaction creditCardTransaction = this.CreateCreditCardTransaction(transactionParameter);
            SubmitTransactionResult submitTransactionResult = this.GetPaymentGateway().SubmitTransaction(transactionParameter);
            this.UpdateCreditCardTransaction(creditCardTransaction, transactionParameter, submitTransactionResult);
            if (!submitTransactionResult.Success)
                return this.CreateErrorServiceResult<AddPaymentTransactionResult>(SubCode.CreditCardFailed, string.Join(Environment.NewLine, (IEnumerable<string>)submitTransactionResult.ResponseMessages));
            return new AddPaymentTransactionResult()
            {
                CreditCardTransaction = this.UpdateCreditCardTransaction(creditCardTransaction, submitTransactionParameter, submitTransactionResult)
            };
        }

        private string GetAvsAddr(SubmitTransactionParameter submitTransactionParameter)
        {
            if (submitTransactionParameter.BillToAddress == null)
                return string.Empty;
            return string.Format("{0} | {1} | {2} | {3} | {4}", (object)submitTransactionParameter.BillToAddress.Address1, (object)submitTransactionParameter.BillToAddress.Address2, (object)submitTransactionParameter.BillToAddress.City, (object)submitTransactionParameter.BillToAddress.State, (object)submitTransactionParameter.BillToAddress.Country);
        }
    }
}

