using Insite.Common.Providers;
using Insite.ContentLibrary.Pages;
using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content;
using InSiteCommerce.Brasseler.ContentLibrary.Widgets;


namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerPaymentOptionsPageContentCreator : AbstractContentCreator<BrasselerPaymentOptionsPage>
    {
        protected override BrasselerPaymentOptionsPage Create()
        {
            var now = DateTimeProvider.Current.Now;
            BrasselerPaymentOptionsPage brasselerPaymentOptionspage = this.InitializePageWithParentType<BrasselerPaymentOptionsPage>(typeof(MyAccountPage), "Standard");
            brasselerPaymentOptionspage.Name = "Payment Options";
            brasselerPaymentOptionspage.Title = "Payment Options";
            brasselerPaymentOptionspage.Url = "/MyAccount/PaymentOptions";
            brasselerPaymentOptionspage.ExcludeFromNavigation = false;
            this.SaveItem(brasselerPaymentOptionspage, now);
            Breadcrumb contentmodel1 = this.InitializeWidget<Breadcrumb>("Content", brasselerPaymentOptionspage, "Standard");
            this.SaveItem(contentmodel1, now);
            this.SaveItem(this.InitializeWidget<PageTitle>("Content", brasselerPaymentOptionspage, "Standard"), now);
            this.SaveItem(this.InitializeWidget<BrasselerPaymentOptionsView>("Content", brasselerPaymentOptionspage, "Standard"), now);

            return brasselerPaymentOptionspage;
        }
    }
}
