using System.Net.Http;
using Insite.Core.Interfaces.Localization;
using Insite.Core.Plugins.Utilities;
using Insite.Core.WebApi.Interfaces;
using Insite.Invoice.Services.Results;
using Insite.Invoice.WebApi.V1.ApiModels;
using Insite.Invoice.WebApi.V1.Mappers;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Invoice.Services.Dtos;
namespace InSiteCommerce.Brasseler.Services.Mappers
{
    public class GetInvoiceMapper_Brasseler : GetInvoiceMapper
    {
        public GetInvoiceMapper_Brasseler(ICurrencyFormatProvider currencyFormatProvider, IUrlHelper urlHelper, IObjectToObjectMapper objectToObjectMapper, ITranslationLocalizer translationLocalizer) :base(currencyFormatProvider, urlHelper, objectToObjectMapper, translationLocalizer)
        {

        }

        public override InvoiceModel MapResult(GetInvoiceResult serviceResult, HttpRequestMessage request)
        {
            InvoiceHistory invoiceHistory = serviceResult.InvoiceHistory;
            Currency currency = serviceResult.Currency;
            InvoiceModel invoiceModel = ObjectToObjectMapper.Map<InvoiceHistory, InvoiceModel>(invoiceHistory);
            invoiceModel.DiscountAmountDisplay = CurrencyFormatProvider.GetString(invoiceModel.DiscountAmount, currency);
            invoiceModel.CurrentBalanceDisplay = CurrencyFormatProvider.GetString(invoiceModel.CurrentBalance, currency);
            invoiceModel.InvoiceTotalDisplay = CurrencyFormatProvider.GetString(invoiceModel.InvoiceTotal, currency);
            invoiceModel.OtherChargesDisplay = CurrencyFormatProvider.GetString(invoiceModel.OtherCharges, currency);
            invoiceModel.ProductTotalDisplay = CurrencyFormatProvider.GetString(invoiceModel.ProductTotal, currency);
            invoiceModel.ShippingAndHandlingDisplay = CurrencyFormatProvider.GetString(invoiceModel.ShippingAndHandling, currency);
            invoiceModel.TaxAmountDisplay = CurrencyFormatProvider.GetString(invoiceModel.TaxAmount, currency);
            invoiceModel.ShipViaDescription = serviceResult.ShipViaDescription;
            invoiceModel.Properties = serviceResult.Properties;
            invoiceModel.Uri = request == null ? string.Empty : UrlHelper.Link("InvoiceV1", new
            {
                invoiceid = invoiceModel.InvoiceNumber
            }, request);
            HandlerBase.CopyCustomPropertiesToResult(invoiceHistory, invoiceModel, null);
            foreach (GetInvoiceLineResult invoiceLineResult in serviceResult.GetInvoiceLineResults)
            {
                InvoiceLineModel destination = new InvoiceLineModel();
                if (invoiceLineResult.ProductDto != null)
                {
                    ObjectToObjectMapper.Map(invoiceLineResult.ProductDto, destination);
                    destination.ProductUri = invoiceLineResult.ProductDto.ProductDetailUrl;
                    destination.Properties.Add("ProductID", invoiceLineResult.ProductDto.Id.ToString()); 
                }
                ObjectToObjectMapper.Map(invoiceLineResult.InvoiceHistoryLine, destination);
                destination.UnitPriceDisplay = CurrencyFormatProvider.GetString(destination.UnitPrice, currency);
                destination.DiscountAmountDisplay = CurrencyFormatProvider.GetString(destination.DiscountAmount, currency);
                destination.LineTotalDisplay = CurrencyFormatProvider.GetString(destination.LineTotal, currency);
                HandlerBase.CopyCustomPropertiesToResult(invoiceLineResult.InvoiceHistoryLine, destination, null);
                invoiceModel.InvoiceLines.Add(destination);
            }
            foreach (InvoiceHistoryTaxDto invoiceHistoryTax in invoiceModel.InvoiceHistoryTaxes)
            {
                invoiceHistoryTax.TaxCode = TranslationLocalizer.TranslateLabel(invoiceHistoryTax.TaxCode);
                invoiceHistoryTax.TaxDescription = TranslationLocalizer.TranslateLabel(invoiceHistoryTax.TaxDescription);
                invoiceHistoryTax.TaxAmountDisplay = CurrencyFormatProvider.GetString(invoiceHistoryTax.TaxAmount, currency);
            }
            //invoiceModel.InvoiceDate = DateTime.SpecifyKind(invoiceModel.InvoiceDate, DateTimeKind.Unspecified) removed in 4.4;
            return invoiceModel;
        }

    }
}
