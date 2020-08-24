using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Pipelines.Results;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Pipelines;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Insite.Core.Context;

/*
    Customized the Set Billto Flow for New User.
*/

namespace InSiteCommerce.Brasseler.Services.Pipelines
{
    public class SetBillto_Brasseler : IPipe<SetBillToParameter, SetBillToResult>, IMultiInstanceDependency, IDependency, IExtension
    {
        public int Order
        {
            get
            {
                return 150;
            }
        }

        public SetBillToResult Execute(IUnitOfWork unitOfWork, SetBillToParameter parameter, SetBillToResult result)
        {

            
            Customer billTo = parameter.BillTo;

            // BUSA-475 : Shipping Terms Starts
            // Added condition to take updated ship to account from address check out page. Also if the bill to account postal address is similar to ship to account postal address and customer sequence is empty, then bill to takes the precedence for the condition mentioned in line # 179.
            //if (customerOrder != null)
            //    {

            //        if (!string.IsNullOrEmpty(customerOrder.BTPostalCode) || !string.IsNullOrEmpty(customerOrder.STPostalCode))
            //        {
            //            //BUSA-730 : Tax & Shipping were getting calculated wrong
            //            if (customerOrder.Status.EqualsIgnoreCase("AwaitingApproval"))
            //            {
            //                isShipToAddressChange = false;
            //            } //BUSA-730 : Tax & Shipping were getting calculated wrong
            //            else if (customerOrder.BTPostalCode.EqualsIgnoreCase(customerOrder.STPostalCode) && string.IsNullOrEmpty(customerOrder.Customer.CustomerSequence))
            //            {
            //                isShipToAddressChange = true;
            //            }
            //            else
            //            {
            //                isShipToAddressChange = false;
            //            }
            //        }
            //    }
            // BUSA-475 : Shipping Terms Ends

            if (billTo == null)
                return result;

            CustomerOrder customerOrder = parameter.Cart;
            CustomSettings customSettings = new CustomSettings();
            UserProfile userProfile = SiteContext.Current.UserProfile;

            var companyNameIdentifier = customSettings.CompanyNameIdentifier;
            var newuserCustomerNumber = customSettings.Brasseler_GuestCustomerNumber;


            if (billTo.CustomerNumber.EqualsIgnoreCase(companyNameIdentifier + newuserCustomerNumber) && userProfile != null)
            {
                var properties = userProfile.CustomProperties;

                customerOrder.CustomerNumber = billTo.CustomerNumber;
                customerOrder.Currency = unitOfWork.GetRepository<Insite.Data.Entities.Currency>().GetByNaturalKey((object)billTo.CurrencyCode) ?? customerOrder.Currency;
                customerOrder.TermsCode = billTo.TermsCode;
                customerOrder.BTCompanyName = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTCompanyName")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTCompanyName")).FirstOrDefault().Value : billTo.CompanyName;
                customerOrder.BTFirstName = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTFirstName")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTFirstName")).FirstOrDefault().Value : billTo.FirstName;
                customerOrder.BTLastName = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTLastName")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTLastName")).FirstOrDefault().Value : billTo.LastName;
                customerOrder.BTPhone = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTPhone")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTPhone")).FirstOrDefault().Value : billTo.Phone;
                customerOrder.BTAddress1 = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTAddress1")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTAddress1")).FirstOrDefault().Value : billTo.Address1;
                customerOrder.BTAddress2 = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTAddress2")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTAddress2")).FirstOrDefault().Value : billTo.Address2;
                customerOrder.BTCity = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTCity")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTCity")).FirstOrDefault().Value : billTo.City;
                var propState = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTState")).FirstOrDefault();
                if (propState != null)
                    customerOrder.BTState = propState.Value;
                customerOrder.BTPostalCode = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTPostalCode")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTPostalCode")).FirstOrDefault().Value : billTo.PostalCode;
                var propCountry = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTCountry")).FirstOrDefault();
                if (propCountry != null)
                    customerOrder.BTCountry = propCountry.Value;
                customerOrder.BTEmail = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTEmail")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrBTEmail")).FirstOrDefault().Value : String.Empty;
                customerOrder.ShipTo = billTo;
                //CustomerOrder customerOrder2 = customerOrder;
                //Customer shipTo = customerOrder2.ShipTo;
                //this.SetShipTo(customerOrder2, shipTo);
            }
            return result;
        }
    }
}
