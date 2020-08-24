using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Repositories;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Repositories
{
    public class PriceMatrixBrasselerRepository : Repository<PriceMatrixBrasseler>, IRepository<PriceMatrixBrasseler>, IDependency, IRepository
    {
    }
}
