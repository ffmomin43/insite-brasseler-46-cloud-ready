using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("SalespersonRefreshPostprocessor")]
    public class SalespersonRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create Table #SalespersonFilter
                                                            (SalespersonNumber nvarchar(50),Name nvarchar(50),Company nvarchar(10),Code nvarchar(50))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#SalespersonFilter", dataSet.Tables[0]);

                        const string salespersonMerge = @" 
                                                             Update #SalespersonFilter
                                                                 set 
                                                                 SalespersonNumber =RTRIM(LTRIM(SalespersonNumber)), 
                                                                 Name = RTRIM(LTRIM(Name)),
                                                                 Company = RTRIM(LTRIM(Company)),
                                                                 Code = RTRIM(LTRIM(Code))
                                                             
                                                            MERGE INTO Salesperson AS TARGET USING
	                                                            (select concat(Company,SalespersonNumber) as SalespersonNumber,Name,Code 
		                                                        from #SalespersonFilter where SalespersonNumber !='' and Company !='')
                                                            AS SOURCE
                                                            ON TARGET.SalespersonNumber=SOURCE.SalespersonNumber 
                                                            WHEN NOT MATCHED THEN
	                                                            INSERT(SalespersonNumber,Name,Code)
	                                                            VALUES(SOURCE.SalespersonNumber,ISNULL(SOURCE.Name,''),ISNULL(SOURCE.Code,''))
                                                            WHEN MATCHED THEN
	                                                            UPDATE SET Name = ISNULL(SOURCE.Name,''), Code=ISNULL(SOURCE.Code,''); 
                                
                                                            DROP TABLE #SalespersonFilter";

                        using (var command = new SqlCommand(salespersonMerge, sqlConnection))
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
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", this), ex);
                throw;
            }
        }

    }
}
