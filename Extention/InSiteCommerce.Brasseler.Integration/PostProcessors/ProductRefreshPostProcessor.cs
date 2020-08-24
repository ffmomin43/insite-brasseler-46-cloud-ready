using Insite.Integration.WebService.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data;
using System.Threading;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using System.Data.SqlClient;
using Insite.Common.Logging;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("ProductRefreshPostprocessor")]
    public class ProductRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #ProductFilter 
                                                            (Name varchar(32),ERPDescription varchar(max),ProductCode varchar(50),PriceCode varchar(50),UnitOfMeasure varchar(50),Sku varchar(100),
                                                            ActivateOn varchar(100),TaxCode1 varchar(50),ShippingWeight decimal(18,3), QtyPerPackage decimal(18,3),
                                                            ERPNumber varchar(50),UPCCode varchar(50),TaxCategory varchar(50),BasicListPrice decimal(18,3), 
                                                            IsDiscontinued varchar(100), ManufacturerItem varchar(100),SuspendCode varchar(10),
                                                            LastMaintenanceDate varchar(100),Price1 decimal(18,3), Price2 decimal(18,3), 
                                                            Price3 decimal(18,3), Price4 decimal(18,3), Price5 decimal(18,3),AltCnv varchar(100),
                                                            Replacement varchar(32), ItemContrCode varchar(32), --RestrictionCode varchar(10), 
                                                            PrdTaxId varchar(100), QtyBrkCls varchar(50), VolumeQtyGroupName varchar(max) , WareHouseID nvarchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#ProductFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table
                        const string productMerge = @"  
                                                       Update #ProductFilter set
                                                        Name =RTRIM(LTRIM(Name)), ERPDescription =RTRIM(LTRIM(ERPDescription)), ProductCode =RTRIM(LTRIM(ProductCode)),
                                                        PriceCode =RTRIM(LTRIM(PriceCode)), UnitOfMeasure =RTRIM(LTRIM(UnitOfMeasure)), Sku =RTRIM(LTRIM(Sku)),
                                                        ActivateOn =RTRIM(LTRIM(ActivateOn)), TaxCode1 =RTRIM(LTRIM(TaxCode1)), ShippingWeight =RTRIM(LTRIM(ShippingWeight)), 
                                                        QtyPerPackage =RTRIM(LTRIM(QtyPerPackage)), ERPNumber =RTRIM(LTRIM(ERPNumber)), UPCCode =RTRIM(LTRIM(UPCCode)),
                                                        TaxCategory =RTRIM(LTRIM(TaxCategory)), BasicListPrice =RTRIM(LTRIM(BasicListPrice)), IsDiscontinued =RTRIM(LTRIM(IsDiscontinued)), 
                                                        ManufacturerItem =RTRIM(LTRIM(ManufacturerItem)), SuspendCode =RTRIM(LTRIM(SuspendCode)), LastMaintenanceDate =RTRIM(LTRIM(LastMaintenanceDate)),
                                                        Price1 =RTRIM(LTRIM(Price1)),  Price2 =RTRIM(LTRIM(Price2)),  Price3 =RTRIM(LTRIM(Price3)),  Price4 =RTRIM(LTRIM(Price4)),  Price5 =RTRIM(LTRIM(Price5)),AltCnv = RTRIM(LTRIM(AltCnv)),
                                                        Replacement =RTRIM(LTRIM(Replacement)), ItemContrCode=RTRIM(LTRIM(ItemContrCode)),--RestrictionCode = LTRIM(RTRIM(RestrictionCode)),
                                                        PrdTaxId = LTRIM(RTRIM(PrdTaxId)), QtyBrkCls = LTRIM(RTRIM(QtyBrkCls)), VolumeQtyGroupName = LTRIM(RTRIM(VolumeQtyGroupName)), WareHouseID =RTRIM(LTRIM(WareHouseID))


                                                        Declare @currentdate  as datetime 
                                                        SET @currentdate = GETDATE();
                                                        Declare @ProductProperty Table (ProductId uniqueidentifier, IsDiscontinued varchar(max),PriceClass nvarchar(50),
                                                        Price1 nvarchar(50),Price2 nvarchar(50),Price3 nvarchar(50),Price4 nvarchar(50),Price5 nvarchar(50),AltCnv nvarchar(50),
                                                        ItemContrCode nvarchar(50),ERPPriceMatrix nvarchar(max));

                                                        -- BUSA-501 : To populate QTYPERPKG from ZXPRODUCT view into Insite Product.MultipleSaleQty column Starts  
                                                        select distinct pr.Id as ProductId,pf.Name,pf.ERPDescription,pf.ProductCode,pf.UnitOfMeasure,pf.Sku,pf.ActivateOn,pf.TaxCode1,pf.ShippingWeight,pf.ERPNumber,pf.UPCCode,pf.PrdTaxId,pf.BasicListPrice,pf.IsDiscontinued,pf.SuspendCode,pf.ManufacturerItem,pf.QtyPerPackage,pf.PriceCode,pf.Price1,pf.Price2,pf.Price3,pf.Price4,pf.Price5,pf.AltCnv,pf.ItemContrCode,--pf.RestrictionCode,
                                                        stuff((SELECT '|'+ concat('CompanyNo=' +cast(mxcono as varchar(25))+',PriceDiscountCode='+
                                                        cast(mxprds as varchar(25))+',Discount='+cast(mxdscp as varchar(25))+',MarkupCode='+
                                                        cast(mxdsmr as varchar(25))+',CustomerPriceList=',mxcprl)
                                                        FROM OEMTX WHERE mxprcl = pf.PriceCode FOR XML PATH('')),1,1,'') as ERPPriceMatrix,CASE WHEN ISNULL(pf.QtyPerPackage,0) > 0 THEN 'Multiple Only' ELSE '' END AS 'RoundingRule',pf.QtyBrkCls,pf.VolumeQtyGroupName
                                                        into #UpdateProductList from #ProductFilter pf join Product pr on pr.Name= pf.Name
                                                        left outer join OEMTX otx on otx.mxprcl= pf.pricecode

																		  
                                                        MERGE INTO Product AS TARGET USING
                                                        (select distinct pf.Name,pf.ERPDescription,pf.ProductCode,pf.PriceCode,pf.UnitOfMeasure,pf.Sku,pf.ActivateOn,pf.TaxCode1,pf.ShippingWeight,pf.ERPNumber,pf.UPCCode,pf.PrdTaxId,pf.BasicListPrice,pf.IsDiscontinued,pf.SuspendCode,pf.ManufacturerItem,pf.QtyPerPackage,pf.Price1,pf.Price2,pf.Price3,pf.Price4,
                                                        pf.Price5,pf.AltCnv,pf.ItemContrCode,--pf.RestrictionCode, 
                                                        CASE WHEN ISNULL(pf.QtyPerPackage,0) > 0 THEN 'Multiple Only' ELSE '' END AS 'RoundingRule',pf.QtyBrkCls,pf.VolumeQtyGroupName,
                                                        stuff((SELECT '|'+ concat('CompanyNo=' +cast(mxcono as varchar(25))+',PriceDiscountCode='+
                                                        cast(mxprds as varchar(25))+',Discount='+cast(mxdscp as varchar(25))+',MarkupCode='+cast(mxdsmr as varchar(25))+
                                                        ',CustomerPriceList=',mxcprl)FROM OEMTX WHERE mxprcl = pf.PriceCode FOR XML PATH('')),1,1,'') as ERPPriceMatrix
                                                        from #ProductFilter pf left outer join OEMTX otx on otx.mxprcl= pf.pricecode WHERE Name NOT LIKE '%.%') 
                                                        AS SOURCE
                                                        ON TARGET.Name =SOURCE.Name
                                                        WHEN NOT MATCHED THEN 
                                                        INSERT(Name,ShortDescription,ERPDescription,ProductCode,PriceCode,UnitOfMeasure,Sku,ActivateOn,DeactivateOn,TaxCode1,ShippingWeight,
	                                                            ERPNumber, UPCCode,TaxCategory,BasicListPrice,IsDiscontinued,ManufacturerItem,QtyPerShippingPackage,UrlSegment,ContentManagerId,--RestrictionGroupId,
                                                                MultipleSaleQty,RoundingRule,ModelNumber,PriceBasis)
                                                        VALUES(SOURCE.Name,ISNULL(SOURCE.ERPDescription,''),ISNULL(SOURCE.ERPDescription,''),SOURCE.ProductCode,SOURCE.PriceCode,
	                                                            ISNULL(SOURCE.UnitOfMeasure,''),ISNULL(SOURCE.Sku,''),CONVERT(datetime,convert(char(8),SOURCE.ActivateOn),102),
	                                                            @currentdate,ISNULL(SOURCE.TaxCode1,''),SOURCE.ShippingWeight,ISNULL(SOURCE.ERPNumber,''),ISNULL(SOURCE.UPCCode,''),
	                                                            ISNULL(SOURCE.PrdTaxId,''),SOURCE.BasicListPrice,(CASE WHEN (SOURCE.IsDiscontinued = '530' OR SOURCE.SuspendCode='S') THEN 1 ELSE 0 END) ,
	                                                            ISNULL(SOURCE.ManufacturerItem,''), ISNULL(SOURCE.QtyPerPackage,1),SOURCE.Name, newid(),
		                                                        --(select Id from RestrictionGroup where Name=SOURCE.RestrictionCode),
                                                                ISNULL(SOURCE.QtyPerPackage,0),RoundingRule,ISNULL(SOURCE.VolumeQtyGroupName,''),ISNULL(SOURCE.QtyBrkCls,''))
                                                        OUTPUT Inserted.Id,Inserted.IsDiscontinued,SOURCE.PriceCode,SOURCE.Price1,SOURCE.Price2,SOURCE.Price3,SOURCE.Price4,SOURCE.Price5,SOURCE.AltCnv,
                                                        SOURCE.ItemContrCode,SOURCE.ERPPriceMatrix
		                                                        into @ProductProperty(ProductId,IsDiscontinued,PriceClass,Price1,Price2,Price3,Price4,Price5,AltCnv,ItemContrCode,ERPPriceMatrix);

                                                        MERGE INTO Product AS TARGET USING
                                                            (select  * from #UpdateProductList)
                                                        AS SOURCE
                                                        ON TARGET.Id =SOURCE.ProductId 
                                                        WHEN MATCHED THEN 
                                                            UPDATE SET	ERPDescription=ISNULL(SOURCE.ERPDescription,''),ProductCode=ISNULL(SOURCE.ProductCode,''),PriceCode=ISNULL(SOURCE.PriceCode,''),
			                                                        UnitOfMeasure=ISNULL(SOURCE.UnitOfMeasure,''),Sku=ISNULL(SOURCE.Sku,''),
			                                                        ActivateOn=CONVERT(datetime,convert(char(8),SOURCE.ActivateOn),102),			
			                                                        TaxCode1=ISNULL (SOURCE.TaxCode1,''),ShippingWeight=SOURCE.ShippingWeight,ERPNumber=ISNULL(SOURCE.ERPNumber,''),
			                                                        UPCCode=ISNULL(SOURCE.UPCCode,''),TaxCategory=ISNULL(SOURCE.PrdTaxId,''),
			                                                        BasicListPrice=SOURCE.BasicListPrice,IsDiscontinued= (CASE WHEN (SOURCE.IsDiscontinued = '530' OR SOURCE.SuspendCode='S') THEN 1 ELSE 0 END),
			                                                        ManufacturerItem=ISNULL(SOURCE.ManufacturerItem,''),QtyPerShippingPackage=ISNULL(SOURCE.QtyPerPackage,1),
			                                                        --RestrictionGroupId=(select Id from RestrictionGroup where Name = RestrictionCode),
                                                                    MultipleSaleQty=ISNULL(SOURCE.QtyPerPackage,0),RoundingRule=SOURCE.RoundingRule,ModelNumber=ISNULL(VolumeQtyGroupName,''),PriceBasis=ISNULL(QtyBrkCls,'');

                                                                    -- BUSA-501 : To populate QTYPERPKG from ZXPRODUCT view into Insite Product.MultipleSaleQty column Ends

                                                            MERGE INTO Product AS TARGET USING
                                                            (select pr.Id as RProductId,pf.Name as Name from #ProductFilter pf 
	                                                        join Product pr on (pf.IsDiscontinued = '530' or pf.SuspendCode='S') and pf.Replacement = pr.Name)
	                                                        AS SOURCE
                                                        ON TARGET.Name = SOURCE.Name and TARGET.IsDiscontinued = 1
                                                        WHEN MATCHED THEN 
                                                            UPDATE SET	ReplacementProductId =  SOURCE.RProductId;


                                                        MERGE INTO ContentManager AS TARGET
	                                                        USING Product AS SOURCE	ON TARGET.ID = SOURCE.CONTENTMANAGERID
                                                        WHEN NOT MATCHED THEN
	                                                        INSERT (Id,Name) 
	                                                        VALUES (SOURCE.CONTENTMANAGERID,'Product');                                                      
                                                        

                                                            Declare @warehouseId as varchar(max) 
                                                            Declare @WareHouseName as nvarchar(50)

                                                            SET @WareHouseName = (SELECT Distinct WareHouseID FROM [#ProductFilter])
                                                            SET @warehouseId = (SELECT [Id] FROM [Warehouse] WHERE Name = @WareHouseName)

                                                        --SET @warehouseId = (SELECT [Id] FROM [Warehouse] WHERE Name = 'B1')
                                                        

                                                            MERGE INTO ProductWarehouse AS TARGET USING
                                                            (select  ProductId,IsDiscontinued  from @ProductProperty) 
	                                                        AS SOURCE
                                                            ON TARGET.ProductId =SOURCE.ProductId 
                                                            WHEN NOT MATCHED THEN 
                                                            INSERT(ProductId,WarehouseId,ErpQtyAvailable)
                                                            VALUES(SOURCE.ProductId,ISNULL(@warehouseId,''),(CASE WHEN SOURCE.IsDiscontinued = 0 THEN 100 ELSE 0 END))
                                                            WHEN MATCHED THEN
                                                            UPDATE SET  ProductId=SOURCE.ProductId,WarehouseId=ISNULL(@warehouseId,''),
                                                            ErpQtyAvailable=(CASE WHEN SOURCE.IsDiscontinued = 0 THEN 100 ELSE 0 END);

                                                            MERGE INTO CustomProperty AS TARGET USING
	                                                        (
		                                                        SELECT ProductId, Name, Value FROM (SELECT ProductId,CAST(PriceClass as varchar(max)) PriceClass,
		                                                        CAST(Price1 as varchar(max)) Price1,CAST(Price2 as varchar(max)) Price2, CAST(Price3 as varchar(max)) Price3,
		                                                        CAST(Price4 as varchar(max)) Price4,CAST(Price5 as varchar(max)) Price5,CAST(AltCnv as varchar(max)) AltCnv,
		                                                        CAST(ItemContrCode as varchar(max)) ProductContractCode,
		                                                        CAST(ERPPriceMatrix as varchar(max)) ERPPriceMatrix  FROM @ProductProperty) pp 
		                                                        UNPIVOT (Value FOR Name IN (PriceClass,Price1,Price2,Price3,Price4,Price5,AltCnv,
		                                                        ProductContractCode,ERPPriceMatrix)) as ppvt
		                                                        UNION
		                                                        SELECT ProductId, Name, Value FROM (SELECT ProductId,CAST('True' as varchar(max)) IsModified,
                                                                CAST(PriceCode as varchar(max)) PriceClass,CAST(Price1 as varchar(max)) Price1,CAST(Price2 as varchar(max)) Price2, 
                                                                CAST(Price3 as varchar(max)) Price3,CAST(Price4 as varchar(max)) Price4,
                                                                CAST(Price5 as varchar(max)) Price5,CAST(AltCnv as Varchar(max)) AltCnv ,CAST(ItemContrCode as varchar(max)) ProductContractCode, 
		                                                        CAST(ERPPriceMatrix as varchar(max)) ERPPriceMatrix FROM #UpdateProductList) pp 
                                                                UNPIVOT (Value FOR Name IN (IsModified,PriceClass,Price1,Price2,Price3,Price4,Price5,AltCnv,
		                                                        ProductContractCode,ERPPriceMatrix)) as ppvt) AS SOURCE
                                                            ON TARGET.ParentId = SOURCE.ProductId AND TARGET.Name= SOURCE.Name
                                                            WHEN NOT MATCHED THEN 
	                                                        INSERT(ParentId,Name,Value,ParentTable)
	                                                        VALUES(SOURCE.ProductId,SOURCE.Name,SOURCE.Value,'Product')
                                                        WHEN MATCHED THEN
	                                                        UPDATE SET  Value=SOURCE.Value,ParentTable='Product';

                                                    -- BUSA-257 : Question: Viewing Product Status Code in Insite Starts
                                                    
                                                            MERGE INTO CustomProperty AS TARGET USING
                                                            (SELECT ProductId, Name, Value FROM (SELECT distinct pf.IsDiscontinued AS ProductStatusCode, p.Id as ProductId FROM  #ProductFilter pf JOIN Product p ON                                 pf.Name = p.Name) pp UNPIVOT (Value FOR Name IN (ProductStatusCode)) as ppvt) AS SOURCE 
                                                            ON TARGET.ParentId = SOURCE.ProductId AND TARGET.Name= SOURCE.Name
                                                            WHEN NOT MATCHED THEN INSERT(ParentId,Name,Value,ParentTable)
                                                            VALUES(SOURCE.ProductId,SOURCE.Name,SOURCE.Value,'Product')
                                                            WHEN MATCHED THEN
                                                            UPDATE SET  Value=SOURCE.Value,ParentTable='Product';

                                                    -- BUSA-257 : Question: Viewing Product Status Code in Insite Ends

                                                        DROP TABLE #UpdateProductList;
                                                        DROP TABLE #ProductFilter;

                                                        -- BEGIN AttributeTypeRefresh --
                                                        Declare @AttributeTypeTemp Table (Name varchar(50),IsFilter bit,IsComparable bit,IsActive bit, Label varchar(50));
                                                        INSERT INTO @AttributeTypeTemp (Name,IsFilter,IsComparable,IsActive,Label)
                                                        VALUES ('Discontinued Products',1,1,1,'Discontinued Products');
                                                        MERGE INTO AttributeType AS TARGET USING 
                                                        (select Name,IsFilter,IsComparable,IsActive,Label from @AttributeTypeTemp) AS SOURCE
                                                        on TARGET.Name = SOURCE.Name
                                                        WHEN NOT MATCHED THEN 
                                                            INSERT(Name,IsFilter,IsComparable,IsActive,Label)
                                                            VALUES(SOURCE.Name,SOURCE.IsFilter,SOURCE.IsComparable,SOURCE.IsActive,SOURCE.Label)
                                                        WHEN MATCHED THEN
                                                            UPDATE SET Name=SOURCE.Name,IsFilter=SOURCE.IsFilter,IsComparable=SOURCE.IsComparable,IsActive=SOURCE.IsActive,Label=SOURCE.Label;
                                                        -- END AttributeTypeRefresh --


                                                        -- BEGIN AttributeValueRefresh --
                                                        Declare @AttributeValueTemp Table (AttributeTypeId varchar(50),Value varchar(50),IsActive bit, SortOrder int);
                                                        INSERT INTO @AttributeValueTemp (AttributeTypeId,Value,IsActive,SortOrder)
                                                        VALUES ((select id from AttributeType where Name ='Discontinued Products'),'Show Discontinued Products',1,0);
                                                        MERGE INTO AttributeValue AS TARGET USING 
                                                        (select AttributeTypeId,Value,IsActive,SortOrder from @AttributeValueTemp) AS SOURCE
                                                        on TARGET.AttributeTypeId = SOURCE.AttributeTypeId and TARGET.Value = SOURCE.Value
                                                        WHEN NOT MATCHED THEN 
                                                            INSERT(AttributeTypeId,Value,IsActive,SortOrder)
                                                            VALUES(SOURCE.AttributeTypeId,SOURCE.Value,SOURCE.IsActive,SOURCE.SortOrder)
                                                        WHEN MATCHED THEN
                                                            UPDATE SET AttributeTypeId=SOURCE.AttributeTypeId,Value=SOURCE.Value,IsActive=SOURCE.IsActive,SortOrder=SOURCE.SortOrder;
                                                        -- END AttributeValueRefresh --

                                                        -- BEGIN CategoryAttributeTypeRefresh --
                                                        MERGE INTO CategoryAttributeType AS TARGET USING 
                                                        (select Id from Category) AS SOURCE
	                                                        on TARGET.CategoryId = SOURCE.Id and AttributeTypeId = (select id from AttributeType where Name='Discontinued Products')
                                                        WHEN NOT MATCHED THEN 
                                                            INSERT(CategoryId,AttributeTypeId,SortOrder,IsActive,DetailDisplaySequence)
                                                            VALUES(SOURCE.ID,(select id from AttributeType where Name='Discontinued Products'),0,1,0)
                                                        WHEN MATCHED THEN
                                                            UPDATE SET CategoryId=SOURCE.ID,AttributeTypeId=(select id from AttributeType where Name='Discontinued Products'),IsActive=1,DetailDisplaySequence=0; 
                                                        -- END CategoryAttributeTypeRefresh --


                                                        -- BEGIN ProductAttributeValueRefresh --
                                                        MERGE INTO ProductAttributeValue AS TARGET USING 
	                                                        (select Id,IsDiscontinued from Product) AS SOURCE
                                                        on TARGET.ProductId = SOURCE.Id and (TARGET.AttributeValueId=(select Id from AttributeValue where Value='Show Discontinued Products') or
									                                                            TARGET.AttributeValueId=(select Id from AttributeValue where Value='Show Available Products'))
                                                        WHEN NOT MATCHED THEN 
	                                                        INSERT(ProductId,AttributeValueId)
	                                                        VALUES(SOURCE.Id, (case  when SOURCE.IsDiscontinued = 0
							                                                            then (select Id from AttributeValue where Value='Show Available Products')
							                                                            when SOURCE.IsDiscontinued = 1
							                                                            then (select Id from AttributeValue where Value='Show Discontinued Products')
							                                                            else (select Id from AttributeValue where Value='Show Available Products') end))

                                                        -- Changes For BUSA - 255 Starts
                                                        WHEN MATCHED THEN 
                                                        UPDATE SET AttributeValueId =  case  when SOURCE.IsDiscontinued = 0
                                                        then (select Id from AttributeValue where Value='Show Available Products')
                                                        when SOURCE.IsDiscontinued = 1
                                                        then (select Id from AttributeValue where Value='Show Discontinued Products')
                                                        else (select Id from AttributeValue where Value='Show Available Products') end
                                                        -- Changes For BUSA - 255 Ends
                                                        
                                                        WHEN NOT MATCHED BY SOURCE and (TARGET.AttributeValueId=(select Id from AttributeValue where Value='Show Discontinued Products') or
								                                                        TARGET.AttributeValueId=(select Id from AttributeValue where Value='Show Available Products')) then
                                                        Delete;
                                                        -- END ProductAttributeValueRefresh --


                                                        --BEGIN RMAthreshold value assignment --
                                                        
                                                        MERGE INTO CustomProperty AS TARGET USING
                                                            (select  Id,ProductCode from Product)
                                                                AS SOURCE
                                                            ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='RMAthreshold'
                                                            WHEN NOT MATCHED THEN 
                                                            INSERT(ParentId,Name,Value,ParentTable)
                                                            VALUES(SOURCE.Id,'RMAthreshold',(CASE WHEN EXISTS (SELECT TOP 1 Id FROM Product p WHERE (SELECT Value
                                                            FROM SystemSetting
                                                            WHERE Name = 'Custom_PowerSubClass') LIKE '%'+SOURCE.ProductCode+'%') THEN 30 ELSE 90 END),
                                                            'Product')
                                                            WHEN MATCHED THEN
                                                            UPDATE SET  Value=(CASE WHEN EXISTS (SELECT TOP 1 Id FROM Product p WHERE (SELECT Value
                                                            FROM SystemSetting
                                                            WHERE Name = 'Custom_PowerSubClass') LIKE '%'+SOURCE.ProductCode+'%') THEN 30 ELSE 90 END),
                                                            ParentTable='Product';
                                                       --END  RMAthreshold value assignment--


                        ";

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