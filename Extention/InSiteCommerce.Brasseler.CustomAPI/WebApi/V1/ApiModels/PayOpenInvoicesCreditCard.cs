using System.Xml.Serialization;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
    [XmlRoot(ElementName = "CreditCard")]
    public class PayOpenInvoicesCreditCard
    {
        [XmlElement(ElementName = "CCCustomerID")]
        public string CCCustomerID { get; set; }
        [XmlElement(ElementName = "CCCreditCardNbr")]
        public string CCCreditCardNbr { get; set; }
        [XmlElement(ElementName = "CCPaymentType")]
        public string CCPaymentType { get; set; }
        [XmlElement(ElementName = "CCCreditCardExp")]
        public string CCCreditCardExp { get; set; }
        [XmlElement(ElementName = "CCCardHolder")]
        public string CCCardHolder { get; set; }
        [XmlElement(ElementName = "CCCVV2")]
        public string CCCVV2 { get; set; }
        [XmlElement(ElementName = "CCAddr1")]
        public string CCAddr1 { get; set; }
        [XmlElement(ElementName = "CCAddr2")]
        public string CCAddr2 { get; set; }
        [XmlElement(ElementName = "CCAddr3")]
        public string CCAddr3 { get; set; }
        [XmlElement(ElementName = "CCAddr4")]
        public string CCAddr4 { get; set; }
        [XmlElement(ElementName = "CCCity")]
        public string CCCity { get; set; }
        [XmlElement(ElementName = "CCState")]
        public string CCState { get; set; }
        [XmlElement(ElementName = "CCZip")]
        public string CCZip { get; set; }
        [XmlElement(ElementName = "CCCountry")]
        public string CCCountry { get; set; }
        [XmlElement(ElementName = "CCPONumber")]
        public string CCPONumber { get; set; }
        [XmlElement(ElementName = "CCTaxAmount")]
        public string CCTaxAmount { get; set; }
        [XmlElement(ElementName = "CCAuthorizationAmount")]
        public string CCAuthorizationAmount { get; set; }
        [XmlElement(ElementName = "CCMerchantId")]
        public string CCMerchantId { get; set; }
        [XmlElement(ElementName = "CCMaskedCard")]
        public string CCMaskedCard { get; set; }
        [XmlElement(ElementName = "CCToken")]
        public string CCToken { get; set; }
        [XmlElement(ElementName = "CCCardType")]
        public string CCCardType { get; set; }
        [XmlElement(ElementName = "CCAuthorizationNumber")]
        public string CCAuthorizationNumber { get; set; }
        [XmlElement(ElementName = "CCReferenceNumber")]
        public string CCReferenceNumber { get; set; }
        [XmlElement(ElementName = "CCEmail")]
        public string CCEmail { get; set; }
        [XmlElement(ElementName = "CCCustomerCode")]
        public string CCCustomerCode { get; set; }
        [XmlElement(ElementName = "CCEND")]
        public string CCEND { get; set; }
    }
}
