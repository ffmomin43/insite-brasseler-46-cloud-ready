using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common.Logging;
using Insite.Core.Enums;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Integration;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.Integration;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using System;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("SubmitOrderToErp")]
    public class SubmitOrderToErp : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly Lazy<IIntegrationJobSchedulingService> integrationJobSchedulingService;

        private readonly OrderSubmitSettings orderSubmitSettings;

        public override int Order
        {
            get
            {
                return 3000;
            }
        }

        public SubmitOrderToErp(Lazy<IIntegrationJobSchedulingService> integrationJobSchedulingService, OrderSubmitSettings orderSubmitSettings)
        {
            this.integrationJobSchedulingService = integrationJobSchedulingService;
            this.orderSubmitSettings = orderSubmitSettings;
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            //BUSA-1070: Added "Return Requested" check for RMA
            if ((!parameter.Status.EqualsIgnoreCase("Submitted") || !this.orderSubmitSettings.ErpSubmitOrders) && !parameter.Status.EqualsIgnoreCase("Return Requested"))
            {
                return base.NextHandler.Execute(unitOfWork, parameter, result);
            }
            try
            {
                try
                {
                    JobDefinitionStandardJobName jobDefinitionStandardJobName = JobDefinitionStandardJobName.OrderSubmit;
                    JobDefinition byStandardName = unitOfWork.GetTypedRepository<IJobDefinitionRepository>().GetByStandardName(jobDefinitionStandardJobName.ToString());
                    if (byStandardName == null)
                    {
                        throw new Exception(string.Format("Unable to find a JobDefinition for {0}.", JobDefinitionStandardJobName.OrderSubmit));
                    }
                    unitOfWork.CommitTransaction();
                    if (!this.orderSubmitSettings.UseRealTimeOrderSubmit)
                    {
                        DateTime? nullable = null;
                        this.integrationJobSchedulingService.Value.ScheduleBatchIntegrationJob(byStandardName.Name, null, null, result.GetCartResult.Cart.OrderNumber, nullable, false);
                    }
                    else
                    {
                        this.integrationJobSchedulingService.Value.RunRealTimeIntegrationJob(byStandardName.Name, null, null, result.GetCartResult.Cart.OrderNumber, false);
                    }
                    unitOfWork.BeginTransaction();
                    unitOfWork.Refresh<CustomerOrder>(result.GetCartResult.Cart);
                }
                catch (Exception exception1)
                {
                    Exception exception = exception1;
                    LogHelper.For(this).Error(exception.Message, exception, "SubmitOrderToErp", null);
                }
            }
            finally
            {
                if (!unitOfWork.DataProvider.TransactionActive)
                {
                    unitOfWork.BeginTransaction();
                }
            }
            return base.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}