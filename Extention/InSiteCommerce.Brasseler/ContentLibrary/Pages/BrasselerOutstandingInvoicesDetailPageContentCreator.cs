using Insite.Common.Providers;
using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content;
using InSiteCommerce.Brasseler.ContentLibrary.Widgets;


namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerOutstandingInvoicesDetailPageContentCreator : AbstractContentCreator<BrasselerOutstandingInvoicesDetailPage>
    {
        protected override BrasselerOutstandingInvoicesDetailPage Create()
        {
            var now = DateTimeProvider.Current.Now;
            BrasselerOutstandingInvoicesDetailPage brasselerOutstandingInvoicesDetailPage = this.InitializePageWithParentType<BrasselerOutstandingInvoicesDetailPage>(typeof(BrasselerOutstandingInvoicesListPage), "Standard");
            
            brasselerOutstandingInvoicesDetailPage.Name = "Outstanding Invoice Details";
            brasselerOutstandingInvoicesDetailPage.Title = "Outstanding Invoice Details";
            brasselerOutstandingInvoicesDetailPage.Url = "/MyAccount/OutstandingInvoices/Detail";
            brasselerOutstandingInvoicesDetailPage.ExcludeFromNavigation = true;
            this.SaveItem(brasselerOutstandingInvoicesDetailPage, now);
            Breadcrumb contentmodel1 = this.InitializeWidget<Breadcrumb>("Content", brasselerOutstandingInvoicesDetailPage, "Standard");
            this.SaveItem(contentmodel1, now);
            this.SaveItem(this.InitializeWidget<PageTitle>("Content", brasselerOutstandingInvoicesDetailPage, "Standard"), now);
            this.SaveItem(this.InitializeWidget<BrasselerOutstandingInvoicesDetailView>("Content", brasselerOutstandingInvoicesDetailPage, "Standard"), now);
            
            return brasselerOutstandingInvoicesDetailPage;
        }
    }
}
