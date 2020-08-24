using Insite.Core.Context;
using Insite.Data.Entities;
using System;

namespace InSiteCommerce.Brasseler.Plugins.Helper
{
    public class HelperUtility
    {
        public HelperUtility()
        {

        }

        // To Check if current flow is BIll to or Ship to.
        public Customer GetCurrentCustomerFlow(CustomerOrder customerOrder)
        {
            bool isShipToAddressChange = false;

            if (customerOrder == null)
            {
                return null;
            }

            if (customerOrder != null)
            {
                if (!string.IsNullOrEmpty(customerOrder.BTPostalCode) || !string.IsNullOrEmpty(customerOrder.STPostalCode))
                {
                    if (customerOrder.BTPostalCode.EqualsIgnoreCase(customerOrder.STPostalCode) && string.IsNullOrEmpty(customerOrder.Customer.CustomerSequence))// Check if the flow is Bill To.
                    {
                        isShipToAddressChange = true;
                    }
                    else
                    {
                        isShipToAddressChange = false;
                    }
                }
            }

            var currentCustomer = customerOrder.ShipTo != null && !isShipToAddressChange && !string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence) ? customerOrder.ShipTo : SiteContext.Current.BillTo;

            return currentCustomer;
        }
    }
}
