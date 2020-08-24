using Insite.Core.Interfaces.Dependency;
using Insite.Core.WebApi.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers.Interfaces
{
    //BUSA-1122 updating existing payment profile
    public interface IPatchUserPaymentProfileMapper : IWebApiMapper<UserPaymentProfileModel, PatchUserPaymentProfileParameter, PatchUserPaymentProfileResult, UserPaymentProfileModel>, ISingletonLifetime, IDependency
    {
    }

}
