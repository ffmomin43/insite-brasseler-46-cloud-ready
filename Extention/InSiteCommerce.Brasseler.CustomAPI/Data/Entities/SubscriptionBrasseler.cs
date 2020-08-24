using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("SubscriptionBrasseler")]
    public class SubscriptionBrasseler : EntityBase, IArchivable<SubscriptionBrasseler>
    {
        public Guid CustomerOrderId { get; set; }
        public int Frequency { get; set; }
        public string PaymentMethod { get; set; }
        public DateTimeOffset NextDelieveryDate { get; set; }
        public DateTimeOffset ActivationDate { get; set; }
        public DateTimeOffset DeActivationDate { get; set; }
        public Guid ParentCustomerOrderId { get; set; }//BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
        public bool ShipNow { get; set; }
        public bool IsModified { get; set; } //BUSA - 762.



        void IArchivable<SubscriptionBrasseler>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<SubscriptionBrasseler, bool>> IArchivable<SubscriptionBrasseler>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<SubscriptionBrasseler>.Restore()
        {
            throw new NotImplementedException();
        }
    }
}
