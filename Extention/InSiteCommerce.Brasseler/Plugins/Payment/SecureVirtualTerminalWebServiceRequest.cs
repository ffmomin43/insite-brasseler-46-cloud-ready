using System;
using System.CodeDom.Compiler;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "SecureVirtualTerminalWebServiceRequest", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.Client.Tokens.v2.Common.Requests")]
    [Serializable]
    //[KnownType(typeof(AddCardTokenRequest))]
    //[KnownType(typeof(GetTokenRequest))]
    [KnownType(typeof(UseTokenRequest))]
    //[KnownType(typeof(ModifyAchTokenRequest))]
    //[KnownType(typeof(ModifyCardTokenRequest))]
    //[KnownType(typeof(DeleteAchTokenRequest))]
    //[KnownType(typeof(DeleteCardTokenRequest))]
    //[KnownType(typeof(GenerateCryptoRequest))]
    //[KnownType(typeof(AddAchTokenRequest))]
    public class SecureVirtualTerminalWebServiceRequest : VirtualTerminalWebServiceRequest
    {

        [OptionalField]
        private string GeoLocationInformationField;

        [OptionalField]
        private string IMEIField;

        [DataMember]
        public string GeoLocationInformation
        {
            get
            {
                return this.GeoLocationInformationField;
            }
            set
            {
                if ((object.ReferenceEquals(this.GeoLocationInformationField, value) != true))
                {
                    this.GeoLocationInformationField = value;
                    this.RaisePropertyChanged("GeoLocationInformation");
                }
            }
        }

        [DataMember]
        public string IMEI
        {
            get
            {
                return this.IMEIField;
            }
            set
            {
                if ((object.ReferenceEquals(this.IMEIField, value) != true))
                {
                    this.IMEIField = value;
                    this.RaisePropertyChanged("IMEI");
                }
            }
        }
    }
}
