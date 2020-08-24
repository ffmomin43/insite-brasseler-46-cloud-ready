using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("InvoiceInforTransaction")]
    public class InvoiceInforTransaction : EntityBase, IArchivable<InvoiceInforTransaction>
    {
        public bool PostedToInfor { get; set; }

        public string InvoiceNumber { get; set; }

        public string CCMaskedCard { get; set; }

        public string CardType { get; set; }

        public string AuthCode { get; set; }

        public string CCReferenceNumber { get; set; }

        public string InforMessage { get; set; }

        public Guid TransactionId { get; set; }

        public string CustomerNumber { get; set; } //BUSA-1123 added customer number in Infor table.

        void IArchivable<InvoiceInforTransaction>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<InvoiceInforTransaction, bool>> IArchivable<InvoiceInforTransaction>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<InvoiceInforTransaction>.Restore()
        {
            throw new NotImplementedException();
        }

    }
}
