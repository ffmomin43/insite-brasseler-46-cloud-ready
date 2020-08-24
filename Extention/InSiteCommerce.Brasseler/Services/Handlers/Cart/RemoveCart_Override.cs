using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Data.Extensions;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Dynamic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("ValidateCart")]
    public class RemoveCart_Override : HandlerBase<RemoveCartParameter, RemoveCartResult>
    {
        protected readonly Lazy<IEmailService> EmailService;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly IContentManagerUtilities ContentManagerUtilities;

        public RemoveCart_Override(IEmailTemplateUtilities emailTemplateUtilities, IHandlerFactory handlerFactory, IContentManagerUtilities contentManagerUtilities, Lazy<IEmailService> emailService)
        {
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.ContentManagerUtilities = contentManagerUtilities;
            this.EmailService = emailService;
        }

        public override int Order
        {
            get
            {
                return 600;
            }
        }

        public override RemoveCartResult Execute(IUnitOfWork unitOfWork, RemoveCartParameter parameter, RemoveCartResult result)
        {
            CustomerOrder cart = result.GetCartResult.Cart;
            if (cart.Id == Guid.Empty)
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (cart.Status == "AwaitingApproval")
            {
                cart.Status = "Void";
                this.SendOrderCancellationEmail(unitOfWork, cart); //trigger email
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            }
            if (cart.Status != "Cart" && cart.Status != "Saved" && cart.Status != "SubscriptionOrder")
                return this.CreateErrorServiceResult<RemoveCartResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        protected void SendOrderCancellationEmail(IUnitOfWork unitOfWork, CustomerOrder cart)
        {
            dynamic expandoObjects = new ExpandoObject();
            this.PopulateOrderEmailModel(expandoObjects, cart, unitOfWork);
            EmailList orCreateByName = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("OrderCancellation", "Order Cancellation");
            List<string> list = BuildEmailValues(cart.Id, unitOfWork).Split(new char[] { ',' }).ToList<string>();
            EmailList emailList = unitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName.Id);
            if (emailList != null)
            {
                SendEmailParameter sendEmailParameter = new SendEmailParameter();
                CustomSettings customSettings = new CustomSettings();
                string htmlTemplate = GetHtmlTemplate(emailList);
                sendEmailParameter.Body = this.EmailService.Value.ParseTemplate(htmlTemplate, expandoObjects);
                string defaultEmailAddress = customSettings.DefaultEmailAddress; 
                string approverEmail = SiteContext.Current.IsUserInRole("Administrator") ? SiteContext.Current.UserProfileDto.Email : !string.IsNullOrEmpty(cart.ApproverUserProfile.Email) ? cart.ApproverUserProfile.Email : defaultEmailAddress;// BUSA-625 : To Add Reject Button to order Approve page. If Admin rejects the order, then Admin email's address should be in From address.
                sendEmailParameter.Subject = emailList.Subject;
                sendEmailParameter.ToAddresses = list;
                sendEmailParameter.FromAddress = approverEmail;
                sendEmailParameter.ReplyToAddresses = new List<string>();
                sendEmailParameter.ExtendedProperties = new NameValueCollection();
                this.EmailService.Value.SendEmail(sendEmailParameter, unitOfWork);
            }
        }


        protected virtual string GetHtmlTemplate(EmailList emailList)
        {
            ContentManager contentManager = this.EmailTemplateUtilities.GetOrCreateByName(emailList.EmailTemplate.Name).ContentManager;
            return this.ContentManagerUtilities.CurrentContent(contentManager).Html;
        }

        protected void PopulateOrderEmailModel(dynamic emailModel, CustomerOrder customerOrder, IUnitOfWork unitOfWork)
        {
            emailModel.OrderNumber = customerOrder.OrderNumber;
            // BUSA-625 : To Add Reject Button to order Approve page. If Admin rejects the order, then Admin email's address should be in From address Starts.
            emailModel.FirstName = SiteContext.Current.IsUserInRole("Administrator") ? SiteContext.Current.UserProfileDto.FirstName : customerOrder.ApproverUserProfile.FirstName;
            emailModel.LastName = SiteContext.Current.IsUserInRole("Administrator") ? SiteContext.Current.UserProfileDto.LastName : customerOrder.ApproverUserProfile.LastName;
            emailModel.ApproverEmail = SiteContext.Current.IsUserInRole("Administrator") ? SiteContext.Current.UserProfileDto.Email : customerOrder.ApproverUserProfile.Email;
            // BUSA-625 : To Add Reject Button to order Approve page. If Admin rejects the order, then Admin email's address should be in From address Starts.
        }

        protected string BuildEmailValues(Guid customerOrderID, IUnitOfWork unitOfWork)
        {
            CustomerOrder customerOrder = unitOfWork.GetRepository<CustomerOrder>().Get(customerOrderID);
            string str1 = string.Empty;

            if (customerOrder.ApproverUserProfileId != null && !String.IsNullOrEmpty(customerOrder.PlacedByUserProfile.Email))
            {
                string userEmail = customerOrder.PlacedByUserProfile.Email;
                char[] chArray = new char[2] { ',', ';' };
                foreach (string possibleEmail in userEmail.Split(chArray))
                {
                    if (RegularExpressionLibrary.IsValidEmail(possibleEmail) && !str1.Contains(possibleEmail))
                    {
                        string str2 = str1;
                        string str3 = str2.Length > 0 ? "," : string.Empty;
                        string str4 = possibleEmail;
                        str1 = str2 + str3 + str4;
                    }
                }
            }
            return str1;
            //trigger email for BUSA-625 end.
        }
    }
}
