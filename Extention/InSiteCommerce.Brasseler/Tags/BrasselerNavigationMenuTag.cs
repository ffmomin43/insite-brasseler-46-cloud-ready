using DotLiquid;
using Insite.Common.Dependencies;
using Insite.ContentLibrary.Pages;
using Insite.Core.Context;
using Insite.WebFramework;
using Insite.WebFramework.Content;
using Insite.WebFramework.Content.Interfaces;
using Insite.WebFramework.Mvc;
using Insite.WebFramework.Mvc.Extensions;
using Insite.WebFramework.Templating.DotLiquidTags;
using InSiteCommerce.Brasseler.ContentLibrary.Pages;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web.Mvc;
using System.Web.UI.WebControls;

/*
 * The class displays Custom Navigation using dotliquid tag "BrasselerNavigationMenu"  
*/
namespace InSiteCommerce.Brasseler.Tags
{
    public class BrasselerNavigationMenuTag : Tag
    {
        private string viewName = "Standard";
        CustomSettings customSetting = new CustomSettings();

        public override void Initialize(string tagName, string markup, List<string> tokens)
        {
            markup = markup.Trim();
            if (string.IsNullOrEmpty(markup))
            {
                base.Initialize(tagName, markup, tokens);
            }
        }

        public override void Render(Context context, TextWriter result)
        {
            var pageContext = (PageContext.Current as PageContext);
            var contentController = pageContext.GetType().GetProperty("Controller", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).GetValue(pageContext) as Controller;


            ViewContext viewContext = new ViewContext(contentController.ControllerContext, 
                (IView)new View(), contentController.ViewData, contentController.TempData, TextWriter.Null);
            ViewRenderer viewRenderer = new ViewRenderer((ControllerContext)viewContext);
            HtmlHelper htmlHelper = new HtmlHelper(viewContext, (IViewDataContainer)new ViewPage());
            IContentHelper instance = DependencyLocator.Current.GetInstance<IContentHelper>();
            int parentVariantKey = instance.GetPage("Home", false).Page.VariantKey.Value;

            BrasselerCatalogNavigationPage catalogNavItem = (BrasselerCatalogNavigationPage)instance.GetChildPages<AbstractPage>(instance.GetPage<HomePage>().Page.ContentKey).Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(instance.GetPage<BrasselerCatalogNavigationPage>().Page.ContentKey)).FirstOrDefault();

            MyAccountPage myAccountNavItem = (MyAccountPage)instance.GetChildPages<AbstractPage>(instance.GetPage<HomePage>().Page.ContentKey).Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(instance.GetPage<MyAccountPage>().Page.ContentKey)).FirstOrDefault();

            result.Write("<ul>");

            if (catalogNavItem != null)
            {
                string catalogThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)catalogNavItem.NavigationViewDirectory, (object)this.viewName));
                result.Write(viewRenderer.RenderPartialView(catalogThemedPartialPath, (object)catalogNavItem));
            }

            if (myAccountNavItem != null)
            {
                if (!((SiteContext.Current.UserProfileDto != null) && (SiteContext.Current.BillTo.CustomerNumber.Length >= 1 && (SiteContext.Current.BillTo.CustomerNumber.Substring(1) == customSetting.Brasseler_GuestCustomerNumber))))
                {
                    string myAccountThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)myAccountNavItem.NavigationViewDirectory, (object)this.viewName));
                    result.Write(viewRenderer.RenderPartialView(myAccountThemedPartialPath, (object)myAccountNavItem));
                }
            }

            if (SiteContext.Current.UserProfileDto != null)
            {
                result.Write("<li style='float:right'> <a class='cms-linklist-linkitem' href='/QuickOrder'>[% translate 'Quick Order' %]</a></li>");
            }

            result.Write("</ul>");
        }
    }
}
