using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using Insite.Core.Context;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("ParameterizedCustomerRefreshPostProcessors")]
    public class ParameterizedCustomerRefreshPostProcessors : IntegrationBase, IJobPostprocessor
    {
        public IntegrationJob IntegrationJob { get; set; }
        public IJobLogger JobLogger { get; set; }
        protected readonly IUnitOfWork UnitOfWork;

        public ParameterizedCustomerRefreshPostProcessors(IUnitOfWorkFactory unitOfWorkFactory)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
        }
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
                        //BUSA -723: To change logic of 'PO Number Mandatory' sync in Customer refresh job.
                        //var CustomerClasses = UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("POCustomerTypes", SiteContext.Current.Website.Id);
                        var CustomerClasses = customSettings.Value.POCustomerTypes;
                        //Load DataTable in to SQL Server Temp Table
                        //BUSA-546 Added segment field to customerFilter
                        const string createTempTableSql = @"Create table #CustomerFilter
                                                            (CompanyNumber nvarchar(max),CustomerNumber nvarchar(max),CustomerType nvarchar(max),CompanyName nvarchar(max),
                                                            Phone nvarchar(max),Fax nvarchar(max),TermsCode nvarchar(max),ShipCode nvarchar(max),
                                                            TaxCode1 nvarchar(max),TaxCode2 nvarchar(max),PriceCode nvarchar(max),CurrencyCode nvarchar(max),
                                                            Address1 nvarchar(max),Address2 nvarchar(max),Address3 nvarchar(max),Address4 nvarchar(max),City nvarchar(max),
                                                            State nvarchar(max),PostalCode nvarchar(max),Country nvarchar(max),Email nvarchar(max),IsActive nvarchar(1),
                                                            ERPNumber nvarchar(max),Territory  nvarchar(max),PrimaryRep nvarchar(max),SecondRep nvarchar(max),ThirdRep nvarchar(max),
                                                            IAMCode nvarchar(max),CorporateGroupId nvarchar(max),PORequired nvarchar(1),
                                                            ContractCode nvarchar(max),FOBCode nvarchar(max),TradeDiscountCode nvarchar(max),ARTermCode nvarchar(max),
                                                            PriceList nvarchar(max), BillToShipTo nvarchar(max),EXCert nvarchar(max),Segment nvarchar(max),WareHouseID nvarchar(max), Id nvarchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#CustomerFilter", dataSet.Tables[0]);
                        //BUSA -723: To change logic of 'PO Number Mandatory' sync in Customer refresh job start.
                        const string createPOCustomerType = @"Create table #POCustomerType(
                                                             CustomerType nvarchar(max))";
                        using (var command = new SqlCommand(createPOCustomerType, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                            foreach (string value in CustomerClasses.Split(','))
                            {
                                command.CommandText = "INSERT INTO #POCustomerType (CustomerType) VALUES ('" + value + "')"; command.CommandTimeout = CommandTimeOut;
                                command.ExecuteNonQuery();
                            }
                        }
                        //BUSA -723: To change logic of 'PO Number Mandatory' sync in Customer refresh job end.
                        // Merge the data from the Temp Table
                        //BUSA-546 Merge  segment value to Temp Table

                        const string customerMerge = @"
                                                         Update #CustomerFilter
                                                         set CompanyNumber =RTRIM(LTRIM(CompanyNumber)),CustomerNumber =RTRIM(LTRIM(CustomerNumber)),CustomerType =RTRIM(LTRIM(CustomerType)), 
                                                        CompanyName =RTRIM(LTRIM(CompanyName)),
                                                        Phone =RTRIM(LTRIM(Phone)),Fax =RTRIM(LTRIM(Fax)),TermsCode =RTRIM(LTRIM(TermsCode)),ShipCode =RTRIM(LTRIM(ShipCode)),TaxCode1 =RTRIM(LTRIM(TaxCode1)),
                                                        TaxCode2 =RTRIM(LTRIM(TaxCode2)),PriceCode =RTRIM(LTRIM(PriceCode)),CurrencyCode =RTRIM(LTRIM(CurrencyCode)),Address1 =RTRIM(LTRIM(Address1)),
                                                        Address2 =RTRIM(LTRIM(Address2)), Address3 =RTRIM(LTRIM(Address3)),  Address4 =RTRIM(LTRIM(Address4)), City =RTRIM(LTRIM(City)),
                                                        State =RTRIM(LTRIM(State)), PostalCode =RTRIM(LTRIM(PostalCode)), Country =RTRIM(LTRIM(Country)), Email =RTRIM(LTRIM(Email)),
                                                        IsActive =RTRIM(LTRIM(IsActive)), ERPNumber =RTRIM(LTRIM(ERPNumber)),Territory  =RTRIM(LTRIM(Territory)),PrimaryRep =RTRIM(LTRIM(PrimaryRep)),
                                                        SecondRep =RTRIM(LTRIM(SecondRep)),ThirdRep =RTRIM(LTRIM(ThirdRep)),IAMCode =RTRIM(LTRIM(IAMCode)), CorporateGroupId =RTRIM(LTRIM(CorporateGroupId)),
                                                        PORequired =RTRIM(LTRIM(PORequired)),
                                                        ContractCode =RTRIM(LTRIM(ContractCode)),FOBCode =RTRIM(LTRIM(FOBCode)),TradeDiscountCode =RTRIM(LTRIM(TradeDiscountCode)),ARTermCode =RTRIM(LTRIM(ARTermCode)),PriceList =RTRIM(LTRIM(PriceList)), 
                                                        BillToShipTo =RTRIM(LTRIM(BillToShipTo)), EXCert = RTRIM(LTRIM(EXCert)), Segment = RTRIM(LTRIM(Segment)),WareHouseID =RTRIM(LTRIM(WareHouseID))
													   
                                                        Merge INTO  Customer AS TARGET USING
                                                        (Select CompanyNumber,CustomerNumber From #CustomerFilter) As Source
                                                        ON  TARGET.CustomerNumber = SOURCE.CompanyNumber + SOURCE.CustomerNumber
                                                        AND SUBSTRING(TARGET.CustomerNumber, 1, 1) = SOURCE.CompanyNumber
                                                        WHEN MATCHED THEN 
                                                        UPDATE SET ISActive = 0;

                                                        --Update Customer Set IsActive = 0 -- BUSA-575 : Customer Type Update --query commented for Brasseler Canada
                                                        
                                                        Declare @warehouseId as varchar(max) ;
                                                        Declare @currency as varchar(20)
                                                        Declare @WareHouseName as varchar(50)
                                                       -- SET @currency = (SELECT Distinct CurrencyCode FROM [#CustomerFilter])
                                                        --if (@currency ='USD') 
                                                        --SET @warehouseId = (SELECT [Id] FROM [Warehouse] WHERE Name = 'B1')
                                                       -- ELSE
                                                       --  SET @warehouseId = (SELECT [Id] FROM [Warehouse] WHERE Name = 'C1') 

                                                        SET @WareHouseName = (SELECT Distinct WareHouseID FROM [#CustomerFilter])
                                                        SET @warehouseId = (SELECT [Id] FROM [Warehouse] WHERE Name = @WareHouseName)
                                                        
                                                   

                                                    --BEGIN:This Merge is for Customers who are both Billto and Shipto
                                                    MERGE INTO Customer AS TARGET USING
                                                    (select   CompanyNumber,CustomerNumber,CustomerType,CompanyName,ContactFullName,Phone,Fax,TermsCode,ShipCode,TaxCode1,PriceCode,
                                                    Address1, Address2, Address3, Address4 ,City, State, PostalCode, Country, IsActive, ERPNumber, Territory, BillToShipTo,TaxCode2,--IgnoreProductRestrictions,
                                                    PrimaryRep,ContractCode,Email from #CustomerFilter where BillToShipTo = '0') AS SOURCE

                                                    ON TARGET.CustomerNumber = SOURCE.CompanyNumber + SOURCE.CustomerNumber and TARGET.CustomerSequence = ''
                                                    WHEN NOT MATCHED THEN
                                                    INSERT(CustomerNumber,CustomerType,CompanyName,ContactFullName,Phone,Fax,TermsCode,ShipCode,TaxCode1,PriceCode,
                                                        Address1, Address2, Address3, Address4 ,City, State, PostalCode, Country, IsActive, ERPNumber, Territory,IsBillTo,
                                                        IsShipTo,CustomerSequence,TaxCode2,--IgnoreProductRestrictions
                                                        DefaultWarehouseId,PrimarySalespersonId,Email)

                                                    VALUES(SOURCE.CompanyNumber + SOURCE.CustomerNumber, ISNULL(SOURCE.CustomerType, ''), ISNULL(SOURCE.CompanyName, ''),--ISNULL(SOURCE.ContactFullName, ''), 
                                                          ISNULL(SOURCE.Phone, ''), ISNULL(SOURCE.Fax, ''),
	                                                      (CASE WHEN ((SOURCE.TermsCode = 'CC') or (SOURCE.TermsCode = 'CK')) THEN SOURCE.TermsCode ELSE '' END), 
                                                          ISNULL(SOURCE.ShipCode, ''),ISNULL(SOURCE.TaxCode1, ''),ISNULL(SOURCE.ContractCode, ''),
                                                          ISNULL(SOURCE.Address1, ''),ISNULL(SOURCE.Address2, ''),ISNULL(SOURCE.Address3, ''),ISNULL(SOURCE.Address4, ''),
                                                          ISNULL(SOURCE.City, ''),ISNULL(SOURCE.State, ''),ISNULL(SOURCE.PostalCode, ''),ISNULL(SOURCE.Country, ''),
                                                          (CASE WHEN SOURCE.IsActive = 'S' THEN 0 ELSE 1 END),ISNULL(SOURCE.ERPNumber, ''),ISNULL(SOURCE.Territory, ''),
                                                          (CASE WHEN SOURCE.BillToShipTo = 0 THEN 1 ELSE 0 END),1,'',SOURCE.TaxCode2,--0,
                                                          @warehouseId,(select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep),ISNULL(SOURCE.Email, ''))
                                                    WHEN MATCHED THEN
                                                    UPDATE SET CustomerNumber= SOURCE.CompanyNumber + SOURCE.CustomerNumber,CustomerType= ISNULL(SOURCE.CustomerType, ''),
                                                            CompanyName=ISNULL(SOURCE.CompanyName, ''),--ContactFullName=ISNULL(SOURCE.ContactFullName, ''),
                                                            Phone= ISNULL(SOURCE.Phone, ''),Fax= ISNULL(SOURCE.Fax, ''),TermsCode=(CASE WHEN ((SOURCE.TermsCode = 'CC') or (SOURCE.TermsCode = 'CK')) THEN SOURCE.TermsCode ELSE '' END), 
		                                                    ShipCode=ISNULL(SOURCE.ShipCode, ''),TaxCode1=ISNULL(SOURCE.TaxCode1, ''),
                                                            PriceCode=ISNULL(SOURCE.ContractCode, ''),Address1=ISNULL(SOURCE.Address1, ''),
                                                            Address2=ISNULL(SOURCE.Address2, ''),Address3=ISNULL(SOURCE.Address3, ''),Address4=ISNULL(SOURCE.Address4, ''),City=ISNULL(SOURCE.City, ''),
                                                            State=ISNULL(SOURCE.State, ''),PostalCode=ISNULL(SOURCE.PostalCode, ''),Country=ISNULL(SOURCE.Country, ''),
                                                            IsActive=(CASE WHEN SOURCE.IsActive = 'S' THEN 0 ELSE 1 END),ERPNumber=ISNULL(SOURCE.ERPNumber, ''),
                                                            Territory=ISNULL(SOURCE.Territory, ''),IsBillTo=(CASE WHEN SOURCE.BillToShipTo = 0 THEN 1 ELSE 0 END),IsShipTo=1,CustomerSequence='',
                                                            TaxCode2=SOURCE.TaxCode2,--IgnoreProductRestrictions=0,
                                                            DefaultWarehouseId=@warehouseId,PrimarySalespersonId=(select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep),Email=ISNULL(SOURCE.Email, '');
                                                    --END:This Merge is for Customers who are both Billto and Shipto

                                                    --BEGIN: setting parentID as same as ID for Customers who are both billto and shipto
                                                    UPDATE Customer SET ParentId = Id where CustomerSequence = '' and ParentId is null
                                                    --END:: setting parentID as same as ID for Customers who are both billto and shipto

                                                    --BEGIN:This Merge is for only Shipto Customers
                                                    MERGE INTO Customer AS TARGET USING
                                                    (select   CompanyNumber,CustomerNumber,CustomerType,CompanyName,--ContactFullName,
                                                     Phone,Fax,TermsCode,ShipCode,TaxCode1,PriceCode,
                                                     Address1, Address2, Address3, Address4 ,City, State, PostalCode, Country, IsActive, ERPNumber, 
		                                             Territory,BillToShipTo,TaxCode2,--IgnoreProductRestrictions,
                                                     PrimaryRep,ContractCode,Email
                                                     from #CustomerFilter where BillToShipTo <> '0') AS SOURCE
                                                    ON TARGET.CustomerNumber = SOURCE.CompanyNumber + SOURCE.BillToShipTo and TARGET.CustomerSequence = SOURCE.CompanyNumber + SOURCE.CustomerNumber
                                                    WHEN NOT MATCHED THEN
                                                    INSERT(ParentId,CustomerNumber,CustomerType,CompanyName,--ContactFullName,
                                                        Phone,Fax,TermsCode,ShipCode,TaxCode1,PriceCode,
                                                        Address1, Address2, Address3, Address4 ,City, State, PostalCode, Country, IsActive, ERPNumber, Territory,IsBillTo,
                                                        IsShipTo,CustomerSequence,ERPSequence,TaxCode2,--IgnoreProductRestrictions,
                                                        DefaultWarehouseId,PrimarySalespersonId,Email)
                                                    VALUES((select Id from Customer c  where c.CustomerNumber = SOURCE.CompanyNumber + SOURCE.BillToShipTo AND c.CustomerSequence = ''),
	                                                    SOURCE.CompanyNumber + SOURCE.BillToShipTo, ISNULL(SOURCE.CustomerType, ''), ISNULL(SOURCE.CompanyName, ''),--ISNULL(SOURCE.ContactFullName, ''),
                                                        ISNULL(SOURCE.Phone, ''), ISNULL(SOURCE.Fax, ''),
	                                                    (CASE WHEN ((SOURCE.TermsCode = 'CC') or (SOURCE.TermsCode = 'CK')) THEN SOURCE.TermsCode ELSE '' END), 
                                                        ISNULL(SOURCE.ShipCode, ''),ISNULL(SOURCE.TaxCode1, ''),ISNULL(SOURCE.ContractCode, ''),
                                                        ISNULL(SOURCE.Address1, ''),ISNULL(SOURCE.Address2, ''),ISNULL(SOURCE.Address3, ''),ISNULL(SOURCE.Address4, ''),
                                                        ISNULL(SOURCE.City, ''),ISNULL(SOURCE.State, ''),ISNULL(SOURCE.PostalCode, ''),ISNULL(SOURCE.Country, ''),
                                                        (CASE WHEN SOURCE.IsActive = 'S' THEN 0 ELSE 1 END),ISNULL(SOURCE.ERPNumber, ''),ISNULL(SOURCE.Territory, ''),
                                                        (CASE WHEN SOURCE.BillToShipTo = 0 THEN 1 ELSE 0 END),1,SOURCE.CompanyNumber + SOURCE.CustomerNumber,SOURCE.CustomerNumber,SOURCE.TaxCode2,--0, 
	                                                    @warehouseId,(select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep),ISNULL(SOURCE.Email, ''))
                                                    WHEN MATCHED THEN
                                                    UPDATE SET  ParentId = (select Id from Customer c  where c.CustomerNumber = SOURCE.CompanyNumber + SOURCE.BillToShipTo AND c.CustomerSequence = ''),
                                                            CustomerNumber= SOURCE.CompanyNumber + SOURCE.BillToShipTo,CustomerType= ISNULL(SOURCE.CustomerType, ''),
                                                            CompanyName=ISNULL(SOURCE.CompanyName, ''),--ContactFullName=ISNULL(SOURCE.ContactFullName, ''),
                                                            Phone= ISNULL(SOURCE.Phone, ''),Fax= ISNULL(SOURCE.Fax, ''),TermsCode=(CASE WHEN ((SOURCE.TermsCode = 'CC') or (SOURCE.TermsCode = 'CK')) THEN SOURCE.TermsCode ELSE '' END),
		                                                    ShipCode=ISNULL(SOURCE.ShipCode, ''),TaxCode1=ISNULL(SOURCE.TaxCode1, ''),
                                                            PriceCode=ISNULL(SOURCE.ContractCode, ''),Address1=ISNULL(SOURCE.Address1, ''),
                                                            Address2=ISNULL(SOURCE.Address2, ''),Address3=ISNULL(SOURCE.Address3, ''),Address4=ISNULL(SOURCE.Address4, ''),City=ISNULL(SOURCE.City, ''),
                                                            IsActive=(CASE WHEN SOURCE.IsActive = 'S' THEN 0 ELSE 1 END),ERPNumber=ISNULL(SOURCE.ERPNumber, ''),
                                                            Territory=ISNULL(SOURCE.Territory, ''),IsBillTo=(CASE WHEN SOURCE.BillToShipTo = 0 THEN 1 ELSE 0 END),IsShipTo=1,
		                                                    CustomerSequence=SOURCE.CompanyNumber + SOURCE.CustomerNumber,ERPSequence=SOURCE.CustomerNumber,TaxCode2=SOURCE.TaxCode2,--IgnoreProductRestrictions=0,
		                                                    DefaultWarehouseId=@warehouseId,PrimarySalespersonId=(select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep),Email=ISNULL(SOURCE.Email, '');
                                                    --END:This Merge is for only Shipto Customers

                                                    --BEGIN: storing ID from Customer table to #CustomerFilter so that It can be used for Custom Properties
                                                    Merge INTO #CustomerFilter AS TARGET USING
                                                    (select  Id,CustomerNumber,CustomerSequence from Customer) AS Source
                                                    ON TARGET.CompanyNumber+TARGET.CustomerNumber= SOURCE.CustomerNumber and Source.CustomerSequence=''
                                                    WHEN MATCHED THEN
                                                    UPDATE SET  Id=SOURCE.Id;

                                                    Merge INTO #CustomerFilter AS TARGET USING
                                                    (select  Id,CustomerNumber,CustomerSequence from Customer) AS Source
                                                    ON TARGET.CompanyNumber+Target.BillToShipTo= SOURCE.CustomerNumber and Source.CustomerSequence=TARGET.CompanyNumber+TARGET.CustomerNumber
                                                    WHEN MATCHED THEN
                                                    UPDATE SET  Id=SOURCE.Id;
                                                    --END: storing ID from Customer table to #CustomerFilter so that It can be used for Custom Properties

                                                    --BEGIN: assigning custom properties to each Customers
                                                    --BEGIN: assigning custom properties to each Customers
                                                    --BUSA-546 assigning segment values in custom Property Table
                                                    MERGE INTO CustomProperty AS TARGET
                                                    USING (SELECT Id, Name, Value FROM 
                                                    (SELECT Id,CorporateGroupId,FOBCode,TradeDiscountCode,ARTermCode,PriceCode as PriceDiscountCode,PriceList  as DefaultPriceList,EXCert,Segment FROM #CustomerFilter) cbp 
                                                    UNPIVOT (Value FOR Name IN (CorporateGroupId,FOBCode,TradeDiscountCode,ARTermCode,PriceDiscountCode,DefaultPriceList,EXCert,Segment)) as cbppvt ) 
                                                    AS SOURCE
                                                    ON TARGET.ParentId = SOURCE.Id AND TARGET.Name = SOURCE.Name
                                                    WHEN NOT MATCHED THEN 
                                                    INSERT(ParentId, Name, Value,ParentTable)
                                                    VALUES(SOURCE.Id, SOURCE.Name, Source.Value,'Customer')			    
                                                    WHEN MATCHED THEN
                                                    UPDATE SET Value = SOURCE.Value,ParentTable='Customer';
                                                    --END: assigning custom properties to each Customers
                                                           
                                                    --BEGIN: Merge for POrequire Custom property
                                                   --BUSA -723: To change logic of 'PO Number Mandatory' sync in Customer refresh job.
                                                    MERGE INTO CustomProperty AS TARGET USING
                                                    (select  Id,PORequired from #CustomerFilter where customertype in (select CustomerType from #POCustomerType) )
                                                    AS SOURCE
                                                    ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='PORequired'
                                                    WHEN NOT MATCHED THEN 
                                                    INSERT(ParentId,Name,Value,ParentTable)
                                                    --BUSA-660: To make PO number mandatory for a specific Customer Class start.
                                                    VALUES(SOURCE.Id,'PORequired',(CASE WHEN SOURCE.PORequired = 'Y' THEN '1' ELSE '0' END),'Customer')
                                                    WHEN MATCHED THEN
                                                    UPDATE SET  Value=(CASE WHEN SOURCE.PORequired = 'Y' THEN ( CASE WHEN TARGET.VALUE  IN('1','TRUE') THEN '1' ELSE '0' END ) ELSE '0' END),ParentTable='Customer';
                                                    --BUSA-660: To make PO number mandatory for a specific Customer Class end.
                                                    --END: Merge for POrequire Custom property
                                                    --END: assigning custom properties to each Customers
                                                    --BEGIN: SalesPerson Customer association
                                                    MERGE INTO CustomerSalesperson AS TARGET
                                                    USING (SELECT Id, Name, Value,CompanyNumber FROM 
                                                    (SELECT Id,PrimaryRep,SecondRep,ThirdRep,CompanyNumber FROM #CustomerFilter) spp 
                                                    UNPIVOT (Value FOR Name IN (PrimaryRep,SecondRep,ThirdRep)) as spppvt )
                                                    AS SOURCE
                                                    ON TARGET.CustomerId = SOURCE.Id AND TARGET.SalespersonId = (select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.value)
                                                    WHEN NOT MATCHED and ((select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.value) is not null) THEN 
                                                    INSERT(CustomerId,SalespersonId)
                                                    VALUES(SOURCE.Id,
                                                    (select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.value)
                                                    );
                                                    --END: SalesPerson Customer association     
                                                    --BEGIN: Adding Email to the CustomProperty
                                                    --primeryrep
                                                    MERGE INTO CustomProperty AS TARGET USING
                                                    (select  Id,PrimaryRep,CompanyNumber from #CustomerFilter) AS SOURCE
                                                        ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='PrimaryRepEmail'
                                                    WHEN NOT MATCHED and ((select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep) is not null) THEN 
                                                    INSERT(ParentId,Name,Value,ParentTable)
                                                    VALUES(SOURCE.Id,'PrimaryRepEmail',ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep),''),'Customer')
                                                        WHEN MATCHED THEN
                                                    UPDATE SET  Value=ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.PrimaryRep),''),ParentTable='Customer';
                                                    --secondrep
                                                    MERGE INTO CustomProperty AS TARGET USING
                                                    (select  Id,SecondRep,CompanyNumber from #CustomerFilter) AS SOURCE
                                                        ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='SecondRepEmail'
                                                    WHEN NOT MATCHED and ((select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.SecondRep) is not null) THEN 
                                                    INSERT(ParentId,Name,Value,ParentTable)
                                                    VALUES(SOURCE.Id,'SecondRepEmail',ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.SecondRep),''),'Customer')
                                                        WHEN MATCHED THEN
                                                    UPDATE SET  Value=ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.SecondRep),''),ParentTable='Customer';
                                                    --thirdrep
                                                    MERGE INTO CustomProperty AS TARGET USING
                                                    (select  Id,ThirdRep,CompanyNumber from #CustomerFilter) AS SOURCE
                                                        ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='ThirdRepEmail'
                                                    WHEN NOT MATCHED and ((select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.ThirdRep) is not null) THEN 
                                                    INSERT(ParentId,Name,Value,ParentTable)
                                                    VALUES(SOURCE.Id,'ThirdRepEmail',ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.ThirdRep),''),'Customer')
                                                        WHEN MATCHED THEN
                                                    UPDATE SET  Value=ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.ThirdRep),''),ParentTable='Customer';
                                                    --IAMrep
                                                    MERGE INTO CustomProperty AS TARGET USING
                                                    (select  Id,IAMCode,CompanyNumber from #CustomerFilter) AS SOURCE
                                                        ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='IAMCodeEmail'
                                                    WHEN NOT MATCHED and ((select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.IAMCode) is not null) THEN 
                                                    INSERT(ParentId,Name,Value,ParentTable)
                                                    VALUES(SOURCE.Id,'IAMCodeEmail',ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.IAMCode),''),'Customer')
                                                        WHEN MATCHED THEN
                                                    UPDATE SET  Value=ISNULL((select Email from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.IAMCode),''),ParentTable='Customer';
                                                    
                                                    --BUSA-623 start : Add Inside Rep to Customer Custom properties tab
                                                    MERGE INTO CustomProperty AS TARGET USING
                                                    (select Id,IAMCode,CompanyNumber from #CustomerFilter) AS SOURCE
                                                        ON TARGET.ParentId = SOURCE.Id   AND TARGET.Name='IAMCodeNumber'
                                                    WHEN NOT MATCHED and ((select id from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.IAMCode) is not null) THEN 
                                                    INSERT(ParentId,Name,Value,ParentTable)
                                                    VALUES(SOURCE.Id,'IAMCodeNumber',ISNULL((select SalespersonNumber from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.IAMCode),''),'Customer')
                                                        WHEN MATCHED THEN
                                                    UPDATE SET  Value=ISNULL((select SalespersonNumber from Salesperson where SalespersonNumber = SOURCE.CompanyNumber+SOURCE.IAMCode),''),ParentTable='Customer';
                                                     --BUSA-623 end : Add Inside Rep to Customer Custom properties tab

                                                    --END: Adding Email to the CustomProperty
                                                    --BEGIN: adding countryId
                                                    UPDATE Customer
                                                    set CountryId = (Select Id from Country as c where c.ISOCode2 = Country or c.ISOCode3 = Country)
                                                    where (Select Id from Country as c where c.ISOCode2 = Country or c.ISOCode3 = Country) is not null
                                                    --END: adding CountryId
                                                    --BEGIN: adding stateId
                                                    UPDATE Customer
                                                    set StateId = (Select Id from [State] as s where s.Abbreviation=[State])
                                                    where (Select Id from [State] as s where s.Abbreviation=[State]) is not null
                                                    --END: adding stateId
                                                           --BEGIN: update IgnoreProductRestrictions = 0 for all customers
                                                              --update Customer 
                                                             --set IgnoreProductRestrictions=0
                                                          --End: update IgnoreProductRestrictions = 0 for all customers
                                                    DROP TABLE #CustomerFilter
                            --BUSA -723: To change logic of 'PO Number Mandatory' sync in Customer  refresh job 
                                                    DROP TABLE #POCustomerType";

                        using (var command = new SqlCommand(customerMerge, sqlConnection))
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