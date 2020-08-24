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
    [DependencyName("CustomerRestrictionRefreshPostprocesor")]
    public class CustomerRestrictionRefreshPostprocesor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #CustomerRestrictionFilter
                                                            (CompanyNumber varchar(4), CustomerNumber varchar(20), RestrictionCode varchar(10),RestrictionType varchar(5))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#CustomerRestrictionFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table
                        const string customerRestrictionMerge = @"
                                                                    Update #CustomerRestrictionFilter set 
                                                                     CompanyNumber =RTRIM(LTRIM(CompanyNumber)), CustomerNumber =RTRIM(LTRIM(CustomerNumber)), RestrictionCode =RTRIM(LTRIM(RestrictionCode)),RestrictionType = LTRIM(RTRIM(RestrictionType))
                                                                  
                                                                      DELETE FROM  RestrictionGroupCustomerAddition                                                                  
                                                                      MERGE INTO RestrictionGroupCustomerAddition AS TARGET
	                                                                    USING
	                                                                    (select distinct cr.Id CustomerId,rg.Id RestrictionGroupId
	                                                                    from #CustomerRestrictionFilter crf join RestrictionGroup rg on rg.name= crf.RestrictionCode
	                                                                    join Customer cr on cr.CustomerNumber = crf.CompanyNumber + crf.CustomerNumber)
                                                                        AS SOURCE
                                                                        ON TARGET.CustomerId=SOURCE.CustomerId and TARGET.RestrictionGroupId=SOURCE.RestrictionGroupId 
                                                                        WHEN NOT MATCHED THEN
	                                                                    INSERT(CustomerId,RestrictionGroupId)
	                                                                    VALUES(SOURCE.CustomerId,SOURCE.RestrictionGroupId);
                                                                    

                                                                    DROP TABLE #CustomerRestrictionFilter;
                                                                    
                                                                ";

                        using (var command = new SqlCommand(customerRestrictionMerge, sqlConnection))
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
                LogHelper.For((object)this).Error(ex.Message, "Customer Restriction Refresh");
            }
        }



    }
}