using Insite.Common.Helpers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using Insite.Invoice.Services;
using Insite.Invoice.Services.Parameters;
using Insite.Invoice.Services.Results;
using Insite.Invoice.WebApi.V1.ApiModels;
using Insite.Invoice.WebApi.V1.Mappers.Interfaces;
using Insite.WebFramework.Mvc;
using Insite.WebFramework.Templating;
using Insite.WebFramework.Theming;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections;
using System.IO;
using System.Web.Mvc;

namespace InsiteCommerce.Web.Areas.Controllers
{
    public class InvoiceController : BaseController
    {
        protected readonly IGetInvoiceMapper GetInvoiceMapper;
        protected readonly IInvoiceService InvoiceService;
        protected readonly IThemeContentProvider ThemeContentProvider;
        protected readonly IEmailTemplateRenderer EmailTemplateRenderer;

        public InvoiceController(IUnitOfWorkFactory unitOfWorkFactory, IGetInvoiceMapper getInvoiceMapper, IInvoiceService invoiceService, IThemeContentProvider themeContentProvider, IEmailTemplateRenderer emailTemplateRenderer)
      : base(unitOfWorkFactory)
        {
            this.GetInvoiceMapper = getInvoiceMapper;
            this.InvoiceService = invoiceService;
            this.ThemeContentProvider = themeContentProvider;
            this.EmailTemplateRenderer = emailTemplateRenderer;
        }

        public void GeneratePdf(string invoiceNumber, Stream pdfStream)
        {
            string name;
            GetInvoiceResult invoice = this.InvoiceService.GetInvoice(new GetInvoiceParameter(invoiceNumber)
            {
                GetInvoiceLines = true
            });
            InvoiceModel invoiceModel = this.GetInvoiceMapper.MapResult(invoice, null);
            Theme theme = base.UnitOfWork.GetRepository<Theme>().Get(SiteContext.Current.WebsiteDto.ThemeId);
            if (theme.ThemeSource == null)
            {
                name = (theme.IsSystemTheme ? "System" : "User");
            }
            else
            {
                name = theme.ThemeSource.Name;
            }
            string str = string.Format("~/frontendresources/{0}/{1}/pdfviews/invoicedetails.cshtml", name, theme.Name);
            ThemeContentDto byPath = this.ThemeContentProvider.GetByPath(str);
            if (invoiceModel.InvoiceNumber.Contains("-"))
            {
                string[] invoiceNumberArray = invoiceModel.InvoiceNumber.Split('-');
                if (invoiceNumberArray.Length > 0)
                {
                    invoiceModel.InvoiceNumber = invoiceNumberArray[0];
                }
            }
            dynamic expando = invoiceModel.ToJson(false).ToExpando();
            DateTime invoiceDate = invoiceModel.InvoiceDate;
            expando.InvoiceDateDisplay = invoiceDate.ToShortDateString();
            invoiceDate = invoiceModel.DueDate;
            expando.DueDateDisplay = invoiceDate.ToShortDateString();
            decimal invoiceTotal = invoiceModel.InvoiceTotal - invoiceModel.CurrentBalance;
            expando.PaymentTotalDisplay = invoiceTotal.ToString("0.00");

            foreach (dynamic obj in (IEnumerable)expando.InvoiceLines)
            {
                obj.QtyInvoicedDisplay = obj.QtyInvoiced.ToString("0");
            }

            //Display Company logo based on website
            CustomSettings customSettings = new CustomSettings();
            expando.CompanyIdentifier = customSettings.CompanyNameIdentifier;

            PdfGeneratorHelper.GeneratePdf(this.EmailTemplateRenderer.Render(byPath.Content, expando), pdfStream);
        }

        public ActionResult GetPdf(string invoiceNumber)
        {
            ActionResult actionResult;
            using (MemoryStream memoryStream = new MemoryStream())
            {
                this.GeneratePdf(invoiceNumber, memoryStream);
                string str = string.Format("invoice_{0}.pdf", invoiceNumber);
                base.Response.AppendHeader("Content-Disposition", string.Concat("inline; filename=", str));
                actionResult = base.File(memoryStream.ToArray(), "application/pdf");
            }
            return actionResult;
        }
    }
}