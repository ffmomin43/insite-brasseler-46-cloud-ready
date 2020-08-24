using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "ParameterValidationResult", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.Client.Tokens.v2.Common")]
    [Serializable]
    public  class ParameterValidationResult : object, IExtensibleDataObject, INotifyPropertyChanged
    {

        [NonSerialized]
        private ExtensionDataObject extensionDataField;

        [OptionalField]
        private string NameField;

        [OptionalField]
        private string ResultField;

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
        public string Name
        {
            get
            {
                return this.NameField;
            }
            set
            {
                if ((object.ReferenceEquals(this.NameField, value) != true))
                {
                    this.NameField = value;
                    this.RaisePropertyChanged("Name");
                }
            }
        }

        [DataMember]
        public string Result
        {
            get
            {
                return this.ResultField;
            }
            set
            {
                if ((object.ReferenceEquals(this.ResultField, value) != true))
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
