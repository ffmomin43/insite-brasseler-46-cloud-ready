using Insite.Account.Emails;
using Insite.Account.SystemSettings;
using Insite.Common.Providers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.EnumTypes;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Core.Security;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos.Interfaces;
using Insite.Data.Entities.Extensions;
using Insite.Data.Repositories.Interfaces;
using System;
using System.Dynamic;

namespace InSiteCommerce.Brasseler.Services.Handlers.Account
{
    public class AccountActivationEmail : IAccountActivationEmail, IDependency
    {


        protected readonly IUnitOfWork UnitOfWork;

        protected readonly IEmailService EmailService;

        protected readonly IAuthenticationService AuthenticationService;

        protected readonly StorefrontSecuritySettings StorefrontSecuritySettings;

        protected readonly ConsoleSecuritySettings ConsoleSecuritySettings;

        public AccountActivationEmail(IUnitOfWorkFactory unitOfWorkFactory, IEmailService emailService, IAuthenticationService authenticationService, StorefrontSecuritySettings storefrontSecuritySettings, ConsoleSecuritySettings consoleSecuritySettings)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.EmailService = emailService;
            this.AuthenticationService = authenticationService;
            this.StorefrontSecuritySettings = storefrontSecuritySettings;
            this.ConsoleSecuritySettings = consoleSecuritySettings;
        }

        public void Send(IUserProfile userProfile, string baseUrl, Guid? websiteId)
        {
            int num;
            baseUrl = baseUrl.TrimEnd(new char[] { '/' });
            SiteContext.AllowForAdmin();
            bool flag = userProfile is AdminUserProfile;
            string str = (flag ? AdminUserNameHelper.AddPrefix(userProfile.UserName) : userProfile.UserName);
            dynamic expandoObjects = new ExpandoObject();
            expandoObjects.UserName = userProfile.GetDisplayName();
            expandoObjects.UserEmail = userProfile.UserName;
            expandoObjects.ActivationUrl = string.Concat(baseUrl, this.AuthenticationService.GeneratePasswordResetUrl(str, false));
            dynamic obj = expandoObjects;
            num = (flag ? this.ConsoleSecuritySettings.EmailedPasswordLinkValidForDays : this.StorefrontSecuritySettings.EmailedPasswordLinkValidForDays);
            obj.ActivationUrlExpirationInDays = num;
            expandoObjects.ContentBaseUrl = baseUrl;
            string str1 = string.Concat((flag ? "Admin" : "Website"), "_AccountActivation");
            EmailList orCreateByName = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName(str1, "Insite Commerce Account Activation", "");
            this.EmailService.SendEmailList(orCreateByName.Id, userProfile.Email, expandoObjects, string.Empty, this.UnitOfWork, websiteId);
            if (userProfile.ActivationStatus == UserActivationStatus.EmailNotSent.ToString())
            {
                userProfile.ActivationStatus = UserActivationStatus.EmailSent.ToString();
            }
            userProfile.LastActivationEmailSentOn = new DateTimeOffset?(DateTimeProvider.Current.Now);
            this.UnitOfWork.Save();
        }

    }
}
