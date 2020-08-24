using System.Xml.Serialization;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    [XmlRoot(ElementName = "ARSummary")]
    public class ARSummary
    {
        [XmlElement(ElementName = "CustomerName")]
        public string CustomerName { get; set; }
        [XmlElement(ElementName = "Address1")]
        public string Address1 { get; set; }
        [XmlElement(ElementName = "Address2")]
        public string Address2 { get; set; }
        [XmlElement(ElementName = "Address3")]
        public string Address3 { get; set; }
        [XmlElement(ElementName = "Address4")]
        public string Address4 { get; set; }
        [XmlElement(ElementName = "City")]
        public string City { get; set; }
        [XmlElement(ElementName = "State")]
        public string State { get; set; }
        [XmlElement(ElementName = "Country")]
        public string Country { get; set; }
        [XmlElement(ElementName = "ZipCode")]
        public string ZipCode { get; set; }
        [XmlElement(ElementName = "OpenOrderAmount")]
        public string OpenOrderAmount { get; set; }
        [XmlElement(ElementName = "BillingPeriodAmt")]
        public string BillingPeriodAmt { get; set; }
        [XmlElement(ElementName = "AgePeriod1Amt")]
        public string AgePeriod1Amt { get; set; }
        [XmlElement(ElementName = "AgePeriod2Amt")]
        public string AgePeriod2Amt { get; set; }
        [XmlElement(ElementName = "AgePeriod3Amt")]
        public string AgePeriod3Amt { get; set; }
        [XmlElement(ElementName = "AgePeriod4Amt")]
        public string AgePeriod4Amt { get; set; }
        [XmlElement(ElementName = "AmountDue")]
        public string AmountDue { get; set; }
        [XmlElement(ElementName = "FutureAmount")]
        public string FutureAmount { get; set; }
        [XmlElement(ElementName = "SalesMonthToDate")]
        public string SalesMonthToDate { get; set; }
        [XmlElement(ElementName = "SalesYearToDate")]
        public string SalesYearToDate { get; set; }
        [XmlElement(ElementName = "SalesLastYear")]
        public string SalesLastYear { get; set; }
        [XmlElement(ElementName = "LPCentury")]
        public string LPCentury { get; set; }
        [XmlElement(ElementName = "DateOfLastPayment")]
        public string DateOfLastPayment { get; set; }
        [XmlElement(ElementName = "FSCentury")]
        public string FSCentury { get; set; }
        [XmlElement(ElementName = "DateOfFirstSale")]
        public string DateOfFirstSale { get; set; }
        [XmlElement(ElementName = "LSCentury")]
        public string LSCentury { get; set; }
        [XmlElement(ElementName = "DateOfLastSale")]
        public string DateOfLastSale { get; set; }
        [XmlElement(ElementName = "CurrencyCode")]
        public string CurrencyCode { get; set; }
        [XmlElement(ElementName = "TradeOpenOrderAmt")]
        public string TradeOpenOrderAmt { get; set; }
        [XmlElement(ElementName = "TradeBillingPeriodAmt")]
        public string TradeBillingPeriodAmt { get; set; }
        [XmlElement(ElementName = "TradeAgePeriod1Amt")]
        public string TradeAgePeriod1Amt { get; set; }
        [XmlElement(ElementName = "TradeAgePeriod2Amt")]
        public string TradeAgePeriod2Amt { get; set; }
        [XmlElement(ElementName = "TradeAgePeriod3Amt")]
        public string TradeAgePeriod3Amt { get; set; }
        [XmlElement(ElementName = "TradeAgePeriod4Amt")]
        public string TradeAgePeriod4Amt { get; set; }
        [XmlElement(ElementName = "TradeAmountDue")]
        public string TradeAmountDue { get; set; }
        [XmlElement(ElementName = "TradeFutureAmt")]
        public string TradeFutureAmt { get; set; }
        [XmlElement(ElementName = "TradeSalesMonthToDate")]
        public string TradeSalesMonthToDate { get; set; }
        [XmlElement(ElementName = "TradeSalesYearToDate")]
        public string TradeSalesYearToDate { get; set; }
        [XmlElement(ElementName = "TradeSalesLastYear")]
        public string TradeSalesLastYear { get; set; }
        [XmlElement(ElementName = "TradeCurrencyCode")]
        public string TradeCurrencyCode { get; set; }
        [XmlElement(ElementName = "TermsDescription")]
        public string TermsDescription { get; set; }
        [XmlElement(ElementName = "AgeDaysPeriod1")]
        public string AgeDaysPeriod1 { get; set; }
        [XmlElement(ElementName = "AgeDaysPeriod2")]
        public string AgeDaysPeriod2 { get; set; }
        [XmlElement(ElementName = "AgeDaysPeriod3")]
        public string AgeDaysPeriod3 { get; set; }
        [XmlElement(ElementName = "AgeDaysPeriod4")]
        public string AgeDaysPeriod4 { get; set; }
    }

}
