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
    [DependencyName("PricingRefreshPostprocessorDeletion")]
    public class PricingRefreshPostprocessorDeletion : IntegrationBase, IJobPostprocessor
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

                        const string createTempTableSql = @"Create Table #PricingFilterDeletion
                                                            (CompanyNo nvarchar(max),ContractNo nvarchar(max),CustomerCode nvarchar(max),CustomerID nvarchar(max),ItemCode nvarchar(max),
                                                            ItemNumber nvarchar(max),StartCC nvarchar(max),StartDate nvarchar(max),ExpCC nvarchar(max),
                                                            ExpDate nvarchar(max),Currency nvarchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#PricingFilterDeletion", dataSet.Tables[0]);

                        const string pricingMerge = @"                                                          
                                                    Update #PricingFilterDeletion set Currency = Case When Currency ='' then 'USD' else LTRIM(RTRIM(Currency))  end ;
                                                                                                  
                                                    -- Begin : Contract: Customer/Item Number

                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (select cr.Id as CustomerId,prf.Currency as CurrencyCode,pr.Id as ProductId,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn                                               
                                                    from #PricingFilterDeletion prf join Product pr on pr.Name = prf.ItemNumber and prf.CustomerCode =''
                                                    and prf.ItemCode = ''
                                                    join Customer cr on cr.CustomerNumber= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int)))
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductId
                                                    AND Target.CurrencyCode =Source.CurrencyCode  and SOURCE.ActivateOn = Target.ActivateOn
                                                    WHEN MATCHED THEN
	                                                UPDATE SET DeactivateOn = Source.DeactivateOn;

                                                    -- End : Contract: Customer/Item Number


                                                 -- BUSA : 457 : Price matrix for Price code blank contract Starts.
                                                    -- BEGIN : Contract: Customer/Item Number with Customer sequence

                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (select cr.Id as CustomerId,prf.Currency as CurrencyCode,pr.Id as ProductId,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn                                                    
                                                    from #PricingFilterDeletion prf join Product pr on pr.Name = prf.ItemNumber and prf.CustomerCode =''
                                                    and prf.ItemCode = ''
                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int)))
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product' and TARGET.CustomerKeyPart=SOURCE.CustomerId
                                                    and TARGET.ProductKeyPart=SOURCE.ProductId AND Target.CurrencyCode =Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                
                                                    WHEN MATCHED THEN
                                                    Update SET DeactivateOn=SOURCE.DeactivateOn;                                               

                                                    -- BUSA : 457 : Price matrix for Price code blank contract Ends.
                                                    -- End : Contract: Customer/Item Number with Customer sequence

                                                    -- Begin : Contract: Customer / Item class/sub class

                                                    select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,                                                
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    into #temp_CRPCMergeSource  
                                                    from #PricingFilterDeletion prf join Product pr 
                                                    on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
                                                    join Customer cr on cr.CustomerNumber= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int)) WHERE cr.CustomerSequence = ''

                                                    MERGE INTO PriceMatrix AS TARGET USING

                                                    (select * from #temp_CRPCMergeSource)
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND Target.CurrencyCode =Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;
			
                                                    drop table #temp_CRPCMergeSource;

                                                    -- End : Contract: Customer / Item class/sub class
                                                    -- End : Contract: Customer / Item class/sub class

                                                    -- BUSA : 539 : Pricing Issue - 1037895 GEORGIA ENDODONTIC SPECIALIST--Bill to 980399 Starts

                                                    select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,                                               
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    into #temp_CustomerSequence  
                                                    from #PricingFilterDeletion prf join Product pr 
                                                    on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int))

                                                    MERGE INTO PriceMatrix AS TARGET USING

                                                    (select * from #temp_CustomerSequence)
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND Target.CurrencyCode =Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn                                              
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;
			
                                                    drop table  #temp_CustomerSequence;
                                                    -- BUSA : 539 : Pricing Issue - 1037895 GEORGIA ENDODONTIC SPECIALIST--Bill to 980399 Ends

                                                    -- BUSA : 457 : Price matrix for Price code blank contract Starts.
                                                    -- Begin : Contract: Customer / Product Contract Code - Price Code is blank with Customer Sequence Condition

                                                    select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    into #temp_PriceCodeBlankMergeSource  
                                                    from #PricingFilterDeletion prf join Product pr  
                                                    on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int))

                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (select * from #temp_PriceCodeBlankMergeSource)
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND Target.CurrencyCode = Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;			
                                                
                                                    drop table #temp_PriceCodeBlankMergeSource;

                                                    --End : Contract: Customer / Product Contract Code - Price Code is blank with Customer Sequence Condition
                                                    --Begin : Contract: Customer / Product Contract Code - Customer Sequence Condition (Ship To)

                                                    select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    into #temp_CustomerSequenceMergeSource  
                                                    from #PricingFilterDeletion prf join Product pr  
                                                    on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int))

                                                    MERGE INTO PriceMatrix AS TARGET USING

                                                    (select * from #temp_CustomerSequenceMergeSource)
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND Target.CurrencyCode = Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;
			
                                                    drop table #temp_CustomerSequenceMergeSource;

                                                    --End : Contract: Customer / Product Contract Code - Customer Sequence Condition (Ship To)
                                                
                                                    --Begin : Contract: Customer contract code / Item number 
                                                   
                                                    select distinct cr.PriceCode as CustomerPriceCode,prf.Currency as CurrencyCode,cast(pr.Id as varchar(max)) as ProductId,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    into #temp_CCDPRMergeSource 
                                                    from #PricingFilterDeletion prf join Product pr on pr.Name = prf.ItemNumber 
                                                    and prf.CustomerCode ='G' and prf.ItemCode = ''	
                                                    join Customer cr on cr.PriceCode= LTRIM(RTRIM(prf.CustomerID))

                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (select * from #temp_CCDPRMergeSource)
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer Price Code/Product' and TARGET.ProductKeyPart=SOURCE.ProductId  
                                                    and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode AND Target.CurrencyCode =Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                    
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;							 
                                                
                                                    drop table #temp_CCDPRMergeSource;
                                                    -- End : Contract: Customer contract code / Item number

                                                    -- Begin : Contract: Customer contract code / Item class/sub class
                                                    
                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (select distinct cr.PriceCode as CustomerPriceCode,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    from #PricingFilterDeletion prf join Product pr on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) 
                                                    and prf.CustomerCode ='G' and prf.ItemCode = 'G' and prf.ItemNumber like '    %'
                                                    join Customer cr on cr.PriceCode= LTRIM(RTRIM(prf.CustomerID)))
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer Price Code/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND TARGET.CurrencyCode = Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                               
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;
                                                    -- End : Contract: Customer contract code / Item class/sub class

                                                    -- Begin : Contract: Customer contract code / Item class/sub class based on Product Class Customer 1061091 TLC FOR SMILES Starts
                                                    -- BUSA-555 : Pricing issue for     
   
                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (
                                                    select distinct prf.ItemNumber, cr.PriceCode as CustomerPriceCode,prf.Currency as CurrencyCode,SUBSTRING(pr.ProductCode,0,3) as ProductPriceCode,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn
                                                    from #PricingFilterDeletion prf join Product pr on SUBSTRING(pr.ProductCode,0,3) = LTRIM(RTRIM(prf.ItemNumber)) 
                                                    and prf.CustomerCode ='G' and prf.ItemCode = 'G'
                                                    join Customer cr on cr.PriceCode= LTRIM(RTRIM(prf.CustomerID)) 
                                                    )
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer Price Code/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND TARGET.CurrencyCode = Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                    
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;
                                        
                                                    -- BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Ends
                                                    -- Ends : Contract: Customer contract code / Item class/sub class based on Product Class
                                                    -- Begin : Contract: Customer contract code / Item contract code

                                                    MERGE INTO PriceMatrix AS TARGET USING
                                                    (select distinct LTRIM(RTRIM(cr.PriceCode)) as CustomerPriceCode,LTRIM(RTRIM(prf.Currency)) CurrencyCode,
                                                    LTRIM(RTRIM(cp.Value)) as ProductContractCode,
                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn                                                
                                                    from #PricingFilterDeletion prf join Customer cr on cr.PriceCode= prf.CustomerID 
                                                    join  CustomProperty cp on (cp.Name='ProductContractCode' and cp.ParentTable='Product' and cp.Value =LTRIM(RTRIM(prf.ItemNumber)))	
                                                    where (prf.CustomerCode ='G' and prf.ItemCode = 'G' and prf.ItemNumber not like '    %')) 
                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer Price Code/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductContractCode AND TARGET.CurrencyCode = Source.CurrencyCode
                                                    and SOURCE.ActivateOn = Target.ActivateOn
                                                
                                                    WHEN MATCHED THEN
                                                    UPDATE SET DeactivateOn=SOURCE.DeactivateOn;

                                                    -- End : Contract: Customer contract code / Item contract code

                                                

                                                    -- End : Contract: Customer All / Item number                                                    
                                                    -- BUSA-443  : Purging Deactivate Price Matrices From Insite Start
                                                    -- Archived deletetion of records from Price matrix table
                                                    MERGE INTO PriceMatrix_Archived AS TARGET USING
	                                                (SELECT * from PriceMatrix where DeactivateOn <= GETDATE())
                                                    AS SOURCE ON TARGET.ID = SOURCE.ID
                                                    WHEN NOT MATCHED THEN
                                                       INSERT (ID,RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,CalculationFlags,
                                                        PriceBasis01,PriceBasis02,PriceBasis03,PriceBasis04,PriceBasis05,PriceBasis06,
                                                        PriceBasis07,PriceBasis08,PriceBasis09,PriceBasis10,PriceBasis11,AdjustmentType01,
                                                        AdjustmentType02,AdjustmentType03,AdjustmentType04,AdjustmentType05,AdjustmentType06,
                                                        AdjustmentType07,AdjustmentType08,AdjustmentType09,AdjustmentType10,AdjustmentType11,
                                                        BreakQty01,BreakQty02,BreakQty03,BreakQty04,BreakQty05,BreakQty06,BreakQty07,BreakQty08,
                                                        BreakQty09,BreakQty10,BreakQty11,Amount01,Amount02,Amount03,Amount04,Amount05,Amount06,
                                                        Amount07,Amount08,Amount09,Amount10,Amount11,AltAmount01,AltAmount02,AltAmount03,
                                                        AltAmount04,AltAmount05,AltAmount06,AltAmount07,AltAmount08,AltAmount09,AltAmount10,
                                                        AltAmount11,CreatedOn,CreatedBy,ModifiedOn,ModifiedBy) 
                                                        VALUES( SOURCE.ID,SOURCE.RecordType,SOURCE.CurrencyCode,SOURCE.Warehouse,SOURCE.UnitOfMeasure,SOURCE.CustomerKeyPart,SOURCE.ProductKeyPart,SOURCE.ActivateOn,SOURCE.DeactivateOn,SOURCE.CalculationFlags,
                                                        SOURCE.PriceBasis01,SOURCE.PriceBasis02,SOURCE.PriceBasis03,SOURCE.PriceBasis04,SOURCE.PriceBasis05,SOURCE.PriceBasis06,
                                                        SOURCE.PriceBasis07,SOURCE.PriceBasis08,SOURCE.PriceBasis09,SOURCE.PriceBasis10,SOURCE.PriceBasis11,SOURCE.AdjustmentType01,
                                                        SOURCE.AdjustmentType02,SOURCE.AdjustmentType03,SOURCE.AdjustmentType04,SOURCE.AdjustmentType05,SOURCE.AdjustmentType06,
                                                        SOURCE.AdjustmentType07,SOURCE.AdjustmentType08,SOURCE.AdjustmentType09,SOURCE.AdjustmentType10,SOURCE.AdjustmentType11,
                                                        SOURCE.BreakQty01,SOURCE.BreakQty02,SOURCE.BreakQty03,SOURCE.BreakQty04,SOURCE.BreakQty05,SOURCE.BreakQty06,SOURCE.BreakQty07,SOURCE.BreakQty08,
                                                        SOURCE.BreakQty09,SOURCE.BreakQty10,SOURCE.BreakQty11,SOURCE.Amount01,SOURCE.Amount02,SOURCE.Amount03,SOURCE.Amount04,SOURCE.Amount05,SOURCE.Amount06,
                                                        SOURCE.Amount07,SOURCE.Amount08,SOURCE.Amount09,SOURCE.Amount10,SOURCE.Amount11,SOURCE.AltAmount01,SOURCE.AltAmount02,SOURCE.AltAmount03,
                                                        SOURCE.AltAmount04,SOURCE.AltAmount05,SOURCE.AltAmount06,SOURCE.AltAmount07,SOURCE.AltAmount08,SOURCE.AltAmount09,SOURCE.AltAmount10,
                                                        SOURCE.AltAmount11,SOURCE.CreatedOn,SOURCE.CreatedBy,SOURCE.ModifiedOn,SOURCE.ModifiedBy  );

                                                        -- BUSA-443  : Purging Deactivate Price Matrices From Insite Start
                                                           DELETE FROM PRICEMATRIX WHERE DeactivateOn <= GETDATE();
                                                        -- BUSA-443 : Purging Deactivate Price Matrices From Insite End 
                                                           DROP TABLE #PricingFilterDeletion";

                        using (var command = new SqlCommand(pricingMerge, sqlConnection))
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