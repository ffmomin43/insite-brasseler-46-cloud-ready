using Insite.Account.Services;
using Insite.Account.Services.Parameters;
using Insite.Account.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Core.Plugins.Cart;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Services.Handlers;
using Insite.Customers.Services;
using Insite.Data.Entities;
using System;
using System.Linq;


namespace InSiteCommerce.Brasseler.Services.Handlers.Account
{
    [DependencyName("UpdateAccountHandler_Brasseler")]
    public class UpdateAccountHandler_Brasseler : HandlerBase<UpdateAccountParameter, UpdateAccountResult>
    {
        protected readonly Lazy<IAuthenticationService> AuthenticationService;
        protected readonly ICartOrderProviderFactory CartOrderProviderFactory;
        protected readonly ICustomerService CustomerService;
        protected readonly Lazy<IEmailService> EmailService;
        protected readonly ISessionService SessionService;
        protected readonly Lazy<ICustomerOrderUtilities> CustomerOrderUtilities;

        public override int Order
        {
            get
            {
                return 1250;
            }
        }

        public UpdateAccountHandler_Brasseler(Lazy<IAuthenticationService> authenticationService, Lazy<IEmailService> emailService, ICustomerService customerService, ISessionService sessionService, ICartOrderProviderFactory cartOrderProviderFactory, Lazy<ICustomerOrderUtilities> customerOrderUtilities)
        {
            this.AuthenticationService = authenticationService;
            this.EmailService = emailService;
            this.CustomerService = customerService;
            this.SessionService = sessionService;
            this.CartOrderProviderFactory = cartOrderProviderFactory;
            this.CustomerOrderUtilities = customerOrderUtilities;
        }

        public override UpdateAccountResult Execute(IUnitOfWork unitOfWork, UpdateAccountParameter parameter, UpdateAccountResult result)
        {
            UserProfile userProfile = SiteContext.Current.UserProfile;
            string defaultCardId;
            //var dCard = parametesr.GetProperty("defaultCardId", string.Empty);
            var defaultCardExists = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(x => x.Name == "defaultCardId" && x.ParentId == userProfile.Id);

            if (parameter.Properties.Count > 0 && parameter.Properties.ContainsKey("defaultCardId"))
            {
                if (defaultCardExists != null)
                {
                    if (parameter.Properties.Count > 0)
                    {
                        defaultCardId = parameter.Properties["defaultCardId"];

                        var userCustom = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(c => c.ParentId == userProfile.Id && c.Name == "defaultCardId");
                        if (userCustom != null)
                        {
                            userCustom.Value = defaultCardId;
                            unitOfWork.Save();
                        }
                    }
                }
                else
                {
                    userProfile.SetProperty("defaultCardId", parameter.Properties["defaultCardId"]);
                }
            }
            
            //BUSA-805 Default Credit Card is not getting set start
            var userLanguage = userProfile.CustomProperties.FirstOrDefault(x => x.Name == "userLanguage")?.Value ??" ";
            if (parameter.Properties.ContainsKey("userLanguage"))
            {
                if (String.IsNullOrEmpty(userLanguage) || !userLanguage.Equals(parameter.Properties["userLanguage"]))
                {
                    userProfile.SetProperty("userLanguage", parameter.Properties["userLanguage"]);
                }
            }
            else
            {
                userProfile.SetProperty("userLanguage",SiteContext.Current.Language.Id.ToString());
            }
            //BUSA-805 Default Credit Card is not getting set end
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}