using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("OrderSourceCodePostProcessor")]
    public class OrderSourceCodePostProcessor : IntegrationBase, IJobPostprocessor
    {
        public IntegrationJob IntegrationJob { get; set; }
        public IJobLogger JobLogger { get; set; }
        public void Cancel()
        {
            throw new NotImplementedException();
        }
        public void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            try
            {
                if (dataSet.Tables.Count > 0)
                {
                    using (var sqlConnection = new SqlConnection(InsiteDbConnectionString))
                    {
                        sqlConnection.Open();

                        //Load DataTable in to SQL Server Temp Table
                        const string createTempTableSql = @"Create table #OrderSourceCodeFilter 
                                                            (CO varchar(max),OSCODE varchar(max),OSC000001 varchar(max), BYPASSSA varchar(max), OSGROUP varchar(max),OSGR00001 varchar(max),
                                                                OSCLASS varchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#OrderSourceCodeFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table
                        const string OrderSourceCodeMerge = @" 
                                                              MERGE INTO OrderSourceCode AS TARGET USING
                                                              (select distinct CO,OSCODE, OSC000001, BYPASSSA,OSGROUP,OSGR00001,OSCLASS from #OrderSourceCodeFilter) AS SOURCE
                                                            ON TARGET.CO =  SOURCE.CO and 
                                                               TARGET.OSCODE = SOURCE.OSCODE
                                                            WHEN NOT MATCHED THEN
	                                                          INSERT(CO,OSCODE,OSC000001,BYPASSSA,OSGROUP,OSGR00001,OSCLASS)
	                                                            VALUES(SOURCE.CO,SOURCE.OSCODE,SOURCE.OSC000001,SOURCE.BYPASSSA,SOURCE.OSGROUP,SOURCE.OSGR00001,SOURCE.OSCLASS)
                                                            WHEN MATCHED THEN
	                                                            UPDATE SET CO = ISNULL(SOURCE.CO,''), OSCODE=ISNULL(SOURCE.OSCODE,''),OSC000001=ISNULL(SOURCE.OSC000001,''),BYPASSSA=ISNULL(SOURCE.BYPASSSA,''),OSGROUP=ISNULL(SOURCE.OSGROUP,''),OSGR00001=ISNULL(SOURCE.OSGR00001,'');                                                            

                                                            DROP TABLE #OrderSourceCodeFilter";

                        using (var command = new SqlCommand(OrderSourceCodeMerge, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
                }
                else
                {
                    LogHelper.For((object)this).Info(string.Format("Brasseler:DataSet is Empty"));
                }
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check"), ex);
                throw;
            }
        }
    }
}
