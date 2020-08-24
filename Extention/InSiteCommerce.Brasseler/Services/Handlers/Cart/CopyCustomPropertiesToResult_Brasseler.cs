using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Services.Handlers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos.Interfaces;
using Insite.Core.Interfaces.Dependency;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("CopyCustomPropertiesToResult")]
    public class CopyCustomPropertiesToResult_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        public override int Order
        {
            get
            {
                return 3400;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
           // 4.2 Code Sync
            if (parameter.Properties.ContainsKey("IsNewUser"))
            {
                if (result.GetCartResult != null && !result.GetCartResult.Properties.ContainsKey("IsNewUser"))
                    result.GetCartResult.Properties.Add("IsNewUser", "true");
            }
            else
            {
                HandlerBase.CopyCustomPropertiesToResult((EntityBase)result.GetCartResult.Cart, (IPropertiesDictionary)result, (List<string>)null);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
            
        }
    }
}
