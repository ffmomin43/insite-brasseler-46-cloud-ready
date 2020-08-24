using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using InSiteCommerce.Brasseler.Integration;
using System;
using System.Data;
using System.Threading;
using System.Linq;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using System.Data.Entity;
using Insite.Common.Logging;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using Insite.Core.Plugins.Integration;

namespace Insite.Integration.WebService.PlugIns.Postprocessor
{
    [DependencyName("DailySubscription")]
    public class DailySubscriptionRefreshPostProcessor : IntegrationBase, IJobPostprocessor
    {
        #region Variables

        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IUnitOfWorkFactory unitOfWorkFactory;
        protected readonly Lazy<IIntegrationJobSchedulingService> IntegrationJobSchedulingService;

        #endregion

        #region Properties

        public IJobLogger JobLogger { get; set; }
        public IntegrationJob IntegrationJob { get; set; }

        #endregion

        #region Constructor

        public DailySubscriptionRefreshPostProcessor(IUnitOfWorkFactory unitOfWorkFactory, Lazy<IIntegrationJobSchedulingService> IntegrationJobSchedulingService)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.unitOfWorkFactory = unitOfWorkFactory;
            this.IntegrationJobSchedulingService = IntegrationJobSchedulingService;
        }

        #endregion

        #region Methods

        public virtual void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            try
            {
                var date = DateTimeOffset.Now.Date;

                var subscriptionOrder = from co in this.UnitOfWork.GetRepository<CustomerOrder>().GetTable()
                                        join sb in this.UnitOfWork.GetRepository<SubscriptionBrasseler>().GetTable()
                                        on co.Id equals sb.CustomerOrderId
                                        where co.Status == "SubscriptionOrder" && (DbFunctions.TruncateTime(sb.NextDelieveryDate) == DbFunctions.TruncateTime(date))
                                        select sb;

                JobLogger.Info(subscriptionOrder.Count() + " :Count of Subscription Order");

                if (subscriptionOrder.Count() == 0)
                {
                    return;
                }

                JobDefinition jobDefinition = (from jd in this.UnitOfWork.GetRepository<JobDefinition>().GetTable()
                                               join jds in this.UnitOfWork.GetRepository<JobDefinitionStep>().GetTable()
                                               on jd.Id equals jds.JobDefinitionId
                                               join jdsp in this.UnitOfWork.GetRepository<JobDefinitionStepParameter>().GetTable()
                                               on jds.Id equals jdsp.JobDefinitionStepId
                                               where jd.Name == "SmartSupply Submit Job"
                                               select jd).FirstOrDefault();

                JobLogger.Info(jobDefinition.Name + " :Job Definition");

                if (jobDefinition == null)
                {
                    return;
                }

                foreach (var subscriptionOrderJob in subscriptionOrder)
                {
                    // Check if Subscription Submit job is already scheduled.
                    var scheduleDateTime = from ijp in this.UnitOfWork.GetRepository<IntegrationJobParameter>().GetTable()
                                           join ij in this.UnitOfWork.GetRepository<IntegrationJob>().GetTable()
                                           on ijp.IntegrationJobId equals ij.Id
                                           join jd in this.UnitOfWork.GetRepository<JobDefinition>().GetTable()
                                           on ij.JobDefinitionId equals jd.Id
                                           where jd.Name.ToUpper() == "SMARTSUPPLY SUBMIT JOB" && subscriptionOrderJob.CustomerOrderId.ToString().ToUpper() == ijp.Value.ToUpper() && DbFunctions.TruncateTime(ij.ScheduleDateTime) == DbFunctions.TruncateTime(DateTimeOffset.Now)
                                           select DbFunctions.TruncateTime(ij.ScheduleDateTime);

                    // If Subscription Submit job is not scheduled, then schedule it.
                    if (scheduleDateTime.Count() == 0)
                    {
                        Collection<JobDefinitionStepParameter> parameters = new Collection<JobDefinitionStepParameter>();
                        if (jobDefinition != null)
                        {
                            foreach (JobDefinitionStepParameter definitionStepParameter in jobDefinition.JobDefinitionSteps.SelectMany<JobDefinitionStep, JobDefinitionStepParameter>((Func<JobDefinitionStep, IEnumerable<JobDefinitionStepParameter>>)(s => (IEnumerable<JobDefinitionStepParameter>)s.JobDefinitionStepParameters)))
                            {
                                if (definitionStepParameter.Name.EqualsIgnoreCase("SmartSupplyOrderId"))
                                {
                                    definitionStepParameter.Value = subscriptionOrderJob.CustomerOrderId.ToString();
                                }
                                else if (definitionStepParameter.Name.EqualsIgnoreCase("Ship Now"))
                                {
                                    definitionStepParameter.Value = "false";
                                }
                                parameters.Add(definitionStepParameter);
                            }

                            if (parameters.Count() == 0)
                            {
                                return;
                            }

                            this.IntegrationJobSchedulingService.Value.ScheduleBatchIntegrationJob("SmartSupply Submit Job", null, parameters, null, new DateTime?(), false);
                            JobLogger.Info("Scheduled for Customer Order ID = " + subscriptionOrderJob.CustomerOrderId + " : Scheduled Date = " + subscriptionOrderJob.NextDelieveryDate.ToString());
                        }
                    }
                    else
                    {
                        JobLogger.Info("Already Scheduled for Customer Order ID = " + subscriptionOrderJob.CustomerOrderId + " : Scheduled Date = " + subscriptionOrderJob.NextDelieveryDate.ToString());
                    }
                }

            }
            catch (Exception ex)
            {
                LogHelper.For(this).Error(ex);
                throw;
            }
            finally
            {
            }
        }

        public void Cancel()
        {
            throw new NotImplementedException();
        }

        #endregion
    }
}