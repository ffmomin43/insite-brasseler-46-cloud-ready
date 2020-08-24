using System;
using System.Data;
using System.Threading;
using Insite.Integration.WebService.Interfaces;
using Insite.Core.Interfaces.Dependency;
using Insite.Common.Logging;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("TestODBCPostprocessor")]
    public class TestODBCPostprocessor : IJobPostprocessor
    {
        public Insite.Data.Entities.IntegrationJob IntegrationJob { get; set; }


        public IJobLogger JobLogger { get; set; }


        public void Cancel()
        {
            throw new NotImplementedException();
        }

        public void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            LogHelper.For((object)this).Info(dataSet.GetXml());
        }
    }
}
