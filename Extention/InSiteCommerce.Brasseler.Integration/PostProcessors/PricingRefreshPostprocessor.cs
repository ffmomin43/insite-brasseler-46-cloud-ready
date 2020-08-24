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
    [DependencyName("PricingRefreshPostprocessor")]
    public class PricingRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create Table #PricingFilter
                                                            (CompanyNo nvarchar(max),ContractNo nvarchar(max),CustomerCode nvarchar(max),CustomerID nvarchar(max),ItemCode nvarchar(max),
                                                            ItemNumber nvarchar(max),PriceCode nvarchar(max),NegotiatedPrice nvarchar(max),StartCC nvarchar(max),StartDate nvarchar(max),
                                                            ExpCC nvarchar(max),ExpDate nvarchar(max),LastMaintenanceCC nvarchar(max),LastMaintenanceDate nvarchar(max),PriceDiscountCode nvarchar(max),
                                                            PriceBucket nvarchar(max),CountryID nvarchar(max),Currency nvarchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#PricingFilter", dataSet.Tables[0]);

                        const string pricingMerge = @" 
                                                         
                                                        Update #PricingFilter set Currency = Case When Currency ='' then 'USD' else Currency  end ;

                                                        Declare @warehouseName as varchar(max) ;
                                                        Declare @Currency as varchar(max)
                                                        SET @currency = (SELECT Distinct Currency FROM [#PricingFilter])
                                                        if (@currency ='USD') 
                                                        SET @warehouseName = 'B1'
                                                        ELSE
                                                        SET @warehouseName = 'C1'

                                                    -- Begin : Contract: Customer/Item Number

                                                    MERGE INTO PriceMatrix AS TARGET USING
	                                                    (select cr.Id as CustomerId,prf.Currency as CurrencyCode,pr.Id as ProductId,pr.UnitOfMeasure,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice	 
	                                                     from #PricingFilter prf join Product pr on pr.Name = prf.ItemNumber and prf.CustomerCode =''
														 and prf.ItemCode = ''
	                                                    join Customer cr on cr.CustomerNumber= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int)))
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product' and TARGET.CustomerKeyPart=SOURCE.CustomerId and TARGET.ProductKeyPart=SOURCE.ProductId
                                                        AND @currency =Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer/Product',SOURCE.CurrencyCode ,
			                                                    @warehouseName,LTRIM(RTRIM(SOURCE.UnitOfMeasure)),
																SOURCE.CustomerId,SOURCE.ProductId,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																      when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET UnitOfMeasure= LTRIM(RTRIM(SOURCE.UnitOfMeasure)),ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
				                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																	when SOURCE.PriceCode ='D'then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000'  end);

                                                    -- End : Contract: Customer/Item Number


                                                    -- BUSA : 457 : Price matrix for Price code blank contract Starts.
                                                    -- BEGIN : Contract: Customer/Item Number with Customer sequence

                                                        MERGE INTO PriceMatrix AS TARGET USING
	                                                    (select cr.Id as CustomerId,prf.Currency as CurrencyCode,pr.Id as ProductId,pr.UnitOfMeasure,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice	 
	                                                     from #PricingFilter prf join Product pr on pr.Name = prf.ItemNumber and prf.CustomerCode =''
														 and prf.ItemCode = ''
	                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int)))
	                                                    AS SOURCE
                                                        ON TARGET.RecordType ='Customer/Product' and TARGET.CustomerKeyPart=SOURCE.CustomerId
                                                        and TARGET.ProductKeyPart=SOURCE.ProductId AND @currency =Source.CurrencyCode
                                                        WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer/Product',SOURCE.CurrencyCode ,
			                                                    @warehouseName,LTRIM(RTRIM(SOURCE.UnitOfMeasure)),
																SOURCE.CustomerId,SOURCE.ProductId,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																      when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET UnitOfMeasure= LTRIM(RTRIM(SOURCE.UnitOfMeasure)),ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
				                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																	when SOURCE.PriceCode ='D'then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000'  end);

                                                     -- BUSA : 457 : Price matrix for Price code blank contract Ends.
                                                    -- End : Contract: Customer/Item Number with Customer sequence


                                                     -- Begin : Contract: Customer / Item class/sub class

													select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice into #temp_CRPCMergeSource  
														 from #PricingFilter prf join Product pr 
														 on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
	                                                    join Customer cr on cr.CustomerNumber= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int)) WHERE cr.CustomerSequence = ''

                                                    MERGE INTO PriceMatrix AS TARGET USING

	                                                    (select * from #temp_CRPCMergeSource)
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND @currency =Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer/Product Price Code',SOURCE.CurrencyCode,
			                                                    @warehouseName,SOURCE.CustomerId,SOURCE.ProductPriceCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                      when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																	  then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
									                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' 
																						then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' 
																						   when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																			when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000'  end);
			
													drop table #temp_CRPCMergeSource;

                                                    -- End : Contract: Customer / Item class/sub class

                                                    -- BUSA : 539 : Pricing Issue - 1037895 GEORGIA ENDODONTIC SPECIALIST--Bill to 980399 Starts

                                                        select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice into #temp_CustomerSequence  
														 from #PricingFilter prf join Product pr 
														 on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
	                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int))

                                                    MERGE INTO PriceMatrix AS TARGET USING

	                                                    (select * from #temp_CustomerSequence)
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND @currency =Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer/Product Price Code',SOURCE.CurrencyCode ,
			                                                    @warehouseName,SOURCE.CustomerId,SOURCE.ProductPriceCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                      when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																	  then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
									                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' 
																						then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' 
																						   when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																			when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000'  end);
			
													drop table  #temp_CustomerSequence;

                                                    -- BUSA : 539 : Pricing Issue - 1037895 GEORGIA ENDODONTIC SPECIALIST--Bill to 980399 Ends

                                                    -- BUSA : 457 : Price matrix for Price code blank contract Starts.
                                                    -- Begin : Contract: Customer / Product Contract Code - Price Code is blank with Customer Sequence Condition

													select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice into #temp_PriceCodeBlankMergeSource  
														 from #PricingFilter prf join Product pr  
														 on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' and prf.PriceCode=''
	                                                   join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int))

                                                    MERGE INTO PriceMatrix AS TARGET USING

	                                                    (select * from #temp_PriceCodeBlankMergeSource)
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND @currency =Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer/Product Price Code',SOURCE.CurrencyCode,
			                                                    @warehouseName,SOURCE.CustomerId,SOURCE.ProductPriceCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                      when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																	  then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
									                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' 
																						then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' 
																						   when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																			when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000'  end);
			
													        drop table #temp_PriceCodeBlankMergeSource;

                                                    -- End : Contract: Customer / Product Contract Code - Price Code is blank with Customer Sequence Condition

	
                                                      -- Begin : Contract: Customer / Product Contract Code - Customer Sequence Condition (Ship To)

													select distinct cast(cr.Id as varchar(max)) as CustomerId,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice into #temp_CustomerSequenceMergeSource  
														 from #PricingFilter prf join Product pr  
														 on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) and prf.CustomerCode ='' and prf.ItemCode = 'G' 
	                                                    join Customer cr on cr.CustomerSequence= CONCAT(prf.CompanyNo,CAST(prf.CustomerID  AS int))

                                                    MERGE INTO PriceMatrix AS TARGET USING

	                                                    (select * from #temp_CustomerSequenceMergeSource)
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerId 
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND @currency=Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer/Product Price Code',SOURCE.CurrencyCode,
			                                                    @warehouseName,SOURCE.CustomerId,SOURCE.ProductPriceCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                      when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																	  then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
									                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' 
																						then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' 
																						   when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																			when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000'  end);
			
													drop table #temp_CustomerSequenceMergeSource;

                                                    -- End : Contract: Customer / Product Contract Code - Customer Sequence Condition (Ship To)

                                                    -- BUSA : 457 : Price matrix for Price code blank contract Ends.



                                                    -- Begin : Contract: Customer contract code / Item number

                                                    
                                                    select distinct cr.PriceCode as CustomerPriceCode,prf.Currency as CurrencyCode,cast(pr.Id as varchar(max)) as ProductId,
	                                                    pr.UnitOfMeasure,LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                    CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                    CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
	                                                    LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice into #temp_CCDPRMergeSource 
														from #PricingFilter prf join Product pr on pr.Name =prf.ItemNumber 
	                                                    and prf.CustomerCode ='G' and prf.ItemCode = ''	join Customer cr on cr.PriceCode= LTRIM(RTRIM(prf.CustomerID))

                                                    MERGE INTO PriceMatrix AS TARGET USING
	                                                    (select * from #temp_CCDPRMergeSource)
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer Price Code/Product' and TARGET.ProductKeyPart=SOURCE.ProductId  
                                                    and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode AND @currency =Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer Price Code/Product',SOURCE.CurrencyCode,
			                                                    @warehouseName,SOURCE.UnitOfMeasure,SOURCE.CustomerPriceCode,SOURCE.ProductId,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																	then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' 
																when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice when SOURCE.PriceCode ='D' 
																then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET UnitOfMeasure= SOURCE.UnitOfMeasure,ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
									                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																						then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																				   when SOURCE.PriceCode ='D'then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end);
							 
                                                    drop table #temp_CCDPRMergeSource;

                                                    -- End : Contract: Customer contract code / Item number

	
                                                    -- Begin : Contract: Customer contract code / Item class/sub class
                                                    
                                                    MERGE INTO PriceMatrix AS TARGET USING
	                                                    (select distinct cr.PriceCode as CustomerPriceCode,prf.Currency as CurrencyCode,pr.ProductCode as ProductPriceCode,
														 LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
														 LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice
	                                                     from #PricingFilter prf join Product pr on pr.ProductCode = LTRIM(RTRIM(prf.ItemNumber)) 
														 and prf.CustomerCode ='G' and prf.ItemCode = 'G' and prf.ItemNumber like '    %'
	                                                     join Customer cr on cr.PriceCode= LTRIM(RTRIM(prf.CustomerID)))
	                                                    AS SOURCE
                                                    ON TARGET.RecordType ='Customer Price Code/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode
                                                    and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND TARGET.CurrencyCode = Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer Price Code/Product Price Code',SOURCE.CurrencyCode,
			                                                    @warehouseName,SOURCE.CustomerPriceCode,SOURCE.ProductPriceCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                    when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																	then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end)			
		                                                    )
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
									                                                   when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
																					   then concat('P',cast(PriceBucket as int)+1) end),
				                                                    AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
				                                                    Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
																				   when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end);

                                                    -- End : Contract: Customer contract code / Item class/sub class

                                                         -- Begin : Contract: Customer contract code / Item class/sub class based on Product Class
                                                         -- BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Starts    
   
                                                        MERGE INTO PriceMatrix AS TARGET USING
                                                        (
                                                        select distinct prf.ItemNumber, cr.PriceCode as CustomerPriceCode,prf.Currency as CurrencyCode,SUBSTRING(pr.ProductCode,0,3) as ProductPriceCode,
                                                        LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
                                                        CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
                                                        CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
                                                        LTRIM(RTRIM(prf.NegotiatedPrice)) NegotiatedPrice
                                                        from #PricingFilter prf join Product pr on SUBSTRING(pr.ProductCode,0,3) = LTRIM(RTRIM(prf.ItemNumber)) 
                                                        and prf.CustomerCode ='G' and prf.ItemCode = 'G'
                                                        join Customer cr on cr.PriceCode= LTRIM(RTRIM(prf.CustomerID)) AND prf.pricecode <> ''
                                                        )
                                                        AS SOURCE
                                                        ON TARGET.RecordType ='Customer Price Code/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode 
                                                        and TARGET.ProductKeyPart=SOURCE.ProductPriceCode AND TARGET.CurrencyCode = Source.CurrencyCode
                                                        WHEN NOT MATCHED THEN
                                                        INSERT(id,RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
                                                        VALUES(NEWID(),'Customer Price Code/Product Price Code',SOURCE.CurrencyCode,
                                                        @warehouseName,SOURCE.CustomerPriceCode,SOURCE.ProductPriceCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
                                                        (case when SOURCE.PriceCode ='$' then 'O' 
                                                        when SOURCE.PriceCode ='D'
                                                        then concat('P',cast(PriceBucket as int)+1) end),
                                                        (case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
                                                        (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                        WHEN MATCHED THEN
                                                        UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
                                                        PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
                                                        when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
                                                        then concat('P',cast(PriceBucket as int)+1) end),
                                                        AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' then 'P' end),
                                                        Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
                                                        when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end);
                                        
                                                    -- BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Ends
                                                    -- Ends : Contract: Customer contract code / Item class/sub class based on Product Class
                                                    
													-- Begin : Contract: Customer contract code / Item contract code

													MERGE INTO PriceMatrix AS TARGET USING
	                                                    (select distinct LTRIM(RTRIM(cr.PriceCode)) as CustomerPriceCode,LTRIM(RTRIM(prf.Currency)) CurrencyCode,
	                                                     LTRIM(RTRIM(cp.Value)) as ProductContractCode,LTRIM(RTRIM(prf.PriceCode)) PriceCode,LTRIM(RTRIM(prf.PriceBucket)) PriceBucket,
	                                                     CONVERT(datetime,convert(char(8),((prf.StartCC * 1000000) + prf.StartDate)),102) as ActivateOn,
	                                                     CONVERT(datetime,convert(char(8),((prf.ExpCC * 1000000) + prf.ExpDate)),102) as DeactivateOn,
	                                                     LTRIM(RTRIM(prf.NegotiatedPrice))	NegotiatedPrice
	                                                     from #PricingFilter prf join Customer cr on cr.PriceCode= prf.CustomerID 
	                                                     join  CustomProperty cp on (cp.Name='ProductContractCode' and cp.ParentTable='Product' and cp.Value =LTRIM(RTRIM(prf.ItemNumber)))	
	                                                     where (prf.CustomerCode ='G' and prf.ItemCode = 'G' and prf.ItemNumber not like '    %'))
	                                                    AS SOURCE
                                                     ON TARGET.RecordType ='Customer Price Code/Product Price Code' and TARGET.CustomerKeyPart=SOURCE.CustomerPriceCode 
                                                        and TARGET.ProductKeyPart=SOURCE.ProductContractCode AND TARGET.CurrencyCode = Source.CurrencyCode
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,PriceBasis01,AdjustmentType01,BreakQty01,Amount01)
	                                                    VALUES('Customer Price Code/Product Price Code',SOURCE.CurrencyCode,
		                                                       @warehouseName,SOURCE.CustomerPriceCode,SOURCE.ProductContractCode,SOURCE.ActivateOn,SOURCE.DeactivateOn,
			                                                    (case when SOURCE.PriceCode ='$' then 'O' 
				                                                      when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
				                                                      then concat('P',cast(PriceBucket as int)+1) end),
			                                                    (case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),1,
			                                                    (case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
				                                                      when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end))
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn,
			                                                       PriceBasis01= (case when SOURCE.PriceCode ='$' then 'O' 
								                                                       when SOURCE.PriceCode ='D' or SOURCE.PriceCode =''
								                                                       then concat('P',cast(PriceBucket as int)+1) end),
			                                                       AdjustmentType01=(case when SOURCE.PriceCode ='$' then 'A' when SOURCE.PriceCode ='D' or SOURCE.PriceCode ='' then 'P' end),
			                                                       Amount01=(case when SOURCE.PriceCode ='$' then SOURCE.NegotiatedPrice 
							                                                      when SOURCE.PriceCode ='D' then CONCAT('-',SOURCE.NegotiatedPrice) else '0.00000' end);

													-- End : Contract: Customer contract code / Item contract code

													-- Begin : Contract: Customer All / Item number
                                                    Declare @currencyCode varchar(50);
                                                    SET @currencyCode = (SELECT Distinct Ltrim(Rtrim(Currency)) FROM #PricingFilter)
                                                    MERGE INTO PriceMatrix AS TARGET USING
	                                                    (select Id as ProductId,* from product)
	                                                    AS SOURCE
	                                                    ON TARGET.RecordType ='Product' and TARGET.CustomerKeyPart='' and TARGET.ProductKeyPart=SOURCE.ProductId AND TARGET.CurrencyCode = @currencyCode                                                           
                                                    WHEN NOT MATCHED THEN
	                                                    INSERT(RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,
			                                                    PriceBasis01,AdjustmentType01,BreakQty01)
	                                                    VALUES('Product',@currencyCode,@warehouseName,LTRIM(RTRIM(SOURCE.UnitOfMeasure)),'',SOURCE.ProductId,SOURCE.ActivateOn,SOURCE.DeactivateOn,'P1','P','1')
                                                    WHEN MATCHED THEN
	                                                    UPDATE SET UnitOfMeasure= LTRIM(RTRIM(SOURCE.UnitOfMeasure)),ActivateOn=SOURCE.ActivateOn,DeactivateOn=SOURCE.DeactivateOn;


                                                     -- End : Contract: Customer All / Item number
                                                    
                                                  -- BUSA-443  : Purging Deactivate Price Matrices From Insite Start

                                                 DELETE FROM PriceMatrix WHERE DeactivateOn <= GETDATE()

                                                   -- BUSA-443 : Purging Deactivate Price Matrices From Insite End
                                                   
                                                   DROP TABLE #PricingFilter";

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