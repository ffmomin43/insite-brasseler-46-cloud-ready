using Insite.Cart.Services.Results;
using Insite.Core.Services.Handlers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Cart.Services.Parameters;
using Insite.Core.Context;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    /*
    *  Save billing, shipping and additional information to user custom property
    */
    [DependencyName("SetNewUserCustomProperties")]
    class SetNewUserCustomProperties : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        public override int Order
        {
            get
            {
                return 460;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            bool isNewUser = parameter.Properties.ContainsKey("IsNewUser");
            if (parameter.Properties.ContainsKey("IsNewUser"))
            {
                foreach (var property in parameter.Properties.Where(p => !p.Key.EqualsIgnoreCase("IsNewUser")))
                {
                    SiteContext.Current.UserProfile.SetProperty(property.Key, property.Value);
                }
                    
                parameter.Properties = new Dictionary<string, string>();
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
