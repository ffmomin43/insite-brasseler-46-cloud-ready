using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("ProductCurrencyMappingBrasseler")]
    public class ProductCurrencyMappingBrasseler : EntityBase, IArchivable<ProductCurrencyMappingBrasseler>
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; }
        public Guid CurrencyId { get; set; }
        public Decimal BasicListPrice { get; set; }

        void IArchivable<ProductCurrencyMappingBrasseler>.Archive()
        {
            throw new NotImplementedException();
        }

        Expression<Func<ProductCurrencyMappingBrasseler, bool>> IArchivable<ProductCurrencyMappingBrasseler>.Archived()
        {
            throw new NotImplementedException();
        }

        void IArchivable<ProductCurrencyMappingBrasseler>.Restore()
        {
            throw new NotImplementedException();
        }
    }
}
