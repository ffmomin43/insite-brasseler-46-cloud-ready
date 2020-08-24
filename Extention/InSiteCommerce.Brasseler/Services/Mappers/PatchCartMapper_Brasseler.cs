using Insite.Cart.WebApi.V1.Mappers;
using Insite.Cart.WebApi.V1.Mappers.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insite.Cart.Services.Parameters;
using Insite.Cart.WebApi.V1.ApiModels;
using System.Net.Http;
using Insite.Core.Extensions;
using Insite.Cart.Services.Dtos;
using Insite.Customers.WebApi.V1.ApiModels;

namespace InSiteCommerce.Brasseler.Services.Mappers
{
    public class PatchCartMapper_Brasseler : PatchCartMapper
    {
        public PatchCartMapper_Brasseler(IGetCartMapper getCartMapper) : base(getCartMapper)
        {

        }

        public override UpdateCartParameter MapParameter(CartModel cartModel, HttpRequestMessage request)
        {
            UpdateCartParameter updateCartParameter1 = new UpdateCartParameter();
            updateCartParameter1.CartId = cartModel.Id.ToCurrentOrGuid();
            updateCartParameter1.Status = cartModel.Status;
            ShipToModel shipTo = cartModel.ShipTo;
            updateCartParameter1.ShipToId = shipTo != null ? new Guid?(shipTo.Id.ToGuid()) : new Guid?();
            updateCartParameter1.ShipViaId = cartModel.ShipVia?.Id;
            updateCartParameter1.Notes = cartModel.Notes;
            updateCartParameter1.PoNumber = cartModel.PoNumber;
            updateCartParameter1.TermsCode = cartModel.PaymentMethod?.Name;
            PaymentMethodDto paymentMethod = cartModel.PaymentMethod;
            updateCartParameter1.RequestedDeliveryDate = cartModel.RequestedDeliveryDate;
            UpdateCartParameter updateCartParameter2 = updateCartParameter1;
            if (cartModel.PaymentOptions != null && cartModel.PaymentOptions.IsPayPal)
            {
                updateCartParameter2.IsPayPal = cartModel.PaymentOptions.IsPayPal;
                updateCartParameter2.PaypalRedirectUrl = cartModel.PaymentOptions.PayPalPaymentUrl;
                if (cartModel.Status == "Submitted")
                {
                    updateCartParameter2.PayPalPayerId = cartModel.PaymentOptions.PayPalPayerId;
                    updateCartParameter2.PayPalToken = cartModel.PaymentOptions.PayPalToken;
                }
            }
            if (!cartModel.Status.EqualsIgnoreCase("Submitted") && !cartModel.Status.EqualsIgnoreCase("CreateSmartSupply") && !cartModel.Status.EqualsIgnoreCase("SaveNewCard") && !cartModel.Status.EqualsIgnoreCase("PayInvoice")) //BUSA-PIO
                return updateCartParameter2;

            updateCartParameter2.PaymentMethod = cartModel.PaymentMethod;
            //if (cartModel.PaymentMethod.IsCreditCard)
            if (cartModel.PaymentOptions.PaymentMethods.Count > 0) /*BUSA-619 : Card Information popup becomes unresponsive on clicking save button.*/
                updateCartParameter2.CreditCard = cartModel.PaymentOptions.CreditCard;
            updateCartParameter2.StorePaymentProfile = cartModel.PaymentOptions.StorePaymentProfile;
            if (cartModel.PaymentMethod != null && cartModel.PaymentMethod.IsPaymentProfile)
            {
                updateCartParameter2.IsPaymentProfile = true;
                updateCartParameter2.PaymentProfileId = cartModel.PaymentMethod.Name;
            }
            //BUSA-1170 Added order level property for sample product
            if (cartModel.CartLines.Where(cl => cl.Properties.ContainsKey("isSampleCartLine") && cl.Properties.ContainsValue("true")).Count() > 0)
            {
                cartModel.Properties.Add("isSampleOrder", "true");
            }
            updateCartParameter2.Properties = cartModel.Properties; //
            return updateCartParameter2;
        }

    }
}
