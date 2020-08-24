using Insite.Common.DynamicLinq;
using Insite.Core.Interfaces.Data;
using Insite.Core.Plugins.Utilities;
using Insite.Core.Services;
using Insite.Core.WebApi;
using Insite.PunchOut.HttpHandlers.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Plugins.Helper;
using InSiteCommerce.Brasseler.CustomAPI.Services;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Dtos;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System.Linq;
using System.Web.Http;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1
{

    [Authorize]
    [RoutePrefix("api/v1/outstandinginvoices")]
    public class OutstandingInvoicesV1Controller : BaseApiController
    {
        protected readonly IUnitOfWork unitOfWork;
        protected string xmlRequest;
        protected readonly IXmlHelper xmlHelper;
        protected readonly OutstandingInvoiceService OutstandingInvoiceService;
        protected CustomSettings customSettings;

        public OutstandingInvoicesV1Controller(IXmlHelper XmlHelper, ICookieManager cookieManager, IUnitOfWorkFactory unitOfWorkFactory, OutstandingInvoiceService OutstandingInvoiceService)
      : base(cookieManager)
        {
            this.unitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.xmlHelper = XmlHelper;
            this.OutstandingInvoiceService = OutstandingInvoiceService;
            customSettings = new CustomSettings();
        }

        [HttpPost]
        [Route(Name = "OutstandingInvoicesDtoV1")]
        public dynamic Post([FromBody] GetOutstandingInvoicesDto getOutstandingInvoicesDto, [FromUri] GetOutstandingInvoiceParameter parameter)
        {
            XmlToModelConverter xmlToModelConverter = new XmlToModelConverter();
            xmlRequest = this.OutstandingInvoiceService.CreateRequestXml(getOutstandingInvoicesDto, parameter);
            var response = this.OutstandingInvoiceService.PostXml(parameter, xmlRequest);
            if (response.IsSuccessStatusCode)
            {
                if (parameter.TransactionName.Equals("ARSummary"))
                {
                    ARSummary openinvoices = new ARSummary();
                    openinvoices = xmlToModelConverter.Deserialize<ARSummary>(response.Content.ReadAsStringAsync().Result);
                    return openinvoices;
                }
                else if (parameter.TransactionName.Equals("AROpenInvoices"))
                {                  
					AROpenInvoicesResult openinvoicesResult = new AROpenInvoicesResult();
                    openinvoicesResult.AROpenInvoices = xmlToModelConverter.Deserialize<AROpenInvoices>(response.Content.ReadAsStringAsync().Result);
                    openinvoicesResult.Pagination = new PagingModel();
                    IQueryable<Invoice> invoiceQuery = openinvoicesResult.AROpenInvoices.Invoice.AsQueryable();

                    this.OutstandingInvoiceService.GetShiptos(invoiceQuery, getOutstandingInvoicesDto.CustomerNumber);
                    invoiceQuery = string.IsNullOrWhiteSpace(parameter.Sort) ? invoiceQuery.OrderBy<Invoice>("InvoiceDate") : invoiceQuery.OrderBy<Invoice>(parameter.Sort);

                    var pagedResult = this.OutstandingInvoiceService.ApplyPaging<Invoice>((PagingParameterBase)parameter, (PagingResultBase)openinvoicesResult.Pagination, invoiceQuery).ToList();

                    // Frontend Model
                    AROpenInvoicesResult openinvoices = new AROpenInvoicesResult();
                    openinvoices.AROpenInvoices = new AROpenInvoices();
                    openinvoices.AROpenInvoices = openinvoicesResult.AROpenInvoices;
                    openinvoices.PagedOpenInvoices = new AROpenInvoices();
                    openinvoices.PagedOpenInvoices.Invoice = pagedResult.ToList<Invoice>();
                    openinvoices.Pagination = new PagingModel(openinvoicesResult.Pagination.Page, openinvoicesResult.Pagination.PageSize, openinvoicesResult.Pagination.DefaultPageSize, openinvoicesResult.Pagination.TotalCount);

                    if (openinvoicesResult.Pagination.Page > 1)
                        openinvoices.Pagination.PrevPageUri = this.OutstandingInvoiceService.GetLink(openinvoicesResult.Pagination, this.Request, openinvoicesResult.Pagination.Page - 1);
                    if (openinvoicesResult.Pagination.Page < openinvoicesResult.Pagination.TotalPages)
                        openinvoices.Pagination.NextPageUri = this.OutstandingInvoiceService.GetLink(openinvoicesResult.Pagination, this.Request, openinvoicesResult.Pagination.Page + 1);

                    return openinvoices;
                }
                else
                {
                    ARInvoiceDetail openinvoices = new ARInvoiceDetail();
                    openinvoices = xmlToModelConverter.Deserialize<ARInvoiceDetail>(response.Content.ReadAsStringAsync().Result);
                    return openinvoices;
                }

            }

            return response;
        }

        [HttpPost]
        [Route("~/api/v1/getoutstandingorder")]
        public OutstandingOrderModel Post([FromBody] GetOutstandingOrderDto getOrderDto, [FromUri] GetOutstandingInvoiceParameter parameter)
        {
            OutstandingOrderModel openinvoices = null;
            XmlToModelConverter xmlToModelConverter = new XmlToModelConverter();
            xmlRequest = this.OutstandingInvoiceService.CreateOrderRequestXml(getOrderDto, parameter);
            var response = this.OutstandingInvoiceService.PostXml(parameter, xmlRequest);
            if (response.IsSuccessStatusCode)
                openinvoices = xmlToModelConverter.Deserialize<OutstandingOrderModel>(response.Content.ReadAsStringAsync().Result);

            return openinvoices;
        }

    }
}