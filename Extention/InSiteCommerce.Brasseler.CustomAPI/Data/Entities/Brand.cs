using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("Brand")]
    public class Brand : EntityBase, IArchivable<Brand>
    {

        [Required(AllowEmptyStrings = false)]
        [StringLength(512)]
        public virtual string Name { get; set; }

        //[Required(AllowEmptyStrings = true)]
        [StringLength(512)]
        public virtual string Description { get; set; }

        //[Required(AllowEmptyStrings = true)]
        [StringLength(1024)]
        public virtual string Website { get; set; }

        //[Required(AllowEmptyStrings = true)]
        [StringLength(1024)]
        public virtual string ImagePath { get; set; }

        public void Archive()
        {
            throw new NotImplementedException();
        }

        public Expression<Func<Brand, bool>> Archived()
        {
            throw new NotImplementedException();
        }

        public void Restore()
        {
            throw new NotImplementedException();
        }
    }
}
