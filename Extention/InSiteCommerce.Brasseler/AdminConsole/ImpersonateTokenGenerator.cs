using Insite.Admin.Exceptions;
using Insite.Admin.Services;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos.Interfaces;
using Insite.Data.Repositories.Interfaces;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.AdminConsole
{
    public class ImpersonateTokenGenerator : IImpersonationTokenGenerator, IDependency
    {
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IUserProfileUtilities UserProfileUtilities;

        public ImpersonateTokenGenerator(IUnitOfWorkFactory unitOfWorkFactory, IUserProfileUtilities userProfileUtilities)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.UserProfileUtilities = userProfileUtilities;
        }

        public void VerifyUserCanBeImpersonated(UserProfile userToImpersonate, Website website)
        {
            if (this.IsUserNotAllowedForWebsite(userToImpersonate, website))
                throw new ImpersonationTokenGenerationException("This user is not allowed to sign into the current website. Associate the user with the website and try again.");
            Customer billToForUser = this.GetBillToForUser(userToImpersonate, website);
            if (billToForUser == null)
                throw new ImpersonationTokenGenerationException("This user does not have an assigned customer bill to. Assign a bill to and try again.");
            if (this.IsCustomerNotAllowedForWebsite(billToForUser, website))
                throw new ImpersonationTokenGenerationException("The site is restricted and the customer assigned to this user does not have access to the site. Assign the restricted website to the customer and try again.");
        }

        private bool IsUserNotAllowedForWebsite(UserProfile userProfile, Website website)
        {
            return !this.UserProfileUtilities.IsAllowedForWebsite((IUserProfile)userProfile, (IWebsite)website);
        }

        private Customer GetBillToForUser(UserProfile userProfile, Website website)
        {
            return this.UnitOfWork.GetTypedRepository<ICustomerRepository>().GetDefaultBillTo((IWebsite)website, userProfile.Id) ?? this.UnitOfWork.GetTypedRepository<ICustomerRepository>().GetDefaultBillToFromAssignedBillTos((IWebsite)website, userProfile.Id);
        }

        private bool IsCustomerNotAllowedForWebsite(Customer billTo, Website website)
        {
            if (website.IsRestricted)
                return !billTo.Websites.Contains(website);
            return false;
        }
    }
}
