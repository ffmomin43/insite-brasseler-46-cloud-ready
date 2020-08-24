using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common.Logging;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.Integration;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Dynamic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("UpdateCartHandlerBrasseler")]
    public class UpdateCartHandlerBrasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        protected IPromotionEngine promotionEngine;
        protected readonly IEmailService EmailService;
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected CustomSettings customSettings;
        public override int Order => 550;

        public UpdateCartHandlerBrasseler(IPromotionEngine promotionEngine, IEmailService emailService, IIntegrationJobSchedulingService IntegrationJobSchedulingService)
        {
            this.IntegrationJobSchedulingService = IntegrationJobSchedulingService;
            this.promotionEngine = promotionEngine;
            this.EmailService = emailService;
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            customSettings = new CustomSettings();
            //BUSA- 463 Cancel subscription and Save status in CustomerOrder
            if (parameter.Status.EqualsIgnoreCase("SubscriptionCancelled"))
            {
                return this.CancelSubscription(result, unitOfWork, parameter);
            }

            var selectedShipVia = parameter.ShipViaId;

            AddOrUpdateProperty(result, "selectedShipVia", selectedShipVia.ToString());
            var companyNameIdentifier = customSettings.CompanyNameIdentifier;
            var newuserCustomerNumber = customSettings.Brasseler_GuestCustomerNumber;

            UserProfile userProfile = unitOfWork.GetRepository<UserProfile>().Get(SiteContext.Current.UserProfileDto.Id);
            if (userProfile != null && !userProfile.IsGuest)
            {
                var currentCustomer = SiteContext.Current.BillTo;
                if (currentCustomer != null && currentCustomer.CustomerNumber.EqualsIgnoreCase(companyNameIdentifier + newuserCustomerNumber) && result.GetCartResult != null)
                {
                    result.GetCartResult.RequiresPoNumber = false;
                    result.GetCartResult.ShowPoNumber = false;
                }
                else if (result.GetCartResult != null)
                    result.GetCartResult.RequiresPoNumber = parameter.TermsCode.EqualsIgnoreCase("CK");
            }
            if (parameter.Properties.ContainsKey("ShipNow") && parameter.Status.EqualsIgnoreCase("SubscriptionOrder"))
            {
                var isShipNow = parameter.Properties["ShipNow"];
                if (isShipNow.EqualsIgnoreCase("true"))
                {

                    JobDefinition jobDefinition = (from jd in unitOfWork.GetRepository<JobDefinition>().GetTable()
                                                   join jds in unitOfWork.GetRepository<JobDefinitionStep>().GetTable()
                                                   on jd.Id equals jds.JobDefinitionId
                                                   join jdsp in unitOfWork.GetRepository<JobDefinitionStepParameter>().GetTable()
                                                   on jds.Id equals jdsp.JobDefinitionStepId
                                                   where jd.Name == "SmartSupply Submit Job"
                                                   select jd).FirstOrDefault();

                    if (jobDefinition == null)
                    {
                        return this.CreateErrorServiceResult<UpdateCartResult>(result, result.GetCartResult.SubCode, "Something went wrong please contact customer support");
                    }
                    Collection<JobDefinitionStepParameter> parameters = new Collection<JobDefinitionStepParameter>();
                    if (jobDefinition != null)
                    {
                        foreach (JobDefinitionStepParameter definitionStepParameter in jobDefinition.JobDefinitionSteps.SelectMany<JobDefinitionStep, JobDefinitionStepParameter>((Func<JobDefinitionStep, IEnumerable<JobDefinitionStepParameter>>)(s => (IEnumerable<JobDefinitionStepParameter>)s.JobDefinitionStepParameters)))
                        {
                            if (definitionStepParameter.Name.EqualsIgnoreCase("Ship Now"))
                            {
                                definitionStepParameter.Value = parameter.Properties["ShipNow"];
                            }
                            if (definitionStepParameter.Name.EqualsIgnoreCase("SmartSupplyOrderID"))
                            {
                                definitionStepParameter.Value = result.GetCartResult.Cart.Id.ToString();
                            }
                            parameters.Add(definitionStepParameter);
                        }

                        if (parameters.Count() == 0)
                        {
                            parameter.Properties["ShipNow"] = "false";
                            return result;
                        }

                        //BUSA-1076 - start: Notification for SS Failure not displayed when CC declined
                        try
                        {
                            var rslt = this.IntegrationJobSchedulingService.RunRealTimeIntegrationJob("SmartSupply Submit Job", null, parameters, null, false);

                            if (rslt.Status == "Failure")

                            {
                                var msg = rslt.IntegrationJobLogs.Where(x => x.TypeName.EqualsIgnoreCase("Error") && x.Message == "CC Declined").FirstOrDefault().Message;
                                //BUSA-1076 - start: Notification for SS Failure not displayed when CC declined - localisation done
                                if ((msg == "CC Declined"))
                                {
                                    var current = SiteContext.Current.Language.LanguageCode;
                                    if (current.ToLower() == "fr-ca")
                                    {
                                        this.CreateErrorServiceResult<UpdateCartResult>(result, result.SubCode, "Échec de la carte de crédit, veuillez mettre à jour vos informations de paiement et réessayer");
                                    }

                                    else
                                    {
                                        this.CreateErrorServiceResult<UpdateCartResult>(result, result.SubCode, "Credit Card Failed, please update your payment information and try again.");
                                    }
                                    //BUSA-1076 - end: Notification for SS Failure not displayed when CC declined - localisation done
                                }
                                else
                                {
                                    this.CreateErrorServiceResult<UpdateCartResult>(result, result.SubCode, "An error occurred while processing your request, please contact customer support");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            LogHelper.For(this).Error(ex);

                        }
                        //BUSA-1076 - end: Notification for SS Failure not displayed when CC declined
                        parameter.Properties["ShipNow"] = "false";
                    }
                }
            }
            //BUSA-636 Pricing 2018 added if to retrive related Products on Cart
            if (parameter.Properties.ContainsKey("getRelatedProducts"))
            {
                var volumeGrp = parameter.Properties.ContainsKey("grpDescription") ? parameter.Properties["grpDescription"] : string.Empty;

                var grpRelatedProducts = unitOfWork.GetRepository<Product>().GetTable().Where(x => x.ModelNumber.ToUpper().Equals(volumeGrp.ToUpper()) && (x.DeactivateOn == null || x.DeactivateOn >= DateTime.Now)).Select(c => new { Name = c.Name, Description = c.ShortDescription });

                //Filter Products as per restriction grp -Pricing2018
                if (!string.IsNullOrEmpty(volumeGrp))
                {
                    List<Product> relatedProduct = new List<Product>();
                    var products = unitOfWork.GetRepository<Product>().GetTable().Where(x => x.ModelNumber.ToUpper().Equals(volumeGrp.ToUpper()) && (x.DeactivateOn == null || x.DeactivateOn >= DateTime.Now));


                    //if (SiteContext.Current.ShipTo != null && SiteContext.Current.BillTo != null)
                    //{
                    //    var Customer = !string.IsNullOrEmpty(SiteContext.Current.ShipTo.CustomerSequence) ? SiteContext.Current.ShipTo.CustomerRestrictionGroups : SiteContext.Current.BillTo.CustomerRestrictionGroups;

                    //    List<Guid?> restrictionGrps = new List<Guid?>();
                    //    foreach (var restrictionGrp in Customer)
                    //    {
                    //        restrictionGrps.Add(restrictionGrp.RestrictionGroupId);
                    //    }

                    foreach (var product in products)
                    {
                        //    if (product.RestrictionGroupId != null && restrictionGrps.Contains(product.RestrictionGroupId))
                        //    {
                        relatedProduct.Add(product);
                        //    }
                        //    else if (product.RestrictionGroupId == null)
                        //    {
                        //        relatedProduct.Add(product);
                        //   }
                    }


                    Object grpRelatedProduct = relatedProduct.Select(c => new { Name = c.Name, Description = c.ShortDescription });

                    this.AddObjectToResultProperties(result, "grpRelatedProduct", grpRelatedProduct);
                }
            }

            //All Source Codes were getting saved in DB; thats why deleted(BUSA-833)
            if (parameter.Status == "Submitted" || parameter.Status == "AwaitingApproval")
            {
                if (parameter.Properties.ContainsKey("orderSourceCode"))
                {
                    parameter.Properties.Remove("orderSourceCode");
                    var sourceCodeCustomProperty = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.Name == "orderSourceCode" && x.ParentId == result.GetCartResult.Cart.Id).FirstOrDefault();
                    if (sourceCodeCustomProperty != null)
                        unitOfWork.GetRepository<CustomProperty>().Delete(sourceCodeCustomProperty);
                }

                if (parameter.Status == "Submitted" && SiteContext.Current.UserProfile.Salespersons.Count > 0)
                {
                    if (!result.Properties.ContainsKey("salesSourceCode"))
                    {
                        var propertyValue = parameter.Properties.Where(x => x.Key.EndsWithIgnoreCase("salesSourceCode")).Select(x => x.Value).FirstOrDefault() ?? string.Empty;
                        AddOrUpdateProperty(result, "salesSourceCode", propertyValue);
                        SiteContext.Current.UserProfile.Salespersons.FirstOrDefault().SetProperty("SourceCode", propertyValue);
                    }
                }
            }

            this.NextHandler.Execute(unitOfWork, parameter, result);
            return result;
        }
        private void AddOrUpdateProperty(UpdateCartResult result, string key, string value)
        {
            if (result.Properties.ContainsKey(key))
            {
                result.Properties[key] = value;
            }
            else
            {
                result.Properties.Add(key, value);
            }
        }

        public string GetPropertyValue(UpdateCartParameter parameter, string key, string defaultValue = null)
        {
            return parameter.Properties.ContainsKey(key) ? parameter.Properties[key] : defaultValue ?? string.Empty;
        }

        protected UpdateCartResult CancelSubscription(UpdateCartResult result, IUnitOfWork unitOfWork, UpdateCartParameter parameter)
        {
            CustomerOrder cart = result.GetCartResult.Cart;
            this.promotionEngine.ClearPromotions(cart);
            if (parameter.Notes != "")
            {
                cart.Notes = parameter.Notes;
            }
            cart.Status = "SubscriptionCancelled";
            SendSubscriptionCancellationEmail(unitOfWork, cart);
            return result;
        }

        //BUSA-463 : Subscription Cancellation Email.
        protected void SendSubscriptionCancellationEmail(IUnitOfWork unitOfWork, CustomerOrder cart)
        {
            dynamic emailModel = new ExpandoObject();
            List<ExpandoObject> expandoObjectList = new List<ExpandoObject>();

            foreach (OrderLine orderLine in (IEnumerable<OrderLine>)cart.OrderLines)
            {
                dynamic obj1 = new ExpandoObject();
                obj1.ProductName = orderLine.Product.Name;
                obj1.Description = orderLine.Description;
                obj1.QtyOrdered = decimal.Round(orderLine.QtyOrdered, 2);
                obj1.QtyOrderedDisplay = obj1.QtyOrdered.ToString("0.##");
                expandoObjectList.Add(obj1);
            }

            emailModel.OrderNumber = cart.OrderNumber;
            emailModel.OrderLines = expandoObjectList;
            emailModel.CustomerNumber = cart.CustomerNumber;
            if (cart.ShipTo != null && !string.IsNullOrEmpty(cart.ShipTo.CustomerSequence))
            {
                emailModel.CustomerShipToNumber = cart.ShipTo.CustomerSequence;
            }
            else
            {
                emailModel.CustomerShipToNumber = string.Empty;
            }
            var emailTo = cart.CreatedBy;

            var emailList = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyCancellationEmailList", "SmartSupply Cancellation");

            if (emailTo != null)
                this.EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject, unitOfWork);
        }
    }
}
