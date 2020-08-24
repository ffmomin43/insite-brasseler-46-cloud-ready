using System;
using System.Xml.Serialization;
using System.Collections.Generic;
using Insite.Core.WebApi;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    [XmlRoot(ElementName = "Orders")]
    public class OutstandingOrderModel 
    {
        [XmlElement(ElementName = "Order")]
        public OutstandingOrder Order { get; set; }
    }


    [XmlRoot(ElementName = "Order")]
    public class OutstandingOrder
    {
        [XmlElement(ElementName = "OrderHeader")]
        public OrderHeaderModel OrderHeader { get; set; }
        [XmlElement(ElementName = "OrderDetail")]
        public List<OrderDetailModel> OrderDetail { get; set; }
    }

    [XmlRoot(ElementName = "OrderDetail")]
    public class OrderDetailModel
    {
        [XmlElement(ElementName = "CompanyNumber")]
        public string CompanyNumber { get; set; }
        [XmlElement(ElementName = "CustomerNumber")]
        public string CustomerNumber { get; set; }
        [XmlElement(ElementName = "OrderNumber")]
        public string OrderNumber { get; set; }
        [XmlElement(ElementName = "OrderGenerationNumber")]
        public string OrderGenerationNumber { get; set; }
        [XmlElement(ElementName = "OrderSequenceNumber")]
        public string OrderSequenceNumber { get; set; }
        [XmlElement(ElementName = "ItemNumber")]
        public string ItemNumber { get; set; }
        [XmlElement(ElementName = "LineItemType")]
        public string LineItemType { get; set; }
        [XmlElement(ElementName = "ItemDescription1")]
        public string ItemDescription1 { get; set; }
        [XmlElement(ElementName = "ItemDescription2")]
        public string ItemDescription2 { get; set; }
        [XmlElement(ElementName = "QuantityOrdered")]
        public string QuantityOrdered { get; set; }
        [XmlElement(ElementName = "QuantityShipped")]
        public string QuantityShipped { get; set; }
        [XmlElement(ElementName = "QuantityBackOrdered")]
        public string QuantityBackOrdered { get; set; }
        [XmlElement(ElementName = "UnitOfMeasure")]
        public string UnitOfMeasure { get; set; }
        [XmlElement(ElementName = "CustomerOrderUM")]
        public string CustomerOrderUM { get; set; }
        [XmlElement(ElementName = "PricingUM")]
        public string PricingUM { get; set; }
        [XmlElement(ElementName = "CustomerPricingUM")]
        public string CustomerPricingUM { get; set; }
        [XmlElement(ElementName = "ListPrice")]
        public string ListPrice { get; set; }
        [XmlElement(ElementName = "ActualSellPrice")]
        public string ActualSellPrice { get; set; }
        [XmlElement(ElementName = "TotalLineAmount")]
        public string TotalLineAmount { get; set; }
        [XmlElement(ElementName = "Century")]
        public string Century { get; set; }
        [XmlElement(ElementName = "ReplacementReasonCode")]
        public string ReplacementReasonCode { get; set; }
        [XmlElement(ElementName = "DueDate")]
        public string DueDate { get; set; }
        [XmlElement(ElementName = "OriginalItemNumber")]
        public string OriginalItemNumber { get; set; }
        [XmlElement(ElementName = "EntrySequenceNumber")]
        public string EntrySequenceNumber { get; set; }
        [XmlElement(ElementName = "WarehouseID")]
        public string WarehouseID { get; set; }
        [XmlElement(ElementName = "LineValue")]
        public string LineValue { get; set; }
    }

    [XmlRoot(ElementName = "OrderHeader")]
    public class OrderHeaderModel
    {
        [XmlElement(ElementName = "CompanyNumber")]
        public string CompanyNumber { get; set; }
        [XmlElement(ElementName = "CustomerNumber")]
        public string CustomerNumber { get; set; }
        [XmlElement(ElementName = "OrderNumber")]
        public string OrderNumber { get; set; }
        [XmlElement(ElementName = "OrderGenerationNumber")]
        public string OrderGenerationNumber { get; set; }
        [XmlElement(ElementName = "OrderType")]
        public string OrderType { get; set; }
        [XmlElement(ElementName = "OrderStatus")]
        public string OrderStatus { get; set; }
        [XmlElement(ElementName = "CustomerName")]
        public string CustomerName { get; set; }
        [XmlElement(ElementName = "CustomerAddress1")]
        public string CustomerAddress1 { get; set; }
        [XmlElement(ElementName = "CustomerAddress2")]
        public string CustomerAddress2 { get; set; }
        [XmlElement(ElementName = "CustomerAddress3")]
        public string CustomerAddress3 { get; set; }
        [XmlElement(ElementName = "CustomerAddress4")]
        public string CustomerAddress4 { get; set; }
        [XmlElement(ElementName = "BillToCity")]
        public string BillToCity { get; set; }
        [XmlElement(ElementName = "BillToStateProvince")]
        public string BillToStateProvince { get; set; }
        [XmlElement(ElementName = "BillToZipCode")]
        public string BillToZipCode { get; set; }
        [XmlElement(ElementName = "BillToCountry")]
        public string BillToCountry { get; set; }
        [XmlElement(ElementName = "BillToContact")]
        public string BillToContact { get; set; }
        [XmlElement(ElementName = "ShipToNumber")]
        public string ShipToNumber { get; set; }
        [XmlElement(ElementName = "ShipToName")]
        public string ShipToName { get; set; }
        [XmlElement(ElementName = "ShipToAddress1")]
        public string ShipToAddress1 { get; set; }
        [XmlElement(ElementName = "ShipToAddress2")]
        public string ShipToAddress2 { get; set; }
        [XmlElement(ElementName = "ShipToAddress3")]
        public string ShipToAddress3 { get; set; }
        [XmlElement(ElementName = "ShipToAddress4")]
        public string ShipToAddress4 { get; set; }
        [XmlElement(ElementName = "ShipToCity")]
        public string ShipToCity { get; set; }
        [XmlElement(ElementName = "ShipToStateProvince")]
        public string ShipToStateProvince { get; set; }
        [XmlElement(ElementName = "ShipToZipCode")]
        public string ShipToZipCode { get; set; }
        [XmlElement(ElementName = "ShipToCountry")]
        public string ShipToCountry { get; set; }
        [XmlElement(ElementName = "Contact")]
        public string Contact { get; set; }
        [XmlElement(ElementName = "ParentOrderNumber")]
        public string ParentOrderNumber { get; set; }
        [XmlElement(ElementName = "EntryDateCentury")]
        public string EntryDateCentury { get; set; }
        [XmlElement(ElementName = "AcknowledgePrintCentury")]
        public string AcknowledgePrintCentury { get; set; }
        [XmlElement(ElementName = "PickSlipPrintCentury")]
        public string PickSlipPrintCentury { get; set; }
        [XmlElement(ElementName = "ShipConfirmCentury")]
        public string ShipConfirmCentury { get; set; }
        [XmlElement(ElementName = "InvoicePrintCentury")]
        public string InvoicePrintCentury { get; set; }
        [XmlElement(ElementName = "QuoteReviewCentury")]
        public string QuoteReviewCentury { get; set; }
        [XmlElement(ElementName = "RequestedShipCentury")]
        public string RequestedShipCentury { get; set; }
        [XmlElement(ElementName = "InvoiceCentury")]
        public string InvoiceCentury { get; set; }
        [XmlElement(ElementName = "CancelDateCentury")]
        public string CancelDateCentury { get; set; }
        [XmlElement(ElementName = "EntryDate")]
        public string EntryDate { get; set; }
        [XmlElement(ElementName = "AcknowledgePrintDate")]
        public string AcknowledgePrintDate { get; set; }
        [XmlElement(ElementName = "PickSlipPrintDate")]
        public string PickSlipPrintDate { get; set; }
        [XmlElement(ElementName = "ShipConfirmDate")]
        public string ShipConfirmDate { get; set; }
        [XmlElement(ElementName = "InvoicePrintDate")]
        public string InvoicePrintDate { get; set; }
        [XmlElement(ElementName = "QuoteReviewDate")]
        public string QuoteReviewDate { get; set; }
        [XmlElement(ElementName = "RequestedShipDate")]
        public string RequestedShipDate { get; set; }
        [XmlElement(ElementName = "CompleteShipCode")]
        public string CompleteShipCode { get; set; }
        [XmlElement(ElementName = "BackorderCode")]
        public string BackorderCode { get; set; }
        [XmlElement(ElementName = "InvoiceDate")]
        public string InvoiceDate { get; set; }
        [XmlElement(ElementName = "CustomerPurchaseOrder")]
        public string CustomerPurchaseOrder { get; set; }
        [XmlElement(ElementName = "ItemSalesAmount")]
        public string ItemSalesAmount { get; set; }
        [XmlElement(ElementName = "TotalSpecialCharges")]
        public string TotalSpecialCharges { get; set; }
        [XmlElement(ElementName = "DiscountAmountTrading")]
        public string DiscountAmountTrading { get; set; }
        [XmlElement(ElementName = "SalesTaxAmount")]
        public string SalesTaxAmount { get; set; }
        [XmlElement(ElementName = "FederalExciseAmount")]
        public string FederalExciseAmount { get; set; }
        [XmlElement(ElementName = "TotalContainerCharge")]
        public string TotalContainerCharge { get; set; }
        [XmlElement(ElementName = "InvoiceAmount")]
        public string InvoiceAmount { get; set; }
        [XmlElement(ElementName = "TotalOrderValue")]
        public string TotalOrderValue { get; set; }
        [XmlElement(ElementName = "CarrierCode")]
        public string CarrierCode { get; set; }
        [XmlElement(ElementName = "CancelDate")]
        public string CancelDate { get; set; }
        [XmlElement(ElementName = "ProNumber")]
        public string ProNumber { get; set; }
        [XmlElement(ElementName = "BillOfLadingNumber")]
        public string BillOfLadingNumber { get; set; }
        [XmlElement(ElementName = "WarehouseId")]
        public string WarehouseId { get; set; }
        [XmlElement(ElementName = "InvoiceNumber")]
        public string InvoiceNumber { get; set; }
        [XmlElement(ElementName = "HistorySequenceNumber")]
        public string HistorySequenceNumber { get; set; }
        [XmlElement(ElementName = "HoldCode")]
        public string HoldCode { get; set; }
        [XmlElement(ElementName = "WorkStationId")]
        public string WorkStationId { get; set; }
        [XmlElement(ElementName = "CurrencyCode")]
        public string CurrencyCode { get; set; }
        [XmlElement(ElementName = "ExchangeCode")]
        public string ExchangeCode { get; set; }
        [XmlElement(ElementName = "BoxIndicatorCode")]
        public string BoxIndicatorCode { get; set; }
        [XmlElement(ElementName = "SMSPrefix")]
        public string SMSPrefix { get; set; }
        [XmlElement(ElementName = "BlanketOrderCode")]
        public string BlanketOrderCode { get; set; }
        [XmlElement(ElementName = "CreditCardKeySeq")]
        public string CreditCardKeySeq { get; set; }
    }

}
