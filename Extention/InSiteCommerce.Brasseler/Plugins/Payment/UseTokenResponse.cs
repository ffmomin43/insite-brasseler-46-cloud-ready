using System;
using System.CodeDom.Compiler;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "UseTokenResponse", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.Client.Tokens.v2.Commo" +
       "n.Responses")]
    [Serializable]
    public class UseTokenResponse : VirtualTerminalWebServiceResponse
    {

        [OptionalField]
        private System.Nullable<decimal> AccountBalanceAmountField;

        [OptionalField]
        private decimal AmountField;

        [OptionalField]
        private string AuthorizationNumberField;

        [OptionalField]
        private string CardTypeField;

        [OptionalField]
        private decimal DiscountField;

        [OptionalField]
        private decimal DiscountAmountField;

        [OptionalField]
        private decimal OriginalAmountField;

        [OptionalField]
        private ParameterValidationResult[] ParameterValidationResultListField; //may be cenpos v6

        [OptionalField]
        private System.Nullable<decimal> PartiallyAuthorizedAmountField;

        [OptionalField]
        private string ReferenceNumberField;

        [OptionalField]
        private decimal SurchargeField;

        [OptionalField]
        private decimal SurchargeAmountField;

        [OptionalField]
        private string TraceNumberField;

        [DataMember]
        public System.Nullable<decimal> AccountBalanceAmount
        {
            get
            {
                return this.AccountBalanceAmountField;
            }
            set
            {
                if ((this.AccountBalanceAmountField.Equals(value) != true))
                {
                    this.AccountBalanceAmountField = value;
                    this.RaisePropertyChanged("AccountBalanceAmount");
                }
            }
        }

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
        public string CardType
        {
            get
            {
                return this.CardTypeField;
            }
            set
            {
                if ((object.ReferenceEquals(this.CardTypeField, value) != true))
                {
                    this.CardTypeField = value;
                    this.RaisePropertyChanged("CardType");
                }
            }
        }

        [DataMember]
        public decimal Discount
        {
            get
            {
                return this.DiscountField;
            }
            set
            {
                if ((this.DiscountField.Equals(value) != true))
                {
                    this.DiscountField = value;
                    this.RaisePropertyChanged("Discount");
                }
            }
        }

        [DataMember]
        public decimal DiscountAmount
        {
            get
            {
                return this.DiscountAmountField;
            }
            set
            {
                if ((this.DiscountAmountField.Equals(value) != true))
                {
                    this.DiscountAmountField = value;
                    this.RaisePropertyChanged("DiscountAmount");
                }
            }
        }

        [DataMember]
        public decimal OriginalAmount
        {
            get
            {
                return this.OriginalAmountField;
            }
            set
            {
                if ((this.OriginalAmountField.Equals(value) != true))
                {
                    this.OriginalAmountField = value;
                    this.RaisePropertyChanged("OriginalAmount");
                }
            }
        }

        [DataMember]
        public ParameterValidationResult[] ParameterValidationResultList
        {
            get
            {
                return this.ParameterValidationResultListField;
            }
            set
            {
                if ((object.ReferenceEquals(this.ParameterValidationResultListField, value) != true))
                {
                    this.ParameterValidationResultListField = value;
                    this.RaisePropertyChanged("ParameterValidationResultList");
                }
            }
        }

        [DataMember]
        public System.Nullable<decimal> PartiallyAuthorizedAmount
        {
            get
            {
                return this.PartiallyAuthorizedAmountField;
            }
            set
            {
                if ((this.PartiallyAuthorizedAmountField.Equals(value) != true))
                {
                    this.PartiallyAuthorizedAmountField = value;
                    this.RaisePropertyChanged("PartiallyAuthorizedAmount");
                }
            }
        }

        [DataMember]
        public string ReferenceNumber
        {
            get
            {
                return this.ReferenceNumberField;
            }
            set
            {
                if ((object.ReferenceEquals(this.ReferenceNumberField, value) != true))
                {
                    this.ReferenceNumberField = value;
                    this.RaisePropertyChanged("ReferenceNumber");
                }
            }
        }

        [DataMember]
        public decimal Surcharge
        {
            get
            {
                return this.SurchargeField;
            }
            set
            {
                if ((this.SurchargeField.Equals(value) != true))
                {
                    this.SurchargeField = value;
                    this.RaisePropertyChanged("Surcharge");
                }
            }
        }

        [DataMember]
        public decimal SurchargeAmount
        {
            get
            {
                return this.SurchargeAmountField;
            }
            set
            {
                if ((this.SurchargeAmountField.Equals(value) != true))
                {
                    this.SurchargeAmountField = value;
                    this.RaisePropertyChanged("SurchargeAmount");
                }
            }
        }

        [DataMember]
        public string TraceNumber
        {
            get
            {
                return this.TraceNumberField;
            }
            set
            {
                if ((object.ReferenceEquals(this.TraceNumberField, value) != true))
                {
                    this.TraceNumberField = value;
                    this.RaisePropertyChanged("TraceNumber");
                }
            }
        }
    }
}
