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
                var userdata = unitOfWork.GetRepository<UserProfile>().GetTable().FirstOrDefault(u => u.UserName == parameter.UserName);
                if (userdata != null)
                {
                    var importUser = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(c => c.ParentId == userdata.Id && c.Name == "IsMigratedUser" && c.Value == "true");
                    if (importUser != null)
                    {
                        isMigratedUser = true;
                    }
                }
                if (isMigratedUser)
                {
                    return this.CreateErrorServiceResult<AddAccountResult>(result, result.SubCode, "IsMigratedUser");
                }
                else
                {
                    return this.CreateErrorServiceResult<AddAccountResult>(result, result.SubCode, "IsNotMigratedUser");
                }
                //return this.CreateServiceResult<AddAccountResult>(result, ResultCode.Success, result.SubCode, "IsMigratedUser");    
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
                    var isValidCustomer = 0;

                    //change for BUSA-403 start
                    var companyNameIdentifier = customSettings.CompanyNameIdentifier;
                    //change for BUSA-403 end

                    if (parameter.Properties.Count > 0)
                    {
                        //change for BUSA-403 start
                        string CustomerNumber = companyNameIdentifier + parameter.Properties["CustomerNumber"];
                        //change for BUSA-403 end

                        string ZipCode = parameter.Properties["ZipCode"];
                        ZipCode = ZipCode.Length <= 5 ? ZipCode : ZipCode.Substring(0, 5);
                        var isValidCustomers =
                            unitOfWork.GetRepository<Customer>()
                                .GetTable()
                                .Where(cn => cn.CustomerNumber == CustomerNumber)
                                .Where(zip => (zip.PostalCode.Length <= 5 ? zip.PostalCode : zip.PostalCode.Substring(0, 5)) == ZipCode)
                                .Where(a => a.IsActive == true)
                                .Where(b => b.IsBillTo == true);
                        isValidCustomer = isValidCustomers.Count();
                        if (isValidCustomer > 0)
                        {
                            parameter.Properties["ZipCode"] = isValidCustomers.FirstOrDefault().PostalCode;
                        }
                    }

                    if (isValidCustomer == 0)
                    {
                        return this.CreateErrorServiceResult<AddAccountResult>(result, SubCode.AccountServiceAccountDoesNotExist, "Provided CustomerNumber/ZipCode is incorrect");
                    }
                }
            }

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}