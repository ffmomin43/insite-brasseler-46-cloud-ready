using Insite.Cart.WebApi.V1.Mappers;
using Insite.Cart.Services.Results;
using Insite.Cart.WebApi.V1.ApiModels;
using Insite.Cart.WebApi.V1.Mappers.Interfaces;
using Insite.Core.Interfaces.Localization;
using Insite.Core.Plugins.Utilities;
using Insite.Core.WebApi.Interfaces;
using Insite.Customers.WebApi.V1.Mappers.Interfaces;
using Insite.Data.Entities;
using System;
using System.Net.Http;
using Insite.Core.Context;
using System.Linq;
using Insite.Websites.WebApi.V1.Mappers.Interfaces;
using Insite.Websites.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos;
using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using Insite.Cart.Services.Dtos;
using Insite.Data.Entities.Dtos.Interfaces;
using System.Collections.Generic;
using Insite.Core.Services;

namespace InSiteCommerce.Brasseler.Services.Mappers
{
    public class GetCartMapper_Brasseler : GetCartMapper
    {
        protected readonly ICurrencyFormatProvider CurrencyFormatProvider;
        protected readonly IGetBillToMapper GetBillToMapper;
        protected readonly IGetCartLineCollectionMapper GetCartLineCollectionMapper;
        protected readonly IGetShipToMapper GetShipToMapper;
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        protected readonly IRouteDataProvider RouteDataProvider;
        protected readonly ITranslationLocalizer TranslationLocalizer;
        protected readonly IUrlHelper UrlHelper;
        protected readonly IGetCountryMapper GetCountryMapper;
        protected readonly IGetStateMapper GetStateMapper;
        protected readonly IUnitOfWork UnitOfWork;

        public GetCartMapper_Brasseler(ICurrencyFormatProvider currencyFormatProvider, IGetCountryMapper getCountryMapper, IGetStateMapper getStateMapper, IGetBillToMapper getBillToMapper, IGetShipToMapper getShipToMapper, IGetCartLineCollectionMapper getCartLineCollectionMapper, IObjectToObjectMapper objectToObjectMapper, IUrlHelper urlHelper, IRouteDataProvider routeDataProvider, ITranslationLocalizer translationLocalizer, IUnitOfWorkFactory unitOfWork)
            : base(currencyFormatProvider, getBillToMapper, getShipToMapper, getCartLineCollectionMapper, objectToObjectMapper, urlHelper, routeDataProvider, translationLocalizer)
        {
            this.CurrencyFormatProvider = currencyFormatProvider;
            this.GetBillToMapper = getBillToMapper;
            this.GetShipToMapper = getShipToMapper;
            this.GetCartLineCollectionMapper = getCartLineCollectionMapper;
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.UrlHelper = urlHelper;
            this.RouteDataProvider = routeDataProvider;
            this.TranslationLocalizer = translationLocalizer;
            this.GetCountryMapper = getCountryMapper;
            this.GetStateMapper = getStateMapper;
            this.UnitOfWork = unitOfWork.GetUnitOfWork();
        }


        public override CartModel MapResult(GetCartResult serviceResult, HttpRequestMessage request)
        {
            CustomerOrder cart = serviceResult.Cart;
            CartModel destination = this.ObjectToObjectMapper.Map<GetCartResult, CartModel>(serviceResult);
            this.ObjectToObjectMapper.Map<CustomerOrder, CartModel>(cart, destination);
            if (cart.ShipVia != null)
                this.ObjectToObjectMapper.Map<Carrier, CarrierDto>(cart.ShipVia.Carrier, destination.Carrier);
            destination.SalespersonName = cart.Salesperson?.Name ?? string.Empty;
            destination.InitiatedByUserName = cart.InitiatedByUserProfile?.UserName ?? string.Empty;
            destination.OrderSubTotal = serviceResult.OrderSubTotal;
            destination.OrderSubTotalDisplay = this.CurrencyFormatProvider.GetString(destination.OrderSubTotal, (ICurrency)cart.Currency);
            destination.OrderSubTotalWithOutProductDiscounts = serviceResult.OrderSubTotalWithOutProductDiscounts;
            destination.OrderSubTotalWithOutProductDiscountsDisplay = this.CurrencyFormatProvider.GetString(destination.OrderSubTotalWithOutProductDiscounts, (ICurrency)cart.Currency);
            destination.OrderGrandTotal = serviceResult.OrderGrandTotal;
            destination.OrderGrandTotalDisplay = this.CurrencyFormatProvider.GetString(destination.OrderGrandTotal, (ICurrency)cart.Currency);
            destination.ShippingAndHandling = serviceResult.ShippingAndHandling;
            destination.ShippingAndHandlingDisplay = this.CurrencyFormatProvider.GetString(destination.ShippingAndHandling, (ICurrency)cart.Currency);
            destination.TotalTax = serviceResult.TotalTax;
            destination.TotalTaxDisplay = this.CurrencyFormatProvider.GetString(destination.TotalTax, (ICurrency)cart.Currency);
            destination.TypeDisplay = this.TranslationLocalizer.TranslateLabel(cart.Type);
            destination.StatusDisplay = this.TranslationLocalizer.TranslateLabel(cart.Status);
            destination.CurrencySymbol = serviceResult.CurrencySymbol;
            CartModel cartModel1 = destination;
            DateTimeOffset? requestedDeliveryDate1 = serviceResult.RequestedDeliveryDate;

            DateTimeOffset valueOrDefault;
            string str;
            if (!requestedDeliveryDate1.HasValue)
            {
                str = (string)null;
            }
            else
            {
                valueOrDefault = requestedDeliveryDate1.GetValueOrDefault();
                str = valueOrDefault.ToString();
            }
            cartModel1.RequestedDeliveryDate = str;
            CartModel cartModel2 = destination;
            DateTimeOffset? requestedDeliveryDate2 = serviceResult.RequestedDeliveryDate;

            DateTime? nullable;
            if (!requestedDeliveryDate2.HasValue)
            {
                nullable = new DateTime?();
            }
            else
            {
                valueOrDefault = requestedDeliveryDate2.GetValueOrDefault();
                nullable = new DateTime?(valueOrDefault.Date);
            }
            cartModel2.RequestedDeliveryDateDisplay = nullable;
            if (cart.Status.EqualsIgnoreCase("Cart"))
                destination.Id = this.RouteDataProvider.GetRouteValue(request, "cartid");
            if (serviceResult.GetBillToResult != null)
            {
                destination.BillTo = this.GetBillToMapper.MapResult(serviceResult.GetBillToResult, request);
                if (serviceResult.Properties.ContainsKey("IsNewUser") && destination.BillTo != null)
                {
                    destination.BillTo.FirstName = serviceResult.Cart.BTFirstName;
                    destination.BillTo.LastName = serviceResult.Cart.BTLastName;
                    destination.BillTo.CompanyName = serviceResult.Cart.BTCompanyName;
                    destination.BillTo.Address1 = serviceResult.Cart.BTAddress1;
                    destination.BillTo.Address2 = serviceResult.Cart.BTAddress2;
                    destination.BillTo.City = serviceResult.Cart.BTCity;
                    destination.BillTo.PostalCode = serviceResult.Cart.BTPostalCode;
                    destination.BillTo.Phone = serviceResult.Cart.BTPhone;
                    destination.BillTo.Email = serviceResult.Cart.BTEmail;
                    if (!string.IsNullOrEmpty(serviceResult.Cart.BTCountry))
                    {


                        var country = SiteContext.Current.Website.Countries.Where(c => c.Name.Equals(serviceResult.Cart.BTCountry)).FirstOrDefault(); //TODO - Obsoleted Website -> WebsiteDTO
                        if (country != null && !string.IsNullOrEmpty(serviceResult.Cart.BTState))
                        {
                            destination.BillTo.Country = GetCountryMapper.MapResult(new GetCountryResult() { Country = country }, request);
                            var state = country.States.Where(s => s.Name.Equals(serviceResult.Cart.BTState)).FirstOrDefault();
                            if (state != null)
                                destination.BillTo.State = GetStateMapper.MapResult(new GetStateResult() { State = state }, request);
                        }
                    }
                }
            }
            if (serviceResult.GetShipToResult != null)
            {
                destination.ShipTo = this.GetShipToMapper.MapResult(serviceResult.GetShipToResult, request);
                destination.ShipToLabel = serviceResult.GetShipToResult.Label;
                if (serviceResult.Properties.ContainsKey("IsNewUser") && destination.ShipTo != null)
                {
                    destination.ShipTo.FirstName = serviceResult.Cart.STFirstName;
                    destination.ShipTo.LastName = serviceResult.Cart.STLastName;
                    destination.ShipTo.CompanyName = serviceResult.Cart.STCompanyName;
                    destination.ShipTo.Address1 = serviceResult.Cart.STAddress1;
                    destination.ShipTo.Address2 = serviceResult.Cart.STAddress2;
                    destination.ShipTo.City = serviceResult.Cart.STCity;
                    destination.ShipTo.PostalCode = serviceResult.Cart.STPostalCode;
                    destination.ShipTo.Phone = serviceResult.Cart.STPhone;
                    if (!string.IsNullOrEmpty(serviceResult.Cart.STCountry))
                    {
                        var country = SiteContext.Current.Website.Countries.Where(c => c.Name.Equals(serviceResult.Cart.STCountry)).FirstOrDefault();
                        if (country != null && !string.IsNullOrEmpty(serviceResult.Cart.STState))
                        {
                            destination.ShipTo.Country = GetCountryMapper.MapResult(new GetCountryResult() { Country = country }, request);
                            var state = country.States.Where(s => s.Name.Equals(serviceResult.Cart.STState)).FirstOrDefault();
                            if (state != null)
                                destination.ShipTo.State = GetStateMapper.MapResult(new GetStateResult() { State = state }, request);
                        }
                    }
                }
            }
            //Below code was removed in 4.2
            //foreach (CustomerOrderTaxDto customerOrderTax in (IEnumerable<CustomerOrderTaxDto>)destination.CustomerOrderTaxes)
            //{
            //    customerOrderTax.TaxCode = this.TranslationLocalizer.TranslateLabel(customerOrderTax.TaxCode);
            //    customerOrderTax.TaxDescription = this.TranslationLocalizer.TranslateLabel(customerOrderTax.TaxDescription);
            //    customerOrderTax.TaxAmountDisplay = this.CurrencyFormatProvider.GetString(customerOrderTax.TaxAmount, (ICurrency)cart.Currency);
            //}
            destination.Uri = this.UrlHelper.Link("CartV1", (object)new
            {
                cartid = destination.Id
            }, request);
            destination.CartLinesUri = this.UrlHelper.Link("CartLinesV1", (object)new
            {
                cartid = destination.Id
            }, request);
            CartLineCollectionModel lineCollectionModel = this.GetCartLineCollectionMapper.MapResult(new GetCartLineCollectionResult()
            {
                GetCartResult = serviceResult,
                GetCartLineResults = serviceResult.CartLineResults
            }, request);
            if (lineCollectionModel != null)
                destination.CartLines = lineCollectionModel.CartLines;
            if (destination.Status.EqualsIgnoreCase("SubscriptionOrder"))
            {
                CartModel_Brasseler cartModel_Brasseler = new CartModel_Brasseler();

                var cartModel = AutoMapper.Mapper.DynamicMap<CartModel_Brasseler>(destination);
                cartModel.CartSubscriptionDto = new CartSubscriptionDto();

                var subscriptionBrasseler = this.UnitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().Where(x => x.CustomerOrderId.ToString().ToUpper() == destination.Id.ToUpper()).FirstOrDefault();

                if (subscriptionBrasseler != null)
                {
                    cartModel.CartSubscriptionDto.CustomerOrderId = subscriptionBrasseler.CustomerOrderId;
                    cartModel.CartSubscriptionDto.Frequency = subscriptionBrasseler.Frequency;
                    cartModel.CartSubscriptionDto.NextDelieveryDate = subscriptionBrasseler.NextDelieveryDate;
                    cartModel.CartSubscriptionDto.DeActivationDate = subscriptionBrasseler.DeActivationDate;
                    cartModel.CartSubscriptionDto.ActivationDate = subscriptionBrasseler.ActivationDate;
                    cartModel.CartSubscriptionDto.PaymentMethod = subscriptionBrasseler.PaymentMethod;
                    return cartModel;
                }
            }

            destination.Messages = (ICollection<string>)serviceResult.Messages.Select<ResultMessage, string>((Func<ResultMessage, string>)(m => m.Message)).ToList<string>();
            destination.CreditCardBillingAddress = serviceResult.CreditCardBillingAddress;
            return destination;
        }
    }
}
