using Insite.Catalog.Services.Dtos;
using Insite.Catalog.Services.Parameters;
using Insite.Catalog.Services.Results;
using Insite.Common.Helpers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Localization;
using Insite.Core.Plugins.Search.Dtos;
using Insite.Core.Services.Handlers;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Linq;


namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("GetProductCollectionHandler_Brasseler")]
    public class GetProductCollectionHandler_Brasseler : HandlerBase<GetProductCollectionParameter, GetProductCollectionResult>
    {

        protected readonly Lazy<ITranslationLocalizer> TranslationLocalizer;
        protected CustomSettings customSettings;

        public override int Order
        {
            get
            {
                return 1290;
            }
        }

        public GetProductCollectionHandler_Brasseler(Lazy<ITranslationLocalizer> translationLocalizer)
        {

            TranslationLocalizer = translationLocalizer;
        }

        public override GetProductCollectionResult Execute(IUnitOfWork unitOfWork, GetProductCollectionParameter parameter, GetProductCollectionResult result)
        {
            customSettings = new CustomSettings();
            string showDisProAttr = customSettings.Brasseler_DiscontinuedAttributeValueId;
            bool addShowDiscontinuedProducts = true;
            if (result.AttributeTypeDtos != null)
            {
                foreach (var item in result.AttributeTypeDtos)
                {
                    for (int i = 0; i < item.AttributeValueFacets.Count; i++)
                    {
                        if (item.AttributeValueFacets[i].AttributeValueId == new Guid(showDisProAttr))
                        {
                            addShowDiscontinuedProducts = false;
                        }
                    }
                }
                if (addShowDiscontinuedProducts)
                {
                    AttributeValueFacetDto aVFD = new AttributeValueFacetDto();

                    aVFD.AttributeValueId = new Guid(showDisProAttr);
                    aVFD.Value = "Show Discontinued Products";
                    aVFD.ValueDisplay = "Show Discontinued Products";

                    if (result.AttributeTypeDtos.Count >= 1)
                    {
                        foreach (var item in result.AttributeTypeDtos)
                        {
                            if (item.Name == "Discontinued Products")
                            {
                                item.AttributeValueFacets.Add(aVFD);
                            }
                        }
                    }
                }
            }
            //BUSA-328 Compare screen does not update price if logging directly into page start
            var currentUser = SiteContext.Current.ShipTo;
            foreach (var product in result.ProductDtos)
            {
                //BUSA-771 : If signed in Add to cart button should get hidden if product is suspended, discontinued and inventory is not available.If not then Add to cart button should be visible except if it is discontiued.
                //    product.CanAddToCart = !product.IsDiscontinued;
                if (SiteContext.Current.UserProfileDto == null && !product.IsDiscontinued)
                {
                    product.CanAddToCart = true;
                }
                else if (product.IsDiscontinued)
                {
                    product.CanAddToCart = false;
                }
                //BUSA-771 : If signed in Add to cart button should get hidden if product is suspended, discontinued and inventory is not available.If not then Add to cart button should be visible except if it is discontiued.
                if (currentUser != null)
                {
                    product.CanShowPrice = true;
                }
                else
                {
                    product.CanShowPrice = false;
                }

                // BUSA-463 : Subscription Starts
                if (currentUser != null)
                {

                    var isSubscriptionEligibleCount = currentUser.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsCustomerEligibleSubscription")).Count();
                    if (isSubscriptionEligibleCount > 0)
                    {
                        var IsCustomerEligibleSubscription = currentUser.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsCustomerEligibleSubscription")).FirstOrDefault().Value;
                        if (!string.IsNullOrEmpty(IsCustomerEligibleSubscription))
                        {
                            if (product.IsSubscription)
                            {
                                if (IsCustomerEligibleSubscription.EqualsIgnoreCase("True") && currentUser.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Count() > 0)
                                {
                                    var SubscriptionDiscount = currentUser.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Value;

                                    // Null check to view the Subcriptio order in Order History.
                                    if (!string.IsNullOrEmpty(SubscriptionDiscount) && product.Pricing != null)
                                    {
                                        var regularPrice = product.Pricing.UnitNetPrice;
                                        Decimal percent = decimal.Parse(SubscriptionDiscount) / new Decimal(100);
                                        var SubscriptionAmount = NumberHelper.ApplyDiscount(regularPrice, percent);

                                        this.AddOrUpdateProperty(product, "SubscriptionDiscount", SubscriptionDiscount);
                                        // display SubscriptionAmount in desired Format.
                                        this.AddOrUpdateProperty(product, "SubscriptionAmount", String.Format("{0:n}", SubscriptionAmount));
                                        this.AddOrUpdateProperty(product, "IsCustomerEligibleSubscription", IsCustomerEligibleSubscription);
                                    }
                                }
                            }
                        }
                    }
                }
                // BUSA-463 : Subscription Ends
            }
            //BUSA-328 Compare screen does not update price if logging directly into page end
            //BUSA-636 : Pricing 2018. Switch on/off PLP volume group messages.
            var useVolumeGroupPricing = customSettings.UseVolumeGroupPricing;
            result.Properties.Add("useVolumeGroupPricing", useVolumeGroupPricing);
            return NextHandler.Execute(unitOfWork, parameter, result);
        }

        // BUSA-463 : Subscription Starts
        private void AddOrUpdateProperty(ProductDto result, string key, string value)
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
        // BUSA-463 : Subscription Ends

    }
}