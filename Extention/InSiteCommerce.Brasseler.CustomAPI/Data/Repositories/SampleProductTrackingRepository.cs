using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Repositories;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Repositories
{
    public class SampleProductTrackingRepository : Repository<SampleProductTracking>, IRepository<SampleProductTracking>, IDependency, IRepository
    {
    }
}
