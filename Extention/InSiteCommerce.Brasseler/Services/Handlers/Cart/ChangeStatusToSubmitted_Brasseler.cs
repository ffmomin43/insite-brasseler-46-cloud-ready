using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common;
using Insite.Common.Dependencies;
using Insite.Common.Extensions;
using Insite.Common.Logging;
using Insite.Common.Providers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Localization;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Utilities;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.SiteConfigurations;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Data.Extensions;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Dynamic;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("ChangeStatusToAwaitingApproval_Brasseler")]
    public class ChangeStatusToAwaitingApproval_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly Lazy<ICookieManager> cookieManager;
        protected readonly ICurrencyFormatProvider CurrencyFormatProvider;
        private readonly Lazy<ICustomerOrderUtilities> CustomerOrderUtilities;
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly IContentManagerUtilities ContentManagerUtilities;
        protected readonly IEmailService EmailService;
        protected CustomSettings customSettings;
        protected EmailsSettings EmailsSettings;
        protected readonly IOrderLineUtilities OrderLineUtilities;
        protected readonly Lazy<ITranslationLocalizer> TranslationLocalizer;

        public ChangeStatusToAwaitingApproval_Brasseler(Lazy<ICookieManager> cookieManager, ICurrencyFormatProvider currencyFormatProvider, Lazy<ICustomerOrderUtilities> customerOrderUtilities, IUnitOfWorkFactory unitOfWorkFactory, IContentManagerUtilities contentManagerUtilities, IEmailService emailService, EmailsSettings emailsSettings, IEmailTemplateUtilities emailTemplateUtilities, IOrderLineUtilities OrderLineUtilities, Lazy<ITranslationLocalizer> translationLocalizer)
        {
            this.cookieManager = cookieManager;
            this.CurrencyFormatProvider = currencyFormatProvider;
            this.CustomerOrderUtilities = customerOrderUtilities;
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.ContentManagerUtilities = contentManagerUtilities;
            this.EmailService = emailService;
            customSettings = new CustomSettings();
            this.EmailsSettings = emailsSettings;
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.OrderLineUtilities = OrderLineUtilities;
            this.TranslationLocalizer = translationLocalizer;
        }

        public override int Order
        {
            get
            {
                return 1650;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("AwaitingApproval"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            CustomerOrder cart = result.GetCartResult.Cart;

            try
            {
                if (parameter.Status.EqualsIgnoreCase("AwaitingApproval") && result.GetCartResult.Cart != null)
                {
                    CustomerOrder order = result.GetCartResult.Cart;
                    string approverEmail = string.IsNullOrEmpty(order.ApproverUserProfile.Email) ? "" : order.ApproverUserProfile.Email;
                    UserProfileDto userProfile = SiteContext.Current.UserProfileDto;
                    dynamic emailModel = new ExpandoObject();
                    emailModel.OrderNumber = order.OrderNumber;
                    emailModel.Name = order.PlacedByUserName;
                    emailModel.Approver = order.ApproverUserProfile.FirstName;
                    emailModel.Reason = order.ApproverMessage;
                    emailModel.totalCost = order.ShippingCharges;
                    DateTime date = order.OrderDate.Date;
                    emailModel.OrderDate = date.ToShortDateString();
                    emailModel.CustomerPO = order.CustomerPO;
                    emailModel.OrderLines = new List<ExpandoObject>();
                    foreach (OrderLine orderLine in order.OrderLines)
                    {
                        dynamic expandoObjects = new ExpandoObject();
                        expandoObjects.ProductNumber = orderLine.Product.ErpNumber;
                        expandoObjects.Description = orderLine.Description;
                        expandoObjects.QtyOrdered = decimal.Round(orderLine.QtyOrdered, 2);
                        expandoObjects.QtyOrderedDisplay = expandoObjects.QtyOrdered.ToString("0.##");
                        expandoObjects.UnitNetPrice = orderLine.UnitNetPrice;
                        expandoObjects.UnitNetPriceDisplay = this.CurrencyFormatProvider.GetString(orderLine.UnitNetPrice, order.Currency);
                        expandoObjects.ExtendedUnitNetPrice = this.OrderLineUtilities.GetTotalNetPrice(orderLine);
                        dynamic currency = expandoObjects;
                        ICurrencyFormatProvider currencyFormatProvider = this.CurrencyFormatProvider;
                        currency.ExtendedUnitNetPriceDisplay = currencyFormatProvider.GetString(expandoObjects.ExtendedUnitNetPrice, order.Currency);
                        emailModel.OrderLines.Add(expandoObjects);
                    }
                    emailModel.Shipping = result.GetCartResult.ShippingAndHandling;
                    emailModel.SubTotal = result.GetCartResult.OrderSubTotal;
                    emailModel.Tax = result.GetCartResult.TotalTax;
                    emailModel.OrderTotal = result.GetCartResult.OrderGrandTotal;
                    emailModel.CustomerNumber = order.CustomerNumber;
                    emailModel.BTCompanyName = order.BTCompanyName;
                    emailModel.BTAddress1 = order.BTAddress1;
                    emailModel.BTAddress2 = order.BTAddress2;
                    emailModel.BTAddress3 = order.BTAddress3;
                    emailModel.BTCity = order.BTCity;
                    emailModel.BTState = order.BTState;
                    emailModel.BTPostalCode = order.BTPostalCode;
                    emailModel.STCompanyName = order.STCompanyName;
                    emailModel.STAddress1 = order.STAddress1;
                    emailModel.STAddress2 = order.STAddress2;
                    emailModel.STAddress3 = order.STAddress3;
                    emailModel.STCity = order.STCity;
                    emailModel.STState = order.STState;
                    emailModel.STPostalCode = order.STPostalCode;
                    emailModel.BTDisplayName = order.BTFirstName + " " + order.BTLastName;
                    emailModel.STDisplayName = order.STFirstName + " " + order.STLastName;
                    emailModel.BTFirstName = order.BTFirstName;
                    emailModel.BTLastName = order.BTLastName;
                    emailModel.STFirstName = order.STFirstName;
                    emailModel.STLastName = order.STLastName;
                    if (order.ShipVia != null && order.ShipVia.Carrier != null)
                    {
                        emailModel.ShipMethod = order.ShipVia.Description;
                    }
                    else
                    {
                        emailModel.ShipMethod = string.Empty;
                    }
                    emailModel.Notes = order.Notes;
                    emailModel.Handling = order.HandlingCharges;
                    emailModel.HandlingDisplay = this.CurrencyFormatProvider.GetString(order.HandlingCharges, order.Currency);
                    emailModel.OrderSubTotalDisplay = this.CurrencyFormatProvider.GetString(result.GetCartResult.OrderSubTotal, order.Currency);
                    emailModel.OrderGrandTotalDisplay = this.CurrencyFormatProvider.GetString(result.GetCartResult.OrderGrandTotal, order.Currency);
                    emailModel.OrderTotalDueDisplay = this.CurrencyFormatProvider.GetString(result.GetCartResult.OrderGrandTotal, order.Currency);
                    emailModel.CustomerOrderTaxes = new List<ExpandoObject>();
                    foreach (CustomerOrderTax customerOrderTax in
                        from o in order.CustomerOrderTaxes
                        orderby o.SortOrder
                        select o)
                    {
                        dynamic expandoObjects = new ExpandoObject();
                        expandoObjects.TaxCode = this.TranslationLocalizer.Value.TranslateLabel(customerOrderTax.TaxCode);
                        expandoObjects.TaxDescription = this.TranslationLocalizer.Value.TranslateLabel(customerOrderTax.TaxDescription);
                        expandoObjects.TaxRate = customerOrderTax.TaxRate;
                        expandoObjects.TaxAmount = customerOrderTax.TaxAmount;
                        expandoObjects.TaxAmountDisplay = this.CurrencyFormatProvider.GetString(customerOrderTax.TaxAmount, order.Currency);
                        expandoObjects.SortOrder = customerOrderTax.SortOrder;
                        emailModel.CustomerOrderTaxes.Add(expandoObjects);
                    }
                    emailModel.CreditCardWillBeCharged = result.GetCartResult.OrderGrandTotal;
                    emailModel.TotalTaxDisplay = this.CurrencyFormatProvider.GetString(result.GetCartResult.TotalTax, order.Currency);

                    var promotionProductDiscountTotal = this.CustomerOrderUtilities.Value.GetPromotionProductDiscountTotal(order);
                    emailModel.PromotionProductDiscountTotal = promotionProductDiscountTotal;
                    emailModel.PromotionProductDiscountTotalDisplay = this.CurrencyFormatProvider.GetString(promotionProductDiscountTotal, order.Currency);

                    var promotionOrderDiscountTotal = this.CustomerOrderUtilities.Value.GetPromotionOrderDiscountTotal(order);
                    emailModel.PromotionOrderDiscountTotal = promotionOrderDiscountTotal;
                    emailModel.PromotionOrderDiscountTotalDisplay = this.CurrencyFormatProvider.GetString(promotionOrderDiscountTotal, order.Currency);

                    var promotionShippingDiscountTotal = this.CustomerOrderUtilities.Value.GetPromotionShippingDiscountTotal(order);
                    emailModel.PromotionShippingDiscountTotal = promotionShippingDiscountTotal;
                    emailModel.PromotionShippingDiscountTotalDisplay = this.CurrencyFormatProvider.GetString(promotionShippingDiscountTotal, order.Currency);

                    var giftCardTotal = this.CustomerOrderUtilities.Value.GetGiftCardTotal(order);
                    emailModel.GiftCardTotal = giftCardTotal;
                    emailModel.GiftCardTotalDisplay = this.CurrencyFormatProvider.GetString(giftCardTotal, order.Currency);
                    //changes for BUSA-401 starts
                    //emailModel.WebsiteUrl = order.Website.DomainName;
                    //changes for BUSA-401 ends

                    emailModel.WebsiteUrl = HttpContext.Current.Request.ActualUrl().GetLeftPart(UriPartial.Authority);//BUSA-552 : Incorrect URL in Order Approve email template

                    var emailList = this.GetOrCreateEmailList("OrderApprove", "You have a new order to approve");
                    //this.EmailService.SendEmailList(emailList.Id, approverEmail, emailModel, string.Format("{0} {1}", emailList.Subject, order.OrderNumber), this.UnitOfWork);
                    //BUSA-489 - commented the above line and added the below block

                    //BUSA - 489 - start
                    emailList = unitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == emailList.Id);
                    if (emailList != null)
                    {
                        SendEmailParameter sendEmailParameter = new SendEmailParameter();
                        string htmlTemplate = GetHtmlTemplate(emailList);
                        sendEmailParameter.Body = this.EmailService.ParseTemplate(htmlTemplate, emailModel);

                        sendEmailParameter.Subject = string.Format("{0} {1}", emailList.Subject, order.OrderNumber);
                        sendEmailParameter.ToAddresses.Add(approverEmail);
                        sendEmailParameter.BccAddresses = new List<string>();

                        var emailCCAddresses = customSettings.EmailCCAddresses;
                        if (!string.IsNullOrEmpty(emailCCAddresses))
                        {
                            sendEmailParameter.CCAddresses.Add(emailCCAddresses);
                        }
                        string defaultEmailAddress = customSettings.DefaultEmailAddress;
                        sendEmailParameter.FromAddress = (emailList.FromAddress.IsBlank() ? defaultEmailAddress : emailList.FromAddress);
                        //Start BUSA - 685 :Create an ability to resend an email for Order Approve
                        var emailCCAddressOfFrom = userProfile.Email;
                        var emailCCAddressOfSupport = sendEmailParameter.FromAddress;
                        if (!string.IsNullOrEmpty(emailCCAddressOfFrom))
                        {
                            sendEmailParameter.CCAddresses.Add(emailCCAddressOfFrom);
                        }
                        if (!string.IsNullOrEmpty(emailCCAddressOfSupport))
                        {
                            sendEmailParameter.CCAddresses.Add(emailCCAddressOfSupport);
                        }
                        //Start BUSA - 685 :Create an ability to resend an email for Order Approve
                        sendEmailParameter.ReplyToAddresses = new List<string>();
                        sendEmailParameter.ExtendedProperties = new NameValueCollection();
                        SendEmail(sendEmailParameter, unitOfWork);
                    }
                    //BUSA - 489 - end
                }
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Error((object)("There was a problem executing UpdateCartResult" + (object)ex.InnerException), ex.InnerException, (string)null, (object)null);
                throw ex;
            }
            return NextHandler.Execute(unitOfWork, parameter, result);
        }

        public void SendEmail(SendEmailParameter parameter, IUnitOfWork unitOfWork)
        {
            foreach (string toAddress in (IEnumerable<string>)parameter.ToAddresses)
            {
                if (!RegularExpressionLibrary.IsValidEmail(toAddress))
                    throw new ArgumentException("The value '{email}' in the ToAddresses collection is not a valid email address".FormatWith((object)new
                    {
                        email = toAddress
                    }, (IFormatProvider)null));
            }
            if (!RegularExpressionLibrary.IsValidEmail(parameter.FromAddress))
                throw new ArgumentException("The value '{email}' for the FromAddress is not a valid email address".FormatWith((object)new
                {
                    email = parameter.FromAddress
                }, (IFormatProvider)null));
            foreach (string replyToAddress in (IEnumerable<string>)parameter.ReplyToAddresses)
            {
                if (!RegularExpressionLibrary.IsValidEmail(replyToAddress))
                    throw new ArgumentException("The value '{email}' in the ReplyToAddresses collection is not a valid email address".FormatWith((object)new
                    {
                        email = replyToAddress
                    }, (IFormatProvider)null));
            }
            foreach (string ccAddress in (IEnumerable<string>)parameter.CCAddresses)
            {
                if (!RegularExpressionLibrary.IsValidEmail(ccAddress))
                    throw new ArgumentException("The value '{email}' in the CCAddresses collection is not a valid email address".FormatWith((object)new
                    {
                        email = ccAddress
                    }, (IFormatProvider)null));
            }
            foreach (string bccAddress in (IEnumerable<string>)parameter.BccAddresses)
            {
                if (!RegularExpressionLibrary.IsValidEmail(bccAddress))
                    throw new ArgumentException("The value '{email}' in the BccAddresses collection is not a valid email address".FormatWith((object)new
                    {
                        email = bccAddress
                    }, (IFormatProvider)null));
            }
            IRepository<EmailMessage> repository = unitOfWork.GetRepository<EmailMessage>();
            EmailMessage emailMessage = repository.Create();
            emailMessage.Body = parameter.Body;
            emailMessage.Subject = parameter.Subject;
            repository.Insert(emailMessage);
            foreach (string toAddress in (IEnumerable<string>)parameter.ToAddresses)
                emailMessage.EmailMessageAddresses.Add(new EmailMessageAddress()
                {
                    EmailAddress = toAddress,
                    Type = EmailMessageAddressType.To.ToString()
                });
            emailMessage.EmailMessageAddresses.Add(new EmailMessageAddress()
            {
                EmailAddress = parameter.FromAddress,
                Type = EmailMessageAddressType.From.ToString()
            });
            foreach (string ccAddress in (IEnumerable<string>)parameter.CCAddresses)
                emailMessage.EmailMessageAddresses.Add(new EmailMessageAddress()
                {
                    EmailAddress = ccAddress,
                    Type = EmailMessageAddressType.CC.ToString()
                });
            foreach (string bccAddress in (IEnumerable<string>)parameter.BccAddresses)
                emailMessage.EmailMessageAddresses.Add(new EmailMessageAddress()
                {
                    EmailAddress = bccAddress,
                    Type = EmailMessageAddressType.BCC.ToString()
                });
            foreach (string replyToAddress in (IEnumerable<string>)parameter.ReplyToAddresses)
                emailMessage.EmailMessageAddresses.Add(new EmailMessageAddress()
                {
                    EmailAddress = replyToAddress,
                    Type = EmailMessageAddressType.ReplyTo.ToString()
                });
            EmailMessageDeliveryAttempt emailMessageDeliveryAttempt = new EmailMessageDeliveryAttempt();
            emailMessage.EmailMessageDeliveryAttempts.Add(emailMessageDeliveryAttempt);
            unitOfWork.Save();
            string emailTestAddress = EmailsSettings.TestEmail;
            Task.Factory.StartNew((Action)(() => this.DoActualSend(emailMessage, emailMessageDeliveryAttempt, emailTestAddress)));
        }

        protected void DoActualSend(EmailMessage emailMessage, EmailMessageDeliveryAttempt currentDeliveryAttempt, string emailTestAddress)
        {
            IUnitOfWork unitOfWork = DependencyLocator.Current.GetInstance<IUnitOfWorkFactory>().GetUnitOfWork();
            unitOfWork.Reattach<EmailMessageDeliveryAttempt>(currentDeliveryAttempt);
            bool flag = false;
            MailMessage mailMessage = this.ConvertEmailMessageToMailMessage(emailMessage);
            if (!emailTestAddress.IsBlank())
            {
                mailMessage.To.Clear();
                mailMessage.To.Add(emailTestAddress);
            }
            try
            {
                SmtpClient smtpClient = new SmtpClient();
                smtpClient.Timeout = 90000;
                smtpClient.Send(mailMessage);
                flag = true;
            }
            catch (SmtpFailedRecipientsException ex)
            {
                for (int i = 0; i < ex.InnerExceptions.Length; i++)
                {
                    SmtpStatusCode status = ex.InnerExceptions[i].StatusCode;
                    if (status == SmtpStatusCode.MailboxBusy || status == SmtpStatusCode.MailboxUnavailable || status == SmtpStatusCode.ServiceClosingTransmissionChannel
                         || status == SmtpStatusCode.ServiceNotAvailable || status == SmtpStatusCode.TransactionFailed)
                    {
                        System.Threading.Thread.Sleep(10000);
                        new SmtpClient().Send(mailMessage);
                    }
                    else
                    {
                        currentDeliveryAttempt.ErrorMessage = ex.ToString();
                        LogHelper.For((object)this).Error((object)("There was a problem sending the email " + (object)emailMessage.Id), ex, (string)null, (object)null);
                    }
                }
            }
            catch (Exception ex)
            {
                currentDeliveryAttempt.ErrorMessage = ex.ToString();
                LogHelper.For((object)this).Error((object)("There was a problem sending the email " + (object)emailMessage.Id), ex, (string)null, (object)null);
            }
            finally
            {
                mailMessage.Dispose();
            }
            if (flag)
                currentDeliveryAttempt.DeliveredDate = new DateTimeOffset?((DateTimeOffset)DateTimeProvider.Current.Now);
            unitOfWork.Save();
        }
        protected virtual MailMessage ConvertEmailMessageToMailMessage(EmailMessage emailMessage)
        {
            ICollection<EmailMessageAddress> messageAddresses1 = emailMessage.EmailMessageAddresses;
            Func<EmailMessageAddress, bool> func1 = (Func<EmailMessageAddress, bool>)(o => o.Type != EmailMessageAddressType.From.ToString());
            Func<EmailMessageAddress, bool> predicate1;
            if (messageAddresses1.All<EmailMessageAddress>(func1))
                throw new ArgumentException("There were not any EmailMessageAddresses with a From type.");
            ICollection<EmailMessageAddress> messageAddresses2 = emailMessage.EmailMessageAddresses;
            Func<EmailMessageAddress, bool> func2 = (Func<EmailMessageAddress, bool>)(o => o.Type == EmailMessageAddressType.From.ToString());
            Func<EmailMessageAddress, bool> predicate2;
            if (messageAddresses2.Count<EmailMessageAddress>(func2) > 1)
                throw new ArgumentException("There were multiple EmailMessageAddresses with a From type.");
            ICollection<EmailMessageAddress> messageAddresses3 = emailMessage.EmailMessageAddresses;
            Func<EmailMessageAddress, bool> func3 = (Func<EmailMessageAddress, bool>)(o => o.Type != EmailMessageAddressType.To.ToString());
            Func<EmailMessageAddress, bool> predicate3;
            if (messageAddresses3.All<EmailMessageAddress>(func3))
                throw new ArgumentException("There were not any EmailMessageAddresses with a To type.");
            foreach (EmailMessageAddress emailMessageAddress in (IEnumerable<EmailMessageAddress>)emailMessage.EmailMessageAddresses)
            {
                if (!RegularExpressionLibrary.IsValidEmail(emailMessageAddress.EmailAddress))
                    throw new ArgumentException("The value '{email}' on the EmailMessage with type {type} is not a valid email address".FormatWith((object)new
                    {
                        email = emailMessageAddress.EmailAddress,
                        type = emailMessageAddress.Type
                    }, (IFormatProvider)null));
            }
            MailMessage mailMessage = new MailMessage();
            mailMessage.Body = emailMessage.Body;
            mailMessage.Subject = emailMessage.Subject;
            List<string> source = new List<string>()
      {
        "<html",
        "<body",
        "<div",
        "<a"
      };
            mailMessage.IsBodyHtml = source.Any<string>((Func<string, bool>)(s => mailMessage.Body.Contains(s)));
            EmailMessageAddress emailMessageAddress1 = emailMessage.EmailMessageAddresses.FirstOrDefault<EmailMessageAddress>((Func<EmailMessageAddress, bool>)(o => o.Type == EmailMessageAddressType.From.ToString()));
            if (emailMessageAddress1 != null)
                mailMessage.From = new MailAddress(emailMessageAddress1.EmailAddress);
            foreach (EmailMessageAddress emailMessageAddress2 in emailMessage.EmailMessageAddresses.Where<EmailMessageAddress>((Func<EmailMessageAddress, bool>)(o => o.Type == EmailMessageAddressType.To.ToString())))
                mailMessage.To.Add(emailMessageAddress2.EmailAddress);
            foreach (EmailMessageAddress emailMessageAddress2 in emailMessage.EmailMessageAddresses.Where<EmailMessageAddress>((Func<EmailMessageAddress, bool>)(o => o.Type == EmailMessageAddressType.BCC.ToString())))
                mailMessage.Bcc.Add(emailMessageAddress2.EmailAddress);
            foreach (EmailMessageAddress emailMessageAddress2 in emailMessage.EmailMessageAddresses.Where<EmailMessageAddress>((Func<EmailMessageAddress, bool>)(o => o.Type == EmailMessageAddressType.CC.ToString())))
                mailMessage.CC.Add(emailMessageAddress2.EmailAddress);
            foreach (EmailMessageAddress emailMessageAddress2 in emailMessage.EmailMessageAddresses.Where<EmailMessageAddress>((Func<EmailMessageAddress, bool>)(o => o.Type == EmailMessageAddressType.ReplyTo.ToString())))
                mailMessage.ReplyToList.Add(emailMessageAddress2.EmailAddress);
            return mailMessage;
        }
        //End BUSA - 685 :Create an ability to resend an email for Order Approve
        //BUSA - 489 - start
        protected virtual string GetHtmlTemplate(EmailList emailList)
        {
            ContentManager contentManager = this.EmailTemplateUtilities.GetOrCreateByName(emailList.EmailTemplate.Name).ContentManager;
            return this.ContentManagerUtilities.CurrentContent(contentManager).Html;
        }
        //BUSA - 489 - end

        protected virtual EmailList GetOrCreateEmailList(string name, string defaultSubject)
        {
            IRepository<EmailList> repository = this.UnitOfWork.GetRepository<EmailList>();
            EmailList inserted = repository.GetTable().Expand<EmailList, ContentManager>((Expression<Func<EmailList, ContentManager>>)(o => o.EmailTemplate.ContentManager)).FirstOrDefault<EmailList>((Expression<Func<EmailList, bool>>)(o => o.Name == name));
            if (inserted == null)
            {
                inserted = new EmailList()
                {
                    Name = name,
                    Subject = defaultSubject,
                    EmailTemplate = new EmailTemplate()
                    {
                        Name = name,
                        ContentManager = new ContentManager()
                        {
                            Name = "EmailTemplate"
                        }
                    }
                };
                repository.Insert(inserted);
                this.UnitOfWork.Save();
            }
            return inserted;
        }
    }
}
