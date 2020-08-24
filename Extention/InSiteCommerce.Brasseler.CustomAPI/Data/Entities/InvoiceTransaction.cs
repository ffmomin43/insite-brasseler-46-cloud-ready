using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("InvoiceTransaction")]
    public class InvoiceTransaction : EntityBase, IArchivable<InvoiceTransaction>
    {
        public bool PostedToInfor { get; set; }

        public string InvoiceNumber { get; set; }

        public decimal AmountPaid { get; set; }

        //public decimal Total { get; set; }

        public string CCReferenceNumber { get; set; }

        public Guid InvoiceInforTransactionId { get; set; }

        public string CustomerNumber { get; set; } //BUSA-1123 added customer number in Infor table.

        void IArchivable<InvoiceTransaction>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<InvoiceTransaction, bool>> IArchivable<InvoiceTransaction>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<InvoiceTransaction>.Restore()
        {
            throw new NotImplementedException();
        }

    }
}
