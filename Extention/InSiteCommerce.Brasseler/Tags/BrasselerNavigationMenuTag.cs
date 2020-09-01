using DotLiquid;
using Insite.Common.Dependencies;
using Insite.Common.Logging;
using Insite.ContentLibrary.Pages;
using Insite.Core.Context;
using Insite.WebFramework;
using Insite.WebFramework.Content;
using Insite.WebFramework.Content.Interfaces;
using Insite.WebFramework.Mvc;
using Insite.WebFramework.Mvc.Extensions;
using Insite.WebFramework.Templating;
using Insite.WebFramework.Templating.DotLiquidTags;
using InSiteCommerce.Brasseler.ContentLibrary.Pages;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Microsoft.Ajax.Utilities;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web.Mvc;
using System.Web.UI.WebControls;
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

            //var pageContext = (PageContext.Current as PageContext);
            //var contentController = pageContext.GetType().GetProperty("Controller", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).GetValue(pageContext) as Controller;


            //ViewContext viewContext = new ViewContext(contentController.ControllerContext,
            //    (IView)new FakeView(), contentController.ViewData, contentController.TempData, TextWriter.Null);
            //ViewRenderer viewRenderer = new ViewRenderer((ControllerContext)viewContext);

            //IContentHelper contentHelper = DependencyLocator.Current.GetInstance<IContentHelper>();
            //ITemplateRenderer templateRenderer= DependencyLocator.Current.GetInstance<ITemplateRenderer>();

            //HtmlHelper htmlHelper = new HtmlHelper(viewContext, (IViewDataContainer)new ViewPage());

            //int? variantKey = (int?)contentHelper.GetPage(this.PageName, false).Page?.VariantKey;

            //BrasselerCatalogNavigationPage catalogNavItem = (BrasselerCatalogNavigationPage)contentHelper.GetChildPages<AbstractPage>(contentHelper.GetPage<HomePage>()
            //    .Page.ContentKey)
            //    .Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(contentHelper.GetPage<BrasselerCatalogNavigationPage>().Page.ContentKey))
            //    .FirstOrDefault();

            //MyAccountPage myAccountNavItem = (MyAccountPage)contentHelper.GetChildPages<AbstractPage>(contentHelper.GetPage<HomePage>().Page.ContentKey)
            //    .Where(o => !o.ExcludeFromNavigation && o.ContentKey.Equals(contentHelper.GetPage<MyAccountPage>().Page.ContentKey)).FirstOrDefault();

            //result.Write("<ul>");
            //if (myAccountNavItem != null)
            //{
            //    if (!((SiteContext.Current.UserProfileDto != null) 
            //        && SiteContext.Current.BillTo.CustomerNumber.Length >= 1 
            //        && (SiteContext.Current.BillTo.CustomerNumber.Substring(1) == customSetting.Brasseler_GuestCustomerNumber)))
            //    {
            //        string myAccountThemedPartialPath = htmlHelper.GetThemedPartialPath(string.Format("{0}{1}.cshtml", (object)myAccountNavItem.NavigationViewDirectory, (object)this.ViewName));
            //        result.Write(viewRenderer.RenderPartialView(myAccountThemedPartialPath, (object)myAccountNavItem));
            //    }
            //}


            //if (!variantKey.HasValue)
            //{
            //    LogHelper.For((object)this).Error((object)("No menu navigation can be rendered starting from a page named '" + this.PageName + "' because it could not be found. "), (Exception)null, (string)null, (object)null);
            //}
            //else
            //{
            //    if (!this.SurroundWith.IsBlank())
            //        result.Write("<" + this.SurroundWith + ">");
            //    foreach (AbstractPage abstractPage in instance1.GetChildPagesForVariantKey<AbstractPage>(variantKey.Value, true).Where<AbstractPage>((Func<AbstractPage, bool>)(o => !o.ExcludeFromNavigation)))
            //    {
            //        string str = instance2.Render(string.Format("[% navigationMenuItem {0} '{1}' %]", (object)abstractPage.VariantKey, (object)this.ViewName));
            //        result.Write(str);
            //    }
            //    if (this.SurroundWith.IsBlank())
            //        return;
            //    result.Write("</" + this.SurroundWith + ">");
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
    }

