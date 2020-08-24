using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{

    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "VirtualTerminalWebServiceRequest", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.EPayment.VirtualTerminal.Common")]
    [Serializable]
    [KnownType(typeof(SecureVirtualTerminalWebServiceRequest))]
    //[KnownType(typeof(AddCardTokenRequest))]
    //[KnownType(typeof(GetTokenRequest))]
    [KnownType(typeof(UseTokenRequest))]
    //[KnownType(typeof(ModifyAchTokenRequest))]
    //[KnownType(typeof(ModifyCardTokenRequest))]
    //[KnownType(typeof(DeleteAchTokenRequest))]
    //[KnownType(typeof(DeleteCardTokenRequest))]
    //[KnownType(typeof(GenerateCryptoRequest))]
    //[KnownType(typeof(AddAchTokenRequest))]OptionalField
    public class VirtualTerminalWebServiceRequest : object,IExtensibleDataObject, INotifyPropertyChanged
    {

        [NonSerialized]
        private ExtensionDataObject extensionDataField;

        private int MerchantIdField;

        [OptionalField]
        private string PasswordField;

        [OptionalField]
        private string UserIdField;

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

        [DataMember(IsRequired = true)]
        public int MerchantId
        {
            get
            {
                return this.MerchantIdField;
            }
            set
            {
                if ((this.MerchantIdField.Equals(value) != true))
                {
                    this.MerchantIdField = value;
                    this.RaisePropertyChanged("MerchantId");
                }
            }
        }

        [DataMember]
        public string Password
        {
            get
            {
                return this.PasswordField;
            }
            set
            {
                if ((object.ReferenceEquals(this.PasswordField, value) != true))
                {
                    this.PasswordField = value;
                    this.RaisePropertyChanged("Password");
                }
            }
        }

        [DataMember]
        public string UserId
        {
            get
            {
                return this.UserIdField;
            }
            set
            {
                if ((object.ReferenceEquals(this.UserIdField, value) != true))
                {
                    this.UserIdField = value;
                    this.RaisePropertyChanged("UserId");
                }
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void RaisePropertyChanged(string propertyName)
        {
            System.ComponentModel.PropertyChangedEventHandler propertyChanged = this.PropertyChanged;
            if ((propertyChanged != null))
            {
                propertyChanged(this, new System.ComponentModel.PropertyChangedEventArgs(propertyName));
            }
        }
    }
}
