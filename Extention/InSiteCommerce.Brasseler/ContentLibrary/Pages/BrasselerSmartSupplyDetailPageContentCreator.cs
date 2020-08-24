using Insite.Common.Providers;
using Insite.ContentLibrary.Pages;
using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content;
using InSiteCommerce.Brasseler.ContentLibrary.Widgets;


namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerSmartSupplyDetailPageContentCreator : AbstractContentCreator<BrasselerSmartSupplyDetailPage>
    {
        protected override BrasselerSmartSupplyDetailPage Create()
        {
            var now = DateTimeProvider.Current.Now;
            BrasselerSmartSupplyDetailPage brasselerSmartSupplyDetailPage = this.InitializePageWithParentType<BrasselerSmartSupplyDetailPage>(typeof(BrasselerSmartSupplyListPage), "Standard");
            brasselerSmartSupplyDetailPage.Name = "Smart Supply Details";
            brasselerSmartSupplyDetailPage.Title = "Smart Supply Details";
            brasselerSmartSupplyDetailPage.Url = "/MyAccount/SmartSupply/Detail";
            brasselerSmartSupplyDetailPage.ExcludeFromNavigation = true;
            this.SaveItem(brasselerSmartSupplyDetailPage, now);
            Breadcrumb contentmodel1 = this.InitializeWidget<Breadcrumb>("Content", brasselerSmartSupplyDetailPage, "Standard");
            this.SaveItem(contentmodel1, now);
            this.SaveItem(this.InitializeWidget<PageTitle>("Content", brasselerSmartSupplyDetailPage, "Standard"), now);
            this.SaveItem(this.InitializeWidget<BrasselerSmartSupplyDetailView>("Content", brasselerSmartSupplyDetailPage, "Standard"), now);

            return brasselerSmartSupplyDetailPage;
        }
    }
}
