using Insite.Cart.Services.Dtos;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common.Extensions;
using Insite.Common.Providers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Localization;
using Insite.Core.Plugins.PaymentGateway.Dtos;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Payments.Services;
using Insite.Payments.Services.Parameters;
using Insite.Payments.Services.Results;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;

namespace InSiteCommerce.Brasseler.Services.Handlers
{

    [DependencyName("PopulatePaymentOptions")]
    public sealed class PopulatePaymentOptions : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly Lazy<IEntityTranslationService> entityTranslationService;
        private readonly Lazy<IPaymentService> paymentService;
        private readonly CheckoutSettings checkoutSettings;

        public PopulatePaymentOptions(Lazy<IEntityTranslationService> entityTranslationService, Lazy<IPaymentService> paymentService, CheckoutSettings checkoutSettings)
        {
            this.paymentService = paymentService;
            this.entityTranslationService = entityTranslationService;
            this.checkoutSettings = checkoutSettings;
        }

        public override int Order
        {
            get
            {
                return 2190;
            }
        }

        public override GetCartResult Execute(IUnitOfWork unitOfWork, GetCartParameter parameter, GetCartResult result)
        {
            if (!parameter.GetPaymentOptions || SiteContext.Current.BillTo == null)
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            result.PaymentOptions = new PaymentOptionsDto();
            if (result.ShowPoNumber)
                this.PopulatePoOptions(unitOfWork, result.PaymentOptions);
            if (result.ShowCreditCard)
                this.PopulateCreditCardOptions(unitOfWork, result.PaymentOptions);
            result.PaymentMethod = result.PaymentOptions.PaymentMethods.FirstOrDefault<PaymentMethodDto>((Func<PaymentMethodDto, bool>)(o => o.Name.EqualsIgnoreCase(result.Cart.TermsCode)));
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        private void PopulatePoOptions(IUnitOfWork unitOfWork, PaymentOptionsDto paymentOptions)
        {
            Customer billTo = SiteContext.Current.BillTo;
            if (billTo.CreditHold)
                return;
            PaymentMethod customerPaymentMethod = unitOfWork.GetRepository<PaymentMethod>().GetTable().FirstOrDefault<PaymentMethod>((Expression<Func<PaymentMethod, bool>>)(o => o.Name == billTo.TermsCode));
            if (customerPaymentMethod == null || customerPaymentMethod.IsCreditCard)
                return;
            DateTimeOffset now = DateTimeProvider.Current.Now;
            unitOfWork.GetRepository<PaymentMethod>().GetTable().Where<PaymentMethod>((Expression<Func<PaymentMethod, bool>>)(o => o.ActivateOn < now && (o.DeactivateOn ?? DateTimeOffset.MaxValue) > now && o.Name.Equals(customerPaymentMethod.Name))).Each<PaymentMethod>((Action<PaymentMethod>)(o =>
            {
                ICollection<PaymentMethodDto> paymentMethods = paymentOptions.PaymentMethods;
                PaymentMethodDto paymentMethodDto = new PaymentMethodDto()
                {
                    Name = o.Name,
                    IsCreditCard = o.IsCreditCard,
                    Description = this.entityTranslationService.Value.TranslateProperty<PaymentMethod>(o, (Expression<Func<PaymentMethod, string>>)(x => x.Description))
                };
                paymentMethods.Add(paymentMethodDto);
            }));
        }

        private void PopulateCreditCardOptions(IUnitOfWork unitOfWork, PaymentOptionsDto paymentOptions)
        {
            DateTimeOffset now = DateTimeProvider.Current.Now;
            unitOfWork.GetRepository<PaymentMethod>().GetTable().Where<PaymentMethod>((Expression<Func<PaymentMethod, bool>>)(o => o.ActivateOn < now && (o.DeactivateOn ?? DateTimeOffset.MaxValue) > now && o.IsCreditCard)).Each<PaymentMethod>((Action<PaymentMethod>)(o =>
            {
                ICollection<PaymentMethodDto> paymentMethods = paymentOptions.PaymentMethods;
                PaymentMethodDto paymentMethodDto = new PaymentMethodDto()
                {
                    Name = o.Name,
                    IsCreditCard = o.IsCreditCard,
                    Description = this.entityTranslationService.Value.TranslateProperty<PaymentMethod>(o, (Expression<Func<PaymentMethod, string>>)(x => x.Description))
                };
                paymentMethods.Add(paymentMethodDto);
            }));
            GetPaymentSettingsResult paymentSettings = this.paymentService.Value.GetPaymentSettings(new GetPaymentSettingsParameter());
            paymentOptions.CanStorePaymentProfile = paymentSettings.ResultCode == ResultCode.Success && paymentSettings.SupportsStoredPaymentProfiles;
            if (paymentOptions.CanStorePaymentProfile)
                this.PopulateStoredPaymentProfile(paymentOptions);
            this.PopulateCardTypes(paymentOptions);
            this.PopulateExpirationDates(paymentOptions);
        }

        private void PopulateStoredPaymentProfile(PaymentOptionsDto paymentOptions)
        {
            UserProfileDto userProfile = SiteContext.Current.UserProfileDto;
            GetPaymentProfileCollectionResult profileCollection = this.paymentService.Value.GetPaymentProfileCollection(new GetPaymentProfileCollectionParameter()
            {
                BillToId = new Guid?(SiteContext.Current.BillTo.Id)
            });
            if (profileCollection.ResultCode != ResultCode.Success)
                return;
            profileCollection.PaymentProfiles.Each<PaymentProfileDto>((Action<PaymentProfileDto>)(o => paymentOptions.PaymentMethods.Add(new PaymentMethodDto()
            {
                Name = o.PaymentProfileId,
                Description = o.MaskedCardNumber + " " + GetCardType(o.CardType) + " " +
                            userProfile.UserPaymentProfiles.FirstOrDefault(x => x.CardIdentifier == o.PaymentProfileId).Description,
                IsPaymentProfile = true
            })));
        }

        private void PopulateCardTypes(PaymentOptionsDto paymentOptions)
        {
            paymentOptions.CardTypes = (ICollection<KeyValuePair<string, string>>)((IEnumerable<string>)this.checkoutSettings.AcceptedCreditCards.Split('|')).Select<string, KeyValuePair<string, string>>((Func<string, KeyValuePair<string, string>>)(o =>
            {
                string key = o;
                return new KeyValuePair<string, string>(key, key.ToUpper());
            })).ToList<KeyValuePair<string, string>>();
        }

        private void PopulateExpirationDates(PaymentOptionsDto paymentOptions)
        {
            DateTimeFormatInfo dateTimeFormat = Thread.CurrentThread.CurrentCulture.DateTimeFormat;
            paymentOptions.ExpirationMonths = (ICollection<KeyValuePair<string, int>>)Enumerable.Range(1, 12).Select<int, KeyValuePair<string, int>>((Func<int, KeyValuePair<string, int>>)(o => new KeyValuePair<string, int>(dateTimeFormat.GetMonthName(o), o))).ToList<KeyValuePair<string, int>>();
            paymentOptions.ExpirationYears = (ICollection<KeyValuePair<int, int>>)Enumerable.Range(DateTimeProvider.Current.Now.Year, 10).Select<int, KeyValuePair<int, int>>((Func<int, KeyValuePair<int, int>>)(o =>
            {
                int key = o;
                return new KeyValuePair<int, int>(key, key);
            })).ToList<KeyValuePair<int, int>>();
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
    }
}