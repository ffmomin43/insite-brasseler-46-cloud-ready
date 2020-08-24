using System.Collections.Generic;
using System.Xml.Serialization;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    [XmlRoot(ElementName = "request")]
    public class PayOpenInvoicesRequest
    {
        [XmlElement(ElementName = "Head")]
        public PayOpenInvoicesHead Head { get; set; }
        [XmlElement(ElementName = "CreditCard")]
        public PayOpenInvoicesCreditCard CreditCard { get; set; }
        [XmlElement(ElementName = "Invoice")]
        public List<PayOpenInvoicesInvoice> Invoice { get; set; }
        [XmlAttribute(AttributeName = "name")]
        public string Name { get; set; }
    }
}
