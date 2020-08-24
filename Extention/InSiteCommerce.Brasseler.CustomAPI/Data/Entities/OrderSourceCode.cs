using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("OrderSourceCode")]
    public class OrderSourceCode : EntityBase, IArchivable<OrderSourceCode>
    {
        public string CO { get; set; }
        public string OSCODE { get; set; }
        public string OSC000001 { get; set; }
        public string BYPASSSA { get; set; }
        public string OSGROUP { get; set; }
        public string OSGR00001 { get; set; }
        public string OSCLASS { get; set; }

        void IArchivable<OrderSourceCode>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<OrderSourceCode, bool>> IArchivable<OrderSourceCode>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<OrderSourceCode>.Restore()
        {
            throw new NotImplementedException();
        }
    }
}

