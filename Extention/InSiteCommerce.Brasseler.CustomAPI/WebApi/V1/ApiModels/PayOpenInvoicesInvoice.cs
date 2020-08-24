using System.Xml.Serialization;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    [XmlRoot(ElementName = "Invoice")]
    public class PayOpenInvoicesInvoice
    {
        [XmlElement(ElementName = "invoiceNo")]
        public string InvoiceNo { get; set; }
        [XmlElement(ElementName = "paymentAmount")]
        public string PaymentAmount { get; set; }
        [XmlElement(ElementName = "discountTakenAmount")]
        public string DiscountTakenAmount { get; set; }
        [XmlElement(ElementName = "invoiceNote")]
        public string InvoiceNote { get; set; }
    }
}
