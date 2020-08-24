using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Tax;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insite.Data.Entities;
using Insite.Common.Logging;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Interfaces.Data;
using Avalara.AvaTax.Adapter.TaxService;
using Avalara.AvaTax.Adapter;
using System.Web;
using Insite.Core.Exceptions;
using Avalara.AvaTax.Adapter.AddressService;
using Insite.Core.Context;
using Insite.TaxCalculator.Avalara.SystemSettings;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Insite.Common.Helpers;

namespace InSiteCommerce.Brasseler.Plugins.Tax
{
    [DependencyName("Avalara")]
    public class TaxCalculatorAvalara_Brasseler : ITaxCalculator, IDependency, IExtension
    {
        /// <summary>Common errors related to address - http://developer.avalara.com/api-docs/designing-your-integration/errors-and-outages/common-errors</summary>
        private readonly string[] addressErrorMessages = new string[14]
        {
          "RegionCodeError",
          "CountryError",
          "TaxAddressError",
          "JurisdictionNotFoundError",
          "AddressRangeError",
          "TaxRegionError",
          "AddressError",
          "InsufficientAddressError",
          "PostalCodeError",
          "UnsupportedCountryError",
          "CityError",
          "NonDeliverableAddressError",
          "AddressUnknownStreetError",
          "MultipleAddressMatchError"
        };
        protected bool isShipToAddressChange;

        protected readonly ICustomerOrderUtilities customerOrderUtilities;
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IOrderLineUtilities orderLineUtilities;
        protected readonly TaxesSettings TaxesSettings;
        protected readonly CustomSettings customSettings;
        protected readonly AvalaraSettings AvalaraSettings;

        public TaxCalculatorAvalara_Brasseler( IOrderLineUtilities orderLineUtilities, ICustomerOrderUtilities customerOrderUtilities, IUnitOfWorkFactory unitOfWorkFactory, TaxesSettings taxesSettings, AvalaraSettings avalaraSettings)
        {
            this.orderLineUtilities = orderLineUtilities;
            this.customerOrderUtilities = customerOrderUtilities;
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.TaxesSettings = taxesSettings;
            this.customSettings = new CustomSettings();
            this.AvalaraSettings = avalaraSettings;
        }

        //Copied the 4.4 OOTB method
        public string TestConnection()
        {
            try
            {
                this.GetConfiguredTaxService().Ping(string.Empty);
            }
            catch (Exception ex)
            {
                if (ex is AvaTaxException || ex is AdapterConfigException || ex is InvalidOperationException && ex.Message.StartsWith("Avalara Tax Service is not configured") || ex.Source.Equals("Avalara.AvaTax.Adapter"))
                {
                    LogHelper.For((object)this).Error((object)string.Format("Exception while testing Avalara connection: {0}", (object)ex.Message), ex, (string)null, (object)null);
                    return string.Format("Test connection to Avalara failed: {0}", (object)ex.Message);
                }
                throw;
            }
            return "Test connection to Avalara was successful.";
        }

        public void CalculateTax(OriginAddress originAddress, CustomerOrder customerOrder)
        {
          Website website = customerOrder.Website;
            if (website == null || customerOrder.OrderLines.Count < 1)
                return;
            if (customerOrder.WebsiteId != null)
            {
                customSettings.OverrideCurrentWebsite(customerOrder.WebsiteId);
            }
            var Excert = customerOrder.ShipTo.CustomProperties.Where(x => x.Name.Equals("EXCert", StringComparison.OrdinalIgnoreCase)).FirstOrDefault();
            if (Excert != null && !string.IsNullOrEmpty(Excert.Value))
            {
                customerOrder.StateTax = Decimal.Zero;
                return;
            }

            var taxCalculation = this.TaxesSettings.TaxCalculation;
            if (taxCalculation.ToString().EqualsIgnoreCase("Calculate") && ValidateOrderAddressForAvalara(customerOrder))
            {
                var requestFromOrder = GetCalcTaxRequestFromOrder(originAddress, customerOrder, DocumentType.SalesOrder);
                var configuredTaxService = GetConfiguredTaxService();
                string message1;
                try
                {
                    LogHelper.For(this).Info("AvalaraTax call for Order Number " + customerOrder.OrderNumber, "TaxCalculator_Avalara");

                    //BUSA-481 : Tax Exempt. Truncate country code from customer number Starts.
                    requestFromOrder.CustomerCode = !string.IsNullOrEmpty(requestFromOrder.CustomerCode) ? requestFromOrder.CustomerCode.Trim().Substring(1, requestFromOrder.CustomerCode.Length - 1) : string.Empty;
                    //BUSA-481 : Tax Exempt. Truncate country code from customer number Ends.

                    var tax = configuredTaxService.GetTax(requestFromOrder);
                    message1 = ProcessAvalaraResponseMessage(tax);
                    customerOrder.StateTax = tax.TotalTax;
                }
                catch (Exception ex)
                {
                    LogHelper.For(this).Error("Error running Avalara GetTax method:  " + ex.Message, "TaxCalculator_Avalara");
                    throw;
                }
                if (!string.IsNullOrEmpty(message1))
                    LogHelper.For(this).Debug(message1, "Avalara Result, PostTax: ");
            }
            else
            {
                customerOrder.StateTax = Decimal.Zero;
                string message = !taxCalculation.ToString().EqualsIgnoreCase("Calculate") ? "Select taxcalculation as calculate." : "The billto/shipto customer does not have an address specified. In order to calculate tax this must be set up.";
                LogHelper.For(this).Debug(message, "TaxCalculator_Avalara");
            } 
        }

        public void PostTax(OriginAddress originAddress, CustomerOrder customerOrder)
        {
            if (!this.AvalaraSettings.PostTaxes)  // Added condition to check post taxes setting
                return;
            string str = string.Empty;
            if (ValidateOrderAddressForAvalara(customerOrder))
            {
                try
                {
                    GetTaxRequest requestFromOrder1 = GetCalcTaxRequestFromOrder(originAddress, customerOrder, DocumentType.SalesInvoice);
                    PostTaxRequest requestFromOrder2 = GetPostTaxRequestFromOrder(customerOrder);
                    TaxSvc configuredTaxService = GetConfiguredTaxService();
                    configuredTaxService.GetTax(requestFromOrder1);
                    str = this.ProcessAvalaraResponseMessage(configuredTaxService.PostTax(requestFromOrder2));
                }
                catch (Exception ex)
                {
                    LogHelper.For(this).Error("Error running Avalara PostTax method: " + ex.Message, "TaxCalculator_Avalara");
                    throw;
                }
            }
            else
            {
                LogHelper.For(this).Debug("The billto/shipto customer does not have an address specified. In order to calculate tax this must be set up.", "TaxCalculator_Avalara");
                return;
            }
            if (string.IsNullOrEmpty(str))
                return;
            LogHelper.For(this).Debug(str, "Avalara Result, PostTax: ");
        }


        protected GetTaxRequest GetCalcTaxRequestFromOrder(OriginAddress originAddress, CustomerOrder customerOrder, DocumentType requestDocType)
        {
            //BUSA-483 Tax is not calculating correctly Start
            if (customerOrder != null)
            {
                if (!string.IsNullOrEmpty(customerOrder.BTPostalCode) || !string.IsNullOrEmpty(customerOrder.STPostalCode))
                {
                    //BUSA-730 : Tax & Shipping were getting calculated wrong
                    if (customerOrder.Status.EqualsIgnoreCase("AwaitingApproval"))
                    {
                        isShipToAddressChange = false;
                    } //BUSA-730 : Tax & Shipping were getting calculated wrong
                    else if (customerOrder.BTPostalCode.EqualsIgnoreCase(customerOrder.STPostalCode) && string.IsNullOrEmpty(customerOrder.Customer.CustomerSequence))
                    {
                        isShipToAddressChange = true;
                    }
                    else
                    {
                        isShipToAddressChange = false;
                    }
                }
            }
            var currentCustomer = customerOrder.ShipTo != null && !isShipToAddressChange ? customerOrder.ShipTo : SiteContext.Current.BillTo;

            var FOBCode = string.IsNullOrEmpty(currentCustomer.GetProperty("FOBCode", string.Empty).Trim()) ? "none"
                    : currentCustomer.GetProperty("FOBCode", string.Empty).Trim();

            if (FOBCode == "02")
            {
                customerOrder.ShippingCharges = Decimal.Zero;
            }
            //BUSA-483 Tax is not calculating correctly end

            // BUSA-336 : Taxes are being calculated based on the item value BEFORE promotional discounts are applied Starts
            var promotionOrderDiscountTotal = customerOrderUtilities.GetPromotionOrderDiscountTotal(customerOrder);
            var promotionShippingDiscountTotal = customerOrderUtilities.GetPromotionShippingDiscountTotal(customerOrder);
            // BUSA-336 : Taxes are being calculated based on the item value BEFORE promotional discounts are applied Ends

            //var companyCode = applicationSettingProvider.GetOrCreateByName<string>("TaxCalculator_Avalara_CompanyCode");
            string companyCode = customSettings.TaxCalculatorAvalaraCompanyCode;
            //var orderDiscountTotal = customerOrder.DiscountAmount; // Commented to pass discounted amount in Avalara. 
            var orderDiscountTotal = promotionOrderDiscountTotal;//BUSA-562:Difference in tax amounts between ERP and Insite ($0.01) // BUSA-336 : // BUSA-336 : Taxes are being calculated based on the item value BEFORE promotional discounts are applied Starts.

            var getTaxRequest = new GetTaxRequest();
            Address address1 = new Address();
            address1.Line1 = originAddress.Address1;
            address1.Line2 = originAddress.Address2;
            address1.Line3 = originAddress.Address3;
            address1.City = originAddress.City;
            address1.Region = originAddress.Region;
            address1.PostalCode = originAddress.PostalCode;
            Country country = originAddress.Country;
            string str1 = country != null ? country.IsoCode2 : string.Empty;
            address1.Country = str1;
            if (address1.Line1.IsBlank())
                throw new InvalidOperationException("The origin address for tax purposes does not have a proper address. In order to calculate tax this must be set up.");

            getTaxRequest.OriginAddress = address1;
            Address address2 = new Address()
            {
                Line1 = customerOrder.STAddress1,
                Line2 = customerOrder.STAddress2,
                Line3 = customerOrder.STAddress3,
                City = customerOrder.STCity,
                Region = customerOrder.STState,
                PostalCode = customerOrder.STPostalCode,
                Country = customerOrder.STCountry
            };
            getTaxRequest.DestinationAddress = address2;
            if (string.IsNullOrEmpty(address2.Line1))
                throw new InvalidOperationException("The current shipto customer does not have an address specified. In order to calculate tax this must be set up.");

            foreach (var orderLine in customerOrder.OrderLines)
            {
                if (!orderLine.Status.EqualsIgnoreCase("Void") && orderLine.Release <= 1)
                {
                    var line = new Line
                    {
                        No = orderLine.Line.ToString(),
                        ItemCode = orderLine.Product.ErpNumber,
                        Qty = (double)orderLine.QtyOrdered,
                        Amount = this.orderLineUtilities.GetTotalNetPrice(orderLine),
                        Discounted = orderDiscountTotal != Decimal.Zero,
                        Description = orderLine.Product.ShortDescription,
                        TaxCode = orderLine.Product.TaxCategory
                    };
                    if (line.TaxCode != null && line.TaxCode.Length >= 24)
                        line.TaxCode = line.TaxCode.Substring(0, 24);
                    getTaxRequest.Lines.Add(line);
                }
            }
            if (customerOrder.ShippingCharges > 0)
            {
                var freightLine = new Line()
                {
                    No = (customerOrder.OrderLines.Count + 1).ToString(),
                    ItemCode = customSettings.TaxCalculatorAvalaraBrasselerShipCode,
                    Qty = 1,
                    Amount = customerOrder.ShippingCharges - promotionShippingDiscountTotal,//BUSA-562:Difference in tax amounts between ERP and Insite ($0.01)
              //    Discounted = customerOrder.DiscountAmount != decimal.Zero -- 4.2
                    Discounted = orderDiscountTotal != decimal.Zero,
                    Description = customSettings.TaxCalculatorAvalaraBrasselerShipCodeDescription,
                    TaxCode = customSettings.TaxCalculatorAvalaraBrasselerShippingTaxCode
                };
                if (freightLine.TaxCode != null && freightLine.TaxCode.Length >= 24)
                    freightLine.TaxCode = freightLine.TaxCode.Substring(0, 24);
                getTaxRequest.Lines.Add(freightLine);
            }
            getTaxRequest.CompanyCode = companyCode;
            getTaxRequest.DocCode = customerOrder.OrderNumber;
            getTaxRequest.DocDate = customerOrder.OrderDate.DateTime;
            getTaxRequest.DocType = requestDocType;
            getTaxRequest.Discount = orderDiscountTotal;
            getTaxRequest.CustomerCode = customerOrder.CustomerNumber;
            if (customerOrder.ShipTo != null)
                getTaxRequest.CustomerUsageType = customerOrder.ShipTo.TaxCode1;            
            return getTaxRequest;
        }

        //BUSA-624 start : Order File is not being generated due to empty one time shipping state during checkout.
        protected string ProcessAvalaraResponseMessage(BaseResult result)
        {
            StringBuilder stringBuilder = new StringBuilder();
            if (result.ResultCode == SeverityLevel.Success)
                return stringBuilder.ToString();
            foreach (Avalara.AvaTax.Adapter.Message message in (BaseArrayList)result.Messages)
            {
                if (((IEnumerable<string>)this.addressErrorMessages).Contains<string>(message.Name))
                {
                    LogHelper.For((object)this).Error((object)string.Format("{0} - {1}", (object)message.Name, (object)message.Details), "TaxCalculator_Avalara");
                    throw new HttpException(400, typeof(InvalidAddressException).ToString());
                }
                stringBuilder.AppendLine("Name: " + message.Name);
                stringBuilder.AppendLine("Severity: " + (object)message.Severity);
                stringBuilder.AppendLine("Summary: " + message.Summary);
                stringBuilder.AppendLine("Details: " + message.Details);
                stringBuilder.AppendLine("Source: " + message.Source);
                stringBuilder.AppendLine("RefersTo: " + message.RefersTo);
                stringBuilder.AppendLine("HelpLink: " + message.HelpLink);
            }
            if (result.ResultCode != SeverityLevel.Error && result.ResultCode != SeverityLevel.Exception)
                return stringBuilder.ToString();
            throw new Exception(stringBuilder.ToString());
        }

        //BUSA-624 end : Order File is not being generated due to empty one time shipping state during checkout.

        protected bool ValidateOrderAddressForAvalara(CustomerOrder customerOrder)
        {
            bool isvalid = false;
            if (customerOrder != null)
            {
                bool validBTAddress = (!string.IsNullOrEmpty(customerOrder.BTAddress1) && !string.IsNullOrEmpty(customerOrder.BTCity) && !string.IsNullOrEmpty(customerOrder.BTState) && !customerOrder.BTPostalCode.EqualsIgnoreCase(customSettings.NewWebShopperPostalCode)
                                      && !string.IsNullOrEmpty(customerOrder.BTPostalCode) && !string.IsNullOrEmpty(customerOrder.BTCountry));
                bool validSTAddress = (!string.IsNullOrEmpty(customerOrder.STAddress1) && !string.IsNullOrEmpty(customerOrder.STCity) && !string.IsNullOrEmpty(customerOrder.STState)
                                      && !string.IsNullOrEmpty(customerOrder.STPostalCode) && !string.IsNullOrEmpty(customerOrder.STCountry) && !customerOrder.STPostalCode.EqualsIgnoreCase(customSettings.NewWebShopperPostalCode));
                return (validBTAddress && validSTAddress);
            }
            return isvalid;
        }

        protected TaxSvc GetConfiguredTaxService()
        {
            var serviceUrl = customSettings.TaxCalculatorAvalaraTaxServiceURL;
            var accountNumber = customSettings.TaxCalculatorAvalaraTaxServiceAccount;
            var licenseKey = customSettings.TaxCalculatorAvalaraTaxServiceLicense;
            var userName = customSettings.TaxCalculatorAvalaraTaxServiceUserName;
            var password = customSettings.TaxCalculatorAvalaraTaxServicePassword;

            if (!string.IsNullOrEmpty(serviceUrl) && !string.IsNullOrEmpty(accountNumber) && !string.IsNullOrEmpty(licenseKey) && !string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(password))
            {
                TaxSvc taxSvc = new TaxSvc();
                taxSvc.Configuration.RequestTimeout = 300;
                taxSvc.Profile.Client = "InSite eCommerce";
                taxSvc.Configuration.Security.Account = accountNumber;
                taxSvc.Configuration.Security.License = licenseKey;
                taxSvc.Configuration.Security.UserName = userName;
                taxSvc.Configuration.Security.Password = password;
                taxSvc.Configuration.Url = serviceUrl;
                taxSvc.Configuration.ViaUrl = serviceUrl;
                taxSvc.Profile.Name = "Brasseler";
                return taxSvc;
            }
            LogHelper.For((object)this).Error("Avalara Tax Service is not configured completely in Commerce App Settings", "TaxCalculator_Avalara");
            throw new InvalidOperationException("Avalara Tax Service is not configured completely in Commerce App Settings");
        }

        protected PostTaxRequest GetPostTaxRequestFromOrder(CustomerOrder customerOrder)
        {
            Decimal totalTax = customerOrderUtilities.GetTotalTax(customerOrder);
            PostTaxRequest postTaxRequest = new PostTaxRequest();
            postTaxRequest.Commit = true;
            string companyCode = customSettings.TaxCalculatorAvalaraCompanyCode;
            postTaxRequest.CompanyCode = companyCode;
            string orderNumber = customerOrder.OrderNumber;
            postTaxRequest.DocCode = orderNumber;
            DateTime utcDateTime = customerOrder.OrderDate.UtcDateTime;
            postTaxRequest.DocDate = utcDateTime;
            postTaxRequest.DocType = DocumentType.SalesInvoice;
            string empty = string.Empty;
            postTaxRequest.NewDocCode = empty;
            Decimal num2 = NumberHelper.RoundCurrency(customerOrderUtilities.GetOrderTotal(customerOrder) - totalTax);
            postTaxRequest.TotalAmount = num2;
            Decimal num3 = totalTax;
            postTaxRequest.TotalTax = num3;
            return postTaxRequest;
        }
    }
}
