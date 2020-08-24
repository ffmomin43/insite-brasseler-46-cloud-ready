using Insite.Core.SystemSetting;
using Insite.Core.SystemSetting.Groups;
//Add all website and application level custom settings in this class

namespace InSiteCommerce.Brasseler.SystemSetting.Groups
{
    [SettingsGroup(Description = "", Label = "General", PrimaryGroupName = "CustomWebAppSetting", SortOrder = 1)]
    public class CustomSettings : BaseSettingsGroup
    {
        //website level property-- IsGlobal field is required
        [SettingsField(Description = "Add email here", DisplayName = "New User Count Info To", IsGlobal = false)]
        public virtual string NewUserCountInfoTo
        {
            get
            {
                return this.GetValue<string>("", nameof(NewUserCountInfoTo));
            }
        }

        [SettingsField(Description = "Add email here", DisplayName = "Daily Orders Report Email Info-To", IsGlobal = false)]
        public virtual string DailyOrdersReportEmailInfoTo
        {
            get
            {
                return this.GetValue<string>("", nameof(DailyOrdersReportEmailInfoTo));
            }
        }

        [SettingsField(Description = "Add email here", DisplayName = "Promotions Report To", IsGlobal = false)]
        public virtual string PromotionsReportTo
        {
            get
            {
                return this.GetValue<string>("", nameof(PromotionsReportTo));
            }
        }

        [SettingsField(Description = "Customer Types separated by comma", DisplayName = "PO CustomerTypes", IsGlobal = false)]
        public virtual string POCustomerTypes
        {
            get
            {
                return this.GetValue<string>("", nameof(POCustomerTypes));
            }
        }

        [SettingsField(Description = "Add email here", DisplayName = "Smart-Supply Credit Card Notification", IsGlobal = false)]
        public virtual string SmartSupplyCreditCardNotification
        {
            get
            {
                return this.GetValue<string>("", nameof(SmartSupplyCreditCardNotification));
            }
        }

        [SettingsField(Description = "User will be notified given days before SS order ", DisplayName = "Smart-Supply shipping Notification", IsGlobal = false)]
        public virtual string SmartSupplyShippingNotification
        {
            get
            {
                return this.GetValue<string>("", nameof(SmartSupplyShippingNotification));
            }
        }

        [SettingsField(Description = "User-Id for cenpos ", DisplayName = "PaymentGateway Cenpos UserId", IsGlobal = false)]
        public virtual string PaymentGateway_Cenpos_UserId
        {
            get
            {
                return this.GetValue<string>("", nameof(PaymentGateway_Cenpos_UserId));
            }
        }

        [SettingsField(Description = "Password for cenpos ", DisplayName = "PaymentGateway Cenpos Password", IsGlobal = false)]
        public virtual string PaymentGateway_Cenpos_Password
        {
            get
            {
                return this.GetValue<string>("", nameof(PaymentGateway_Cenpos_Password));
            }
        }

        [SettingsField(Description = "MerchantId for cenpos ", DisplayName = "PaymentGateway Cenpos MerchantId", IsGlobal = false)]
        public virtual int PaymentGateway_Cenpos_MerchantId
        {
            get
            {
                return this.GetValue<int>(4444, nameof(PaymentGateway_Cenpos_MerchantId));
            }
        }

        [SettingsField(Description = "Enter comma separated guest customer numbers ", DisplayName = "Brasseler_Multisite Customer Numbers", IsGlobal = false)]
        public virtual string Brasseler_MultisiteCustomerNumbers
        {
            get
            {
                return this.GetValue<string>("", nameof(Brasseler_MultisiteCustomerNumbers));
            }
        }

        [SettingsField(Description = "Add UseVolumeGroupPricing here", DisplayName = "Use Volume Group Pricing", IsGlobal = false)]
        public virtual string UseVolumeGroupPricing
        {
            get
            {
                return this.GetValue<string>("", nameof(UseVolumeGroupPricing));
            }
        }

        [SettingsField(Description = "Identifier for the Company name", DisplayName = "Company Name Identifier", IsGlobal = false)]
        public virtual string CompanyNameIdentifier
        {
            get
            {
                return this.GetValue<string>("1", nameof(CompanyNameIdentifier));
            }
        }

        [SettingsField(Description = "Add email here", DisplayName = "New User With Existing Customer Email Info-To", IsGlobal = false)]
        public virtual string NewUserWithExistingCustomerEmailInfoTo
        {
            get
            {
                return this.GetValue<string>("", nameof(NewUserWithExistingCustomerEmailInfoTo));
            }
        }

        [SettingsField(Description = "Dental School,Dental Office,Multi-Practice Corporate Group,Dental Lab,Hospital / Surgery Center,Dental Student, Dental Faculty,Government,Other", DisplayName = "Customer Type for new user ", IsGlobal = false)]
        public virtual string CustomerType
        {
            get
            {
                return this.GetValue<string>("Dental School,Dental Office,Multi-Practice Corporate Group,Dental Lab,Hospital / Surgery Center,Dental Student,Dental Faculty,Government,Other", nameof(CustomerType));
            }
        }

        [SettingsField(Description = "This value should be same as for the customer 'New Web Shopper' postal code", DisplayName = "New Web Shopper Postal Code", IsGlobal = false)]
        public virtual string NewWebShopperPostalCode
        {
            get
            {
                return this.GetValue<string>("XXXXX", nameof(NewWebShopperPostalCode));
            }
        }

        [SettingsField(Description = "This value should be same as for the customer 'New Web Shopper' address1", DisplayName = "New WebShopper Address", IsGlobal = false)]
        public virtual string NewWebShopperAddress
        {
            get
            {
                return this.GetValue<string>("?", nameof(NewWebShopperAddress));
            }
        }

        [SettingsField(Description = "Company Code needed to identify the company to Avalara", DisplayName = "Tax Calculator Avalara Company Code", IsGlobal = false)]
        public virtual string TaxCalculatorAvalaraCompanyCode
        {
            get
            {
                return this.GetValue<string>("BUSADTL", nameof(TaxCalculatorAvalaraCompanyCode));
            }
        }

        [SettingsField(Description = "Ship Code needed for Avalara", DisplayName = "Tax Calculator Avalara Brasseler Ship Code", IsGlobal = false)]
        public virtual string TaxCalculatorAvalaraBrasselerShipCode
        {
            get
            {
                return this.GetValue<string>("/1", nameof(TaxCalculatorAvalaraBrasselerShipCode));
            }
        }

        [SettingsField(Description = "Shipping Tax Code for Avalara", DisplayName = "Tax Calculator Avalara Brasseler Shipping Tax Code", IsGlobal = false)]
        public virtual string TaxCalculatorAvalaraBrasselerShippingTaxCode
        {
            get
            {
                return this.GetValue<string>("FR020800", nameof(TaxCalculatorAvalaraBrasselerShippingTaxCode));
            }
        }

        [SettingsField(Description = "ShipCode Description for Avalara", DisplayName = "Tax Calculator Avalara Brasseler ShipCode Description", IsGlobal = false)]
        public virtual string TaxCalculatorAvalaraBrasselerShipCodeDescription
        {
            get
            {
                return this.GetValue<string>("Shipping and handling", nameof(TaxCalculatorAvalaraBrasselerShipCodeDescription));
            }
        }

        [SettingsField(Description = "Add Default Email address", DisplayName = "Default_Email_address", IsGlobal = false)]
        public virtual string DefaultEmailAddress
        {
            get
            {
                return this.GetValue<string>("", nameof(DefaultEmailAddress));
            }
        }
        //BUSA-1090 Wish list email notification (share) -- Start
        [SettingsField(Description = "Add Default WishList Email address", DisplayName = "Default_WishList_Email_address", IsGlobal = false)]
        public virtual string DefaultWishListEmailAddress
        {
            get
            {
                return this.GetValue<string>("", nameof(DefaultWishListEmailAddress));
            }
        }
        //BUSA-1090 Wish list email notification (share) -- End

        [SettingsField(Description = "Add Email CC address", DisplayName = "Email_CC_Addresses", IsGlobal = false)]
        public virtual string EmailCCAddresses
        {
            get
            {
                return this.GetValue<string>("", nameof(EmailCCAddresses));
            }
        }

        [SettingsField(Description = "Add Email address", DisplayName = "New_CustomerInfo_EmailTo", IsGlobal = false)]
        public virtual string NewCustomerInfoEmailTo
        {
            get
            {
                return this.GetValue<string>("", nameof(NewCustomerInfoEmailTo));
            }
        }

        [SettingsField(Description = "Set true/false (Case sensitive)", DisplayName = "Update Browser", IsGlobal = false)]
        public virtual string UpdateBrowser
        {
            get
            {
                return this.GetValue<string>("true", nameof(UpdateBrowser));
            }
        }

        [SettingsField(Description = "Set Google Tag Manager Id", DisplayName = "Google_TagManagerId", IsGlobal = false)]
        public virtual string Google_TagManagerId
        {
            get
            {
                return this.GetValue<string>("", nameof(Google_TagManagerId));
            }
        }

        [SettingsField(Description = "Set Infor max invoices number", DisplayName = "Infor Max Invoices", IsGlobal = false)]
        public virtual string InforMaxInvoices
        {
            get
            {
                return this.GetValue<string>("500", nameof(InforMaxInvoices));
            }
        }

        [SettingsField(Description = "Maximum sample products allowed per order", DisplayName = "Sample Product per Order", IsGlobal = false)]
        public virtual int MaxSamplePerOrder
        {
            get
            {
                return this.GetValue<int>(0, nameof(MaxSamplePerOrder));
            }
        }

        [SettingsField(Description = "Maximum time alloted to Order Sample Product", DisplayName = "Time Duration alloted for user to order products", IsGlobal = false)]
        public virtual int MaxTimeToLimitUserForSampleOrder
        {
            get
            {
                return this.GetValue<int>(0, nameof(MaxTimeToLimitUserForSampleOrder));
            }
        }

        [SettingsField(Description = "Maximum sample products allowed during given time frame", DisplayName = "Max Sample Order during given time frame", IsGlobal = false)]
        public virtual int MaxSampleOrderInGivenTimeFrame
        {
            get
            {
                return this.GetValue<int>(0, nameof(MaxSampleOrderInGivenTimeFrame));
            }
        }
        //**************************************Please Add application settings below - IsGlobal field is not required************************************************//

        [SettingsField(Description = "Add Guest customer number here", DisplayName = "Guest Customer Number")]
        public virtual string Brasseler_GuestCustomerNumber
        {
            get
            {
                return this.GetValue<string>("1055357", nameof(Brasseler_GuestCustomerNumber));
            }
        }

        [SettingsField(Description = "Add Recaptcha key here", DisplayName = "Recaptcha key")]
        public virtual string ReCaptcha
        {
            get
            {
                return this.GetValue<string>("6LcY0YUUAAAAAJ2HBtLz-PCpHuhl20uLn12LgrNN", nameof(ReCaptcha));
            }
        }

        [SettingsField(Description = "SQL Timeout value for integration jobs", DisplayName = "DBCommand TimeOut Value")]
        public virtual string DBCommandTimeOutValue
        {
            get
            {
                return this.GetValue<string>("1200", nameof(DBCommandTimeOutValue));
            }
        }

        [SettingsField(Description = "Comma Seperated PowerSubClass", DisplayName = "PowerSubClass")]
        public virtual string PowerSubClass
        {
            get
            {
                return this.GetValue<string>("", nameof(PowerSubClass));
            }
        }

        [SettingsField(Description = "This setting is to have show discontinued products attribute id.", DisplayName = "Brasseler Discontinued Attribute Value Id")]
        public virtual string Brasseler_DiscontinuedAttributeValueId
        {
            get
            {
                return this.GetValue<string>("FB53EA80-0DCD-4FB0-A071-A66401170C7A", nameof(Brasseler_DiscontinuedAttributeValueId));
            }
        }

        [SettingsField(Description = "Order threshold values for different corporate groups.", DisplayName = "Corporate Group Thresholds")]
        public virtual string CorporateGroupThresholds
        {
            get
            {
                return this.GetValue<string>("ADP,0;DCA,150;DOP,150;INTERDENT,50;PACIFIC,50;YANNIS,0", nameof(CorporateGroupThresholds));
            }
        }

        [SettingsField(Description = "Avalara URL", DisplayName = "TaxCalculator Avalara Tax Service URL")]
        public virtual string TaxCalculatorAvalaraTaxServiceURL
        {
            get
            {
                return this.GetValue<string>("https://development.avalara.net", nameof(TaxCalculatorAvalaraTaxServiceURL));
            }
        }

        [SettingsField(Description = "Avalara Account", DisplayName = "TaxCalculator Avalara Tax Service Account")]
        public virtual string TaxCalculatorAvalaraTaxServiceAccount
        {
            get
            {
                return this.GetValue<string>("2000186688", nameof(TaxCalculatorAvalaraTaxServiceAccount));
            }
        }

        [SettingsField(Description = "Avalara License", DisplayName = "TaxCalculator Avalara Tax Service License")]
        public virtual string TaxCalculatorAvalaraTaxServiceLicense
        {
            get
            {
                return this.GetValue<string>("D7D351E2361E2FEE", nameof(TaxCalculatorAvalaraTaxServiceLicense));
            }
        }

        [SettingsField(Description = "Avalara Usename", DisplayName = "Tax Calculator Avalara Tax Service UserName")]
        public virtual string TaxCalculatorAvalaraTaxServiceUserName
        {
            get
            {
                return this.GetValue<string>("BrasselerAdapty", nameof(TaxCalculatorAvalaraTaxServiceUserName));
            }
        }

        [SettingsField(Description = "Avalara Password", DisplayName = "Tax Calculator Avalara Tax Service Password")]
        public virtual string TaxCalculatorAvalaraTaxServicePassword
        {
            get
            {
                return this.GetValue<string>("Adapty2017", nameof(TaxCalculatorAvalaraTaxServicePassword));
            }
        }

        [SettingsField(Description = "Add Infor subscriberId here", DisplayName = "Infor Subscriber ID")]
        public virtual string InforSubscriberID
        {
            get
            {
                return this.GetValue<string>("", nameof(InforSubscriberID));
            }
        }

        [SettingsField(Description = "Add Infor Subscriber Password here", DisplayName = "Infor Subscriber Password")]
        public virtual string InforSubscriberPassword
        {
            get
            {
                return this.GetValue<string>("", nameof(InforSubscriberPassword));
            }
        }

        [SettingsField(Description = "Add Infor URL here", DisplayName = "Infor URL")]
        public virtual string InforUrl
        {
            get
            {
                return this.GetValue<string>("", nameof(InforUrl));
            }
        }

        [SettingsField(Description = "Value for OutputType Parameter to be passed in Infor URL", DisplayName = "Infor Url OutputType Parameter")]
        public virtual string InforUrlOutputTypeParameter
        {
            get
            {
                return this.GetValue<string>("0", nameof(InforUrlOutputTypeParameter));
            }
        }

        [SettingsField(Description = "Value for InputType Parameter to be passed in Infor URL", DisplayName = "Infor Url InputType Parameter")]
        public virtual string InforUrlInputTypeParameter
        {
            get
            {
                return this.GetValue<string>("1", nameof(InforUrlInputTypeParameter));
            }
        }

        [SettingsField(Description = "successful message response from Infor", DisplayName = "Infor Success Message")]
        public virtual string InforSuccessMessage
        {
            get
            {
                return this.GetValue<string>("Payment being processed in transaction processor.", nameof(InforSuccessMessage));
            }
        }
        //RMA custom properties
        [SettingsField(Description = "Ship URL Provided by UPS", DisplayName = "Ship URL")]
        public virtual string UPS_Ship_Url
        {
            get
            {
                return this.GetValue<string>("", nameof(UPS_Ship_Url));
            }
        }
        [SettingsField(Description = "Label Recovery URL Provided by UPS", DisplayName = "Label Recovery URL")]
        public virtual string UPS_LabelRecovery_Url
        {
            get
            {
                return this.GetValue<string>("", nameof(UPS_LabelRecovery_Url));
            }
        }
        [SettingsField(Description = "Username Provided by UPSSecurity", DisplayName = "UserToken Username")]
        public virtual string UPSSecurity_UserToken_Username
        {
            get
            {
                return this.GetValue<string>("", nameof(UPSSecurity_UserToken_Username));
            }

        }
        [SettingsField(Description = "Password Provided by UPSSecurity", DisplayName = "UserToken Password")]
        public virtual string UPSSecurity_UserToken_Password
        {
            get
            {
                return this.GetValue<string>("", nameof(UPSSecurity_UserToken_Password));
            }

        }
        [SettingsField(Description = "Service Accees Token Provided by UPSSecurity", DisplayName = "ServiceAccessToken AccessLicenseNumber")]
        public virtual string UPSSecurity_ServiceAccessToken_AccessLicenseNumber
        {
            get
            {
                return this.GetValue<string>("", nameof(UPSSecurity_ServiceAccessToken_AccessLicenseNumber));
            }

        }
        [SettingsField(Description = "UPS Account Number. Must be the same UPS account number as the one provided in Shipper/ShipperNumber.", DisplayName = "UPS AccountNumber")]
        public virtual string PaymentInformation_ShipmentCharge_AccountNumber
        {
            get
            {
                return this.GetValue<string>("", nameof(PaymentInformation_ShipmentCharge_AccountNumber));
            }

        }
        [SettingsField(Description = "Shipper Number.", DisplayName = "Shipper Number")]
        public virtual string Shipper_ShipperNumber
        {
            get
            {
                return this.GetValue<string>("", nameof(Shipper_ShipperNumber));
            }

        }
        [SettingsField(Description = "RMA Order Number Prefix.", DisplayName = "RMA Order Number Prefix")]
        public virtual string RMA_OrderNumberPrefix
        {
            get
            {
                return this.GetValue<string>("", nameof(RMA_OrderNumberPrefix));
            }
        }
        [SettingsField(Description = "RMA Order Number Format.", DisplayName = "RMA Order Number Format")]
        public virtual string RMA_OrderNumberFormat
        {
            get
            {
                return this.GetValue<string>("", nameof(RMA_OrderNumberFormat));
            }
        }
        [SettingsField(Description = "RMA Email Notification.", DisplayName = "RMA To Address")]
        public virtual string RMA_ToAddress
        {
            get
            {
                return this.GetValue<string>("", nameof(RMA_ToAddress));
            }
        }
        [SettingsField(Description = "RMA Email Notification.", DisplayName = "RMA CC Address")]
        public virtual string RMA_CC_Address
        {
            get
            {
                return this.GetValue<string>("", nameof(RMA_CC_Address));
            }
        }
        [SettingsField(Description = "RMA Email Notification.", DisplayName = "RMA BCC Address")]
        public virtual string RMA_BCC_Address
        {
            get
            {
                return this.GetValue<string>("", nameof(RMA_BCC_Address));
            }
        }

        [SettingsField(Description = "Add Punchout Order Prefix here", DisplayName = "Punchout Order Prefix")]
        public virtual string PunchoutOrder_Prefix
        {
            get
            {
                return this.GetValue<string>("P", nameof(PunchoutOrder_Prefix));
            }
        }
        [SettingsField(Description = "Add SmartSupply Order Prefix here", DisplayName = "SmartSupply Order Prefix")]
        public virtual string SmartSupply_Prefix
        {
            get
            {
                return this.GetValue<string>("S", nameof(SmartSupply_Prefix));
            }
        }
    }
}
