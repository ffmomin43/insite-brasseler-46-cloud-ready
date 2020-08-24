using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "ClientWebServiceResponse", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.EPayment.VirtualTerminal.Common")]
    [Serializable]
    [KnownType(typeof(VirtualTerminalWebServiceResponse))]
    //[KnownType(typeof(AddCardTokenResponse))]
    //[KnownType(typeof(GetTokenResponse))]
    [KnownType(typeof(UseTokenResponse))]
    //[KnownType(typeof(ModifyAchTokenResponse))]
    //[KnownType(typeof(ModifyCardTokenResponse))]
    //[KnownType(typeof(DeleteAchTokenResponse))]
    //[KnownType(typeof(DeleteCardTokenResponse))]
    //[KnownType(typeof(GenerateCryptoResponse))]
    //[KnownType(typeof(AddAchTokenResponse))]
    public partial class ClientWebServiceResponse : object, IExtensibleDataObject, INotifyPropertyChanged
    {

        [NonSerialized]
        private ExtensionDataObject extensionDataField;

        [OptionalField]
        private string MessageField;

        [OptionalField]
        private short ResultField;

        [Browsable(false)]
        public ExtensionDataObject ExtensionData
        {
            get
            {
                return this.extensionDataField;
            }
            set
            {
                this.extensionDataField = value;
            }
        }

        [DataMember]
        public string Message
        {
            get
            {
                return this.MessageField;
            }
            set
            {
                if ((object.ReferenceEquals(this.MessageField, value) != true))
                {
                    this.MessageField = value;
                    this.RaisePropertyChanged("Message");
                }
            }
        }

        [DataMember]
        public short Result
        {
            get
            {
                return this.ResultField;
            }
            set
            {
                if ((this.ResultField.Equals(value) != true))
                {
                    this.ResultField = value;
                    this.RaisePropertyChanged("Result");
                }
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void RaisePropertyChanged(string propertyName)
        {
            PropertyChangedEventHandler propertyChanged = this.PropertyChanged;
            if ((propertyChanged != null))
            {
                propertyChanged(this, new PropertyChangedEventArgs(propertyName));
            }
        }
    }
}
