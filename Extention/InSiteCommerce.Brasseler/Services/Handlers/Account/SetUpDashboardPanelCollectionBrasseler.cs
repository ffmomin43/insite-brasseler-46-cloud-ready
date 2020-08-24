using Insite.Cart.Services;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Dashboard.Services.Dtos;
using Insite.Dashboard.Services.Parameters;
using Insite.Dashboard.Services.Results;
using Insite.Requisition.Services;
using Insite.Rfq.Services;
using Insite.WebFramework.Content.Interfaces;
using InSiteCommerce.Brasseler.ContentLibrary.Pages;
using System;

namespace Insite.Dashboard.Services.Handlers.GetDashboardPanelCollectionHandler
{
    [DependencyName("SetUpDashboardPanelCollectionBrasseler")]
    public sealed class SetUpDashboardPanelCollectionBrasseler : HandlerBase<GetDashboardPanelCollectionParameter, GetDashboardPanelCollectionResult>
    {
        private readonly Lazy<ICartService> cartService;
        private readonly IContentHelper contentHelper;
        private readonly Lazy<IQuoteService> quoteService;
        private readonly Lazy<IRequisitionService> requisitionService;
        //1132 Add Outstanding Invoices to My Accounts - Quick Links
        public SetUpDashboardPanelCollectionBrasseler(
          IContentHelper contentHelper,
          Lazy<IRequisitionService> requisitionService,
          Lazy<IQuoteService> quoteService,
          Lazy<ICartService> cartService)
        {
            this.contentHelper = contentHelper;
            this.requisitionService = requisitionService;
            this.quoteService = quoteService;
            this.cartService = cartService;
        }

        public override int Order
        {
            get
            {
                return 610;
            }
        }

        public override GetDashboardPanelCollectionResult Execute(
          IUnitOfWork unitOfWork,
          GetDashboardPanelCollectionParameter parameter,
          GetDashboardPanelCollectionResult result)
        {
            foreach (DashboardPanelDto dashboardPanel in result.DashboardPanels)
                this.SetUpPanelDto(dashboardPanel);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        private void SetUpPanelDto(
          DashboardPanelDto dashboardPanelDto)
        {
            if (dashboardPanelDto.Type == typeof(BrasselerOutstandingInvoicesListPage))
            {
                dashboardPanelDto.IsQuickLink = true;
                dashboardPanelDto.QuickLinkText = this.contentHelper.T("Outstanding Invoices");
                dashboardPanelDto.QuickLinkOrder = 6;
            }
        }
    }
}
