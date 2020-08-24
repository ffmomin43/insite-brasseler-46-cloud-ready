using Insite.Common.Providers;
using Insite.ContentLibrary.Pages;
using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content;
using InSiteCommerce.Brasseler.ContentLibrary.Widgets;


namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerOutstandingInvoicesListPageContentCreator : AbstractContentCreator<BrasselerOutstandingInvoicesListPage>
    {
        protected override BrasselerOutstandingInvoicesListPage Create()
        {
            var now = DateTimeProvider.Current.Now;
            BrasselerOutstandingInvoicesListPage brasselerOutstandingInvoicesListPage = this.InitializePageWithParentType<BrasselerOutstandingInvoicesListPage>(typeof(MyAccountPage), "Standard");
            
            brasselerOutstandingInvoicesListPage.Name = "Outstanding Invoices";
            brasselerOutstandingInvoicesListPage.Title = "Outstanding Invoices";
            brasselerOutstandingInvoicesListPage.Url = "/MyAccount/OutstandingInvoices";
            brasselerOutstandingInvoicesListPage.ExcludeFromNavigation = false;
            this.SaveItem(brasselerOutstandingInvoicesListPage, now);
            Breadcrumb contentmodel1 = this.InitializeWidget<Breadcrumb>("Content", brasselerOutstandingInvoicesListPage, "Standard");
            this.SaveItem(contentmodel1, now);
            this.SaveItem(this.InitializeWidget<PageTitle>("Content", brasselerOutstandingInvoicesListPage, "Standard"), now);
            this.SaveItem(this.InitializeWidget<BrasselerOutstandingInvoicesListView>("Content", brasselerOutstandingInvoicesListPage, "Standard"), now);
            
            return brasselerOutstandingInvoicesListPage;
        }
    }
}
