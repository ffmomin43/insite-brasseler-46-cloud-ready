using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("SampleProductTracking")]
    public class SampleProductTracking : EntityBase, IArchivable<SampleProductTracking>
    {
        public Guid CustomerId { get; set; }

        public Guid? ParentCustomerId { get; set; }

        public Guid CustomerOrderId { get; set; }

        public Guid? PlacedbyUserId { get; set; }

        public string OrderNumber { get; set; }

        public Guid ProductId { get; set; }

        public string ProductNumber { get; set; }

        public decimal QtyOrdered { get; set; }

        public DateTimeOffset TenureStart { get; set; }

        public DateTimeOffset TenureEnd { get; set; }

        void IArchivable<SampleProductTracking>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<SampleProductTracking, bool>> IArchivable<SampleProductTracking>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<SampleProductTracking>.Restore()
        {
            throw new NotImplementedException();
        }

    }
}
