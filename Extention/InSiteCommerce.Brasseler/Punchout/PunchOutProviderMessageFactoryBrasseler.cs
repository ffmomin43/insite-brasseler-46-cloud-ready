//using System;
//using System.Linq;
//using System.Text;
//using System.Xml;
//using System.Globalization;
//using System.Collections.Generic;
//using Insite.Common.Logging;
//using Insite.Common.Providers;
//using Insite.Core.Interfaces.Data;
//using Insite.Core.Plugins.EntityUtilities;
//using Insite.Data.Entities;
//using Insite.Data.Repositories.Interfaces;
//using Insite.PunchOut.HttpHandlers;
//using Insite.PunchOut.HttpHandlers.Interfaces;

///*
// * Dont send XML for cancel order 
// */

//namespace InSiteCommerce.Brasseler.Punchout
//{
//    public class PunchOutProviderMessageFactoryBrasseler : PunchOutProviderMessageFactory
//    {
//        public PunchOutProviderMessageFactoryBrasseler(IDateFormatter iso8601DateFormatter, IPayloadGenerator payloadGenerator, IArgumentContract argumentContract, IPunchOutHandlerAddresses punchOutHandlerAddresses, IUnitOfWorkFactory unitOfWorkFactory, ICustomerOrderUtilities customerOrderUtilities, IOrderLineUtilities orderLineUtilities) : base(iso8601DateFormatter, payloadGenerator, argumentContract, punchOutHandlerAddresses, unitOfWorkFactory, customerOrderUtilities, orderLineUtilities) { }

//        public override string CreatePoRequisitionMessage(PunchOutSession punchOutSession)
//        {
//            this.ArgumentContract.AssertNotNull<PunchOutSession>(punchOutSession, nameof(punchOutSession));
//            StringBuilder output = new StringBuilder();

//            string str1 = punchOutSession.CustomerOrder.Currency == null ? this.UnitOfWork.GetTypedRepository<ICurrencyRepository>().GetDefault().CurrencyCode.SafeTrim() : punchOutSession.CustomerOrder.Currency.CurrencyCode.SafeTrim();

//            if (punchOutSession.PunchOutSessionMode != PunchOutSessionMode.Cancel.ToString())
//            {
//                XmlWriter xmlWriter1 = XmlWriter.Create(output, this.CreateDefaultXmlWriterSettings());
//                xmlWriter1.WriteDocType("cXML", (string)null, this.CXmlVersion, (string)null);
//                xmlWriter1.WriteStartElement("cXML");
//                xmlWriter1.WriteAttributeString("xml", "lang", string.Empty, "en-US");
//                xmlWriter1.WriteAttributeString("payloadID", this.PayloadGenerator.GeneratePayload(punchOutSession.Domain));
//                xmlWriter1.WriteAttributeString("timestamp", this.DateFormatter.FormatDate(DateTimeProvider.Current.Now.DateTime));

//                xmlWriter1.WriteStartElement("Header");
//                xmlWriter1.WriteStartElement("From");
//                xmlWriter1.WriteRaw(punchOutSession.ToIdentityNode);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteStartElement("To");
//                xmlWriter1.WriteRaw(punchOutSession.FromIdentityNode);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteStartElement("Sender");
//                xmlWriter1.WriteStartElement("Credential");
//                xmlWriter1.WriteAttributeString("domain", punchOutSession.Domain);
//                xmlWriter1.WriteElementString("Identity", "PunchoutResponse");
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteElementString("UserAgent", punchOutSession.Domain);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteStartElement("Message");
//                xmlWriter1.WriteStartElement("PunchOutOrderMessage");
//                xmlWriter1.WriteElementString("BuyerCookie", punchOutSession.BuyerCookie);
//                xmlWriter1.WriteStartElement("PunchOutOrderMessageHeader");
//                xmlWriter1.WriteAttributeString("operationAllowed", "edit");
//                xmlWriter1.WriteStartElement("Total");
//                xmlWriter1.WriteStartElement("Money");
//                xmlWriter1.WriteAttributeString("currency", str1);
//                XmlWriter xmlWriter2 = xmlWriter1;
//                Decimal num = this.CustomerOrderUtilities.GetOrderSubTotal(punchOutSession.CustomerOrder);
//                string str2 = num.ToString((IFormatProvider)CultureInfo.InvariantCulture);
//                xmlWriter2.WriteValue(str2);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();

//                //Adding addressId and addresses in POMessage
//                var addressId = punchOutSession.ShipToAddressId;
//                xmlWriter1.WriteStartElement("ShipTo");
//                xmlWriter1.WriteStartElement("Address");
//                xmlWriter1.WriteAttributeString("addressID", addressId);

//                xmlWriter1.WriteStartElement("Name");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STCompanyName);
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteStartElement("PostalAddress");

//                xmlWriter1.WriteStartElement("Street");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STAddress1);
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteStartElement("City");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STCity);
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteStartElement("State");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STState);
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteStartElement("PostalCode");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STPostalCode);
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteStartElement("Country");
//                xmlWriter1.WriteAttributeString("isoCountryCode", punchOutSession.ShipToIsoCountryCode);
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STCountry);
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteEndElement();//postaladdress

//                xmlWriter1.WriteStartElement("Email");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STEmail);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteStartElement("Phone");
//                xmlWriter1.WriteStartElement("Number");
//                xmlWriter1.WriteValue(punchOutSession.CustomerOrder.STPhone);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement(); //phno

//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();
//                //end

//                xmlWriter1.WriteStartElement("Shipping");
//                xmlWriter1.WriteStartElement("Money");
//                xmlWriter1.WriteAttributeString("currency", str1);
//                XmlWriter shipXmlWriter = xmlWriter1;
//                Decimal ship = this.CustomerOrderUtilities.GetShippingAndHandling(punchOutSession.CustomerOrder);
//                string shipStr = ship.ToString((IFormatProvider)CultureInfo.InvariantCulture);
//                xmlWriter2.WriteValue(shipStr);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteStartElement("Tax");
//                xmlWriter1.WriteStartElement("Money");
//                xmlWriter1.WriteAttributeString("currency", str1);
//                XmlWriter taxXmlWriter = xmlWriter1;
//                Decimal tax = this.CustomerOrderUtilities.GetTotalTax(punchOutSession.CustomerOrder);
//                string taxStr = tax.ToString((IFormatProvider)CultureInfo.InvariantCulture);
//                xmlWriter2.WriteValue(taxStr);
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();

//                xmlWriter1.WriteEndElement();
//                foreach (OrderLine orderLine in (IEnumerable<OrderLine>)punchOutSession.CustomerOrder.OrderLines.OrderBy<OrderLine, int>((Func<OrderLine, int>)(o => o.Line)))
//                {
//                    xmlWriter1.WriteStartElement("ItemIn");
//                    XmlWriter xmlWriter3 = xmlWriter1;
//                    string localName1 = "quantity";
//                    int int32 = Convert.ToInt32(orderLine.QtyOrdered);
//                    string str3 = int32.ToString((IFormatProvider)CultureInfo.InvariantCulture);
//                    xmlWriter3.WriteAttributeString(localName1, str3);
//                    XmlWriter xmlWriter4 = xmlWriter1;
//                    string localName2 = "lineNumber";
//                    int32 = Convert.ToInt32(orderLine.Line);
//                    string str4 = int32.ToString((IFormatProvider)CultureInfo.InvariantCulture);
//                    xmlWriter4.WriteAttributeString(localName2, str4);
//                    xmlWriter1.WriteStartElement("ItemID");
//                    xmlWriter1.WriteElementString("SupplierPartID", orderLine.Product.ErpNumber);
//                    xmlWriter1.WriteElementString("SupplierPartAuxiliaryID", punchOutSession.Id.ToString());
//                    xmlWriter1.WriteEndElement();
//                    xmlWriter1.WriteStartElement("ItemDetail");
//                    xmlWriter1.WriteStartElement("UnitPrice");
//                    xmlWriter1.WriteStartElement("Money");
//                    xmlWriter1.WriteAttributeString("currency", str1);
//                    XmlWriter xmlWriter5 = xmlWriter1;
//                    num = orderLine.UnitNetPrice;
//                    string str5 = num.ToString((IFormatProvider)CultureInfo.InvariantCulture);
//                    xmlWriter5.WriteValue(str5);
//                    xmlWriter1.WriteEndElement();
//                    xmlWriter1.WriteEndElement();
//                    xmlWriter1.WriteStartElement("Description");
//                    xmlWriter1.WriteAttributeString("xml", "lang", (string)null, "en");
//                    xmlWriter1.WriteValue(orderLine.Product.ShortDescription);
//                    xmlWriter1.WriteEndElement();
//                    xmlWriter1.WriteElementString("UnitOfMeasure", orderLine.UnitOfMeasure);
//                    xmlWriter1.WriteStartElement("Classification");
//                    xmlWriter1.WriteAttributeString("domain", "UNSPSC");
//                    xmlWriter1.WriteValue(orderLine.Product.Unspsc.Trim());
//                    xmlWriter1.WriteEndElement();
//                    if (orderLine.Product.Vendor != null)
//                        xmlWriter1.WriteElementString("ManufacturerName", orderLine.Product.Vendor.Name);
//                    xmlWriter1.WriteEndElement();
//                    xmlWriter1.WriteEndElement();
//                }
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.WriteEndElement();
//                xmlWriter1.Flush();
//                xmlWriter1.Close();

//                LogHelper.For((object)this).Info(output.ToString());
//            }
//            StringBuilder stringBuilder = new StringBuilder();
//            stringBuilder.Append("<html>");
//            stringBuilder.AppendFormat("<body onload='document.forms[\"form1\"].submit()'>");
//            stringBuilder.AppendFormat("<form name='form1' id='form1' method='post' action='{0}'>", (object)punchOutSession.BrowserFormPost);
//            if (punchOutSession.PunchOutSessionMode != PunchOutSessionMode.Cancel.ToString())
//            {
//                stringBuilder.AppendFormat("<input type='hidden' name='cxml-base64' value='{0}' />", (object)this.EncodeBase64XmlMessage(output.ToString()));
//            }
//            stringBuilder.Append("</form></body></html>");
//            return stringBuilder.ToString();
//        }
//    }
//}
