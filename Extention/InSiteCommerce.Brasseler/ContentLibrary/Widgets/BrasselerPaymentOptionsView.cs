using Insite.Account.Content;
using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content.Attributes;
using InSiteCommerce.Brasseler.ContentLibrary.Pages;
using System;
using System.ComponentModel;

namespace InSiteCommerce.Brasseler.ContentLibrary.Widgets
{
    [AllowedParents(new Type[] {typeof(BrasselerPaymentOptionsPage) })]
    public class BrasselerPaymentOptionsView : ContentWidget
    {
    }
}