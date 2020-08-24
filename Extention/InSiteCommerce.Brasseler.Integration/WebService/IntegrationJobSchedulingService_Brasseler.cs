using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using Insite.Integration.WebService;
using System;
using System.Collections.ObjectModel;
using Insite.Integration.WebService.SystemSettings;

namespace InSiteCommerce.Brasseler.Integration.WebService
{
    public class IntegrationJobSchedulingService_Brasseler : IntegrationJobSchedulingService
    {

        public IntegrationJobSchedulingService_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, IntegrationGeneralSettings IntegrationGeneralSettings) : base(unitOfWorkFactory, IntegrationGeneralSettings)
        {
        }

        protected override void SetParameters(IUnitOfWork unitOfWork, JobDefinition jobDefinition, Collection<JobDefinitionStepParameter> parameters, string genericParameter)
        {
            base.SetParameters(unitOfWork, jobDefinition, parameters, genericParameter);
            foreach (JobDefinitionStep jobDefinitionStep in jobDefinition.JobDefinitionSteps)
            {
                foreach (JobDefinitionStepParameter definitionStepParameter1 in jobDefinitionStep.JobDefinitionStepParameters)
                {
                    JobDefinitionStepParameter stepParam = definitionStepParameter1;
                    if (jobDefinition.Name.EqualsIgnoreCase("SmartSupply Submit Job"))
                    {
                        if (stepParam.Name.EqualsIgnoreCase("SubscriptionOrderId"))
                        {
                            stepParam.Value = genericParameter;
                            parameters.Add(stepParam);
                        }
                    }
                }
            }
        }
    }
}