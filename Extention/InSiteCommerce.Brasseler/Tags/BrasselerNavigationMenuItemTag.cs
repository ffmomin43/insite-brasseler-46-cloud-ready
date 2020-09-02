using DotLiquid;
using Insite.Common.Dependencies;
using Insite.Core.Plugins.Content;
using Insite.WebFramework.Content;
using Insite.WebFramework.Content.Interfaces;
using Insite.WebFramework.Content.Services.Interfaces;
using Insite.WebFramework.Mvc;
using Insite.WebFramework.Routing;
using Insite.WebFramework.Templating.DotLiquidTags;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
//BrasselerNavigation TODO
namespace Extention.InSiteCommerce.Brasseler.Tags
{
    public class BrasselerNavigationMenuItemTag : Tag
    {
        private static readonly Regex VariantContentKeyRegex = new Regex("^(?<variantKey>[0-9]+)\\s(?<quote>['\"])(?<viewName>[a-zA-Z-\\/]+[a-zA-Z-\\/0-9]*)\\k<quote>$");
        private static readonly Regex ContextOnlyRegex = new Regex("^(?<contextProperty>[a-zA-X\\-_]+)");
        private int variantKeyFromMarkup;
        private string contextProperty;
        private string viewNameFromMarkup;

        public override void Initialize(string tagName, string markup, List<string> tokens)
        {
            markup = markup.Trim();
            if (BrasselerNavigationMenuItemTag.VariantContentKeyRegex.IsMatch(markup))
            {
                Match match = BrasselerNavigationMenuItemTag.VariantContentKeyRegex.Match(markup);
                this.variantKeyFromMarkup = int.Parse(match.Groups["variantKey"].Value);
                this.viewNameFromMarkup = match.Groups["viewName"].Value;
            }
            else
            {
                if (!BrasselerNavigationMenuItemTag.ContextOnlyRegex.IsMatch(markup))
                    throw new InvalidOperationException("The tag navigationMenuItemTag had markup of " + markup + " which is not valid");
                this.contextProperty = BrasselerNavigationMenuItemTag.ContextOnlyRegex.Match(markup).Groups["contextProperty"].Value;
            }
            base.Initialize(tagName, markup, tokens);
        }

        public override void Render(DotLiquid.Context context, TextWriter result)
        {
            NavigationMenuItemDrop navigationMenuItemDrop = (NavigationMenuItemDrop)null;
            if (!this.contextProperty.IsBlank())
            {
                object obj = context[this.contextProperty];
                if (obj is int)
                    this.variantKeyFromMarkup = (int)obj;
                else if (obj is NavigationMenuItemDrop)
                    navigationMenuItemDrop = obj as NavigationMenuItemDrop;
            }
            if (navigationMenuItemDrop == null)
            {
                AbstractPage page = DependencyLocator.Current.GetInstance<IContentHelper>().GetPageByVariantKey(this.variantKeyFromMarkup, false).Page;
                navigationMenuItemDrop = !(page is ICatalogNavigationPage) ? this.CreateContentNavigationLink(DependencyLocator.Current.GetInstance<IContentHelper>(), page, this.viewNameFromMarkup, 0) : this.CreateCatalogNavigationLink(((ICatalogNavigationPage)page).CategoryNavRoot, this.viewNameFromMarkup, 0);
            }
            string str = DependencyLocator.Current.GetInstance<IContentItemTemplateRenderer>().RenderNavigationMenu(navigationMenuItemDrop);
            result.Write(str);
        }

        private NavigationMenuItemDrop CreateContentNavigationLink(
          IContentHelper contentHelper,
          AbstractPage page,
          string viewName,
          int level = 0)
        {
            string str = page.CustomUrl;
            if (str.IsBlank())
                str = !(page is ILinkableContent) || DependencyLocator.Current.GetInstance<IContentModeProvider>().CurrentContentMode != ContentMode.Viewing ? DependencyLocator.Current.GetInstance<IUrlProvider>().PrepareUrl("/Content/Item/" + (object)page.ContentKey) : DependencyLocator.Current.GetInstance<IUrlProvider>().PrepareUrl((page as ILinkableContent).Url);
            NavigationMenuItemDrop navigationMenuItemDrop = new NavigationMenuItemDrop();
            navigationMenuItemDrop.Level = level;
            navigationMenuItemDrop.NavigationMenuType = NavigationMenuType.Content;
            navigationMenuItemDrop.Identifier = page.ContentKey.ToString();
            navigationMenuItemDrop.Title = page.Title;
            navigationMenuItemDrop.Url = str;
            bool? openInNewTab = page.OpenInNewTab;
            navigationMenuItemDrop.OpenInNewTab = openInNewTab.HasValue && openInNewTab.GetValueOrDefault();
            navigationMenuItemDrop.ViewName = viewName;
            navigationMenuItemDrop.Children = (IList<NavigationMenuItemDrop>)contentHelper.GetChildPagesForVariantKey<AbstractPage>(page.VariantKey.Value, true).Where<AbstractPage>((Func<AbstractPage, bool>)(o => !o.ExcludeFromNavigation)).OrderBy<AbstractPage, int>((Func<AbstractPage, int>)(o => o.SortOrder)).Select((Func<AbstractPage, NavigationMenuItemDrop>)(o => this.CreateContentNavigationLink(contentHelper, o, viewName, ++level))).ToList<NavigationMenuItemDrop>();
            return navigationMenuItemDrop;
        }

        private NavigationMenuItemDrop CreateCatalogNavigationLink(
          NavLinkDto navLinkDto,
          string viewName,
          int level = 0)
        {
            NavigationMenuItemDrop navigationMenuItemDrop = new NavigationMenuItemDrop();
            navigationMenuItemDrop.Level = level;
            navigationMenuItemDrop.Identifier = navLinkDto.CategoryId.ToString();
            navigationMenuItemDrop.Title = navLinkDto.LinkText;
            navigationMenuItemDrop.Url = navLinkDto.Url;
            IList<NavLinkDto> navLinks = navLinkDto.NavLinks;
            navigationMenuItemDrop.Children = (navLinks != null ? navLinks.Select<NavLinkDto, NavigationMenuItemDrop>(o => CreateCatalogNavigationLink(o, viewName, ++level)).ToList<NavigationMenuItemDrop>() : null) ?? new List<NavigationMenuItemDrop>();
            navigationMenuItemDrop.ViewName = viewName;
            navigationMenuItemDrop.NavigationMenuType = NavigationMenuType.Catalog;
            return navigationMenuItemDrop;
        }
    }
}
