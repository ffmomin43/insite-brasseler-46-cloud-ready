using Insite.Catalog.Services;
using Insite.Common.Providers;
using Insite.ContentLibrary.Pages;
using Insite.ContentLibrary.Providers;
using Insite.WebFramework.Content;

namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerCatalogNavigationPageContentCreator : AbstractContentCreator<BrasselerCatalogNavigationPage>
    {
        protected readonly ICatalogLinkProvider _catalogLinkProvider;
        protected readonly ICatalogService _catalogService;
        public BrasselerCatalogNavigationPageContentCreator(ICatalogLinkProvider catalogLinkProvider, ICatalogService catalogService)
        {
            this._catalogLinkProvider = catalogLinkProvider;
            this._catalogService = catalogService;
        }

        protected override BrasselerCatalogNavigationPage Create()
        {
            var now = DateTimeProvider.Current.Now;
            var brasselerCatalogNavPage = this.InitializePageWithParentType<BrasselerCatalogNavigationPage>(typeof(HomePage));            
            brasselerCatalogNavPage.Name = "BrasselerCatalogNavigation Page";
            brasselerCatalogNavPage.Title = "BrasselerCatalogNavigation Page";
            brasselerCatalogNavPage.NavigationViewDirectory = "~/Views/Pages/BrasselerCatalogNavigationPage/";
            brasselerCatalogNavPage.ExcludeFromNavigation = false;
            this.SaveItem(brasselerCatalogNavPage, now);
            return brasselerCatalogNavPage;
        }

    }
}
