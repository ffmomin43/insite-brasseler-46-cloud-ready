using Insite.Email.Services;
using System.Collections.Generic;
using System.Linq;
using Insite.Email.Services.Parameters;
using Insite.Email.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Data.Entities;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Data.Repositories.Interfaces;
using Insite.Data.Extensions;
using System.Collections.Specialized;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace InSiteCommerce.Brasseler.Plugins.EmailService
{
    public class TellAFriendService_Brasseler : TellAFriendService
    {
        protected readonly IUnitOfWorkFactory UnitOfWorkFactory;
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IEmailService EmailService;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly IContentManagerUtilities ContentManagerUtilities;
        protected CustomSettings customSettings;

        public TellAFriendService_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, IEmailService emailService, IEmailTemplateUtilities emailTemplateUtilities, IContentManagerUtilities contentManagerUtilities) : base(unitOfWorkFactory, emailService)
        {
            this.UnitOfWorkFactory = unitOfWorkFactory;
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.EmailService = emailService;
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.ContentManagerUtilities = contentManagerUtilities;
            customSettings = new CustomSettings();
        }

        public override TellAFriendResult TellAFriend(TellAFriendParameter parameter)
        {
            EmailList orCreateByName = UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName(nameof(TellAFriend), "Your Friend has Sent You a Message", "");
            EmailList emailList = UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName.Id);
            List<string> toAddressesList = new List<string>();


            SendEmailParameter sendEmailParameter = new SendEmailParameter();

            foreach (var keyValue in parameter.EmailModel)
            {
                if (keyValue.Key.ToString().ToUpper().Equals("USERSEMAIL"))
                {
                    sendEmailParameter.FromAddress = keyValue.Value.ToString();
                }
                if (keyValue.Key.ToString().ToUpper().Equals("FRIENDSEMAIL"))
                {
                    toAddressesList.Add(keyValue.Value.ToString());
                }
            }

            string htmlTemplate = GetHtmlTemplate(emailList);
            sendEmailParameter.Body = this.EmailService.ParseTemplate(htmlTemplate, parameter.EmailModel);

            sendEmailParameter.Subject = emailList.Subject;
            sendEmailParameter.BccAddresses = new List<string>();

            var emailCCAddresses = customSettings.EmailCCAddresses;
            if (!string.IsNullOrEmpty(emailCCAddresses))
            {
                sendEmailParameter.CCAddresses.Add(emailCCAddresses);
            }
            sendEmailParameter.ToAddresses = toAddressesList;
            sendEmailParameter.ReplyToAddresses = new List<string>();
            sendEmailParameter.ExtendedProperties = new NameValueCollection();

            this.EmailService.SendEmail(sendEmailParameter, this.UnitOfWork);

            return new TellAFriendResult();
        }

        protected virtual string GetHtmlTemplate(EmailList emailList)
        {
            ContentManager contentManager = this.EmailTemplateUtilities.GetOrCreateByName(emailList.EmailTemplate.Name).ContentManager;
            return this.ContentManagerUtilities.CurrentContent(contentManager).Html;
        }
    }
}