using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Plugins.RulesEngine;
using Insite.Core.Plugins.Content;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Plugins.PromotionEngines;
using System;
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    public class PromotionEngine_Brasseler : PromotionEngine
    {
        public PromotionEngine_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, IRulesEngine rulesEngine, IPromotionResultServiceFactory promotionResultServiceFactory, IContentModeProvider contentModeProvider, CheckoutSettings checkoutSettings) :
             base(unitOfWorkFactory, rulesEngine, promotionResultServiceFactory, contentModeProvider, checkoutSettings)
        {

        }

        decimal orderPromoRank = 0;// BUSA-530 : Promotion is unavailable error message is displayed when user applying second coupon code

        protected override IList<Promotion> GetQualifyingPromotions(CustomerOrder customerOrder)
        {
            List<Promotion> promotionList = new List<Promotion>();
            IEnumerable<string> orderPromotionCodes = customerOrder.OrderPromotionCodes.Select<OrderPromotionCode, string>((Func<OrderPromotionCode, string>)(o => o.Code));
            List<object> rulesEngineContextObjects = new List<object>()
      {
        (object) customerOrder,
        (object) customerOrder.Customer
      };
            UserProfileDto userProfile = SiteContext.Current.UserProfileDto;
            if (userProfile != null)
                rulesEngineContextObjects.Add((object)userProfile);
            //IList<Promotion> promotions = this.Promotions;
            IRepository<CustomerOrderPromotion> promotions = this.UnitOfWork.GetRepository<CustomerOrderPromotion>();
            IOrderedEnumerable<Promotion> source = this.Promotions.OrderBy<Promotion, bool>(new Func<Promotion, bool>(this.CheckIfPromotionHasOrderPromotionRule));
            foreach (Promotion prd in source.Where<Promotion>((Func<Promotion, bool>)(promotion =>
            {
                if (promotion.PromoCode.IsBlank() || this.ListContainsPromotionCode(orderPromotionCodes, promotion.PromoCode))
                    return this.RulesEngine.Execute((IBusinessObject)promotion, rulesEngineContextObjects);
                return false;
            })))
            {
                if (prd.PromotionResults.Where(p => p.PromotionResultType == "PercentOffOrder" || p.PromotionResultType == "AmountOffOrder").Count() > 0)
                {
                    // BUSA-530 : Promotion is unavailable error message is displayed when user applying second coupon code Starts
                    if (string.IsNullOrEmpty(prd.PromoCode))
                    {
                        if (prd.Rank > orderPromoRank)
                        {
                            orderPromoRank = prd.Rank;
                        }
                    }
                    // BUSA-530 : Promotion is unavailable error message is displayed when user applying second coupon code Ends
                }
            }

            // BUSA-530 : Promotion is unavailable error message is displayed when user applying second coupon code Starts
            foreach (Promotion promotion in source.Where<Promotion>((Func<Promotion, bool>)(promotion =>
            {
                if (promotion.PromoCode.IsBlank() || this.ListContainsPromotionCode(orderPromotionCodes, promotion.PromoCode))
                    return this.RulesEngine.Execute((IBusinessObject)promotion, rulesEngineContextObjects);
                return false;
            })))
            {
                if ((promotion.PromotionResults.Where(p => p.PromotionResultType == "PercentOffOrder" || p.PromotionResultType == "AmountOffOrder").Count() > 0))
                {
                    if (orderPromoRank <= promotion.Rank && string.IsNullOrEmpty(promotion.PromoCode))
                    {
                        CustomerOrderPromotion inserted = new CustomerOrderPromotion()
                        {
                            CustomerOrderId = customerOrder.Id,
                            CustomerOrder = customerOrder,
                            PromotionId = promotion.Id,
                            Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotion.Id)
                        };
                        promotionList.Add(promotion);
                        customerOrder.CustomerOrderPromotions.Add(inserted);
                        promotions.Insert(inserted);
                    }
                    else
                    {
                        if (customerOrder.OrderPromotionCodes != null)
                        {
                            foreach (var pro in customerOrder.CustomerOrderPromotions)
                            {
                                if (pro.Promotion.PromotionResults.Where(p => p.PromotionResultType == "PercentOffOrder" || p.PromotionResultType == "AmountOffOrder").Count() > 0)
                                {
                                    if (string.IsNullOrEmpty(pro.Promotion.PromoCode))
                                    {
                                        promotionList.Remove(pro.Promotion);
                                        customerOrder.CustomerOrderPromotions.Remove(pro);
                                        promotions.Delete(pro);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (!string.IsNullOrEmpty(promotion.PromoCode) && orderPromoRank <= promotion.Rank)
                    {
                        if (promotion.PromotionResults.Where(p => p.PromotionResultType == "PercentOffOrder" || p.PromotionResultType == "AmountOffOrder").Count() > 0)
                        {
                            if (!string.IsNullOrEmpty(promotion.PromoCode))
                            {
                                CustomerOrderPromotion inserted = new CustomerOrderPromotion()
                                {
                                    CustomerOrderId = customerOrder.Id,
                                    CustomerOrder = customerOrder,
                                    PromotionId = promotion.Id,
                                    Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotion.Id)
                                };
                                promotionList.Add(promotion);
                                customerOrder.CustomerOrderPromotions.Add(inserted);
                                promotions.Insert(inserted);
                            }
                        }
                    }
                }
                //BUSA-574 : Promotion with highest rank overrides previously applied promotion on category level Starts
                else if (promotion.RuleManager.RuleClauses.Where(x => x.CriteriaType == "OrderedProductCategory").Count() > 0)
                {
                    CustomerOrderPromotion inserted = new CustomerOrderPromotion()
                    {
                        CustomerOrderId = customerOrder.Id,
                        CustomerOrder = customerOrder,
                        PromotionId = promotion.Id,
                        Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotion.Id)
                    };
                    promotionList.Add(promotion);
                    customerOrder.CustomerOrderPromotions.Add(inserted);
                    promotions.Insert(inserted);

                }
                //BUSA-574 : Promotion with highest rank overrides previously applied promotion on category level Ends
                else
                {
                    //BUSA-569 : Bundle Promotion with highest rank overrides previous applied promotions Starts.
                    //BUSA-620 : Error with API call popup is displayed on PLP page Starts
                    Guid? productId = Guid.Empty;
                    if (promotion.PromotionResults.Count() > 0)
                    {
                        productId = promotion.PromotionResults.FirstOrDefault().ProductId;
                    }
                    //BUSA-620 : Error with API call popup is displayed on PLP page Ends
                    decimal productHighRank = 0;
                    foreach (Promotion prd in source.Where<Promotion>((Func<Promotion, bool>)(promotion1 =>
                    {
                        if (promotion1.PromoCode.IsBlank() || this.ListContainsPromotionCode(orderPromotionCodes, promotion1.PromoCode))
                            return this.RulesEngine.Execute((IBusinessObject)promotion1, rulesEngineContextObjects);
                        return false;
                    })))
                    {
                        if (!(prd.PromotionResults.Where(p => p.PromotionResultType == "PercentOffOrder" || p.PromotionResultType == "AmountOffOrder").Count() > 0))
                        {
                            if (string.IsNullOrEmpty(prd.PromoCode))
                            {
                                var a = prd.PromotionResults.Where(p => p.ProductId == productId).FirstOrDefault();
                                if (a != null && a.ProductId == productId)
                                {
                                    if (prd.Rank > productHighRank)
                                    {
                                        productHighRank = prd.Rank;
                                    }
                                }
                            }
                        }
                    }
                    if (productHighRank <= promotion.Rank && string.IsNullOrEmpty(promotion.PromoCode))
                    {
                        CustomerOrderPromotion inserted = new CustomerOrderPromotion()
                        {
                            CustomerOrderId = customerOrder.Id,
                            CustomerOrder = customerOrder,
                            PromotionId = promotion.Id,
                            Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotion.Id)
                        };
                        promotionList.Add(promotion);
                        customerOrder.CustomerOrderPromotions.Add(inserted);
                        promotions.Insert(inserted);
                    }

                    if (!string.IsNullOrEmpty(promotion.PromoCode) && productHighRank <= promotion.Rank)
                    {
                        if (!string.IsNullOrEmpty(promotion.PromoCode))
                        {
                            CustomerOrderPromotion inserted = new CustomerOrderPromotion()
                            {
                                CustomerOrderId = customerOrder.Id,
                                CustomerOrder = customerOrder,
                                PromotionId = promotion.Id,
                                Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotion.Id)
                            };
                            promotionList.Add(promotion);
                            customerOrder.CustomerOrderPromotions.Add(inserted);
                            promotions.Insert(inserted);
                        }
                    }

                    //BUSA-569 : Bundle Promotion with highest rank overrides previous applied promotions Ends.
                }

                // BUSA-463 : Subscription Starts
                if (promotion.PromotionResults.Where(p => p.PromotionResultType == "DiscountSubscriptionProduct").Count() > 0)
                {
                    var subscriptionPromotionCount = promotionList.Where(x => x.PromotionResults.Where( p => p.PromotionResultType == "DiscountSubscriptionProduct").Count() > 0).Count();
                    if (subscriptionPromotionCount == 0)
                    {
                        {
                            CustomerOrderPromotion inserted = new CustomerOrderPromotion()
                            {
                                CustomerOrderId = customerOrder.Id,
                                CustomerOrder = customerOrder,
                                PromotionId = promotion.Id,
                                Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotion.Id)
                            };
                            promotionList.Add(promotion);
                            customerOrder.CustomerOrderPromotions.Add(inserted);
                            promotions.Insert(inserted);
                        }
                    }
                }
                // BUSA-463 : Subscription Ends

                if (!this.CheckoutSettings.AllowMultiplePromotions)
                    return (IList<Promotion>)promotionList;
            }
            // BUSA-530 : Promotion is unavailable error message is displayed when user applying second coupon code Ends

            // BUSA-462 : Subscription. Display only SmartSupply Promotions on SmartSupply Detail page.
            if (customerOrder.Status.EqualsIgnoreCase("SubscriptionOrder") && promotionList.Count() > 0)
            {
                List<Promotion> lstPromo = new List<Promotion>();

                promotionList.ForEach(x =>
                {
                    if (x.PromotionResults.Where(r => r.PromotionResultType == "DiscountSubscriptionProduct").Count() > 0 || x.PromotionResults.Where(r => r.PromotionResultType == "DiscountSubscriptionShipping").Count() > 0)
                    {
                        lstPromo.Add(x);
                    }
                });

                var lstPromotionNotApplicable = promotionList.Except(lstPromo).ToList();

                foreach (var p in lstPromotionNotApplicable)
                {

                    promotionList.Remove(p);
                    var cop = customerOrder.CustomerOrderPromotions.Where(x => x.PromotionId == p.Id)?.FirstOrDefault();
                    customerOrder.CustomerOrderPromotions.Remove(cop);
                    promotions.Delete(cop);
                }

            }

            return (IList<Promotion>)promotionList;
        }
    }
}