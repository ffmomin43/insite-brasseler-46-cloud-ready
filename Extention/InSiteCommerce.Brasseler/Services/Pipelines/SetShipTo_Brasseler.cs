using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Pipelines.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Linq;
using System.Linq.Expressions;

/*
    Customized the Set Shipto Flow for New User.
*/

namespace InSiteCommerce.Brasseler.Services.Pipelines
{
    class SetShipTo_Brasseler : IPipe<SetShipToParameter, SetShipToResult>, IMultiInstanceDependency, IDependency, IExtension
    {
        private readonly ICustomerOrderUtilities customerOrderUtilities;

        public SetShipTo_Brasseler(ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }

        public int Order
        {
            get
            {
                return 250;
            }
        }

        public SetShipToResult Execute(IUnitOfWork unitOfWork, SetShipToParameter parameter, SetShipToResult result)
        {
            Customer shipTo = parameter.ShipTo;
            if (shipTo == null)
                return result;

            CustomerOrder customerOrder = parameter.Cart;
            CustomSettings customSettings = new CustomSettings();
            UserProfile userProfile = SiteContext.Current.UserProfile;

            var companyNameIdentifier = customSettings.CompanyNameIdentifier;
            var newuserCustomerNumber = customSettings.Brasseler_GuestCustomerNumber;

            if (shipTo.CustomerNumber.EqualsIgnoreCase(companyNameIdentifier + newuserCustomerNumber) && userProfile != null)
            {
                var properties = userProfile.CustomProperties;
                customerOrder.ShipToId = shipTo.Id;
                Guid? primarySalespersonId = shipTo.PrimarySalespersonId;
                if (!primarySalespersonId.HasValue && customerOrder.Customer != null)
                    primarySalespersonId = customerOrder.Customer.PrimarySalespersonId;
                customerOrder.CustomerSequence = shipTo.CustomerSequence;
                customerOrder.DefaultWarehouse = shipTo.DefaultWarehouse;
                customerOrder.SalespersonId = primarySalespersonId;
                customerOrder.ShipEarly = shipTo.ShipEarly;
                customerOrder.ShipPartial = shipTo.ShipPartial;
                this.customerOrderUtilities.SetTaxCode1(customerOrder, shipTo.TaxCode1);
                this.customerOrderUtilities.SetTaxCode2(customerOrder, shipTo.TaxCode2);
                customerOrder.STCompanyName = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTCompanyName")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTCompanyName")).FirstOrDefault().Value : shipTo.CompanyName;
                customerOrder.STFirstName = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTFirstName")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTFirstName")).FirstOrDefault().Value : shipTo.FirstName;
                customerOrder.STLastName = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTLastName")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTLastName")).FirstOrDefault().Value : shipTo.LastName;
                customerOrder.STPhone = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTPhone")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTPhone")).FirstOrDefault().Value : shipTo.Phone;
                customerOrder.STAddress1 = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTAddress1")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTAddress1")).FirstOrDefault().Value : shipTo.Address1;
                customerOrder.STAddress2 = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTAddress2")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTAddress2")).FirstOrDefault().Value : shipTo.Address2;
                customerOrder.STCity = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTCity")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTCity")).FirstOrDefault().Value : shipTo.City;
                var propState = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTState")).FirstOrDefault();
                if (propState != null)
                    customerOrder.STState = propState.Value;
                customerOrder.STPostalCode = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTPostalCode")).FirstOrDefault() != null ? properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTPostalCode")).FirstOrDefault().Value : shipTo.PostalCode;
                var propCountry = properties.Where(p => p.Name.EqualsIgnoreCase("NewUsrSTCountry")).FirstOrDefault();
                if (propCountry != null)
                    customerOrder.STCountry = propCountry.Value;
               
                customerOrder.RecalculatePromotions = true;
                customerOrder.RecalculateTax = true;

            }
            return result;
        }
    }
}
