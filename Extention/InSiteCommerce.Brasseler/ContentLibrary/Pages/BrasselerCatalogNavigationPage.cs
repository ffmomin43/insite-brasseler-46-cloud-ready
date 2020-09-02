using Insite.ContentLibrary.Pages;
using Insite.WebFramework.Content.Interfaces;
using Insite.WebFramework.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerCatalogNavigationPage : ContentPage, ICreatableContent //ICatalogNavigationPage
    {
        public IList<BrasselerCategoryNavLink> BrasselerCategoryLinks { get; set; }

        public bool IsShoppingListMenu { get; set; }

        public class BrasselerCategoryNavLink
        {
            public NavLinkDto CategoryNavLink { get; set; }
            public Dictionary<string, string> Properties { get; set; }
            public bool IsShoppingListCategory { get; set; }
        }

        public override string NavigationViewDirectory
        {
            get
            {
                return "~/Views/Pages/BrasselerCatalogNavigationPage/";
            }
        }
        //BrasselerNavigation TODO
        //public override string NavigationViewDirectory
        //{
        //    get
        //    {
        //        return "~/Views/NavigationMenus/Catalog/";
        //    }
        //}

        //public virtual NavLinkDto CategoryNavRoot
        //{
        //    get
        //    {
        //        return this.GetPerRequestValue<NavLinkDto>(nameof(CategoryNavRoot));
        //    }
        //    set
        //    {
        //        this.SetPerRequestValue<NavLinkDto>(nameof(CategoryNavRoot), value);
        //    }
        //}


    }

}
