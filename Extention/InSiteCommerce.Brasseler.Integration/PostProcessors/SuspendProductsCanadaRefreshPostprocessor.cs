using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading;

namespace InSiteCommerce.Brasseler.Integration.PreProcessors
{
    [DependencyName("SuspendedProductCanadaRefreshPostprocessor")]
    public class SuspendedProductCanadaRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #SuspendedProductsCanadaFilter
                                                            (ERPNumber varchar(50))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#SuspendedProductsCanadaFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table
                        const string SuspendedProductsCanadaMerge = @"
                                                                      DELETE FROM SuspendedProductsCanada;                                                                  
                                                                     
                                                                      MERGE INTO SuspendedProductsCanada AS TARGET
	                                                                  USING
	                                                                  (select LTRIM(RTRIM(ERPNumber)) AS ERPNumber
	                                                                  from #SuspendedProductsCanadaFilter)
                                                                      AS SOURCE
                                                                      ON TARGET.ERPNumber=SOURCE.ERPNumber 
                                                                      WHEN NOT MATCHED THEN
	                                                                  INSERT(ERPNumber)
	                                                                  VALUES(SOURCE.ERPNumber);                                                                   

                                                                      DROP TABLE #SuspendedProductsCanadaFilter;";

                        using (var command = new SqlCommand(SuspendedProductsCanadaMerge, sqlConnection))
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
                LogHelper.For((object)this).Error(ex.Message, "Suspended Products Canada Refresh");
            }
        }
    }
}
