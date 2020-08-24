using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("ProductWareHouseRefreshPostProcessor")]
    public class ProductWareHouseRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #ProductWarehouseFilter (ERPNumber varchar(50),Warehouse varchar(10),QTY decimal(18,3)) ";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#ProductWarehouseFilter", dataSet.Tables[0]);

                        var results = (from row in dataSet.Tables[0].AsEnumerable()
                                       where row.Field<string>("WAREHOUSE") != ""
                                       select row.Field<string>("WAREHOUSE")).Distinct();
                        var warehouseID = results.SingleOrDefault().ToString();
                        const string getWarehouse = @"Create table #ERPWarehouse(
                                                             ID nvarchar(max))";

                        using (var command = new SqlCommand(getWarehouse, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                            command.CommandText = "INSERT INTO #ERPWareHouse (ID) VALUES ('" + warehouseID + "')";
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }

                        // Merge the data from the Temp Table
                        const string productMerge = @"UPDATE #ProductWarehouseFilter
                                                      SET ERPNumber = LTRIM(RTRIM(ERPNumber)),
                                                      Warehouse = LTRIM(RTRIM(Warehouse)),
                                                      QTY = LTRIM(RTRIM(QTY))

                                                                    SELECT * INTO #TempProductWarehouse FROM
                                                                    (
	                                                                    SELECT P.Id AS 'ProductID', P.IsDiscontinued, W.Id AS 'WareHouseID', PWF.QTY 
	                                                                    FROM Product P INNER JOIN #ProductWarehouseFilter PWF
	                                                                    ON P.Name = LTRIM(RTRIM(PWF.ERPNumber))  AND P.TrackInventory = 1
	                                                                    INNER JOIN Warehouse W
	                                                                    ON W.Name = LTRIM(RTRIM(PWF.Warehouse)) AND LTRIM(RTRIM(PWF.Warehouse)) = (Select ID from #ERPWareHouse)
                                                                    ) AS T1

                                                                     Declare @currentdate  as DATETIMEOFFSET 
                                                                     SET @currentdate = GETDATE();

                                                                    MERGE INTO ProductWarehouse AS TARGET USING
                                                                    (
	                                                                    SELECT * FROM #TempProductWarehouse
                                                                    )
                                                                    AS SOURCE
                                                                    ON TARGET.ProductId = SOURCE.ProductID AND TARGET.WarehouseId = SOURCE.WareHouseID
                                                                    WHEN NOT MATCHED THEN
                                                                    INSERT(ID,ProductId, WarehouseId, ErpQtyAvailable, QtyOnOrder, SafetyStock, UnitCost,IsDiscontinued,CreatedOn,CreatedBy,ModifiedOn,ModifiedBy)
                                                                    VALUES(NewID(),SOURCE.ProductID, SOURCE.WareHouseID, SOURCE.QTY, 0.00000,0.00000, 0.00000,SOURCE.IsDiscontinued,@currentdate,'',@currentdate,'')

                                                                    WHEN MATCHED THEN
                                                                    UPDATE SET ErpQtyAvailable = SOURCE.QTY, QtyOnOrder = 0.00000,ModifiedOn = @currentdate;


                                                                   SELECT * INTO #TempProductWarehouse_Inv FROM
                                                                    (
	                                                                    SELECT P.Id AS 'ProductID', P.IsDiscontinued, W.Id AS 'WareHouseID', PWF.QTY 
	                                                                    FROM Product P INNER JOIN #ProductWarehouseFilter PWF
	                                                                    ON P.Name = LTRIM(RTRIM(PWF.ERPNumber))  AND P.TrackInventory = 0
	                                                                    INNER JOIN Warehouse W
	                                                                    ON W.Name = LTRIM(RTRIM(PWF.Warehouse)) AND LTRIM(RTRIM(PWF.Warehouse)) = (Select ID from #ERPWareHouse)
                                                                    ) AS T1

                                                                    
                                                                    MERGE INTO ProductWarehouse AS TARGET USING
                                                                    (
	                                                                    SELECT * FROM #TempProductWarehouse_Inv
                                                                    )
                                                                    AS SOURCE
                                                                    ON TARGET.ProductId = SOURCE.ProductID AND TARGET.WarehouseId = SOURCE.WareHouseID
                                                                    WHEN NOT MATCHED THEN
                                                                    INSERT(ID,ProductId, WarehouseId, ErpQtyAvailable, QtyOnOrder, SafetyStock, UnitCost,IsDiscontinued,CreatedOn,CreatedBy,ModifiedOn,ModifiedBy)
                                                                    VALUES(NewID(),SOURCE.ProductID, SOURCE.WareHouseID, SOURCE.QTY, 0.00000,0.00000, 0.00000,SOURCE.IsDiscontinued,@currentdate,'',@currentdate,'')

                                                                    WHEN MATCHED THEN
                                                                    UPDATE SET ErpQtyAvailable = 100.00000, QtyOnOrder = 0.00000,ModifiedOn = @currentdate;


                                                                    DROP TABLE #TempProductWarehouse
                                                                    DROP TABLE #TempProductWarehouse_Inv
                                                                    DROP TABLE #ERPWarehouse";


                        using (var command = new SqlCommand(productMerge, sqlConnection))
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
                LogHelper.For((object)this).Info(ex.ToString());
                throw;
            }
        }
    }
}