using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.Emails;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.SiteConfigurations;
using Insite.Data.Entities;
using Insite.Data.Extensions;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Dynamic;
using System.Globalization;
using System.Linq;
//UpdateCartSubmitHandler_BrasselerOrderEmail:SendOrderConfirmationEmail
namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("SendConfirmationEmail")]
    public class SendConfirmationEmail_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        string insideRepEmail = string.Empty;
        private readonly Lazy<IBuildEmailValues> buildEmailValues;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly Lazy<IEmailService> EmailService;
        protected readonly IContentManagerUtilities ContentManagerUtilities;
        protected CustomSettings customSettings;
        protected EmailsSettings EmailsSettings;
        public override int Order
        {
            get
            {
                return 3199;
            }
        }

        public SendConfirmationEmail_Brasseler(Lazy<IBuildEmailValues> buildEmailValues, Lazy<IEmailService> emailService, IEmailTemplateUtilities emailTemplateUtilities, IContentManagerUtilities contentManagerUtilities, EmailsSettings emailsSettings)
        {
            this.buildEmailValues = buildEmailValues;
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.EmailService = emailService;
            this.ContentManagerUtilities = contentManagerUtilities;
            this.EmailsSettings = emailsSettings;
            customSettings = new CustomSettings();
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);

            //BUSA- 463 Subscription : Send Auto SmartSupply Order Email - starts
            // CustomerOrder customerOrder= result.GetCartResult.Cart.
            var isExistingOrder = unitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().Where(x => x.CustomerOrderId == result.GetCartResult.Cart.Id).Count();
            this.PopulateOrderEmailModel(result.ConfirmationEmailModel, result.GetCartResult.Cart, unitOfWork);
            EmailList orCreateByName = null;
            if (isExistingOrder > 0)
            {
                orCreateByName = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyOrderPlaced", "SmartSupply Order Confirmation");
            }
            else
            {
                orCreateByName = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("OrderConfirmation", "Brasseler Order Confirmation");
            }
            //BUSA- 463 Subscription : Send Auto SmartSupply Order Email -ends

            //List<string> list = this.BuildEmailValues.Value.BuildOrderEmailToList(customerOrder.Id).Split(new char[] { ',' }).ToList<string>();

            //BUSA 590 : W04593 -Single Order confirmation email is triggered to customer and inside sales rep.
            List<string> list = BuildEmailValuesWithoutSalesRep(result.GetCartResult.Cart.Id, unitOfWork).Split(new char[] { ',' }).ToList<string>();

            //BUSA - 829 : Email To Approver On approval
            //string ApproverEmailId = customerOrder.ModifiedBy;
            string userName = result.GetCartResult.Cart.ModifiedBy;
            var userProfile = unitOfWork.GetRepository<UserProfile>().GetTable().Where(x => x.UserName == userName);
            string approverEmail = string.Empty;
            if (userProfile != null)
            {
                approverEmail = userProfile.FirstOrDefault().Email;
                list.Add(approverEmail);
            }
            //BUSA - 829 : Email To Approver On approval

            //BUSA - 489 - start
            EmailList emailList = unitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName.Id);
            if (emailList != null)
            {
                SendEmailParameter sendEmailParameter = new SendEmailParameter();
                string htmlTemplate = GetHtmlTemplate(emailList);
                sendEmailParameter.Body = this.EmailService.Value.ParseTemplate(htmlTemplate, result.ConfirmationEmailModel);

                sendEmailParameter.Subject = emailList.Subject;
                sendEmailParameter.ToAddresses = list;
                sendEmailParameter.BccAddresses = new List<string>();

                var emailCCAddresses = customSettings.EmailCCAddresses;
                if (!string.IsNullOrEmpty(emailCCAddresses))
                {
                    sendEmailParameter.CCAddresses.Add(emailCCAddresses);
                }

                string defaultEmailAddress = customSettings.DefaultEmailAddress;
                sendEmailParameter.FromAddress = (emailList.FromAddress.IsBlank() ? defaultEmailAddress : emailList.FromAddress);
                sendEmailParameter.ReplyToAddresses = new List<string>();
                sendEmailParameter.ExtendedProperties = new NameValueCollection();
                this.EmailService.Value.SendEmail(sendEmailParameter, unitOfWork);
                //BUSA-253 start : Sales Rep Notification
                SendOrderConfirmationToSalesRep(unitOfWork, result.GetCartResult.Cart, result.ConfirmationEmailModel);
                //BUSA-253 end : Sales Rep Notification

            }
            string applyCreditCard = "No";
            var newuserCustomerNumber = customSettings.Brasseler_GuestCustomerNumber;
            var companyNameIdentifier = customSettings.CompanyNameIdentifier;
            bool isNewUser = (SiteContext.Current.UserProfileDto != null && !SiteContext.Current.UserProfileDto.IsGuest && SiteContext.Current.BillTo.CustomerNumber.EqualsIgnoreCase(companyNameIdentifier + newuserCustomerNumber));
            if (parameter.Status.EqualsIgnoreCase("Submitted") && result.ResultCode.Equals(ResultCode.Success) && isNewUser)
            {
                //BUSA-234 -Start
                CustomerOrder customerOrder = result.GetCartResult.Cart;
                if (customerOrder != null && customerOrder.CreditCardTransactions != null && customerOrder.CreditCardTransactions.Count > 0)
                {
                    ICollection<CreditCardTransaction> creditCardTransaction = customerOrder.CreditCardTransactions;
                    if (creditCardTransaction != null && creditCardTransaction.Count > 0)
                    {
                        foreach (CreditCardTransaction creditCard in creditCardTransaction)
                        {
                            if (!string.IsNullOrEmpty(creditCard.PNRef))
                            {
                                applyCreditCard = "Yes";
                            }
                        }
                    }
                }
                // BUSA - 234 - end

                dynamic emailModel = PopulateUserInfoData(applyCreditCard, unitOfWork);
                emailModel.OrderNumber = customerOrder.OrderNumber;
                //emailModel.OrderNumber = result.GetCartResult.Cart.OrderNumber;
                var emailTo = customSettings.NewCustomerInfoEmailTo;
                var emailList1 = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("NewUserInformation", "New User Information");
                if (emailTo != null && !string.IsNullOrEmpty(emailTo))
                    EmailService.Value.SendEmailList(emailList1.Id, emailTo, emailModel, "New User Information", unitOfWork);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        //BUSA 590 : W04593 -Single Order confirmation email is triggered to customer and inside sales rep start.
        protected string BuildEmailValuesWithoutSalesRep(Guid customerOrderID, IUnitOfWork unitOfWork)
        {
            CustomerOrder customerOrder = unitOfWork.GetRepository<CustomerOrder>().Get(customerOrderID);
            string str1 = string.Empty;
            if (customerOrder.BTEmail.Length > 0)
            {
                string btEmail = customerOrder.BTEmail;
                char[] chArray = new char[2] { ',', ';' };
                foreach (string possibleEmail in btEmail.Split(chArray))
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
            if (customerOrder.STEmail.Length > 0)
            {
                string stEmail = customerOrder.STEmail;
                char[] chArray = new char[2] { ',', ';' };
                foreach (string possibleEmail in stEmail.Split(chArray))
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
            string byName = EmailsSettings.OrderNotificationEmail;
            if (byName.Length > 0 && RegularExpressionLibrary.IsValidEmail(byName) && !str1.Contains(byName))
            {
                string str2 = str1;
                string str3 = str2.Length > 0 ? "," : string.Empty;
                string str4 = byName;
                str1 = str2 + str3 + str4;
            }
            return str1;
        }
        //BUSA 590 : W04593 -Single Order confirmation email is triggered to customer and inside sales rep end.

        protected virtual string GetHtmlTemplate(EmailList emailList)
        {
            ContentManager contentManager = this.EmailTemplateUtilities.GetOrCreateByName(emailList.EmailTemplate.Name).ContentManager;
            return this.ContentManagerUtilities.CurrentContent(contentManager).Html;
        }

        //BUSA-253 start : Sales Rep Notification
        //****************************************************8
        protected void SendOrderConfirmationToSalesRep(IUnitOfWork unitOfWork, CustomerOrder customerOrder, ExpandoObject expandoObjects)
        {
            //BUSA - 623 start : Add Inside Rep to Customer Custom properties tab
            string emailCCAddresses = string.Empty;
            //BUSA - 623 end : Add Inside Rep to Customer Custom properties tab 
            List<string> lstToAddress = new List<string>();

            string email = string.Empty;

            //BUSA-590 start : W04593 -Single Order confirmation email is triggered to customer and inside sales rep
            if (!string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence))
            {
                var shipToSalesRep = customerOrder.ShipTo.PrimarySalespersonId;
                if (shipToSalesRep != null)
                {
                    email = unitOfWork.GetRepository<Salesperson>().GetTable().Where(x => x.Id == shipToSalesRep).FirstOrDefault().Email.ToString();
                    //BUSA - 623 start : Add Inside Rep to Customer Custom properties tab 
                    if (string.IsNullOrEmpty(email))
                    {
                        GetInsideSalesRep(unitOfWork, customerOrder, customerOrder.ShipToId);
                        email = insideRepEmail;
                    }
                }
                else
                {
                    GetInsideSalesRep(unitOfWork, customerOrder, customerOrder.ShipToId);
                    email = insideRepEmail;
                }
                //BUSA - 623 end : Add Inside Rep to Customer Custom properties tab 
            }
            else
            {
                if (customerOrder.SalespersonId != null)
                {
                    email = unitOfWork.GetRepository<Salesperson>().GetTable().Where(x => x.Id == customerOrder.SalespersonId).FirstOrDefault().Email.ToString();
                    //BUSA - 623 start : Add Inside Rep to Customer Custom properties tab 
                    if (string.IsNullOrEmpty(email))
                    {
                        GetInsideSalesRep(unitOfWork, customerOrder, customerOrder.CustomerId);
                        email = insideRepEmail;
                    }
                }
                else
                {
                    GetInsideSalesRep(unitOfWork, customerOrder, customerOrder.CustomerId);
                    email = insideRepEmail;
                }
                //BUSA - 623 end : Add Inside Rep to Customer Custom properties tab 
            }
            //BUSA-590 end : W04593 -Single Order confirmation email is triggered to customer and inside sales rep



            if (!string.IsNullOrEmpty(email))
            {
                this.PopulateOrderEmailModel(expandoObjects, customerOrder, unitOfWork);
                //BUSA - 832 : Subject changed to 'Brasseler Order Confirmation'
                EmailList orCreateByName = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SalesOrderConfirmation", "Brasseler Order Confirmation");
                lstToAddress.Add(email);
                EmailList emailList = unitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName.Id);
                if (emailList != null)
                {
                    SendEmailParameter sendEmailParameter = new SendEmailParameter();
                    string htmlTemplate = GetHtmlTemplate(emailList);
                    sendEmailParameter.Body = this.EmailService.Value.ParseTemplate(htmlTemplate, expandoObjects);

                    sendEmailParameter.Subject = emailList.Subject;
                    sendEmailParameter.ToAddresses = lstToAddress;
                    sendEmailParameter.BccAddresses = new List<string>();

                    //BUSA - 623 start : Add Inside Rep to Customer Custom properties tab      
                    if (!string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence))
                    {
                        GetInsideSalesRep(unitOfWork, customerOrder, customerOrder.ShipToId);
                    }
                    else
                    {
                        GetInsideSalesRep(unitOfWork, customerOrder, customerOrder.CustomerId);
                    }

                    emailCCAddresses = insideRepEmail;
                    if (email == emailCCAddresses)
                    {
                        emailCCAddresses = null;
                    }
                    //BUSA - 623 end : Add Inside Rep to Customer Custom properties tab

                    if (!string.IsNullOrEmpty(emailCCAddresses))
                    {
                        sendEmailParameter.CCAddresses.Add(emailCCAddresses);
                    }

                    string defaultEmailAddress = customSettings.DefaultEmailAddress;
                    sendEmailParameter.FromAddress = (emailList.FromAddress.IsBlank() ? defaultEmailAddress : emailList.FromAddress);
                    sendEmailParameter.ReplyToAddresses = new List<string>();
                    sendEmailParameter.ExtendedProperties = new NameValueCollection();
                    this.EmailService.Value.SendEmail(sendEmailParameter, unitOfWork);
                }
            }
        }
        //BUSA-253 end : Sales Rep Notification

        //BUSA - 623 start : Add Inside Rep to Customer Custom properties tab 

        protected void GetInsideSalesRep(IUnitOfWork unitOfWork, CustomerOrder customerOrder, Guid billToShipTo)
        {
            var customProperty = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == billToShipTo);
            foreach (var iAmCodeEmail in customProperty)
            {
                if (iAmCodeEmail.Name == "IAMCodeEmail")
                {
                    insideRepEmail = iAmCodeEmail.Value;
                }
            }
        }

        protected void PopulateOrderEmailModel(dynamic emailModel, CustomerOrder customerOrder, IUnitOfWork unitOfWork)
        {
            DateTimeOffset orderDate = customerOrder.OrderDate.ToLocalTime();  //BUSA-477 Order Confirmation email contains wrong time
            //BUSA-1032 Business Request: Add the promotion name/s on the order email notification -- Start
            List<Guid> promoId = new List<Guid>();
            if (customerOrder.CustomerOrderPromotions.Count > 0)
            {
                //if orderline.promotionresultid != null and promotion.amount = 0 and unitnetprice=unitregularprice 
                emailModel.OrderConfirmationPromotions = new List<ExpandoObject>();
                foreach (CustomerOrderPromotion Promo in customerOrder.CustomerOrderPromotions)
                {
                    //code added to avoid displaying those promotions which are overriden by some other promotions.
                    if (Promo.OrderLineId != null || Promo.Amount != null)
                    {
                        var cust = customerOrder.OrderLines.FirstOrDefault(x => x.Id == Promo.OrderLineId);
                        if (cust != null && cust.PromotionResultId != null && Promo.Amount == 0 && cust.UnitRegularPrice == cust.UnitNetPrice)
                        {
                            //dont display ununsed promotions 
                            //do nothing

                        }
                        else if (!promoId.Contains(Promo.PromotionId))
                        {
                            dynamic expandoObjects = new ExpandoObject();
                            expandoObjects.Promotions = Promo.Promotion.Name;
                            emailModel.OrderConfirmationPromotions.Add(expandoObjects);
                            promoId.Add(Promo.PromotionId);
                        }
                    }
                }
            }
            //BUSA-1032 Business Request: Add the promotion name/s on the order email notification -- End
            emailModel.CustomerNumber = customerOrder.CustomerNumber;
            if (customerOrder.ShipTo != null && !string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence))
            {
                // BUSA-472, 548, 508 : Duplicate Customers on Production Starts
                if (customerOrder.ShipTo.CustomerSequence.ToUpper().Contains("ISC"))
                {
                    var id = SiteContext.Current.ShipTo.CustomProperties.FirstOrDefault(p => p.Name == "prevShipToId")?.Value ?? string.Empty;
                    if (!string.IsNullOrEmpty(id))
                    {
                        emailModel.CustomerShipToNumber = unitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(p => p.Id == new Guid(id)).CustomerSequence ?? SiteContext.Current.ShipTo.CustomerSequence;
                    }
                    else { emailModel.CustomerShipToNumber = SiteContext.Current.ShipTo.CustomerSequence; }
                    //emailModel.CustomerShipToNumber = SiteContext.Current.ShipTo.CustomerSequence;
                }
                else
                {
                    emailModel.CustomerShipToNumber = customerOrder.ShipTo.CustomerSequence;
                }
                // BUSA-472, 548, 508 : Duplicate Customers on Production Ends
            }
            else
            {
                emailModel.CustomerShipToNumber = string.Empty;
            }

            if (customerOrder.CustomProperties.Where(x => x.Name == "subscriptionFrequencyOpted").Count() > 0)
            {
                var frequency = customerOrder.CustomProperties.FirstOrDefault(x => x.Name == "subscriptionFrequencyOpted").Value;
                if (!string.IsNullOrEmpty(frequency))
                {
                    emailModel.SubscriptionFrequency = int.Parse(frequency) / 7;
                }
            }

        }

        public ExpandoObject PopulateUserInfoData(string applyCredit, IUnitOfWork unitOfWork)
        {
            dynamic emailModel = new ExpandoObject();
            //var User = SiteContext.Current.UserProfileDto;
            UserProfile userProfile = unitOfWork.GetRepository<UserProfile>().Get(SiteContext.Current.UserProfileDto.Id);
            var properties = userProfile.CustomProperties;
            emailModel.UserName = SiteContext.Current.UserProfileDto.UserName; /*BUSA-807*/
            emailModel.BTFirstName = GetCurrentUserPropertyValue(properties, "NewUsrBTFirstName");
            emailModel.BTLastName = GetCurrentUserPropertyValue(properties, "NewUsrBTLastName");
            emailModel.BTCompanyName = GetCurrentUserPropertyValue(properties, "NewUsrBTCompanyName");
            emailModel.BTAddress1 = GetCurrentUserPropertyValue(properties, "NewUsrBTAddress1");
            emailModel.BTAddress2 = GetCurrentUserPropertyValue(properties, "NewUsrBTAddress2");
            emailModel.BTCity = GetCurrentUserPropertyValue(properties, "NewUsrBTCity");
            emailModel.BTState = GetCurrentUserPropertyValue(properties, "NewUsrBTState");
            emailModel.BTCountry = GetCurrentUserPropertyValue(properties, "NewUsrBTCountry");
            emailModel.BTPostalCode = GetCurrentUserPropertyValue(properties, "NewUsrBTPostalCode");
            emailModel.BTPhone = GetCurrentUserPropertyValue(properties, "NewUsrBTPhone");
            emailModel.BTEmail = GetCurrentUserPropertyValue(properties, "NewUsrBTEmail");
            emailModel.STFirstName = GetCurrentUserPropertyValue(properties, "NewUsrSTFirstName");
            emailModel.STLastName = GetCurrentUserPropertyValue(properties, "NewUsrSTLastName");
            emailModel.STCompanyName = GetCurrentUserPropertyValue(properties, "NewUsrSTCompanyName");
            emailModel.STAddress1 = GetCurrentUserPropertyValue(properties, "NewUsrSTAddress1");
            emailModel.STAddress2 = GetCurrentUserPropertyValue(properties, "NewUsrSTAddress2");
            emailModel.STCity = GetCurrentUserPropertyValue(properties, "NewUsrSTCity");
            emailModel.STState = GetCurrentUserPropertyValue(properties, "NewUsrSTState");
            emailModel.STCountry = GetCurrentUserPropertyValue(properties, "NewUsrSTCountry");
            emailModel.STPostalCode = GetCurrentUserPropertyValue(properties, "NewUsrSTPostalCode");
            emailModel.STPhone = GetCurrentUserPropertyValue(properties, "NewUsrSTPhone");
            emailModel.Practitioner_FirstName = GetCurrentUserPropertyValue(properties, "PractitionerFirstName");
            emailModel.Practitioner_MiddleName = GetCurrentUserPropertyValue(properties, "PractitionerMiddleName");
            emailModel.Practitioner_LastName = GetCurrentUserPropertyValue(properties, "PractitionerLastName");
            emailModel.DentalLicense_State = GetCurrentUserPropertyValue(properties, "DentalLicenseState");
            emailModel.DentalLicense_LicenseNumber = GetCurrentUserPropertyValue(properties, "DentalLicenseNumber");
            emailModel.Ordering_FirstName = GetCurrentUserPropertyValue(properties, "OrderingFirstName");
            emailModel.Ordering_LastName = GetCurrentUserPropertyValue(properties, "OrderingLastName");
            emailModel.PayableAccount_FirstName = GetCurrentUserPropertyValue(properties, "PayableAccountFirstName");
            emailModel.PayableAccount_LastName = GetCurrentUserPropertyValue(properties, "PayableAccountLastName");
            emailModel.ResponsibleParty_FirstName = GetCurrentUserPropertyValue(properties, "ResponsiblePartyFirstName");
            emailModel.ResponsibleParty_LastName = GetCurrentUserPropertyValue(properties, "ResponsiblePartyLastName");
            emailModel.ResponsibleParty_TaxOrEmpId = GetCurrentUserPropertyValue(properties, "ResponsiblePartyTaxOrEmpId");
            emailModel.ExemptTax = GetCurrentUserPropertyValue(properties, "ExemptTax");
            emailModel.PORequired = GetCurrentUserPropertyValue(properties, "PORequired");
            emailModel.ApplyCredit = GetCurrentUserPropertyValue(properties, "ApplyCredit");
            emailModel.PaybyCreditCard = applyCredit;
            // Changes For BUSA-337 Starts
            var customerType = GetCurrentUserPropertyValue(properties, "customerType").ToString();
            emailModel.customerType = string.IsNullOrEmpty(customerType) || customerType.ToUpper().Equals("NONE") ? string.Empty : customerType;
            // Changes For BUSA-337 Ends
            return emailModel;
        }

        public string GetCurrentUserPropertyValue(ICollection<CustomProperty> properties, string name)
        {
            string propertyValue = string.Empty;
            if (properties != null && properties.Count > 0)
            {
                var userProperty = properties.Where(p => p.Name.EqualsIgnoreCase(name)).FirstOrDefault();
                if (userProperty != null && !string.IsNullOrEmpty(userProperty.Value))
                    return userProperty.Value;
            }
            return propertyValue;
        }

    }
}
