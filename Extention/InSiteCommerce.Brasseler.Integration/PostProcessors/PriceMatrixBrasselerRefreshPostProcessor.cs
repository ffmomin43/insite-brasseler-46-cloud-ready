using Insite.Core.Interfaces.Dependency;
using Insite.Integration.WebService.Interfaces;
using System;
using Insite.Data.Entities;
using System.Data;
using System.Threading;
using System.Data.SqlClient;
using Insite.Common.Logging;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("PriceMatrixBrasselerRefreshPostProcessor")]
    public class PriceMatrixBrasselerRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #PriceMatrixFilter 
                                                            (Name varchar(32),PriceCode varchar(50),BasicListPrice decimal(18,3),Price1 decimal                         (18,3), Price2 decimal(18,3), Price3 decimal(18,3), Price4 decimal(18,3), Price5                            decimal(18,3), ItemContrCode varchar(32), Currency varchar(10))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#PriceMatrixFilter", dataSet.Tables[0]);

                        const string priceMatrixMerge = @"

                                                            Update #PriceMatrixFilter set
                                                            Name =RTRIM(LTRIM(Name)), PriceCode =RTRIM(LTRIM(PriceCode)), BasicListPrice =RTRIM(LTRIM(BasicListPrice)), Price1 =RTRIM(LTRIM(Price1)),  Price2 =RTRIM(LTRIM(Price2)),  Price3 =RTRIM(LTRIM(Price3)),  Price4 =RTRIM(LTRIM(Price4)),  Price5 =RTRIM(LTRIM(Price5)), ItemContrCode=RTRIM(LTRIM(ItemContrCode)), Currency=RTRIM(LTRIM(Currency)) 

                                                            MERGE INTO ProductCurrencyMappingBrasseler AS TARGET USING
                                                            (
	                                                            SELECT P.Id AS 'ProductId', P.Name, C.Id AS 'CurrencyId', PC.BasicListPrice
	                                                            FROM #PriceMatrixFilter PC JOIN Product P
	                                                            ON PC.Name = P.Name
	                                                            JOIN Currency C
	                                                            ON C.CurrencyCode = PC.Currency
                                                            ) AS SOURCE
                                                            ON TARGET.ProductId = SOURCE.ProductId
                                                            WHEN NOT MATCHED THEN
                                                            INSERT(Id, ProductId, ProductName, CurrencyId, BasicListPrice, CreatedOn, CreatedBy, ModifiedOn, ModifiedBy)
                                                            VALUES(NEWID(), SOURCE.ProductId,SOURCE.Name,SOURCE.CurrencyId,SOURCE.BasicListPrice, CAST(GETDATE() AS DATETIMEOFFSET),'Admin', CAST(GETDATE() AS DATETIMEOFFSET),'Admin')
                                                            WHEN MATCHED THEN
                                                            UPDATE SET ProductId = SOURCE.ProductId, ProductName = SOURCE.Name, CurrencyId = SOURCE.CurrencyId, BasicListPrice = SOURCE.BasicListPrice;

                                                            MERGE INTO PriceMatrixbrasseler AS TARGET USING
                                                            (
	                                                            SELECT P.Id AS 'ProductId', C.Id AS 'CurrencyId', PC.Price1, PC.Price2, PC.Price3, PC.Price4, PC.Price5, PC.PriceCode, PC.ItemContrCode
	                                                            FROM #PriceMatrixFilter PC JOIN Product P
	                                                            ON PC.Name = P.Name
	                                                            JOIN Currency C
	                                                            ON C.CurrencyCode = PC.Currency
                                                            ) AS SOURCE
                                                            ON TARGET.ProductId = SOURCE.ProductId
                                                            WHEN NOT MATCHED THEN
                                                            INSERT(Id, ProductId, Price1, Price2, Price3, Price4, Price5, PriceClass, ProductContractCode, CurrencyId, CreatedOn, CreatedBy, ModifiedOn, ModifiedBy)
                                                            VALUES(NEWID(), SOURCE.ProductId, SOURCE.Price1, SOURCE.Price2, SOURCE.Price3, SOURCE.Price4, SOURCE.Price5, SOURCE.PriceCode, SOURCE.ItemContrCode, SOURCE.CurrencyId, CAST(GETDATE() AS DATETIMEOFFSET),'Admin', CAST(GETDATE() AS DATETIMEOFFSET),'Admin')
                                                            WHEN MATCHED THEN
                                                            UPDATE SET ProductId = SOURCE.ProductId, Price1 = SOURCE.Price1, Price2 = SOURCE.Price2, Price3 = SOURCE.Price3, Price4 = SOURCE.Price4, Price5 = SOURCE.Price5, PriceClass = SOURCE.PriceCode, ProductContractCode = SOURCE.ItemContrCode, CurrencyId = SOURCE.CurrencyId;
                                                       ";

                        using (var command = new SqlCommand(priceMatrixMerge, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
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