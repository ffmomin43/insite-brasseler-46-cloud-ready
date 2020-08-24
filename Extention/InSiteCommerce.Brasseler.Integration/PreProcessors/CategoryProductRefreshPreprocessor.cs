using Insite.Integration.WebService.Interfaces;
using System;
using Insite.Data.Entities;
using System.Data.SqlClient;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;

namespace InSiteCommerce.Brasseler.Integration.PreProcessors
{
    [DependencyName("CategoryProductRefreshPreprocessor")]
    public class CategoryProductRefreshPreprocessor : IntegrationBase, IJobPreprocessor
    {
        public IntegrationJob IntegrationJob { get; set; }
        public IJobLogger JobLogger { get; set; }
        

        public IntegrationJob Execute()
        {
            try
            {
                using (var sqlConnection = new SqlConnection(InsiteDbConnectionString))
                {
                    sqlConnection.Open();
                    const string productCategoryMerge = @"MERGE INTO CategoryProduct AS TARGET
	                                                        USING (select distinct pr.Id as ProductId,ctp.CategoryId from Product pr join 
		                                                          (SELECT distinct CategoryId,LTRIM(RTRIM(m.n.value('.[1]','varchar(8000)'))) AS ProductCode
		                                                           FROM(SELECT ct.Id as CategoryId,CAST('<XMLRoot><RowData>' + REPLACE(cp.Value,',','</RowData><RowData>') 
		                                                           + '</RowData></XMLRoot>' AS XML) AS x from Category ct join CustomProperty cp on cp.ParentId= ct.Id
		                                                            and cp.Name = 'ClsSC')t CROSS APPLY x.nodes('/XMLRoot/RowData')m(n) ) ctp on pr.ProductCode= ctp.ProductCode)
			                                                        AS SOURCE
	                                                        ON TARGET.CATEGORYID = SOURCE.CATEGORYID AND TARGET.PRODUCTID = SOURCE.PRODUCTID
                                                          WHEN NOT MATCHED THEN
	                                                        INSERT (CATEGORYID,PRODUCTID) 
	                                                        VALUES (SOURCE.CATEGORYID,SOURCE.PRODUCTID);";

                    using (var command = new SqlCommand(productCategoryMerge, sqlConnection))
                    {
                        command.CommandTimeout = CommandTimeOut;
                        command.ExecuteNonQuery();
                    }
                }
                return IntegrationJob;
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check"), ex);
                throw;
            }           
            
        }
    }
}
