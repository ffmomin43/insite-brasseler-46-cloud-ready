using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Repositories;
using Insite.Data.Entities;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Repositories
{
    public class UserPaymentProfileRepository : Repository<UserPaymentProfile>, IRepository<UserPaymentProfile>, IDependency, IRepository
    {
    }
}
