﻿using Insite.ContentLibrary.Widgets;
using Insite.WebFramework.Content.Attributes;
using InSiteCommerce.Brasseler.ContentLibrary.Pages;
using System;

namespace InSiteCommerce.Brasseler.ContentLibrary.Widgets
{
    [AllowedParents(new Type[] { typeof(BrasselerOutstandingInvoicesListPage) })]
    public class BrasselerOutstandingInvoicesListView : ContentWidget
    {
    }
}
