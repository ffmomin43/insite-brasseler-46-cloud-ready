using System.Xml.Serialization;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    [XmlRoot(ElementName = "Head")]
    public class PayOpenInvoicesHead
    {
        [XmlElement(ElementName = "CompanyNumber")]
        public string CompanyNumber { get; set; }
        [XmlElement(ElementName = "CustomerNumber")]
        public string CustomerNumber { get; set; }
        [XmlElement(ElementName = "settlementDate")]
        public string SettlementDate { get; set; }
        [XmlElement(ElementName = "monetaryAmount")]
        public string MonetaryAmount { get; set; }
    }
}
