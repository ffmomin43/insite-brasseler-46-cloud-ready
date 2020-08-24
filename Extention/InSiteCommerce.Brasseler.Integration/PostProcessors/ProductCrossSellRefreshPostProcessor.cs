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
    [DependencyName("ProductCrossSellRefreshPostProcessor")]
    public class ProductCrossSellRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create Table #ProductCrossSellFilter
                                                            (ERPNumber nvarchar(50),CmplNumber nvarchar(50),Sequence nvarchar(50))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#ProductCrossSellFilter", dataSet.Tables[0]);

                        const string salespersonMerge = @" 
                                                          Update #ProductCrossSellFilter
                                                                 set 
                                                                 ERPNumber = RTRIM(LTRIM(ERPNumber)), 
                                                                 CmplNumber = RTRIM(LTRIM(CmplNumber)),
                                                                 Sequence = RTRIM(LTRIM(Sequence))

                                                            --BUSA-484 start :Product Cross Sells
                                                           DELETE FROM ProductRelatedProduct                

                                                           MERGE INTO ProductRelatedProduct AS TARGET USING
	                                                            (select ERPNumber, CmplNumber, Sequence
		                                                        from #ProductCrossSellFilter)
                                                            AS SOURCE
                                                            ON TARGET.ProductId =  (select Id from Product p where SOURCE.ERPNumber= p.ERPNumber and p.DeactivateOn IS NULL) and 
                                                               TARGET.RelatedProductId = (select Id from Product p where SOURCE.CmplNumber= p.ERPNumber and p.DeactivateOn IS NULL) and
                                                               TARGET.SortOrder = SOURCE.Sequence
                                                            WHEN NOT MATCHED  and (select Id from Product p where SOURCE.ERPNumber= p.ERPNumber and p.DeactivateOn IS NULL) is not null 
															and (select Id from Product p where SOURCE.CmplNumber= p.ERPNumber and p.DeactivateOn IS NULL) is not null THEN
	                                                          INSERT(ProductId,RelatedProductId,SortOrder,SystemListValueId)
	                                                            VALUES((select Id from Product p where SOURCE.ERPNumber= p.ERPNumber),
                                                               (select Id from Product p where SOURCE.CmplNumber= p.ERPNumber),SOURCE.Sequence,
															   (select Id from SystemListValue where Name = 'CrossSell'));
                                                            DROP TABLE #ProductCrossSellFilter
                                                            --BUSA-484 end :Product Cross Sells
                                                         ";

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
