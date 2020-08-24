using Insite.ContentLibrary.ContentFields;
using Insite.ContentLibrary.Widgets;
using Insite.Core.Providers;
using Insite.Data.Entities;
using System.ComponentModel;

namespace InSiteCommerce.Brasseler.ContentLibrary.Widgets
{
    [DisplayName("Acton Form - Insite Commerce Opt-In for Email")]
    public class BrasselerEmailSubscription : ContentWidget
    {

        private string emailIsRequiredErrorMessage;
        private string emailIsInvalidErrorMessage;

        [TextContentField]
        public virtual string ActonFormPostUrl
        {
            get
            {
                return this.GetValue<string>("ActonFormPostUrl", "http://marketing.brasselerusa.com/acton/eform/3381/0088/d-ext-0001", FieldType.Contextual);
            }
            set
            {
                this.SetValue<string>("ActonFormPostUrl", value, FieldType.Contextual);
            }
        }

        [TextContentField]
        public virtual string ActonEmailField
        {
            get 
            {
                return this.GetValue<string>("ActonEmailField", "E-mail", FieldType.Contextual);
            }
            set
            {
                this.SetValue<string>("ActonEmailField", value, FieldType.Contextual);
            }
        }


        [TextContentField]
        public virtual string ActonOptInEmailField 
        {
            get
            {
                return this.GetValue<string>("ActonOptInEmailField", "Opt In for Email", FieldType.Contextual);
            }
            set
            {
                this.SetValue<string>("ActonOptInEmailField", value, FieldType.Contextual);
            }
        }
        
        [TextContentField]
        public virtual string PlaceHolderText
        {
            get
            {
                return this.GetValue<string>("PlaceHolderText", "Subscribe to our newsletter", FieldType.Contextual);
            }
            set
            {
                this.SetValue<string>("PlaceHolderText", value, FieldType.Contextual);
            }
        }


        [TextContentField]
        public virtual string SuccessMessage
        {
            get
            {
                return this.GetValue<string>("SuccessMessage", "You have been successfully subscribed to our newsletter", FieldType.Contextual);
            }
            set
            {
                this.SetValue<string>("SuccessMessage", value, FieldType.Contextual);
            }
        }

        public virtual string EmailIsRequiredErrorMessage
        {
            get
            {
                return this.emailIsRequiredErrorMessage ?? (this.emailIsRequiredErrorMessage = MessageProvider.Current.GetMessage("EmailSubscription_EmailIsRequiredErrorMessage", "Email Address is required."));
            }
        }

        public virtual string EmailIsInvalidErrorMessage
        {
            get
            {
                return this.emailIsInvalidErrorMessage ?? (this.emailIsInvalidErrorMessage = MessageProvider.Current.GetMessage("EmailSubscription_EmailIsInvalidErrorMessage", "Email Address is invalid."));
            }
        }

    }
}
