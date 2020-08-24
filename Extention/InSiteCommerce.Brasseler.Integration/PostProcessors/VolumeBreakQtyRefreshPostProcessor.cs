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
    [DependencyName("VolumeBreakQtyRefreshPostProcessor")]
    public class VolumeBreakQtyRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"CREATE TABLE #VolumeBreakQtyFilter (QYDSIT VARCHAR(27),[DESC] VARCHAR(MAX),QYQDTP VARCHAR(1),QYQGRP NUMERIC(1,0),QYWHID VARCHAR(2),QYQPTP VARCHAR(1),QYBR01 DECIMAL(14,3),QYBR02 DECIMAL(14,3),QYBR03 DECIMAL(14,3),QYBR04 DECIMAL(14,3),QYBR05 DECIMAL(14,3),QYBR06 DECIMAL(14,3),QYBR07 DECIMAL(14,3),QYBR08 DECIMAL(14,3),QYBR09 DECIMAL(14,3),QYBR10 DECIMAL(14,3),QYQD01 DECIMAL(15,5),QYQD02 DECIMAL(15,5),QYQD03 DECIMAL(15,5),QYQD04 DECIMAL(15,5),QYQD05 DECIMAL(15,5),QYQD06 DECIMAL(15,5),QYQD07 DECIMAL(15,5),QYQD08 DECIMAL(15,5),QYQD09 DECIMAL(15,5),QYQD10 DECIMAL(15,5),QYQBCD VARCHAR(1),QYLMCC NUMERIC(2,0),QYLMDT NUMERIC(6,0),QYCTID VARCHAR(3),QYCURR VARCHAR(3))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#VolumeBreakQtyFilter", dataSet.Tables[0]);

                        const string volumeQtyPricingMerge = @" 
                                                         
                                                        Declare @warehouseName as varchar(max) ;
                                                        Declare @Currency as varchar(max)
                                                        SET @currency = (SELECT Distinct QYCURR FROM [#VolumeBreakQtyFilter])
                                                        if (@currency = '') 
                                                        SET @warehouseName = 'B1'                                                 
                                                        ELSE
                                                        SET @warehouseName = 'C1'      
                                                       
                                                        UPDATE #VolumeBreakQtyFilter
                                                        SET QYCURR = (case when QYCURR ='' then 'USD' else QYCURR end)

                                                        Update #VolumeBreakQtyFilter set
                                                        QYDSIT =RTRIM(LTRIM(QYDSIT)), [DESC] =RTRIM(LTRIM([DESC])),
                                                        QYQDTP =RTRIM(LTRIM(QYQDTP)), QYQGRP =RTRIM(LTRIM(QYQGRP)),
                                                        QYWHID =RTRIM(LTRIM(QYWHID)), QYQPTP =RTRIM(LTRIM(QYQPTP)), QYBR01 =RTRIM(LTRIM(QYBR01)),
                                                        QYBR02 =RTRIM(LTRIM(QYBR02)), QYBR03 =RTRIM(LTRIM(QYBR03)), QYBR04 =RTRIM(LTRIM(QYBR04)), 
                                                        QYBR05 =RTRIM(LTRIM(QYBR05)), QYBR06 =RTRIM(LTRIM(QYBR06)), QYBR07 =RTRIM(LTRIM(QYBR07)),
                                                        QYBR08 =RTRIM(LTRIM(QYBR08)), QYBR09 =RTRIM(LTRIM(QYBR09)), QYBR10 =RTRIM(LTRIM(QYBR10)), 
                                                        QYQD01 =RTRIM(LTRIM(QYQD01)), QYQD02 =RTRIM(LTRIM(QYQD02)), QYQD03 =RTRIM(LTRIM(QYQD03)),
                                                        QYQD04 =RTRIM(LTRIM(QYQD04)), QYQD05 =RTRIM(LTRIM(QYQD05)), QYQD06 =RTRIM(LTRIM(QYQD06)),
														QYQD07 =RTRIM(LTRIM(QYQD07)), QYQD08 =RTRIM(LTRIM(QYQD08)), QYQD09 =RTRIM(LTRIM(QYQD09)), 
														QYQD10 =RTRIM(LTRIM(QYQD10)), QYQBCD =LTRIM(RTRIM(QYQBCD)), QYLMCC =RTRIM(LTRIM(QYLMCC)), 
                                                        QYLMDT =RTRIM(LTRIM(QYLMDT)), QYCTID =RTRIM(LTRIM(QYCTID)), QYCURR =RTRIM(LTRIM(QYCURR))

														-- Below queries will run price matrix for all the break qty group starts

														MERGE INTO PriceMatrix AS TARGET USING
                                                        (SELECT * FROM #VolumeBreakQtyFilter WHERE QYQDTP='G') AS SOURCE
                                                        ON TARGET.ProductKeyPart=SOURCE.QYDSIT AND SOURCE.QYQDTP = 'G' and TARGET.CurrencyCode = Source.QYCURR
                                                        WHEN NOT MATCHED THEN
                                                        INSERT (RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,PriceBasis01,PriceBasis02,PriceBasis03,PriceBasis04,PriceBasis05,PriceBasis06,PriceBasis07,PriceBasis08,PriceBasis09,PriceBasis10,PriceBasis11,AdjustmentType01,AdjustmentType02,AdjustmentType03,AdjustmentType04,AdjustmentType05,AdjustmentType06,AdjustmentType07,AdjustmentType08,AdjustmentType09,AdjustmentType10,AdjustmentType11,BreakQty01,BreakQty02,BreakQty03,BreakQty04,BreakQty05,BreakQty06,BreakQty07,BreakQty08,BreakQty09,BreakQty10,BreakQty11,Amount01,Amount02,Amount03,Amount04,Amount05,Amount06,Amount07,Amount08,Amount09,Amount10,Amount11)
                                                        VALUES('Customer Price Code/Product Price Code', SOURCE.QYCURR,@warehouseName,'PKG','1',QYDSIT,GETDATE(),NULL,'L','L','L','L','L','L','L','L','L','L','L','P','P','P','P','P','P','P','P','P','P','P',1.00000,QYBR10,QYBR09,QYBR08,QYBR07,QYBR06,QYBR05,QYBR04,QYBR03,QYBR02,QYBR01,CASE WHEN QYBR01 = 1.000 THEN CONCAT('-',QYQD01) ELSE '0' END,CONCAT('-',QYQD10),CONCAT('-',QYQD09),CONCAT('-',QYQD08),CONCAT('-',QYQD07),CONCAT('-',QYQD06),CONCAT('-',QYQD05),CONCAT('-',QYQD04),CONCAT('-',QYQD03),CONCAT('-',QYQD02),CONCAT('-',QYQD01))
                                                        WHEN MATCHED THEN
                                                        UPDATE SET ProductKeyPart=QYDSIT,BreakQty01=1.00000,BreakQty02=QYBR10,BreakQty03=QYBR09,BreakQty04=QYBR08,BreakQty05=QYBR07,BreakQty06=QYBR06,BreakQty07=QYBR05,BreakQty08=QYBR04,BreakQty09=QYBR03,BreakQty10=QYBR02,BreakQty11=QYBR01,Amount01 = (CASE WHEN QYBR01 = 1.000 THEN CONCAT('-',QYQD01) ELSE '0' END),Amount02=CONCAT('-',QYQD10),Amount03=CONCAT('-',QYQD09),Amount04=CONCAT('-',QYQD08),Amount05=CONCAT('-',QYQD07),Amount06=CONCAT('-',QYQD06),Amount07=CONCAT('-',QYQD05),Amount08=CONCAT('-',QYQD04),Amount09=CONCAT('-',QYQD03),Amount10=CONCAT('-',QYQD02),Amount11=CONCAT('-',QYQD01);


                                                        MERGE INTO PriceMatrix AS TARGET USING
                                                        (SELECT * FROM #VolumeBreakQtyFilter WHERE QYQDTP='I') AS SOURCE
                                                        ON TARGET.ProductKeyPart=SOURCE.QYDSIT AND SOURCE.QYQDTP = 'I' and TARGET.CurrencyCode = Source.QYCURR
                                                        WHEN NOT MATCHED THEN
                                                        INSERT(RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,PriceBasis01,PriceBasis02,PriceBasis03,PriceBasis04,PriceBasis05,PriceBasis06,PriceBasis07,PriceBasis08,PriceBasis09,PriceBasis10,PriceBasis11,AdjustmentType01,AdjustmentType02,AdjustmentType03,AdjustmentType04,AdjustmentType05,AdjustmentType06,AdjustmentType07,AdjustmentType08,AdjustmentType09,AdjustmentType10,AdjustmentType11,BreakQty01,BreakQty02,BreakQty03,BreakQty04,BreakQty05,BreakQty06,BreakQty07,BreakQty08,BreakQty09,BreakQty10,BreakQty11,Amount01,Amount02,Amount03,Amount04,Amount05,Amount06,Amount07,Amount08,Amount09,Amount10,Amount11)
                                                        VALUES('Customer Price Code/Product',SOURCE.QYCURR,@warehouseName,'PKG','1',QYDSIT,GETDATE(),NULL,'L','L','L','L','L','L','L','L','L','L','L','P','P','P','P','P','P','P','P','P','P','P',1.00000,QYBR10,QYBR09,QYBR08,QYBR07,QYBR06,QYBR05,QYBR04,QYBR03,QYBR02,QYBR01,CASE WHEN QYBR01 = 1.000 THEN CONCAT('-',QYQD01) ELSE '0' END,CONCAT('-',QYQD10),CONCAT('-',QYQD09),CONCAT('-',QYQD08),CONCAT('-',QYQD07),CONCAT('-',QYQD06),CONCAT('-',QYQD05),CONCAT('-',QYQD04),CONCAT('-',QYQD03),CONCAT('-',QYQD02),CONCAT('-',QYQD01))
                                                        WHEN MATCHED THEN
                                                          UPDATE SET ProductKeyPart=QYDSIT,BreakQty01=1.00000,BreakQty02=QYBR10,BreakQty03=QYBR09,BreakQty04=QYBR08,BreakQty05=QYBR07,BreakQty06=QYBR06,BreakQty07=QYBR05,BreakQty08=QYBR04,BreakQty09=QYBR03,BreakQty10=QYBR02,BreakQty11=QYBR01,Amount01 = (CASE WHEN QYBR01 = 1.000 THEN CONCAT('-',QYQD01) ELSE '0' END),Amount02=CONCAT('-',QYQD10),Amount03=CONCAT('-',QYQD09),Amount04=CONCAT('-',QYQD08),Amount05=CONCAT('-',QYQD07),Amount06=CONCAT('-',QYQD06),Amount07=CONCAT('-',QYQD05),Amount08=CONCAT('-',QYQD04),Amount09=CONCAT('-',QYQD03),Amount10=CONCAT('-',QYQD02),Amount11=CONCAT('-',QYQD01);

														  -- Below queries will run price matrix for all the break qty group ends

														  -- Below queries will run price matrix for break qty 1 and copy the amount of break qty 1 to default break qty 1 starts
														Select * INTO #BreakQtyTemp from
														(SELECT QYDSIT as id,breakqty
														from #VolumeBreakQtyFilter s 
														unpivot
														(
														  breakQty
														  for breakQuantity in (QYBR01, QYBR02, QYBR03,QYBR04,QYBR05,QYBR06,QYBR07,QYBR08,QYBR09,QYBR10)
														) u
														group by QYDSIT,breakqty having MIN(NULLIF(breakqty,0))=1) T1
														
														select * into #BreakQtyAmountTemp from 
														(select u.QYDSIT AS 'id' , CONCAT('-',MIN(NULLIF(u.amount,0))) as 'qty'
														from #VolumeBreakQtyFilter s
														unpivot
														(
														  amount for #BreakQtyAmount in (QYQD01, QYQD02, QYQD03,QYQD04,QYQD05,QYQD06,QYQD07,QYQD08,QYQD09,QYQD10)
														) u join #BreakQtyTemp t1 on t1.id =u.QYDSIT
														group by u.QYDSIT,t1.breakqty) T2
														

                                                        MERGE INTO PriceMatrix AS TARGET USING
                                                        (SELECT t1.qty,v.qydsit,QYBR10,QYBR09,QYBR08,QYBR07,QYBR06,QYBR05,QYBR04,QYBR03,QYBR02,QYBR01,QYQD01, QYQD02, QYQD03,QYQD04,QYQD05,QYQD06,QYQD07,QYQD08,QYQD09,QYQD10,QYQDTP , QYCURR FROM #VolumeBreakQtyFilter v JOIN #BreakQtyAmountTemp t1 on v.QYDSIT=t1.id WHERE QYQDTP='G') AS SOURCE
                                                        ON TARGET.ProductKeyPart=SOURCE.QYDSIT AND SOURCE.QYQDTP = 'G' and TARGET.CurrencyCode = Source.QYCURR
                                                        WHEN MATCHED THEN
                                                        UPDATE SET ProductKeyPart=QYDSIT,BreakQty01=1.00000,BreakQty02=QYBR10,BreakQty03=QYBR09,BreakQty04=QYBR08,BreakQty05=QYBR07,BreakQty06=QYBR06,BreakQty07=QYBR05,BreakQty08=QYBR04,BreakQty09=QYBR03,BreakQty10=QYBR02,BreakQty11=QYBR01,Amount01 = qty,Amount02=CONCAT('-',QYQD10),Amount03=CONCAT('-',QYQD09),Amount04=CONCAT('-',QYQD08),Amount05=CONCAT('-',QYQD07),Amount06=CONCAT('-',QYQD06),Amount07=CONCAT('-',QYQD05),Amount08=CONCAT('-',QYQD04),Amount09=CONCAT('-',QYQD03),Amount10=CONCAT('-',QYQD02),Amount11=CONCAT('-',QYQD01);


                                                        MERGE INTO PriceMatrix AS TARGET USING
                                                        (SELECT t1.qty,v.qydsit,QYBR10,QYBR09,QYBR08,QYBR07,QYBR06,QYBR05,QYBR04,QYBR03,QYBR02,QYBR01,QYQD01, QYQD02, QYQD03,QYQD04,QYQD05,QYQD06,QYQD07,QYQD08,QYQD09,QYQD10,QYQDTP , QYCURR FROM #VolumeBreakQtyFilter v JOIN #BreakQtyAmountTemp t1 on v.QYDSIT=t1.id WHERE QYQDTP='I') AS SOURCE
                                                        ON TARGET.ProductKeyPart=SOURCE.QYDSIT AND SOURCE.QYQDTP = 'I' and TARGET.CurrencyCode = Source.QYCURR
                                                        WHEN MATCHED THEN
                                                          UPDATE SET ProductKeyPart=QYDSIT,BreakQty01=1.00000,BreakQty02=QYBR10,BreakQty03=QYBR09,BreakQty04=QYBR08,BreakQty05=QYBR07,BreakQty06=QYBR06,BreakQty07=QYBR05,BreakQty08=QYBR04,BreakQty09=QYBR03,BreakQty10=QYBR02,BreakQty11=QYBR01,Amount01 = qty,Amount02=CONCAT('-',QYQD10),Amount03=CONCAT('-',QYQD09),Amount04=CONCAT('-',QYQD08),Amount05=CONCAT('-',QYQD07),Amount06=CONCAT('-',QYQD06),Amount07=CONCAT('-',QYQD05),Amount08=CONCAT('-',QYQD04),Amount09=CONCAT('-',QYQD03),Amount10=CONCAT('-',QYQD02),Amount11=CONCAT('-',QYQD01);

														 DROP TABLE #BreakQtyTemp
														 DROP TABLE #BreakQtyAmountTemp
														 DROP TABLE #VolumeBreakQtyFilter

														  			  -- Below queries will run price matrix for break qty 1 and copy the amount of break qty 1 to default break qty 1 ends";

                        using (var command = new SqlCommand(volumeQtyPricingMerge, sqlConnection))
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