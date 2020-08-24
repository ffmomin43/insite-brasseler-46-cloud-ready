using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Repositories;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Repositories
{
    class RmaResponseRepository : Repository<RmaResponse>, IRepository<RmaResponse>, IDependency, IRepository
    {
    }
}
