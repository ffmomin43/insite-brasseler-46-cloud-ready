using System;
using System.Xml.Serialization;
using System.Collections.Generic;
namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{

    [XmlRoot(ElementName = "ARInvoiceDetail")]
    public class ARInvoiceDetail
    {
        [XmlElement(ElementName = "Line")]
        public List<Line> Line { get; set; }
    }

    [XmlRoot(ElementName = "Line")]
    public class Line
    {
        [XmlElement(ElementName = "SequenceNumber")]
        public string SequenceNumber { get; set; }
        [XmlElement(ElementName = "TransactionDateCent")]
        public string TransactionDateCent { get; set; }
        [XmlElement(ElementName = "TransactionDate")]
        public string TransactionDate { get; set; }
        [XmlElement(ElementName = "TransactionType")]
        public string TransactionType { get; set; }
        [XmlElement(ElementName = "TransactionAmount")]
        public string TransactionAmount { get; set; }
        [XmlElement(ElementName = "PaymentAmount")]
        public string PaymentAmount { get; set; }
        [XmlElement(ElementName = "LocalCurrencyCode")]
        public string LocalCurrencyCode { get; set; }
        [XmlElement(ElementName = "DiscountTakenAmount")]
        public string DiscountTakenAmount { get; set; }
        [XmlElement(ElementName = "CheckNumber")]
        public string CheckNumber { get; set; }
        [XmlElement(ElementName = "AdjustmentNumber")]
        public string AdjustmentNumber { get; set; }
        [XmlElement(ElementName = "TradePaymentTransactionAmount")]
        public string TradePaymentTransactionAmount { get; set; }
        [XmlElement(ElementName = "TradePaymentPaidAmt")]
        public string TradePaymentPaidAmt { get; set; }
        [XmlElement(ElementName = "TradePaymentCashDiscountAmt")]
        public string TradePaymentCashDiscountAmt { get; set; }
        [XmlElement(ElementName = "TradePaymentCurrencyCode")]
        public string TradePaymentCurrencyCode { get; set; }
        [XmlElement(ElementName = "TradeInvoiceTransactionAmt")]
        public string TradeInvoiceTransactionAmt { get; set; }
        [XmlElement(ElementName = "TradeInvoicePaidAmt")]
        public string TradeInvoicePaidAmt { get; set; }
        [XmlElement(ElementName = "TradeInvoiceCashDiscountAmt")]
        public string TradeInvoiceCashDiscountAmt { get; set; }
        [XmlElement(ElementName = "TradeInvoiceCurrencyCode")]
        public string TradeInvoiceCurrencyCode { get; set; }
        [XmlElement(ElementName = "OrderNumber")]
        public string OrderNumber { get; set; }
        [XmlElement(ElementName = "OrderGeneration")]
        public string OrderGeneration { get; set; }
        [XmlElement(ElementName = "CustomerPONumber")]
        public string CustomerPONumber { get; set; }
        [XmlElement(ElementName = "HistorySequenceNumber")]
        public string HistorySequenceNumber { get; set; }
    }

}
