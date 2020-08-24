using System;
using System.CodeDom.Compiler;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "UseTokenRequest", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.Client.Tokens.v2.Common.Requests")]
    [Serializable]
    public class UseTokenRequest : SecureVirtualTerminalWebServiceRequest
    {

        [OptionalField]
        private decimal AmountField;

        [OptionalField]
        private string AuthorizationNumberField;

        [OptionalField]
        private string CardVerificationNumberField;

        [OptionalField]
        private string CurrencyCodeField;

        [OptionalField]
        private string InvoiceDetailField;

        [OptionalField]
        private string InvoiceNumberField;

        [OptionalField]
        private string PurchaseOrderNumberField;

        [OptionalField]
        private string SecureCodeField;

        [OptionalField]
        private decimal TaxAmountField;

        [OptionalField]
        private string TokenIdField;

        [OptionalField]
        private string TransactionTypeField;

        [DataMember]
        public decimal Amount
        {
            get
            {
                return this.AmountField;
            }
            set
            {
                if ((this.AmountField.Equals(value) != true))
                {
                    this.AmountField = value;
                    this.RaisePropertyChanged("Amount");
                }
            }
        }

        [DataMember]
        public string AuthorizationNumber
        {
            get
            {
                return this.AuthorizationNumberField;
            }
            set
            {
                if ((object.ReferenceEquals(this.AuthorizationNumberField, value) != true))
                {
                    this.AuthorizationNumberField = value;
                    this.RaisePropertyChanged("AuthorizationNumber");
                }
            }
        }

        [DataMember]
        public string CardVerificationNumber
        {
            get
            {
                return this.CardVerificationNumberField;
            }
            set
            {
                if ((object.ReferenceEquals(this.CardVerificationNumberField, value) != true))
                {
                    this.CardVerificationNumberField = value;
                    this.RaisePropertyChanged("CardVerificationNumber");
                }
            }
        }

        [DataMember]
        public string CurrencyCode
        {
            get
            {
                return this.CurrencyCodeField;
            }
            set
            {
                if ((object.ReferenceEquals(this.CurrencyCodeField, value) != true))
                {
                    this.CurrencyCodeField = value;
                    this.RaisePropertyChanged("CurrencyCode");
                }
            }
        }

        [DataMember]
        public string InvoiceDetail
        {
            get
            {
                return this.InvoiceDetailField;
            }
            set
            {
                if ((object.ReferenceEquals(this.InvoiceDetailField, value) != true))
                {
                    this.InvoiceDetailField = value;
                    this.RaisePropertyChanged("InvoiceDetail");
                }
            }
        }

        [DataMember]
        public string InvoiceNumber
        {
            get
            {
                return this.InvoiceNumberField;
            }
            set
            {
                if ((object.ReferenceEquals(this.InvoiceNumberField, value) != true))
                {
                    this.InvoiceNumberField = value;
                    this.RaisePropertyChanged("InvoiceNumber");
                }
            }
        }

        [DataMember]
        public string PurchaseOrderNumber
        {
            get
            {
                return this.PurchaseOrderNumberField;
            }
            set
            {
                if ((object.ReferenceEquals(this.PurchaseOrderNumberField, value) != true))
                {
                    this.PurchaseOrderNumberField = value;
                    this.RaisePropertyChanged("PurchaseOrderNumber");
                }
            }
        }

        [DataMember]
        public string SecureCode
        {
            get
            {
                return this.SecureCodeField;
            }
            set
            {
                if ((object.ReferenceEquals(this.SecureCodeField, value) != true))
                {
                    this.SecureCodeField = value;
                    this.RaisePropertyChanged("SecureCode");
                }
            }
        }

        [DataMember]
        public decimal TaxAmount
        {
            get
            {
                return this.TaxAmountField;
            }
            set
            {
                if ((this.TaxAmountField.Equals(value) != true))
                {
                    this.TaxAmountField = value;
                    this.RaisePropertyChanged("TaxAmount");
                }
            }
        }

        [DataMember]
        public string TokenId
        {
            get
            {
                return this.TokenIdField;
            }
            set
            {
                if ((object.ReferenceEquals(this.TokenIdField, value) != true))
                {
                    this.TokenIdField = value;
                    this.RaisePropertyChanged("TokenId");
                }
            }
        }

        [DataMember]
        public string TransactionType
        {
            get
            {
                return this.TransactionTypeField;
            }
            set
            {
                if ((object.ReferenceEquals(this.TransactionTypeField, value) != true))
                {
                    this.TransactionTypeField = value;
                    this.RaisePropertyChanged("TransactionType");
                }
            }
        }
    }
}
