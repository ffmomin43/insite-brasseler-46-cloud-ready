using DotLiquid;
using Insite.Common.Dependencies;
using Insite.ContentLibrary.Pages;
using Insite.Core.Context;
using Insite.WebFramework;
using Insite.WebFramework.Content;
using Insite.WebFramework.Content.Interfaces;
using Insite.WebFramework.Mvc;
using InSiteCommerce.Brasseler.ContentLibrary.Pages;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web.Mvc;
using static Insite.WebFramework.Mvc.Extensions.HtmlHelperExtensions;

/*
 * The class displays Custom Navigation using dotliquid tag "BrasselerNavigationMenu"  
*/
namespace InSiteCommerce.Brasseler.Tags
{
    public class BrasselerNavigationMenuTag : Tag
    {
        protected string ViewName { get; set; } = "Standard";

        CustomSettings customSetting = new CustomSettings();

        protected virtual string PageName { get; set; } = "Home";
        protected virtual string SurroundWith { get; set; } = "ul";

        public override void Initialize(string tagName, string markup, List<string> tokens)
        {
            markup = markup.Trim();
            if (string.IsNullOrEmpty(markup))
            {
                base.Initialize(tagName, markup, tokens);
            }
        }

        public override void Render(DotLiquid.Context context, TextWriter result)
        {
            var pageContext = (PageContext.Current as PageContext);
            var contentController = pageContext.GetType().GetProperty("Controller", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).GetValue(pageContext) as Controller;


            ViewContext viewContext = new ViewContext(contentController.ControllerContext,
                (IView)new FakeView(), contentController.ViewData, contentController.TempData, TextWriter.Null);
            ViewRenderer viewRenderer = new ViewRenderer((ControllerContext)viewContext);
            HtmlHelper htmlHelper = new HtmlHelper(viewContext, (IViewDataContainer)new ViewPage());
            IContentHelper contentHelper = DependencyLocator.Current.GetInstance<IContentHelper>();
            int parentVariantKey = contentHelper.GetPage("Home", false).Page.VariantKey.Value;

            BrasselerCatalogNavigationPage catalogNavItem = (BrasselerCatalogNavigationPage)contentHelper.GetChildPages<AbstractPage>(contentHelper.GetPage<HomePage>()
                .Page.ContentKey)
                .Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(contentHelper.GetPage<BrasselerCatalogNavigationPage>().Page.ContentKey))
                .FirstOrDefault();


            MyAccountPage myAccountNavItem = (MyAccountPage)contentHelper.GetChildPages<AbstractPage>(contentHelper.GetPage<HomePage>().Page.ContentKey).Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(contentHelper.GetPage<MyAccountPage>().Page.ContentKey)).FirstOrDefault();

            result.Write("<ul>");

            if (catalogNavItem != null)
            {
                string catalogThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)catalogNavItem.NavigationViewDirectory, (object)this.ViewName));
                result.Write(viewRenderer.RenderPartialView(catalogThemedPartialPath, (object)catalogNavItem));
            }

            if (myAccountNavItem != null)
            {
                if (!((SiteContext.Current.UserProfileDto != null) && (SiteContext.Current.BillTo.CustomerNumber.Length >= 1 && (SiteContext.Current.BillTo.CustomerNumber.Substring(1) == customSetting.Brasseler_GuestCustomerNumber))))
                {
                    string myAccountThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)myAccountNavItem.NavigationViewDirectory, (object)this.ViewName));
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

        public class FakeView : IView
        {
            public FakeView() { }

            public void Render(ViewContext viewContext, TextWriter writer)
            {
                this.Render(viewContext, writer);
            }
        }
    //BrasselerNavigation TODO
    //public class BrasselerNavigationMenuTag : Tag
    //{
    //    private static readonly Regex ViewNameRegex = new Regex("^(?<quote>['\\\"])(?<viewName>[a-zA-Z\\-_0-9]+)\\k<quote>$");
    //    private static readonly Regex MultipleParametersRegex = new Regex("viewName:(\\s)+(?<viewNameQuote>['\\\"])(?<viewName>[a-zA-Z\\-_0-9]+)\\k<viewNameQuote>(\\s)?|surroundWith:(\\s)*(?<surroundQuote>['\\\"])(?<surroundWith>[a-zA-Z\\-_0-9]*)\\k<surroundQuote>(\\s)?|pageName:(\\s)*(?<pageNameQuote>['\\\"])(?<pageName>[a-zA-Z\\s0-9\\-_]+)\\k<pageNameQuote>(\\s)?");

    //    protected string ViewName { get; set; } = "BrasselerStandard";

    //    protected virtual string SurroundWith { get; set; } = "ul";

    //    CustomSettings customSetting = new CustomSettings();

    //    protected virtual string NameOfTag
    //    {
    //        get
    //        {
    //            return "BrasselerNavigationMenu";
    //        }
    //    }

    //    protected virtual string PageName { get; set; } = "Home";

    //    public override void Initialize(string tagName, string markup, List<string> tokens)
    //    {
    //        markup = markup.Trim();
    //        if (string.IsNullOrEmpty(markup))
    //        {
    //            base.Initialize(tagName, markup, tokens);
    //        }
    //        else
    //        {
    //            if (ViewNameRegex.IsMatch(markup))
    //                this.ViewName = ViewNameRegex.Match(markup).Groups["viewName"].Value;
    //            else if (MultipleParametersRegex.IsMatch(markup))
    //            {
    //                foreach (Match match in MultipleParametersRegex.Matches(markup))
    //                {
    //                    if (!match.Groups["viewName"].Value.IsBlank())
    //                        this.ViewName = match.Groups["viewName"].Value;
    //                    if (!match.Groups["surroundQuote"].Value.IsBlank())
    //                        this.SurroundWith = match.Groups["surroundWith"].Value;
    //                    if (!match.Groups["pageName"].Value.IsBlank())
    //                        this.PageName = match.Groups["pageName"].Value;
    //                }
    //            }
    //            else
    //                throw new ArgumentException("The markup for the " + this.NameOfTag + " tag was: '" + markup + "' which appears incorrect. It should be " + this.NameOfTag + " '[ViewName]' or " + this.NameOfTag + " viewName: '[ViewName]' surroundWith: '[SurroundWith]' pageName: '[PageName]'");
    //            base.Initialize(tagName, markup, tokens);
    //        }
    //    }

    //    public override void Render(Context context, TextWriter result)
    //    {
    //        IContentHelper instance1 = DependencyLocator.Current.GetInstance<IContentHelper>();
    //        ITemplateRenderer instance2 = DependencyLocator.Current.GetInstance<ITemplateRenderer>();
    //        int? variantKey = (int?)instance1.GetPage(this.PageName, false).Page?.VariantKey;

    //        BrasselerCatalogNavigationPage catalogNavItem = (BrasselerCatalogNavigationPage)instance1.GetChildPages<AbstractPage>(instance1.GetPage<HomePage>().Page.ContentKey).Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(instance1.GetPage<BrasselerCatalogNavigationPage>().Page.ContentKey)).FirstOrDefault();

    //        MyAccountPage myAccountNavItem = (MyAccountPage)instance1.GetChildPages<AbstractPage>(instance1.GetPage<HomePage>().Page.ContentKey).Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(instance1.GetPage<MyAccountPage>().Page.ContentKey)).FirstOrDefault();

    //        result.Write("<ul>");

    //        if (catalogNavItem != null)
    //        {
    //            //string catalogThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)catalogNavItem.NavigationViewDirectory, (object)this.viewName));
    //            //result.Write(viewRenderer.RenderPartialView(catalogThemedPartialPath, (object)catalogNavItem));
    //            string str = instance2.Render(string.Format("[% BrasselerNavigationMenuItem {0} '{1}' %]", (object)catalogNavItem.VariantKey, (object)this.ViewName));
    //            result.Write(str);

    //            //string str = instance2.Render(string.Format("[% BrasselerNavigationMenu {0} '{1}' %]", (object)catalogNavItem.VariantKey, (object)this.ViewName));
    //            //result.Write(str);
    //        }

    //        if (myAccountNavItem != null)
    //        {
    //            if (!((SiteContext.Current.UserProfileDto != null) && (SiteContext.Current.BillTo.CustomerNumber.Length >= 1 && (SiteContext.Current.BillTo.CustomerNumber.Substring(1) == customSetting.Brasseler_GuestCustomerNumber))))
    //            {
    //                //string myAccountThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)myAccountNavItem.NavigationViewDirectory, (object)this.viewName));
    //                //result.Write(viewRenderer.RenderPartialView(myAccountThemedPartialPath, (object)myAccountNavItem));
    //                string str = instance2.Render(string.Format("[% BrasselerNavigationMenuItem {0} '{1}' %]", (object)myAccountNavItem.VariantKey, (object)this.ViewName));
    //                result.Write(str);
    //            }
    //        }


    //        //foreach (AbstractPage abstractPage in instance1.GetChildPagesForVariantKey<AbstractPage>(variantKey.Value, true).Where<AbstractPage>((Func<AbstractPage, bool>)(o => !o.ExcludeFromNavigation)))
    //        //{
    //        //    string str = instance2.Render(string.Format("[% BrasselerNavigationMenuItem {0} '{1}' %]", (object)abstractPage.VariantKey, (object)this.ViewName));
    //        //    result.Write(str);
    //        //}

    //        if (SiteContext.Current.UserProfileDto != null)
    //        {
    //            result.Write("<li style='float:right'> <a class='cms-linklist-linkitem' href='/QuickOrder'>[% translate 'Quick Order' %]</a></li>");
    //        }

    //        result.Write("</ul>");
    //    }
    //}
}

