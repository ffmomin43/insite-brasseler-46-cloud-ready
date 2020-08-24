using Insite.Account.Services;
using Insite.Account.Services.Parameters;
using Insite.Account.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Interfaces.Plugins.Security;
using Insite.Core.Plugins.Cart;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Customers.Services;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using System;
using System.Linq;
using System.Dynamic;
using Insite.Account.Services.Pipelines;
using Insite.Account.Services.Pipelines.Parameters;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Data.Entities.Dtos;
using Insite.Account.Services.Pipelines.Results;

namespace InSiteCommerce.Brasseler.Services.Handlers.Account
{
    [DependencyName("AddAccountHandler_Brasseler2")]
    public class AddAccountHandler_Brasseler2 : HandlerBase<AddAccountParameter, AddAccountResult>
    {
        protected readonly IAccountPipeline AccountPipeline;
        protected readonly Lazy<IAuthenticationService> AuthenticationService;
        protected readonly ICartOrderProviderFactory CartOrderProviderFactory;
        protected readonly ICustomerService CustomerService;
        protected readonly IEmailService EmailService;
        protected readonly ISessionService SessionService;
        protected readonly Lazy<ICartPipeline> CartPipeline;

        CustomSettings customSettings = new CustomSettings();

        public override int Order
        {
            get
            {
                return 1550;

            }
        }

        public AddAccountHandler_Brasseler2(Lazy<IAuthenticationService> authenticationService, IEmailService emailService, ICustomerService customerService, ISessionService sessionService, ICartOrderProviderFactory cartOrderProviderFactory, IAccountPipeline accountPipeline, Lazy<ICartPipeline> cartPipeline)
        {
            this.AuthenticationService = authenticationService;
            this.EmailService = emailService;
            this.CustomerService = customerService;
            this.SessionService = sessionService;
            this.CartOrderProviderFactory = cartOrderProviderFactory;
            this.AccountPipeline = accountPipeline;
            this.CartPipeline = cartPipeline;
        }

        public override AddAccountResult Execute(IUnitOfWork unitOfWork, AddAccountParameter parameter, AddAccountResult result)
        {
            IDataProviderConfiguration configuration = unitOfWork.DataProvider.GetConfiguration();
            UserProfileDto userProfiledto = SiteContext.Current.UserProfileDto;
            UserProfile userProfile = unitOfWork.GetRepository<UserProfile>().Get(SiteContext.Current.UserProfileDto.Id);
            var companyNameIdentifier = customSettings.CompanyNameIdentifier;
            AssignCustomerResult assignCustomerResult = null;
            Customer billToCustomer = null;
            //BUSA-410 added if condition
            if (parameter.Properties.Count > 0)
            {
                //BUSA-1076 : start - adding current languageid in user profie wen new user getting created for email localisation 
                 userProfile.SetProperty("userLanguage", parameter.Properties["userLanguage"]);
                //BUSA-1076 : end - adding current languageid in user profie wen new user getting created for email localisation 
                if (parameter.Properties["IsCustomerNumberProvided"] == "1")
                {
                    //change for BUSA-403 start
                    string CustomerNumber = companyNameIdentifier + parameter.Properties["CustomerNumber"];
                    //change for BUSA-403 end
                    string ZipCode = parameter.Properties["ZipCode"];
                    var billToCustomers =
                       unitOfWork.GetRepository<Customer>()
                           .GetTable()
                           .Where(cn => cn.CustomerNumber == CustomerNumber)
                           .Where(zip => zip.PostalCode == ZipCode)
                           .Where(a => a.IsActive == true)
                           .Where(b => b.IsBillTo == true);
                    if (billToCustomers != null)
                        billToCustomer = billToCustomers.FirstOrDefault();
                    else
                        return result;


                    var shipToCustomers =
                        unitOfWork.GetRepository<Customer>()
                            .GetTable()
                            .Where(cn => cn.CustomerNumber == CustomerNumber)
                            .Where(a => a.IsActive == true)
                            .Where(b => b.IsShipTo == true)
                            .Where(c => c.IsBillTo != c.IsShipTo);

                    userProfile.Customers.Clear();

                    assignCustomerResult = this.AccountPipeline.AssignCustomer(new AssignCustomerParameter(userProfile, billToCustomer));
                    //BUSA-595 start : Buyer 3 added dynamically to an existing Brasseler customer request
                    this.AccountPipeline.SetRole(new SetRoleParameter(userProfile, "Buyer3"));
                    //BUSA-595 end : Buyer 3 added dynamically to an existing Brasseler customer request

                    result.Properties.Add("ShipToCount", shipToCustomers.Count().ToString());

                    CustomerOrder cartOrder = this.CartOrderProviderFactory.GetCartOrderProvider().GetCartOrder();
                    if (cartOrder != null)
                    {
                        cartOrder.InitiatedByUserProfile = userProfile;
                        cartOrder.PlacedByUserProfile = userProfile;
                        cartOrder.PlacedByUserName = userProfile.UserName;
                        cartOrder.Customer = billToCustomer;

                        ICartPipeline cartPipeline1 = this.CartPipeline.Value;
                        SetBillToParameter setBillToParameter = new SetBillToParameter();
                        setBillToParameter.BillTo = cartOrder.Customer;
                        setBillToParameter.Cart = cartOrder;
                        cartPipeline1.SetBillTo(setBillToParameter);
                        cartOrder.ShipTo = billToCustomer;

                        ICartPipeline cartPipeline2 = this.CartPipeline.Value;
                        SetShipToParameter setShipToParameter = new SetShipToParameter();
                        setShipToParameter.Cart = cartOrder;
                        setShipToParameter.ShipTo = cartOrder.ShipTo;
                        cartPipeline2.SetShipTo(setShipToParameter);
                    }

                    //BUSA-453 change starts, sends an email if a new user is created with existing customer number
                    dynamic emailModel = new ExpandoObject();
                    emailModel.CustomerNumber = CustomerNumber;
                    emailModel.UserEmail = userProfile.Email;
                    emailModel.FirstName = userProfile.FirstName;
                    emailModel.LastName = userProfile.LastName;
                    emailModel.Address1 = billToCustomer.Address1;
                    emailModel.Address2 = billToCustomer.Address2;
                    emailModel.Address3 = billToCustomer.Address3;
                    emailModel.Phone = billToCustomer.Phone;
                    emailModel.City = billToCustomer.City;
                    emailModel.State = billToCustomer.State.Name;
                    emailModel.PostalCode = billToCustomer.PostalCode;
                    emailModel.Country = billToCustomer.Country.Name;

                    var emailTo = customSettings.NewUserWithExistingCustomerEmailInfoTo;
                    //unitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("NewUserWithExistingCustomerEmailInfoTo", SiteContext.Current.Website.Id);
                    var emailList = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("NewUserEmailForExistingCustomer", "New User Email For Existing Customer");
                    if (emailTo != null && !string.IsNullOrEmpty(emailTo))
                        EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject, unitOfWork);
                    //BUSA-453 change end
                }

                else if (parameter.Properties["IsCustomerNumberProvided"] == "0")
                {
                    string guestCustomerNumber = customSettings.Brasseler_GuestCustomerNumber;

                    userProfile.Customers.Clear();

                    var billToCustomers =
                       unitOfWork.GetRepository<Customer>()
                           .GetTable()
                           .Where(cn => cn.CustomerNumber == companyNameIdentifier + guestCustomerNumber);
                    if (billToCustomers != null)
                        billToCustomer = billToCustomers.FirstOrDefault(); // Appending Company Number at prefix.
                    assignCustomerResult = this.AccountPipeline.AssignCustomer(new AssignCustomerParameter(userProfile, billToCustomer));

                    CustomerOrder cartOrder = this.CartOrderProviderFactory.GetCartOrderProvider().GetCartOrder();
                    if (cartOrder != null)
                    {
                        cartOrder.InitiatedByUserProfile = userProfile;
                        cartOrder.PlacedByUserProfile = userProfile;
                        cartOrder.PlacedByUserName = userProfile.UserName;
                        cartOrder.Customer = billToCustomer;

                        ICartPipeline cartPipeline1 = this.CartPipeline.Value;
                        SetBillToParameter setBilltoParameter = new SetBillToParameter();
                        setBilltoParameter.BillTo = cartOrder.Customer;
                        setBilltoParameter.Cart = cartOrder;
                        cartPipeline1.SetBillTo(setBilltoParameter);
                        cartOrder.ShipTo = billToCustomer;

                        ICartPipeline cartPipeline2 = this.CartPipeline.Value;
                        SetShipToParameter setShipToParameter = new SetShipToParameter();
                        setShipToParameter.ShipTo = cartOrder.ShipTo;
                        setShipToParameter.Cart = cartOrder;
                        cartPipeline2.SetShipTo(setShipToParameter);
                    }
                }

                unitOfWork.Save();
                unitOfWork.DataProvider.SetConfiguration(configuration);
                AddSessionResult addSessionResult = this.SessionService.AddSession(new AddSessionParameter(parameter.UserName, parameter.Password));
                if (addSessionResult.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<AddAccountResult>(result, addSessionResult.SubCode, addSessionResult.Message);

                if (assignCustomerResult.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<AddAccountResult>(result, assignCustomerResult.SubCode, assignCustomerResult.Message);
                result.BillTo = billToCustomer;
                result.ShipTo = billToCustomer;
                //Removed properties to avoid Unauthorized attempt issue.
                parameter.Properties.Remove("IsCustomerNumberProvided");
                parameter.Properties.Remove("CustomerNumber");
                parameter.Properties.Remove("ZipCode");
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}