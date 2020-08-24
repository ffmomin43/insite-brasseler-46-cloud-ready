using Insite.Common;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Caching;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Localization;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.SystemSetting.Groups.SiteConfigurations;
using Insite.Data.Entities;
using Insite.WebFramework.Templating;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Net.Mail;

namespace InSiteCommerce.Brasseler.Plugins.EmailService
{
    public class EmailService_Brasseler : Insite.Plugins.Emails.EmailService, IEmailService, IDependency
    {
        protected readonly CustomSettings CustomSettings;

        public EmailService_Brasseler(IEmailTemplateUtilities emailTemplateUtilities,
                                      IContentManagerUtilities contentManagerUtilities,
                                      IEntityTranslationService entityTranslationService,
                                      EmailsSettings emailsSettings,
                                      Lazy<IEmailTemplateRenderer> emailTemplateRenderer,
                                      Lazy<IPerRequestCacheManager> perRequestCacheManager)
            : base(emailTemplateUtilities,
                   contentManagerUtilities,
                   entityTranslationService,
                   emailsSettings,
                   emailTemplateRenderer,
                   perRequestCacheManager)
        {
            this.CustomSettings = new CustomSettings();
        }

        public override void SendEmailList(Guid emailListId, IList<string> toAddresses, ExpandoObject templateModel, string subject, IUnitOfWork unitOfWork, Guid? templateWebsiteId = null, IList<Attachment> attachments = null)
        {
            object SenderName;
            List<String> Sender = new List<String>();
            foreach (string toAddress in toAddresses)
            {
                if (RegularExpressionLibrary.IsValidEmail(toAddress))
                {
                    continue;
                }
                throw new ArgumentException(string.Concat("To address: ", toAddress, " is not a valid email address."));
            }
            EmailList emailList = this.GetEmailList(unitOfWork, emailListId, templateWebsiteId);
            if (emailList == null)
            {
                return;
            }
            //BUSA-1090 Wish list email notification (share)
            if (((IDictionary<String, Object>)templateModel).TryGetValue("SenderName", out SenderName))
            {
                ((IDictionary<String, Object>)templateModel).TryGetValue("SenderName", out SenderName);
                Sender.Add(SenderName.ToString());
                foreach (string CCAddress in Sender)
                {
                    if (RegularExpressionLibrary.IsValidEmail(CCAddress))
                    {
                        continue;
                    }
                    throw new ArgumentException(string.Concat("CC address: ", CCAddress, " is not a valid email address."));
                }
            }

            //BUSA-1090 Wish list email notification (share)
            emailList.FromAddress = CustomSettings.DefaultWishListEmailAddress;

            // add toAddresses and ccAddresses for RMA notification
            object IsRmaEmail;
            List<string> ccAddresses = new List<string>();
            if (((IDictionary<String, Object>)templateModel).TryGetValue("IsRmaEmail", out IsRmaEmail))
            {
                if (!string.IsNullOrEmpty(CustomSettings.RMA_ToAddress))
                {
                    string[] addresses = CustomSettings.RMA_ToAddress.Split(';');
                    for (int i = 0; i < addresses.Length; i++)
                    {
                        toAddresses.Add(addresses[i].Trim());
                    }
                }
                if (!string.IsNullOrEmpty(CustomSettings.RMA_CC_Address))
                {
                    string[] addresses = CustomSettings.RMA_CC_Address.Split(';');
                    for (int i = 0; i < addresses.Length; i++)
                    {
                        ccAddresses.Add(addresses[i].Trim());
                    }
                }
                if (!string.IsNullOrEmpty(CustomSettings.RMA_BCC_Address))
                {
                    string[] addresses = CustomSettings.RMA_BCC_Address.Split(';');
                    for (int i = 0; i < addresses.Length; i++)
                    {
                        Sender.Add(addresses[i].Trim());
                    }
                }
            }

            SendEmailParameter sendEmailParameter = new SendEmailParameter()
            {
                ToAddresses = toAddresses,
                CCAddresses = ccAddresses,
                Attachments = attachments,
                BccAddresses = Sender,
                FromAddress = (emailList.FromAddress.IsBlank() ? this.EmailsSettings.DefaultEmail : emailList.FromAddress),
                Subject = (subject.IsBlank() ? this.EntityTranslationService.TranslateProperty<EmailList>(emailList, (EmailList o) => o.Subject) : subject)
            };

            SendEmailParameter sendEmailParameter1 = sendEmailParameter;
            string htmlTemplate = this.GetHtmlTemplate(emailList, templateWebsiteId);
            this.ParseAndSendEmail(htmlTemplate, templateModel, sendEmailParameter1, unitOfWork);
        }
    }
}
