using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("PriceMatrixBrasseler")]
    public class PriceMatrixBrasseler : EntityBase, IArchivable<PriceMatrixBrasseler>
    {
        public Guid ProductId { get; set; }
        public Decimal Price1 { get; set; }
        public Decimal Price2 { get; set; }
        public Decimal Price3 { get; set; }
        public Decimal Price4 { get; set; }
        public Decimal Price5 { get; set; }
        public string PriceClass { get; set; }
        public string ProductContractCode { get; set; }
        public Guid CurrencyId { get; set; }

        void IArchivable<PriceMatrixBrasseler>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<PriceMatrixBrasseler, bool>> IArchivable<PriceMatrixBrasseler>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<PriceMatrixBrasseler>.Restore()
        {
            throw new NotImplementedException();
        }
    }
}
