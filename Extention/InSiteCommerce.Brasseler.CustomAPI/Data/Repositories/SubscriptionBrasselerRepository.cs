﻿using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Repositories;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Repositories
{
    public class SubscriptionBrasselerRepository : Repository<SubscriptionBrasseler>, IRepository<SubscriptionBrasseler>, IDependency, IRepository
    {
    }
}