using Insite.Catalog.Services;
using Insite.Catalog.Services.Parameters;
using Insite.ContentLibrary.Providers;
using Insite.Core.Interfaces.Localization;
using Insite.WebFramework.Content;
using Insite.WebFramework.Mvc;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;

namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerCatalogNavigationPagePreparer : GenericPreparer<BrasselerCatalogNavigationPage>
    {
        protected readonly ICatalogLinkProvider _catalogLinkProvider;
        protected readonly ICatalogService _catalogService;
        public BrasselerCatalogNavigationPagePreparer(ITranslationLocalizer translationLocalizer, ICatalogLinkProvider catalogLinkProvider, ICatalogService catalogService)
      : base(translationLocalizer)
        {
            this._catalogLinkProvider = catalogLinkProvider;
            this._catalogService = catalogService;
        }

        public override void Prepare(BrasselerCatalogNavigationPage contentItem)
        {
            var categoryMenuLinks = _catalogLinkProvider.GetCategoryMenuLinks(new int?());
            GetCategoryParameter parameter = new GetCategoryParameter();
            contentItem.BrasselerCategoryLinks = new List<BrasselerCatalogNavigationPage.BrasselerCategoryNavLink>();
            var CategoryLinks = new List<BrasselerCatalogNavigationPage.BrasselerCategoryNavLink>();
            foreach (var cateogoryNavLink in categoryMenuLinks)
            {
                BrasselerCatalogNavigationPage.BrasselerCategoryNavLink brasselerCategoryNavLink = new BrasselerCatalogNavigationPage.BrasselerCategoryNavLink();
                brasselerCategoryNavLink.Properties = new Dictionary<string, string>();
                brasselerCategoryNavLink.CategoryNavLink = cateogoryNavLink;
                parameter.CategoryId = cateogoryNavLink.CategoryId;
                var categoryResult = _catalogService.GetCategory(parameter);
                var isShoppingList = (categoryResult.Properties["IsShoppingList"] != null && !string.IsNullOrEmpty(categoryResult.Properties["IsShoppingList"])) ? categoryResult.Properties["IsShoppingList"] : "false";
                brasselerCategoryNavLink.IsShoppingListCategory = isShoppingList.EqualsIgnoreCase("true");
                if (brasselerCategoryNavLink.Properties.ContainsKey("IsShoppingList"))
                    brasselerCategoryNavLink.Properties["IsShoppingList"] = isShoppingList;
                else
                    brasselerCategoryNavLink.Properties.Add("IsShoppingList", isShoppingList);
                CategoryLinks.Add(brasselerCategoryNavLink);
            }
            contentItem.BrasselerCategoryLinks = CategoryLinks.Distinct().ToList();
            contentItem.IsShoppingListMenu = false;
            contentItem.NavigationViewDirectory = "~/Views/Pages/BrasselerCatalogNavigationPage/";
        }

    }
}
