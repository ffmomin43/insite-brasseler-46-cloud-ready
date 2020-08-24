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
    [DependencyName("CustomerProductRefreshPostprocessor")]
    public class CustomerProductRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #CustomerProductFilter 
                                                            (CustomerNumber nvarchar(50),ProductErpNumber nvarchar(50),CustomerProductName nvarchar(50))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#CustomerProductFilter", dataSet.Tables[0]);
                        
                        const string customerProductMerge = @" 
                                                                 Update #CustomerProductFilter
                                                                 set
                                                                 CustomerNumber =RTRIM(LTRIM(CustomerNumber)),
                                                                 ProductErpNumber = RTRIM(LTRIM(ProductErpNumber)),
                                                                 CustomerProductName = RTRIM(LTRIM(CustomerProductName))

                                                                MERGE INTO CustomerProduct AS TARGET USING
	                                                                (select distinct cr.Id as CustomerId,pr.Id as ProductId,
	                                                                (select top 1 CustomerProductName from #CustomerProductFilter where CustomerNumber= cpf.CustomerNumber and ProductErpNumber=cpf.ProductErpNumber
	                                                                order by CustomerProductName) as CustomerProductName from #CustomerProductFilter cpf JOIN Customer cr 
	                                                                on cr.CustomerNumber= cpf.CustomerNumber and IsBillto=1 JOIN Product pr on pr.ErpNumber =cpf.ProductErpNumber)
	                                                                AS SOURCE ON TARGET.CustomerId = SOURCE.CustomerId AND TARGET.ProductId = SOURCE.ProductId 
                                                                WHEN NOT MATCHED THEN
	                                                                 INSERT(CustomerId,ProductId,Name)
	                                                                 VALUES(SOURCE.CustomerId, SOURCE.ProductId, SOURCE.CustomerProductName)
                                                                WHEN MATCHED THEN
	                                                                UPDATE SET Name = SOURCE.CustomerProductName;

                                                               DROP TABLE #CustomerProductFilter";

                        using (var command = new SqlCommand(customerProductMerge, sqlConnection))
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
