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
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Customers.Services;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace InSiteCommerce.Brasseler.Services.Handlers.Account
{
    [DependencyName("AddAccountHandler_Brasseler")]
    public class AddAccountHandler_Brasseler : HandlerBase<AddAccountParameter, AddAccountResult>
    {
        protected readonly Lazy<IAuthenticationService> AuthenticationService;
        protected readonly ICartOrderProviderFactory CartOrderProviderFactory;
        protected readonly ICustomerService CustomerService;
        protected readonly Lazy<IEmailService> EmailService;
        protected readonly ISessionService SessionService;
        protected readonly Lazy<ICustomerOrderUtilities> CustomerOrderUtilities;

        CustomSettings customSettings = new CustomSettings();

        public override int Order
        {
            get
            {
                return 400;
            }
        }

        public AddAccountHandler_Brasseler(Lazy<IAuthenticationService> authenticationService, Lazy<IEmailService> emailService, ICustomerService customerService, ISessionService sessionService, ICartOrderProviderFactory cartOrderProviderFactory, Lazy<ICustomerOrderUtilities> customerOrderUtilities)
        {
            this.AuthenticationService = authenticationService;
            this.EmailService = emailService;
            this.CustomerService = customerService;
            this.SessionService = sessionService;
            this.CartOrderProviderFactory = cartOrderProviderFactory;
            this.CustomerOrderUtilities = customerOrderUtilities;
        }

        public override AddAccountResult Execute(IUnitOfWork unitOfWork, AddAccountParameter parameter, AddAccountResult result)
        {

            if (parameter.Password == "1")
            {
                bool isMigratedUser = false;
                UserProfile userdata = GetUserProfileByUsername(unitOfWork,parameter.UserName); 
                if (userdata != null)
                {
                    isMigratedUser = userdata.CustomProperties.Any(x => x.Name == "IsMigratedUser" && x.Value == "true");                     
                }

                if (isMigratedUser)
                {
                    return this.CreateErrorServiceResult<AddAccountResult>(result, result.SubCode, "IsMigratedUser");
                }
                else
                {
                    return this.CreateErrorServiceResult<AddAccountResult>(result, result.SubCode, "IsNotMigratedUser");
                }               
            }

            // brasseler password logic
            if (parameter.Password != null)
            {
                bool passvalid;
                passvalid = Regex.IsMatch(parameter.Password, @"^(?=(.*\d){1})(?=.*[a-zA-Z])(?=.*[!@#$%^&*.]).{7,12}$");
                if (!passvalid)
                    return this.CreateErrorServiceResult<AddAccountResult>(result, SubCode.AccountServicePasswordDoesNotMeetComplexity, MessageProvider.Current.ChangePasswordInfo_Password_Not_Meet_Requirements);
            }
            //BUSA-410 added if condition
            if (parameter.Properties.Count > 0)
            {
                if (parameter.Properties["IsCustomerNumberProvided"] == "1")
                {
                    bool isValidCustomer = false;

                    //change for BUSA-403 start
                    var companyNameIdentifier = customSettings.CompanyNameIdentifier;
                    //change for BUSA-403 end

                    if (parameter.Properties.Count > 0)
                    {
                        //change for BUSA-403 start
                        string CustomerNumber = companyNameIdentifier + parameter.Properties["CustomerNumber"];
                        //change for BUSA-403 end

                        string zipCode = GetZipCode(parameter.Properties["ZipCode"]);

                        isValidCustomer = IsCustomerAndZipValid(unitOfWork,CustomerNumber, zipCode);                        
                    }

                    if (isValidCustomer)
                    {
                        return this.CreateErrorServiceResult<AddAccountResult>(result, SubCode.AccountServiceAccountDoesNotExist, "Provided CustomerNumber/ZipCode is incorrect");
                    }
                }
            }

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        private bool IsCustomerAndZipValid(IUnitOfWork unitOfWork, string customerNumber, string zipCode)
        {
            if (unitOfWork is null)
            {
                throw new ArgumentNullException(nameof(unitOfWork));
            }

            if (string.IsNullOrEmpty(customerNumber))
            {
                throw new ArgumentException($"'{nameof(customerNumber)}' cannot be null or empty", nameof(customerNumber));
            }

            if (string.IsNullOrEmpty(zipCode))
            {
                throw new ArgumentException($"'{nameof(zipCode)}' cannot be null or empty", nameof(zipCode));
            }

            return unitOfWork.GetRepository<Customer>()
                                 .GetTable()
                                 .Any(cn => cn.CustomerNumber == customerNumber
                                 && GetZipCode(cn.PostalCode) == zipCode
                                 && cn.IsActive == true
                                 && cn.IsBillTo == true);
        }

        private string GetZipCode(string zipCode)
        {
            if (string.IsNullOrWhiteSpace(zipCode))
                return null;

           return  zipCode.Length <= 5 ? zipCode : zipCode.Substring(0, 5);
        }

        private UserProfile GetUserProfileByUsername(IUnitOfWork unitOfWork,
                                                     string userName) 
            => unitOfWork.GetRepository<UserProfile>()
            .GetTable()
            .SingleOrDefault(u => u.UserName == userName);
    }
}