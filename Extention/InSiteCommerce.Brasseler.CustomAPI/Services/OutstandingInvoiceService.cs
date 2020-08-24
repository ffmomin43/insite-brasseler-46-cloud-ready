using Insite.Common.Logging;
using Insite.Core.Extensions;
using Insite.Core.Interfaces.Data;
using Insite.Core.Services;
using Insite.Core.SystemSetting;
using Insite.Core.SystemSetting.Groups.SiteConfigurations;
using Insite.Core.WebApi.Interfaces;
using Insite.Data.Entities;
using Insite.PunchOut.Services;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Plugins.Helper;
using InSiteCommerce.Brasseler.CustomAPI.Services.Handlers;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Dtos;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Xml;

namespace InSiteCommerce.Brasseler.CustomAPI.Services
{
    public class OutstandingInvoiceService : ServiceBase
    {
        protected string xmlRequest;
        protected readonly IUnitOfWorkFactory unitOfWork;
        protected CustomSettings customSettings;
        protected readonly IXmlHelper xmlHelper;
        protected readonly IUrlHelper UrlHelper;

        public OutstandingInvoiceService(IUnitOfWorkFactory unitOfWorkFactory, IXmlHelper XmlHelper, IUrlHelper urlHelper) : base(unitOfWorkFactory)
        {
            this.unitOfWork = unitOfWorkFactory;
            customSettings = new CustomSettings();
            this.xmlHelper = XmlHelper;
            this.UrlHelper = urlHelper;
        }

        public string CreateOrderRequestXml(GetOutstandingOrderDto getOutstandingOrderDto, GetOutstandingInvoiceParameter parameter)
        {
            xmlRequest = "<request name=" + '"' + parameter.TransactionName + '"' + "> <GetOrderInfo>" + getOutstandingOrderDto.GetOrderInfo + "</GetOrderInfo> <CompanyNumber>" + customSettings.CompanyNameIdentifier + "</CompanyNumber> <CustomerNumber>" + getOutstandingOrderDto.CustomerNumber + "</CustomerNumber> <LookupType>" + getOutstandingOrderDto.LookupType + "</LookupType> <Source>" + getOutstandingOrderDto.Source + "</Source> <FromEntryDate>" + getOutstandingOrderDto.FromEntryDate + "</FromEntryDate> <ToEntryDate>" + getOutstandingOrderDto.EntryDate + "</ToEntryDate> <OrderNumber>" + getOutstandingOrderDto.OrderNumber + "</OrderNumber> <OrderGenerationNumber>" + getOutstandingOrderDto.OrderGenerationNumber + "</OrderGenerationNumber> <InvoiceNumber>" + getOutstandingOrderDto.InvoiceNumber + "</InvoiceNumber> <CustomerPurchaseOrderNumber>" + getOutstandingOrderDto.CustomerPurchaseOrderNumber + "</CustomerPurchaseOrderNumber> <ParentOrderNumber>" + getOutstandingOrderDto.ParentOrderNumber + "</ParentOrderNumber> <GuestFlag>" + getOutstandingOrderDto.GuestFlag + "</GuestFlag> <EmailAddress>" + getOutstandingOrderDto.EmailAddress + "</EmailAddress> <HistorySequenceNumber>" + getOutstandingOrderDto.HistorySequenceNumber + "</HistorySequenceNumber> <EntryDateCentury>" + getOutstandingOrderDto.EntryDateCentury + "</EntryDateCentury> <EntryDate>" + getOutstandingOrderDto.EntryDate + "</EntryDate> <IncludeHistory>" + getOutstandingOrderDto.IncludeHistory + "</IncludeHistory> <CreditCardKeySeq>" + getOutstandingOrderDto.CreditCardKeySeq + "</CreditCardKeySeq> </request>";

            return xmlRequest;
        }

        public string CreateRequestXml(GetOutstandingInvoicesDto getOutstandingInvoicesDto, GetOutstandingInvoiceParameter parameter)
        {
            if (parameter.TransactionName.Equals("AROpenInvoices"))
            {
                xmlRequest = "<request name=" + '"' + parameter.TransactionName + '"' + "> <CompanyNumber>" + customSettings.CompanyNameIdentifier + "</CompanyNumber> <CustomerNumber>" + getOutstandingInvoicesDto.CustomerNumber + "</CustomerNumber> <InvoiceNumberInq>" + getOutstandingInvoicesDto.InvoiceNumberInq + "</InvoiceNumberInq> <ToInvoiceNumber>" + getOutstandingInvoicesDto.ToInvoiceNumber + "</ToInvoiceNumber> <MaxInvoices>" + customSettings.InforMaxInvoices + "</MaxInvoices> <FromInvDate>" + getOutstandingInvoicesDto.FromInvDate + "</FromInvDate> <ToInvDate>" + getOutstandingInvoicesDto.ToInvDate + "</ToInvDate> <FromAgeDate>" + getOutstandingInvoicesDto.FromAgeDate + "</FromAgeDate> <ToAgeDate>" + getOutstandingInvoicesDto.ToAgeDate + "</ToAgeDate> <FromInvAmount>" + getOutstandingInvoicesDto.FromInvAmount + "</FromInvAmount> <ToInvAmount>" + getOutstandingInvoicesDto.ToInvAmount + "</ToInvAmount> </request> ";

            }
            else if (parameter.TransactionName.Equals("ARInvoiceDetail"))
            {
                xmlRequest = "<request name=" + '"' + parameter.TransactionName + '"' + "> <CompanyNumber>" + customSettings.CompanyNameIdentifier + "</CompanyNumber> <CustomerNumber>" + getOutstandingInvoicesDto.CustomerNumber + "</CustomerNumber> <InvoiceType>" + getOutstandingInvoicesDto.InvoiceType + "</InvoiceType> <InvoiceNumber>" + getOutstandingInvoicesDto.InvoiceNumberInq + "</InvoiceNumber> <Flag>" + getOutstandingInvoicesDto.Flag + "</Flag> </request>";
            }
            else
            {
                xmlRequest = "<request name=" + '"' + parameter.TransactionName + '"' + "> <CompanyNumber>" + customSettings.CompanyNameIdentifier + "</CompanyNumber> <CustomerNumber>" + getOutstandingInvoicesDto.CustomerNumber + "</CustomerNumber> </request>";
            }

            return xmlRequest;
        }

        public bool PayOpenInvoicesRequest(PayOpenInvoicesRequest invoiceRequest, string invoiceNumber)
        {
            XmlToModelConverter xmlToModelConverter = new XmlToModelConverter();
            string request = xmlToModelConverter.Serialize<PayOpenInvoicesRequest>(invoiceRequest);
            LogHelper.For(this).Info(request, "InforRequest");
            //string request = CreatePayInvoiceRequest(invoiceRequest);
            GetOutstandingInvoiceParameter parameter = new GetOutstandingInvoiceParameter();
            Boolean status;
            parameter.TransactionName = "PayOpenInvoices";
            var response = this.PostXml(parameter, request);

            if (!response.IsSuccessStatusCode)
            {
                string reason = response.ReasonPhrase + " : " + response.StatusCode + " : " + invoiceRequest.CreditCard.CCAuthorizationNumber + " Infor payment failed for " + invoiceNumber;
                LogHelper.For(this).Info(reason, "Failed InforResponse");
                status = false;
                InvoiceTransactionHandler handler = new InvoiceTransactionHandler(this.unitOfWork);
                handler.CreateInvoiceTransaction(invoiceRequest, reason, status);
                //throw error to frontend
                return false;
            }

            XmlDocument xmlDocument = this.xmlHelper.CreateXmlDocument(response.Content.ReadAsStringAsync().Result);
            string responseString = JsonConvert.SerializeXmlNode(xmlDocument);

            if (responseString.ContainsIgnoreCase(customSettings.InforSuccessMessage))
            {
                LogHelper.For(this).Info(response.StatusCode + " : " + invoiceRequest.CreditCard.CCAuthorizationNumber + " Infor payment successful for " + invoiceNumber, "successful InforResponse");

                status = true;
                InvoiceTransactionHandler handler = new InvoiceTransactionHandler(this.unitOfWork);
                handler.CreateInvoiceTransaction(invoiceRequest, responseString, status);
                return true;
            }
            else
            {
                //log in appl log and db for failed,invoice,amount,
                LogHelper.For(this).Info(response.StatusCode + " : " + invoiceRequest.CreditCard.CCAuthorizationNumber + " Infor payment failed for " + invoiceNumber, "Failed InforResponse");
                status = false;
                InvoiceTransactionHandler handler = new InvoiceTransactionHandler(this.unitOfWork);
                handler.CreateInvoiceTransaction(invoiceRequest, responseString, status);
                //throw error to frontend
                return false;
            }

        }

        public HttpResponseMessage PayOpenInvoicesJob(PayOpenInvoicesRequest invoiceRequest)
        {
            XmlToModelConverter xmlToModelConverter = new XmlToModelConverter();
            string request = xmlToModelConverter.Serialize<PayOpenInvoicesRequest>(invoiceRequest);
            //string request = CreatePayInvoiceRequest(invoiceRequest);
            GetOutstandingInvoiceParameter parameter = new GetOutstandingInvoiceParameter();

            parameter.TransactionName = "PayOpenInvoices";
            var response = this.PostXml(parameter, request);

            return response;
        }

        public HttpResponseMessage PostXml(GetOutstandingInvoiceParameter parameter, string xmlRequest)
        {
            using (var client = new HttpClient())
            {
                client.BaseAddress = new Uri(customSettings.InforUrl);
                client.DefaultRequestHeaders.Accept.Clear();

                var values = new Dictionary<string, string>
                {
                    { "Data", xmlRequest },
                    { "OutputType", customSettings.InforUrlOutputTypeParameter },
                    { "InputType", customSettings.InforUrlInputTypeParameter },
                    { "TransactionName",  parameter.TransactionName },
                    { "SubscriberID", customSettings.InforSubscriberID },
                    { "SubscriberPassword", customSettings.InforSubscriberPassword }
                };

                var content = new FormUrlEncodedContent(values);
                HttpResponseMessage response = client.PostAsync(client.BaseAddress, content).Result;
                return response;
            }

        }

        public IQueryable<T> ApplyPaging<T>( PagingParameterBase parameter, PagingResultBase result, IQueryable<T> query)
        {
            int defaultPageSize = SettingsGroupProvider.Current.Get<StorefrontApiSettings>(new Guid?()).DefaultPageSize;
            int count = !parameter.PageSize.HasValue || parameter.PageSize.Value <= 0 ? defaultPageSize : parameter.PageSize.Value;
            int num1 = parameter.Page ?? 0;
            int num2 = num1 <= 0 ? 1 : num1;
            int num3 = Queryable.Count<T>(query);
            result.PageSize = count;
            result.DefaultPageSize = defaultPageSize;
            result.Page = num2;
            result.TotalPages = (num3 - 1) / count + 1;
            result.TotalCount = num3;
            return Queryable.Take(Queryable.Skip(query, (num2 - 1) * count), count);
        }

        public string GetLink(PagingResultBase serviceResult, HttpRequestMessage request, int page)
        {
            var data = new
            {
                sort = request.GetQueryString("sort"),
                pagesize = serviceResult.PageSize,
                page = page
            };
            return this.UrlHelper.Link("OutstandingInvoicesDtoV1", (object)data, request);
        }

        public void GetShiptos(IQueryable<Invoice> invoices, string customerNumber)
        {
            var invoiceNumbers = (from invoice in invoices select invoice.InvoiceNumber.ToString()).ToArray();
            var customerinvoices = this.unitOfWork.GetUnitOfWork().GetRepository<InvoiceHistory>().GetTable().Where(ih => ih.CustomerNumber == customSettings.CompanyNameIdentifier +customerNumber).ToList();

            var ShiptoDueDate = customerinvoices.Where(
                ih => invoiceNumbers.Contains(ih.InvoiceNumber.ToString().Substring(0, ih.InvoiceNumber.ToString().IndexOf("-")))
                ).Select(
                s => new { inv = s.InvoiceNumber.ToString().Substring(0, s.InvoiceNumber.ToString().IndexOf("-")), s.DueDate, s.STCompanyName }
                ).Distinct().OrderBy(y => y.DueDate).ToList();

            foreach (var inv in invoices)
            {
                // Check Invoice refreshed balances - on hold
                //var checkInvBalance = this.unitOfWork.GetUnitOfWork().GetRepository<InvoiceTransaction>().GetTable().Where(it => it.InvoiceNumber == inv.InvoiceNumber.ToString())
                //     .GroupBy(f => new { f.InvoiceNumber, f.AmountPaid })
                //     .Select(group => new { fee = group.Key, amountpaid = group.Sum(f => f.AmountPaid) }).FirstOrDefault();
                //if (checkInvBalance != null && ( Convert.ToDecimal(inv.InvoiceAmount) - checkInvBalance.amountpaid == Convert.ToDecimal(inv.InvoiceBalance)))
                //{
                //    inv.Refreshed = true;
                //}
                //else
                //{
                //    inv.Refreshed = false;
                //}
                foreach (var s in ShiptoDueDate)
                {
                    if (inv.InvoiceNumber.ToString() == s.inv)
                    {
                        if (inv.DueDate == null)
                        {
                            inv.DueDate = s.DueDate;
                            inv.ShipTo = s.STCompanyName;
                        }
                    }
                }
                inv.AmountPaid = inv.TradeInvoiceAmount - inv.TradeInvoiceBalanceAmt;
            }
        }
    }
}

