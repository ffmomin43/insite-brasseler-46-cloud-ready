using Insite.Common.Providers;
using Insite.ContentLibrary.Pages;
using Insite.ContentLibrary.Widgets;
using Insite.Core.Context;
using Insite.WebFramework.Content;
using InSiteCommerce.Brasseler.ContentLibrary.Widgets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.ContentLibrary.Pages
{
    public class BrasselerLanguagePeferencePageContentCreator : AbstractContentCreator<BrasselerLanguagePeferencePage>
    {
        protected override BrasselerLanguagePeferencePage Create()
        {
            var now = DateTimeProvider.Current.Now;
            BrasselerLanguagePeferencePage brasselerLanguagePeferencePage = InitializePageWithParentType<BrasselerLanguagePeferencePage>(typeof(MyAccountPage), "Standard");
            //TODO
            if (SiteContext.Current.Website.WebsiteLanguages.Count > 1)//Temp changes
            {
                brasselerLanguagePeferencePage.Name = "Language Preference";
                brasselerLanguagePeferencePage.Title = "Language Preference";
                brasselerLanguagePeferencePage.ExcludeFromNavigation = false;
                brasselerLanguagePeferencePage.Url = "/MyAccount/LanguagePreference";

                this.SaveItem(brasselerLanguagePeferencePage, now);
                Breadcrumb contentmodel1 = this.InitializeWidget<Breadcrumb>("Content", brasselerLanguagePeferencePage, "Standard");
                this.SaveItem(contentmodel1, now);
                this.SaveItem(this.InitializeWidget<PageTitle>("Content", brasselerLanguagePeferencePage, "Standard"), now);
                this.SaveItem(this.InitializeWidget<BrasselerLanguagePreferenceView>("Content", brasselerLanguagePeferencePage, "Standard"), now);

            }

            return brasselerLanguagePeferencePage;
        }
    }
}
