using Insite.Common.Providers;
using Insite.ContentLibrary.Pages;
using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content;
using InSiteCommerce.Brasseler.ContentLibrary.Widgets;


namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerSmartSupplyListPageContentCreator : AbstractContentCreator<BrasselerSmartSupplyListPage>
    {
        protected override BrasselerSmartSupplyListPage Create()
        {
            var now = DateTimeProvider.Current.Now;
            BrasselerSmartSupplyListPage brasselerSmartSupplyListPage = this.InitializePageWithParentType<BrasselerSmartSupplyListPage>(typeof(MyAccountPage), "Standard");
            brasselerSmartSupplyListPage.Name = "Smart Supply";
            brasselerSmartSupplyListPage.Title = "Smart Supply";
            brasselerSmartSupplyListPage.Url = "/MyAccount/SmartSupply";
            brasselerSmartSupplyListPage.ExcludeFromNavigation = false;
            this.SaveItem(brasselerSmartSupplyListPage, now);
            Breadcrumb contentmodel1 = this.InitializeWidget<Breadcrumb>("Content", brasselerSmartSupplyListPage, "Standard");
            this.SaveItem(contentmodel1, now);
            this.SaveItem(this.InitializeWidget<PageTitle>("Content", brasselerSmartSupplyListPage, "Standard"), now);
            this.SaveItem(this.InitializeWidget<BrasselerSmartSupplyListView>("Content", brasselerSmartSupplyListPage, "Standard"), now);

            return brasselerSmartSupplyListPage;
        }
    }
}
