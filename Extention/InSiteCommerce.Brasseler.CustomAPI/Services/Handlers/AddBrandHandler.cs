using System;
using Insite.Core.Services.Handlers;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Handlers
{
    [DependencyName("AddBrandHandler")]
    public class AddBrandHandler : HandlerBase<AddBrandParameter, AddBrandResult>
    {
        public override int Order
        {
            get
            {
                return 500;
            }
        }

        public override AddBrandResult Execute(IUnitOfWork unitOfWork, AddBrandParameter parameter, AddBrandResult result)
        {
            //var brand = new Brand()
            //{
            //    Name=parameter.Name,
            //    Description=parameter.Description,
            //    Website=parameter.Website,
            //    ImagePath=parameter.ImagePath,
            //    CreatedOn=DateTime.Now,
            //    ModifiedOn=DateTime.Now
            //};
            IRepository<Brand> repository=unitOfWork.GetRepository<Brand>();
            var brand=repository.Create();
            brand.Name = parameter.Name;
            brand.Description = parameter.Description;
            brand.Website = parameter.Website;
            brand.ImagePath = parameter.ImagePath;
            brand.CreatedOn = DateTime.Now;
            brand.ModifiedOn = DateTime.Now;
            repository.Insert(brand);
            unitOfWork.Save();
            result.Brand = brand;
            //result.Brand = unitOfWork.GetRepository<Brand>().Get(brand.Id);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
