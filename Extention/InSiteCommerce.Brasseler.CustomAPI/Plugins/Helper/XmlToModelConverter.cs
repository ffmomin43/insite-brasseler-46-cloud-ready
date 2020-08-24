using System;
using System.IO;
using System.Xml;
using System.Xml.Serialization;

namespace InSiteCommerce.Brasseler.CustomAPI.Plugins.Helper
{
    public class XmlToModelConverter
    {
        public T Deserialize<T>(string input) where T : class
        {
            try
            {
                System.Xml.Serialization.XmlSerializer ser = new System.Xml.Serialization.XmlSerializer(typeof(T));

                using (StringReader sr = new StringReader(input))
                {
                    return (T)ser.Deserialize(sr);
                }
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public string Serialize<T>(T ObjectToSerialize)
        {
            XmlSerializer xmlSerializer = new XmlSerializer(ObjectToSerialize.GetType());

            using (StringWriter textWriter = new StringWriter())
            {
                using (var xmlWriter = XmlWriter.Create(textWriter, new XmlWriterSettings { Indent = false }))
                {
                    xmlSerializer.Serialize(xmlWriter, ObjectToSerialize);
                    return textWriter.ToString();
                }
            }
        }
    }
}
