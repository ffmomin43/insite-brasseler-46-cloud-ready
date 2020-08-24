using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    //Restriction Refresh job
    [DependencyName("RestrictionRefreshPostprocessor")]
    public class RestrictionRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #RestrictionFilter 
                                                            (RestrictionCode varchar(20),Description varchar(max),RestrictionType varchar(10))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#RestrictionFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table


                        const string restrictionMerge = @"Update #RestrictionFilter set
                                                           RestrictionCode =RTRIM(LTRIM(RestrictionCode)), Description =RTRIM(LTRIM(Description)), RestrictionType =RTRIM(LTRIM(RestrictionType))
                                                   

                                                        MERGE INTO RestrictionGroup AS TARGET
                                                        USING (Select distinct rf.RestrictionCode,rf.Description,rf.RestrictionType from #RestrictionFilter rf
                                                                ) AS SOURCE
                                                        ON SOURCE.RestrictionCode = TARGET.Name 
                                                        WHEN NOT MATCHED THEN
                                                        INSERT(Name,Description,DisplayType,CreatedOn,IsActive,ValidForWebsites)
                                                        VALUES (SOURCE.RestrictionCode,SOURCE.Description,(CASE WHEN SOURCE.RestrictionType ='A' THEN 'Show' WHEN  SOURCE.RestrictionType ='P' THEN 'Hide' ELSE '' END),
                                                                CAST(GETDATE() AS datetimeoffset), 1,'All')
                                                        WHEN MATCHED THEN 
                                                        UPDATE
                                                        SET TARGET.DisplayType = (CASE WHEN SOURCE.RestrictionType ='A' THEN 'Show' ELSE 'Hide' END),
                                                        TARGET.MODIFIEDON = CAST(GETDATE() AS datetimeoffset);

                                                         DROP TABLE #RestrictionFilter";




                        using (var command = new SqlCommand(restrictionMerge, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
                }
                else
                {
                    LogHelper.For((object)this).Info(string.Format("Brasseler: DataSet is Empty"));
                }
                }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(ex.ToString());
                throw;
            }
        }
    }
}
