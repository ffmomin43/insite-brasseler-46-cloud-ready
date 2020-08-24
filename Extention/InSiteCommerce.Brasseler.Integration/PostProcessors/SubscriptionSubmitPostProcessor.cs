using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using InSiteCommerce.Brasseler.Integration;
using System;
using System.Data;
using System.Threading;
using Insite.Common.Logging;
using System.Linq;
using Insite.Core.Context;
using Insite.Cart.Services.Parameters;
//using Insite.Cart.Services.Handlers.Helpers;
using Insite.Cart.Services;
using Insite.Core.Services.Handlers;
using Insite.Cart.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Common.Providers;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Data.Entities.Dtos;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.Interfaces.Plugins.Emails;
using System.Dynamic;
using Insite.Data.Extensions;
using System.Collections.Generic;
using System.Collections.Specialized;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace Insite.Integration.WebService.PlugIns.Postprocessor
{
    [DependencyName("SubscriptionSubmit")]
    public class SubscriptionSubmitPostProcessor : IntegrationBase, IJobPostprocessor
    {
        #region Variables

        protected readonly IUnitOfWork UnitOfWork;
        protected readonly ICartService CartService;
        protected readonly IPricingPipeline pricingPipeline;
        protected readonly Lazy<IntegrationJobSchedulingService> IntegrationJobSchedulingService;
        protected readonly IHandlerFactory HandlerFactory;
        protected readonly IUnitOfWorkFactory unitOfWorkFactory;
        protected readonly IPromotionEngine promotionEngine;
        protected readonly ICustomerOrderUtilities CustomerOrderUtilities;
        protected readonly IOrderLineUtilities OrderLineUtilities;
        private readonly ICartPipeline CartPipeline;
        protected readonly UpdateCartResult updateCartResult;
        protected readonly Lazy<IEmailService> EmailService;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly IContentManagerUtilities ContentManagerUtilities;
        protected CustomSettings CustomSettings;
        #endregion

        #region Properties

        public IJobLogger JobLogger { get; set; }
        public IntegrationJob IntegrationJob { get; set; }


        bool shipNow = false;

        #endregion

        #region Constructor

        public SubscriptionSubmitPostProcessor(IHandlerFactory HandlerFactory, IUnitOfWorkFactory unitOfWorkFactory, ICartService cartService, IPricingPipeline PricingPipeline, Lazy<IntegrationJobSchedulingService> IntegrationJobSchedulingService, IPromotionEngine promotionEngine, ICustomerOrderUtilities customerOrderUtilities, IOrderLineUtilities OrderLineUtilities, ICartPipeline cartPipeline, Lazy<IEmailService> emailService, IEmailTemplateUtilities emailTemplateUtilities, IContentManagerUtilities contentManagerUtilities, CustomSettings customSettings)
        {
            this.HandlerFactory = HandlerFactory;
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.unitOfWorkFactory = unitOfWorkFactory;
            this.CartService = cartService;
            this.pricingPipeline = PricingPipeline;
            this.IntegrationJobSchedulingService = IntegrationJobSchedulingService;
            this.promotionEngine = promotionEngine;
            this.CustomerOrderUtilities = customerOrderUtilities;
            this.OrderLineUtilities = OrderLineUtilities;
            CartPipeline = cartPipeline;
            this.updateCartResult = new UpdateCartResult();    //BUSA-1076 -(Moved from local to Global)  Send Email Notification for SS Failure when triggered form admin console
            this.EmailService = emailService;
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.ContentManagerUtilities = contentManagerUtilities;
            this.CustomSettings = customSettings;
        }

        #endregion

        #region Methods

        public virtual void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            CustomerOrder subscriptionOrder = null;

            try
            {
                // Fetching job parameters.
                var jobParameters = this.IntegrationJob.IntegrationJobParameters;
                if (jobParameters == null || jobParameters.Count <= 0)
                {
                    return;
                }

                var subscriptionOrderId = Guid.Empty;

                foreach (var jobParameter in jobParameters)
                {
                    // Check for null or empty for the job parameter value.
                    if (!string.IsNullOrEmpty(jobParameter.Value))
                    {
                        if (jobParameter.JobDefinitionStepParameter.Name.EqualsIgnoreCase("Ship Now"))
                        {
                            shipNow = bool.Parse(jobParameter.Value);
                        }
                        else if (jobParameter.JobDefinitionStepParameter.Name.EqualsIgnoreCase("SmartSupplyOrderId"))
                        {
                            subscriptionOrderId = Guid.Parse(jobParameter.Value);
                        }
                    }

                    // Assigning the job parameter value i.e Customer Order ID in order to pull the customer order.

                }

                // Pull the customer order based on the job parameter value.
                this.UnitOfWork.BeginTransaction();
                subscriptionOrder = this.UnitOfWork.GetRepository<CustomerOrder>().GetTable().FirstOrDefault(x => x.Id == subscriptionOrderId);


                if (subscriptionOrder == null)
                {
                    return;
                }

                // Validate subscription deactivation date before processing next order.
                var subscriptionBrasselerOrder = this.UnitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().Where(x => x.CustomerOrderId == subscriptionOrder.Id).FirstOrDefault();

                if (subscriptionBrasselerOrder != null && subscriptionOrder.Status.EqualsIgnoreCase("SubscriptionOrder"))
                {
                    if (subscriptionBrasselerOrder.DeActivationDate != null)
                    {
                        if (subscriptionBrasselerOrder.DeActivationDate >= DateTimeOffset.Now.Date)
                        {
                            // Retrieve the subscription order to set the SiteContext object and frequency of the subscription order. 

                            var userProfile = this.UnitOfWork.GetRepository<UserProfile>().GetTable().FirstOrDefault(x => x.Id == subscriptionOrder.InitiatedByUserProfileId);
                            var billTo = this.UnitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(x => x.Id == subscriptionOrder.CustomerId);
                            var shipTo = this.UnitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(x => x.Id == subscriptionOrder.ShipToId);
                            var website = this.UnitOfWork.GetRepository<Website>().GetTable().FirstOrDefault(x => x.Id == subscriptionOrder.WebsiteId);
                            var currency = this.UnitOfWork.GetRepository<Currency>().GetTable().FirstOrDefault(x => x.Id == subscriptionOrder.CurrencyId);

                            // Check for null before setting up the SiteContext object.
                            if (userProfile == null || billTo == null || shipTo == null)
                            {
                                return;
                            }

                            // Set the SiteContext object.
                            SiteContext.SetSiteContext(new SiteContextDto(SiteContext.Current) { UserProfileDto = new UserProfileDto(userProfile), BillTo = billTo, ShipTo = shipTo, WebsiteDto = new WebsiteDto(website), CurrencyDto = new CurrencyDto(currency) });
                            //create new Cart
                            var cart = CreateNewCart(this.UnitOfWork, subscriptionOrder);
                            //Insert in SubscriptionBrasseler
                            if (cart == null)
                            {
                                return;
                            }
                            cart.RecalculatePromotions = true;
                            cart.RecalculateTax = true;
                            this.pricingPipeline.GetCartPricing(new GetCartPricingParameter(cart)
                            {
                                CalculateShipping = true,
                                CalculateTaxes = true,
                                CalculateOrderTotal = true,
                                ForceRecalculation = true,

                            });
                            /*BUSA-755 Smart supply discount issue when user added product qualifies for VDG and smart supply feature*/
                            var newSubscriptionBrasseler = CreateSubscriptionBrasseler(subscriptionBrasselerOrder, cart);
                            if (newSubscriptionBrasseler == null)
                            {
                                return;
                            }
                            // Recalculate the cart to have customer order updated based on Promotion, Tax, Shipping and Handling.
                            //this.pricingPipeline.GetCartPricing(this.UnitOfWork, cart, (OrderLine)null, true);



                            // Build up the update cart paramter.
                            var updateCartParameter = new UpdateCartParameter();
                            updateCartParameter.CartId = cart.Id;

                            if (!string.IsNullOrEmpty(newSubscriptionBrasseler.PaymentMethod))
                            {
                                if (newSubscriptionBrasseler.PaymentMethod.EqualsIgnoreCase("CK"))
                                {
                                    updateCartParameter.IsPaymentProfile = false;
                                    updateCartParameter.TermsCode = "CK";
                                }
                                else
                                {
                                    Guid userPaymentprofileId = Guid.Parse(newSubscriptionBrasseler.PaymentMethod);
                                    var userPaymentprofile = this.UnitOfWork.GetRepository<UserPaymentProfile>().GetTable().Where(x => x.Id == userPaymentprofileId).FirstOrDefault();
                                    if (userPaymentprofile != null)
                                    {
                                        updateCartParameter.PaymentProfileId = userPaymentprofile.CardIdentifier;
                                        updateCartParameter.IsPaymentProfile = true;
                                        updateCartParameter.TermsCode = "CC";
                                    }
                                }
                            }
                            updateCartParameter.Status = "Submitted";
                            updateCartParameter.IsJobQuote = false;
                            updateCartParameter.IsPayPal = false;
                            updateCartParameter.ShipToId = cart.ShipToId;
                            updateCartParameter.ShipViaId = cart.ShipViaId;

                            IHandler<UpdateCartParameter, UpdateCartResult> handler = this.HandlerFactory.GetHandler<IHandler<UpdateCartParameter, UpdateCartResult>>();
                            IUnitOfWork unitOfWork = this.UnitOfWork;
                            var updateCartSubmitResult = handler.Execute(unitOfWork, updateCartParameter, updateCartResult);
                            newSubscriptionBrasseler.NextDelieveryDate = new DateTimeOffset(DateTimeProvider.Current.Now.AddDays(subscriptionBrasselerOrder.Frequency).DateTime, TimeSpan.Zero);
                            this.UnitOfWork.CommitTransaction();
                        }
                    }
                }
            }

            catch (Exception ex)
            {
                LogHelper.For(this).Error(ex);

                if (ex.Message == "Value cannot be null.\r\nParameter name: siteContext")
                {
                    JobLogger.Error("CC Declined");
                    //BUSA-1076 - start: Send Email Notification for SS Failure due to CC decline when triggered from admin console with CC added for sp and ism
                    if (!shipNow)
                    {
                        EmailList orCreateByName_USA = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyOrderFailureUSA", "SmartSupplyOrderFailure");
                        EmailList orCreateByName_CA = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyOrderFailureCA", "SmartSupplyOrderFailure");
                        EmailList orCreateByName_FR = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyOrderFailureFR", "SmartSupplyOrderFailure");
                        dynamic expandoObjects = new ExpandoObject();
                        SendEmailParameter sendEmailParameter = new SendEmailParameter();
                        EmailList emailList_USA = this.UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName_USA.Id);
                        EmailList emailList_CA = this.UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName_CA.Id);
                        EmailList emailList_FR = this.UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName_FR.Id);
                        expandoObjects.OrderNumber = subscriptionOrder.OrderNumber;
                        EmailList emailList = null;
                        expandoObjects.CustomerNumber = subscriptionOrder.CustomerNumber;
                        if (subscriptionOrder != null && !string.IsNullOrEmpty(subscriptionOrder.ShipTo.CustomerSequence))
                        {
                            expandoObjects.CustomerShipToNumber = subscriptionOrder.ShipTo.CustomerSequence;
                        }
                        else
                        {
                            expandoObjects.CustomerShipToNumber = string.Empty;
                        }

                        var languageid = this.UnitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentTable == "UserProfile" && x.Name == "userLanguage" && x.ParentId == updateCartResult.GetCartResult.Cart.InitiatedByUserProfileId).FirstOrDefault()?.Value;
                        var languageName = this.UnitOfWork.GetRepository<Language>().GetTable().Where(x => x.Id.ToString() == languageid).FirstOrDefault()?.LanguageCode;

                        string htmlTemplate = string.Empty;
                        if (updateCartResult.GetCartResult.Cart.OrderNumber.StartsWith("W") || languageName == "en-us")
                        {
                            htmlTemplate = GetHtmlTemplate(emailList_USA);
                            emailList = emailList_USA;

                        }
                        else
                        {
                            if (!string.IsNullOrEmpty(languageid) && languageName=="fr-CA")
                            {
                                htmlTemplate = GetHtmlTemplate(emailList_FR);
                                emailList = emailList_FR;

                            }
                            else
                            {
                                htmlTemplate = GetHtmlTemplate(emailList_CA);
                                emailList = emailList_CA;
                            }



                        }
                        sendEmailParameter.Body = this.EmailService.Value.ParseTemplate(htmlTemplate, expandoObjects);
                        sendEmailParameter.Subject = emailList.Subject;
                        sendEmailParameter.ToAddresses.Add(updateCartResult.GetCartResult.Cart.CreatedBy);
                        var emailCCAddresses = this.UnitOfWork.GetRepository<Salesperson>().GetTable().Where(x => x.Id == updateCartResult.GetCartResult.Cart.SalespersonId).FirstOrDefault();
                        var customProperty = this.UnitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == updateCartResult.GetCartResult.Cart.ShipToId);

                        foreach (var iAmCodeEmail in customProperty)
                        {
                            if (iAmCodeEmail.Name == "IAMCodeEmail")
                            {
                                var insideRepEmail = iAmCodeEmail.Value;

                                if (!string.IsNullOrEmpty(insideRepEmail))
                                {
                                    sendEmailParameter.CCAddresses.Add(insideRepEmail);
                                }
                            }
                        }
                        if ((emailCCAddresses != null) && (!string.IsNullOrEmpty(emailCCAddresses.Email)))
                        {
                            sendEmailParameter.CCAddresses.Add(emailCCAddresses.Email);
                        }

                        string defaultEmailAddress = this.CustomSettings.DefaultEmailAddress;
                        sendEmailParameter.FromAddress = (emailList.FromAddress.IsBlank() ? defaultEmailAddress : emailList.FromAddress);
                        sendEmailParameter.ReplyToAddresses = new List<string>();
                        sendEmailParameter.ExtendedProperties = new NameValueCollection();
                        this.EmailService.Value.SendEmail(sendEmailParameter, this.UnitOfWork);


                    }
                    //BUSA-1076 - end:Send Email Notification for SS Failure due to CC decline when triggered from admin console with CC added  for sp and ism
                }



                throw;
            }
            finally
            {
                if (subscriptionOrder != null)
                {
                    var subscriptionBrasselerOrder = this.UnitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().Where(x => x.CustomerOrderId == subscriptionOrder.Id).FirstOrDefault();
                    if (subscriptionBrasselerOrder.DeActivationDate != null)
                    {
                        if (subscriptionBrasselerOrder.DeActivationDate >= DateTimeOffset.Now.Date)
                        {
                            // Added ship now condition to not update the next delievery date if it is true. Order needs to be placed now. By default value is false.
                            if (subscriptionBrasselerOrder != null)
                            {
                                subscriptionBrasselerOrder.NextDelieveryDate = new DateTimeOffset(DateTimeProvider.Current.Now.AddDays(subscriptionBrasselerOrder.Frequency).DateTime, TimeSpan.Zero);
                            }
                            this.UnitOfWork.Save();
                        }
                    }
                }
            }
        }
        protected CustomerOrder CreateNewCart(IUnitOfWork unitOfWork, CustomerOrder customerOrder)
        {
            //Replaced Guid.Empty with Guid.NewGuid for SS orders
            CustomerOrder cart = new CustomerOrder()
            {
                Id = Guid.NewGuid(),
                OrderNumber = Guid.Empty.ToString(),
                OrderDate = DateTimeProvider.Current.Now,
                Customer = customerOrder.Customer,
                ShipTo = customerOrder.ShipTo,
                DropShipCustomer = customerOrder.DropShipCustomer,
                Website = customerOrder.Website,
                Affiliate = customerOrder.Affiliate,
                ShipVia = customerOrder.ShipVia,
                InitiatedByUserProfile = customerOrder.InitiatedByUserProfile,
                InitiatedByUserProfileId = customerOrder.InitiatedByUserProfileId,
                CurrencyId = customerOrder.CurrencyId,
                PlacedByUserName = customerOrder.PlacedByUserName,
                PlacedByUserProfile = customerOrder.PlacedByUserProfile,
                Status = "Cart",
                CustomerPO = customerOrder.CustomerPO,
                Notes = customerOrder.Notes

            };
            cart.TermsCode = customerOrder.TermsCode;
            cart.ShippingCalculationNeededAsOf = DateTimeOffset.Now;
            //this.CustomerOrderUtilities.SetBillTo(cart, cart.Customer);
            this.CartPipeline.SetBillTo(new SetBillToParameter()
            {
                Cart = cart,
                BillTo = cart.Customer
            });
            //this.CustomerOrderUtilities.SetShipTo(cart, cart.ShipTo);
            this.CartPipeline.SetShipTo(new SetShipToParameter()
            {
                Cart = cart,
                ShipTo = cart.ShipTo
            });
            unitOfWork.GetRepository<CustomerOrder>().Insert(cart);
            cart.OrderNumber = cart.Id.ToString();
            unitOfWork.Save();
            foreach (var customProperty in customerOrder.CustomProperties)
            {
                cart.SetProperty(customProperty.Name, customProperty.Value);
            }

            foreach (var ol in customerOrder.OrderLines)
            {
                //BUSA-1060 - start: Smart Supply discount label not visible after clicking shipnow

                //ol.CostCode = string.Empty;

                //BUSA-1060 - end: Smart Supply discount label not visible after clicking shipnow
                //this.CustomerOrderUtilities.AddOrderLine(cart, this.OrderLineUtilities.Copy(ol));
                Cart.Services.Pipelines.Results.AddCartLineResult addCartLineResult = CartPipeline.AddCartLine(new Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                {
                    Cart = cart,
                    Product = ol.Product,
                    QtyOrdered = ol.QtyOrdered,
                    UnitOfMeasure = ol.UnitOfMeasure,
                    CostCode = ol.CostCode,
                    Notes = ol.Notes,
                    CustomProperties = ol.CustomProperties.ToList()
                });
                addCartLineResult.CartLine.SmartPart = ol.SmartPart;
            }

            return cart;
        }

        protected SubscriptionBrasseler CreateSubscriptionBrasseler(SubscriptionBrasseler subscriptionBraseler, CustomerOrder cart)
        {
            SubscriptionBrasseler subscriptionBrasseler1 = new SubscriptionBrasseler();
            subscriptionBrasseler1.CustomerOrderId = cart.Id;
            subscriptionBrasseler1.Frequency = subscriptionBraseler.Frequency;
            subscriptionBrasseler1.PaymentMethod = subscriptionBraseler.PaymentMethod;
            subscriptionBrasseler1.NextDelieveryDate = subscriptionBraseler.NextDelieveryDate;
            subscriptionBrasseler1.ActivationDate = subscriptionBraseler.ActivationDate;
            subscriptionBrasseler1.DeActivationDate = subscriptionBraseler.DeActivationDate;
            subscriptionBrasseler1.ParentCustomerOrderId = subscriptionBraseler.CustomerOrderId;//BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
            subscriptionBrasseler1.ShipNow = shipNow;

            if (subscriptionBrasseler1 != null)
            {
                this.UnitOfWork.GetRepository<SubscriptionBrasseler>().Insert(subscriptionBrasseler1);
            }
            return subscriptionBrasseler1;
        }

        public void Cancel()
        {
            throw new NotImplementedException();
        }

        //BUSA-1076 - start: Send Email Notification for SS Failure due to CC decline when triggered from admin console with CC added
        protected virtual string GetHtmlTemplate(EmailList emailList)
        {
            ContentManager contentManager = this.EmailTemplateUtilities.GetOrCreateByName(emailList.EmailTemplate.Name).ContentManager;
            return this.ContentManagerUtilities.CurrentContent(contentManager).Html;
        }
        #endregion

        //BUSA-1076 - start: Send Email Notification for SS Failure due to CC decline when triggered from admin console with CC added
    }
}