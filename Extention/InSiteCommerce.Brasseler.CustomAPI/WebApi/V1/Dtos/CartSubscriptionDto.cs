using System;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos
{
    public class CartSubscriptionDto
    {
        public CartSubscriptionDto()
        {

        }
        public Guid CustomerOrderId { get; set; }
        public int Frequency { get; set; }
        public string PaymentMethod { get; set; }
        public DateTimeOffset NextDelieveryDate { get; set; }
        public DateTimeOffset ActivationDate { get; set; }
        public DateTimeOffset DeActivationDate { get; set; }
        public Guid ParentCustomerOrderId { get; set; }//BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
        public bool ShipNow { get; set; }
        public bool IsModified { get; set; }//BUSA -762.
    }
}
