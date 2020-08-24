using System.Xml.Serialization;
using System.Collections.Generic;
using Insite.Core.Services;
using System;
using Insite.Core.WebApi;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    public class AROpenInvoicesResult
    {
        public AROpenInvoices AROpenInvoices { get; set; }

        public PagingModel Pagination { get; set; }

        public AROpenInvoices PagedOpenInvoices { get; set; }

    }

    public class PagingModel : PagingResultBase
    {
        public PagingModel() { }

        public PagingModel(int page, int pageSize, int defaultPageSize, int totalCount)
        {
            this.Page = page;
            this.CurrentPage = page;
            this.PageSize = pageSize;
            this.DefaultPageSize = defaultPageSize <= 0 ? 8 : defaultPageSize;
            this.TotalItemCount = totalCount;
            if (totalCount != 0 && this.PageSize != 0)
                this.NumberOfPages = (int)Math.Ceiling((double)this.TotalItemCount / (double)this.PageSize);
            this.PageSizeOptions = new List<int>();
            this.CalculatePageSizeOptions();
        }

        [Obsolete]
        public int CurrentPage { get; set; }

        public int TotalItemCount { get; set; }

        public int NumberOfPages { get; set; }

        public List<int> PageSizeOptions { get; set; }

        public List<SortOptionModel> SortOptions { get; set; }

        public string SortType { get; set; }

        public string NextPageUri { get; set; }

        public string PrevPageUri { get; set; }

        public void CalculatePageSizeOptions()
        {
            int num1 = this.DefaultPageSize;
            int num2 = 1;
            for (; num1 <= 4 * this.DefaultPageSize; num1 = num2 * this.DefaultPageSize)
            {
                this.PageSizeOptions.Add(num1);
                ++num2;
            }
        }
    }

    [XmlRoot(ElementName = "AROpenInvoices")]
    public class AROpenInvoices
    {
        [XmlElement(ElementName = "Invoice")]
        public List<Invoice> Invoice { get; set; }
        [XmlElement(ElementName = "MoreRecords")]
        public string MoreRecords { get; set; }
    }

    [XmlRoot(ElementName = "Invoice")]
    public class Invoice
    {
        [XmlElement(ElementName = "InvoiceNumber")]
        public int InvoiceNumber { get; set; }
        [XmlElement(ElementName = "InvoiceType")]
        public string InvoiceType { get; set; }
        [XmlElement(ElementName = "InvoiceDisputeCode")]
        public string InvoiceDisputeCode { get; set; }
        [XmlElement(ElementName = "FinanceChargeFlag")]
        public string FinanceChargeFlag { get; set; }
        [XmlElement(ElementName = "InvoiceCentury")]
        public string InvoiceCentury { get; set; }
        [XmlElement(ElementName = "InvoiceDate")]
        public string InvoiceDate { get; set; }
        [XmlElement(ElementName = "AgeCentury")]
        public string AgeCentury { get; set; }
        [XmlElement(ElementName = "AgeDate")]
        public string AgeDate { get; set; }
        [XmlElement(ElementName = "InvoiceAmount")]
        public Double InvoiceAmount { get; set; }
        [XmlElement(ElementName = "InvoiceBalance")]
        public Double InvoiceBalance { get; set; }
        [XmlElement(ElementName = "TradeInvoiceAmount")]
        public Double TradeInvoiceAmount { get; set; }
        [XmlElement(ElementName = "TradeInvoiceBalanceAmt")]
        public Double TradeInvoiceBalanceAmt { get; set; }
        [XmlElement(ElementName = "CurrencySymbol")]
        public string CurrencySymbol { get; set; }
        [XmlElement(ElementName = "LastTransactionCentury")]
        public string LastTransactionCentury { get; set; }
        [XmlElement(ElementName = "LastTransactionDate")]
        public string LastTransactionDate { get; set; }
        [XmlElement(ElementName = "PayDays")]
        public int PayDays { get; set; }
        [XmlElement(ElementName = "OrderNumber")]
        public string OrderNumber { get; set; }
        [XmlElement(ElementName = "CustomerPO")]
        public string CustomerPO { get; set; }
        [XmlIgnore]
        public string ShipTo { get; set; }
        [XmlIgnore]
        public DateTime? DueDate { get; set; } = null;
        [XmlIgnore]
        public Double AmountPaid { get; set; }
        [XmlIgnore]
        public bool Refreshed { get; set; }
    }

}

