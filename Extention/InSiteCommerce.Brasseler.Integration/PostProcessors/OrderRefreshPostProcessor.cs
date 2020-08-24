using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("OrderRefreshPostProcessor")]
    public class OrderRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #OrderHistoryFilter
                                                            ( Company nvarchar(50), WebOrderNumber nvarchar(50), OrderNumber nvarchar(50), OrderGen nvarchar(50), [Type] nvarchar(50)
		                                                    , EntryDate nvarchar(50), [Status] nvarchar(50), ShipToCustomerNumber nvarchar(50), BillToCustomerNumber nvarchar(50), ShipNumber nvarchar(50)
		                                                    , CustomerPO nvarchar(50), Currency nvarchar(50), TermsCd nvarchar(50), ShipCode nvarchar(50), SalesPersonNumber nvarchar(50)
		                                                    , SalesPerson nvarchar(50), BTCompanyName nvarchar(100), BTAddress1 nvarchar(100), BTAddress2 nvarchar(100)
		                                                    , BTCity nvarchar(100), BTState nvarchar(50), BTPostalCode nvarchar(50), BTCountry nvarchar(100)
		                                                    , STCompanyName nvarchar(100), STAddress1 nvarchar(100), STAddress2 nvarchar(100), STCity nvarchar(100)
		                                                    , STState nvarchar(50), STPostalCode nvarchar(50), STCountry nvarchar(100), Notes nvarchar(max)
		                                                    , ProductTotal decimal(18, 5), DiscountAmount decimal(18, 5), ShippingAndHandling decimal(18, 5)
		                                                    , TaxAmount decimal(18, 5), OrderTotal decimal(18, 5), LastShipDate nvarchar(50), LineType nvarchar(50)
		                                                    , LineNumber decimal(18, 5), ProductERPNumber nvarchar(50), CustomerProductNumber nvarchar(50)
		                                                    , [Description] nvarchar(max), WareHouse nvarchar(50), QtyOrdered decimal (18, 5), QtyShipped decimal (18, 5)
		                                                    , UnitOfMeasure nvarchar(50), UnitPrice decimal (18, 5), DiscountPercent decimal (18, 5), LineTotal decimal (18, 5)
		                                                    )";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#OrderHistoryFilter", dataSet.Tables[0]);

                        const string orderHistoryMerge = @"Update #OrderHistoryFilter
                                                       set Company = RTRIM(LTRIM(Company))
                                                         , WebOrderNumber = RTRIM(LTRIM(WebOrderNumber))
                                                         , OrderNumber = RTRIM(LTRIM(OrderNumber))
                                                         , OrderGen = RTRIM(LTRIM(OrderGen))
                                                         , [Type] = RTRIM(LTRIM([Type]))
                                                         , EntryDate = RTRIM(LTRIM(EntryDate))
                                                         , [Status] = RTRIM(LTRIM([Status]))
                                                         , ShipToCustomerNumber = RTRIM(LTRIM(ShipToCustomerNumber))
                                                         , BillToCustomerNumber = RTRIM(LTRIM(BillToCustomerNumber))
                                                         , ShipNumber = RTRIM(LTRIM(ShipNumber))
                                                         , CustomerPO = RTRIM(LTRIM(CustomerPO))
                                                         , Currency = RTRIM(LTRIM(Currency))
                                                         , TermsCd = RTRIM(LTRIM(TermsCd))
                                                         , ShipCode = RTRIM(LTRIM(ShipCode))
                                                         , SalesPersonNumber = RTRIM(LTRIM(SalesPersonNumber))
                                                         , SalesPerson = RTRIM(LTRIM(SalesPerson))
                                                         , BTCompanyName = RTRIM(LTRIM(BTCompanyName))
                                                         , BTAddress1 = RTRIM(LTRIM(BTAddress1))
                                                         , BTAddress2 = RTRIM(LTRIM(BTAddress2))
                                                         , BTCity = RTRIM(LTRIM(BTCity))
                                                         , BTState = RTRIM(LTRIM(BTState))
                                                         , BTPostalCode = RTRIM(LTRIM(BTPostalCode))
                                                         , BTCountry = RTRIM(LTRIM(BTCountry))
                                                         , STCompanyName = RTRIM(LTRIM(STCompanyName))
                                                         , STAddress1 = RTRIM(LTRIM(STAddress1))
                                                         , STAddress2 = RTRIM(LTRIM(STAddress2))
                                                         , STCity = RTRIM(LTRIM(STCity))
                                                         , STState = RTRIM(LTRIM(STState))
                                                         , STPostalCode = RTRIM(LTRIM(STPostalCode))
                                                         , STCountry = RTRIM(LTRIM(STCountry))
                                                         , Notes = RTRIM(LTRIM(Notes))
                                                         , ProductTotal = RTRIM(LTRIM(ProductTotal))
                                                         , DiscountAmount = RTRIM(LTRIM(DiscountAmount))
                                                         , ShippingAndHandling = RTRIM(LTRIM(ShippingAndHandling))
                                                         , TaxAmount = RTRIM(LTRIM(TaxAmount))
                                                         , OrderTotal = RTRIM(LTRIM(OrderTotal))
                                                         , LastShipDate = RTRIM(LTRIM(LastShipDate))
                                                         , LineType = RTRIM(LTRIM(LineType))
                                                         , LineNumber = RTRIM(LTRIM(LineNumber))
                                                         , ProductERPNumber = RTRIM(LTRIM(ProductERPNumber))
                                                         , CustomerProductNumber = RTRIM(LTRIM(CustomerProductNumber))
                                                         , [Description] = RTRIM(LTRIM([Description]))
                                                         , WareHouse = RTRIM(LTRIM(WareHouse))
                                                         , QtyOrdered = RTRIM(LTRIM(QtyOrdered))
                                                         , QtyShipped = RTRIM(LTRIM(QtyShipped))
                                                         , UnitOfMeasure = RTRIM(LTRIM(UnitOfMeasure))
                                                         , UnitPrice = RTRIM(LTRIM(UnitPrice))
                                                         , DiscountPercent = RTRIM(LTRIM(DiscountPercent))
                                                         , LineTotal = RTRIM(LTRIM(LineTotal))
    
	                                                     -- Table variable to hold the status
	                                                     Declare @Status Table (StatusId nvarchar(50), StatusDesc nvarchar(250))
	                                                     insert into @Status (StatusId, StatusDesc)
	                                                     select '1', 'Preparing Shipment'
	                                                     union all select '2','Processing' 
	                                                     union all select '3','Shipment Confirmed'
	                                                     union all select '4','Invoice Printed' 
	                                                     union all select '9','Ready to Ship' 
                                                         union all select '0','Complete' 
	 
	                                                     -- Table variable to hold the terms code
                                                         Declare @Terms Table (TermsId nvarchar(50), TermsDesc nvarchar(250))
	                                                     insert into @Terms (TermsId, TermsDesc)
	                                                     select '01', 'Net 30' 
	                                                     union all select '02', 'Do not use 30/60/90' 
	                                                     union all select '03', 'Prepaid by Credit Cd' 
	                                                     union all select '04', 'DO NOT USE 60' 
	                                                     union all select '05', 'COD-Cash on Delivery' 
	                                                     union all select '06', '6 Month No Interest' 
	                                                     union all select '07', 'Prepaid - No Credit' 
	                                                     union all select '08', 'Net 90 Days' 
	                                                     union all select '09', '9 Month No Interest' 
	                                                     union all select '10', 'Net 60' 
	                                                     union all select '12', '12 Month No Interest' 
	                                                     union all select '14', 'Net 45 Days' 
	                                                     union all select '18', 'Net 180' 
	                                                     union all select '36', 'Net 360' 
	                                                     union all select '45', '1% 20 Net 45 Days' 

                                                         Declare @OrderHistory Table (OrderHistoryId uniqueidentifier, OrderNumber nvarchar(50));

	                                                     -- Deleting the existing insite records 
	                                                     delete OrderHistory where id in 
	                                                     (select oh.id from OrderHistory oh join #OrderHistoryFilter tohf 
	                                                     on tohf.WebOrderNumber = oh.WebOrderNumber and oh.erpordernumber = '')

                                                        
                                                                    MERGE into OrderHistory as TARGET
                                                                    USING ( select distinct Company, OrderNumber, WebOrderNumber, CONVERT(datetime,convert(char(8),EntryDate),102) as OrderDate
                                                                    , OrderGen, [Status], ShipToCustomerNumber, BillToCustomerNumber, CustomerPO, Currency, TermsCd
                                                                    , ShipCode, SalesPerson, BTCompanyName, BTAddress1, BTAddress2, BTCity
                                                                    , BTState, BTPostalCode, BTCountry, STCompanyName, STAddress1, STAddress2
                                                                    , STCity, STState, STPostalCode, STCountry, Notes, ProductTotal, DiscountAmount
                                                                    , ShippingAndHandling, TaxAmount, OrderTotal from #OrderHistoryFilter)
                                                                    as SOURCE 
                                                                    on TARGET.ERPOrderNumber = case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end
                                                                    when not matched by TARGET then
                                                                    insert ( ERPOrderNumber, WebOrderNumber, OrderDate, [Status], CustomerSequence, CustomerNumber
                                                                    , CustomerPO, CurrencyCode, Terms, ShipCode, SalesPerson
                                                                    , BTCompanyName, BTAddress1, BTAddress2, BTCity, BTState, BTPostalCode
                                                                    , BTCountry, STCompanyName, STAddress1, STAddress2, STCity, STState
                                                                    , STPostalCode, STCountry, Notes, ProductTotal, OrderDiscountAmount, ShippingCharges
                                                                    , TaxAmount, OrderTotal)
                                                                    values ( case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end, 
                                                                    case when SOURCE.WebOrderNumber like '[WPS]%' then SOURCE.WebOrderNumber 
                                                                    when SOURCE.WebOrderNumber like '[CPS]%' then SOURCE.WebOrderNumber else ''  end
                                                                    , ISNULL(SOURCE.OrderDate, ''), (select StatusDesc from @Status where StatusId = SOURCE.[Status])
                                                                    , ISNULL((SOURCE.Company + SOURCE.ShipToCustomerNumber), ''), ISNULL((SOURCE.Company + SOURCE.BillToCustomerNumber), '')
                                                                    , ISNULL(SOURCE.CustomerPO, ''), ISNULL(SOURCE.Currency, '')
                                                                    , (select TermsDesc from @Terms where TermsId = SOURCE.[TermsCd])
                                                                    , ISNULL(SOURCE.ShipCode, ''), ISNULL(SOURCE.SalesPerson, ''), ISNULL(SOURCE.BTCompanyName, '')
                                                                    , ISNULL(SOURCE.BTAddress1, ''), ISNULL(SOURCE.BTAddress2, ''), ISNULL(SOURCE.BTCity, '')
                                                                    , ISNULL(SOURCE.BTState, ''), ISNULL(SOURCE.BTPostalCode, ''), ISNULL(SOURCE.BTCountry, '')
                                                                    , ISNULL(SOURCE.STCompanyName, ''), ISNULL(SOURCE.STAddress1, ''), ISNULL(SOURCE.STAddress2, '')
                                                                    , ISNULL(SOURCE.STCity, ''), ISNULL(SOURCE.STState, ''), ISNULL(SOURCE.STPostalCode, '')
                                                                    , ISNULL(SOURCE.STCountry, ''), ISNULL(SOURCE.Notes, ''), ISNULL(SOURCE.ProductTotal, 0)
                                                                    , ISNULL(SOURCE.DiscountAmount, 0), ISNULL(SOURCE.ShippingAndHandling, 0)
                                                                    , ISNULL(SOURCE.TaxAmount, 0), ISNULL(SOURCE.OrderTotal, 0))
                                                                    when not matched by SOURCE then
                                                                    UPDATE SET [STATUS] =  (select StatusDesc from @Status where StatusId ='0')
                                                                    when matched then
                                                                    update set ERPOrderNumber = case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end
                                                                    , WebOrderNumber =  case when SOURCE.WebOrderNumber like '[WPS]%' then SOURCE.WebOrderNumber 
                                                                    when SOURCE.WebOrderNumber like '[CPS]%' then SOURCE.WebOrderNumber else ''  end
                                                                    , OrderDate = ISNULL(SOURCE.OrderDate, '')
                                                                    , [Status] = (select StatusDesc from @Status where StatusId = SOURCE.[Status])
                                                                    , CustomerSequence = ISNULL((SOURCE.Company + SOURCE.ShipToCustomerNumber), '')
                                                                    , CustomerNumber = ISNULL((SOURCE.Company + SOURCE.BillToCustomerNumber), '')
                                                                    , CustomerPO = ISNULL(SOURCE.CustomerPO, '')
                                                                    , CurrencyCode = ISNULL(SOURCE.Currency, '')
                                                                    , Terms = (select TermsDesc from @Terms where TermsId = SOURCE.[TermsCd])
                                                                    , ShipCode = ISNULL(SOURCE.ShipCode, '')
                                                                    , SalesPerson = ISNULL(SOURCE.SalesPerson, '')
                                                                    , BTCompanyName = ISNULL(SOURCE.BTCompanyName, '')
                                                                    , BTAddress1 = ISNULL(SOURCE.BTAddress1, '')
                                                                    , BTAddress2 = ISNULL(SOURCE.BTAddress2, '')
                                                                    , BTCity = ISNULL(SOURCE.BTCity, '')
                                                                    , BTState = ISNULL(SOURCE.BTState, '')
                                                                    , BTPostalCode = ISNULL(SOURCE.BTPostalCode, '')
                                                                    , BTCountry = ISNULL(SOURCE.BTCountry, '')
                                                                    , STCompanyName = ISNULL(SOURCE.STCompanyName, '')
                                                                    , STAddress1 = ISNULL(SOURCE.STAddress1, '')
                                                                    , STAddress2 = ISNULL(SOURCE.STAddress2, '')
                                                                    , STCity = ISNULL(SOURCE.STCity, '')
                                                                    , STState = ISNULL(SOURCE.STState, '')
                                                                    , STPostalCode = ISNULL(SOURCE.STPostalCode, '')
                                                                    , STCountry = ISNULL(SOURCE.STCountry, '')
                                                                    , Notes = ISNULL(SOURCE.Notes, '')
                                                                    , ProductTotal = ISNULL(SOURCE.ProductTotal, 0)
                                                                    , OrderDiscountAmount = ISNULL(SOURCE.DiscountAmount, 0)
                                                                    , ShippingCharges = ISNULL(SOURCE.ShippingAndHandling, 0)
                                                                    , TaxAmount = ISNULL(SOURCE.TaxAmount, 0)
                                                                    , OrderTotal = ISNULL(SOURCE.OrderTotal, 0)
   
                                                                    Output Inserted.Id, case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end into @OrderHistory (OrderHistoryId, OrderNumber);
   
                                                                    -- Merging the records with WebOrderNumber
                                                                    MERGE into OrderHistory as TARGET
                                                                    USING ( select distinct Company, OrderNumber, OrderGen, WebOrderNumber, CONVERT(datetime,convert(char(8),EntryDate),102) as OrderDate
                                                                    , [Status], ShipToCustomerNumber, BillToCustomerNumber, CustomerPO, Currency, TermsCd
                                                                    , ShipCode, SalesPerson, BTCompanyName, BTAddress1, BTAddress2, BTCity
                                                                    , BTState, BTPostalCode, BTCountry, STCompanyName, STAddress1, STAddress2
                                                                    , STCity, STState, STPostalCode, STCountry, Notes, ProductTotal, DiscountAmount
                                                                    , ShippingAndHandling, TaxAmount, OrderTotal from #OrderHistoryFilter where WebOrderNumber like '[WPS]%' Or WebOrderNumber Like '[CPS]%')
                                                                    as SOURCE 
                                                                    on TARGET.WebOrderNumber = SOURCE.WebOrderNumber
                                                                    and TARGET.ERPOrderNumber = case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end
                                                                    when not matched then
                                                                    insert ( ERPOrderNumber, WebOrderNumber, OrderDate, [Status], CustomerSequence, CustomerNumber
                                                                    , CustomerPO, CurrencyCode, Terms, ShipCode, SalesPerson
                                                                    , BTCompanyName, BTAddress1, BTAddress2, BTCity, BTState, BTPostalCode
                                                                    , BTCountry, STCompanyName, STAddress1, STAddress2, STCity, STState
                                                                    , STPostalCode, STCountry, Notes, ProductTotal, OrderDiscountAmount, ShippingCharges
                                                                    , TaxAmount, OrderTotal)
                                                                    values ( case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end, case when SOURCE.WebOrderNumber like '[WPS]%' then SOURCE.WebOrderNumber 
                                                                    when SOURCE.WebOrderNumber like '[CPS]%' then SOURCE.WebOrderNumber else ''  end 
                                                                    , ISNULL(SOURCE.OrderDate, ''), (select StatusDesc from @Status where StatusId = SOURCE.[Status])
                                                                    , ISNULL((SOURCE.Company + SOURCE.ShipToCustomerNumber), ''), ISNULL((SOURCE.Company + SOURCE.BillToCustomerNumber), '')
                                                                    , ISNULL(SOURCE.CustomerPO, ''), ISNULL(SOURCE.Currency, '')	      
                                                                    , (select TermsDesc from @Terms where TermsId = SOURCE.[TermsCd])
                                                                    , ISNULL(SOURCE.ShipCode, ''), ISNULL(SOURCE.SalesPerson, ''), ISNULL(SOURCE.BTCompanyName, '')
                                                                    , ISNULL(SOURCE.BTAddress1, ''), ISNULL(SOURCE.BTAddress2, ''), ISNULL(SOURCE.BTCity, '')
                                                                    , ISNULL(SOURCE.BTState, ''), ISNULL(SOURCE.BTPostalCode, ''), ISNULL(SOURCE.BTCountry, '')
                                                                    , ISNULL(SOURCE.STCompanyName, ''), ISNULL(SOURCE.STAddress1, ''), ISNULL(SOURCE.STAddress2, '')
                                                                    , ISNULL(SOURCE.STCity, ''), ISNULL(SOURCE.STState, ''), ISNULL(SOURCE.STPostalCode, '')
                                                                    , ISNULL(SOURCE.STCountry, ''), ISNULL(SOURCE.Notes, ''), ISNULL(SOURCE.ProductTotal, 0)
                                                                    , ISNULL(SOURCE.DiscountAmount, 0), ISNULL(SOURCE.ShippingAndHandling, 0)
                                                                    , ISNULL(SOURCE.TaxAmount, 0), ISNULL(SOURCE.OrderTotal, 0))
                                                                    when matched then
                                                                    update set ERPOrderNumber = case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end
                                                                    , WebOrderNumber =  case when SOURCE.WebOrderNumber like '[WPS]%' then SOURCE.WebOrderNumber 
                                                                    when SOURCE.WebOrderNumber like '[CPS]%' then SOURCE.WebOrderNumber else ''  end
                                                                    , OrderDate = ISNULL(SOURCE.OrderDate, '')
                                                                    , [Status] = (select StatusDesc from @Status where StatusId = SOURCE.[Status])
                                                                    , CustomerSequence = ISNULL((SOURCE.Company + SOURCE.ShipToCustomerNumber), '')
                                                                    , CustomerNumber = ISNULL((SOURCE.Company + SOURCE.BillToCustomerNumber), '')
                                                                    , CustomerPO = ISNULL(SOURCE.CustomerPO, '')
                                                                    , CurrencyCode = ISNULL(SOURCE.Currency, '')
                                                                    , Terms = (select TermsDesc from @Terms where TermsId = SOURCE.[TermsCd])
                                                                    , ShipCode = ISNULL(SOURCE.ShipCode, '')
                                                                    , SalesPerson = ISNULL(SOURCE.SalesPerson, '')
                                                                    , BTCompanyName = ISNULL(SOURCE.BTCompanyName, '')
                                                                    , BTAddress1 = ISNULL(SOURCE.BTAddress1, '')
                                                                    , BTAddress2 = ISNULL(SOURCE.BTAddress2, '')
                                                                    , BTCity = ISNULL(SOURCE.BTCity, '')
                                                                    , BTState = ISNULL(SOURCE.BTState, '')
                                                                    , BTPostalCode = ISNULL(SOURCE.BTPostalCode, '')
                                                                    , BTCountry = ISNULL(SOURCE.BTCountry, '')
                                                                    , STCompanyName = ISNULL(SOURCE.STCompanyName, '')
                                                                    , STAddress1 = ISNULL(SOURCE.STAddress1, '')
                                                                    , STAddress2 = ISNULL(SOURCE.STAddress2, '')
                                                                    , STCity = ISNULL(SOURCE.STCity, '')
                                                                    , STState = ISNULL(SOURCE.STState, '')
                                                                    , STPostalCode = ISNULL(SOURCE.STPostalCode, '')
                                                                    , STCountry = ISNULL(SOURCE.STCountry, '')
                                                                    , Notes = ISNULL(SOURCE.Notes, '')
                                                                    , ProductTotal = ISNULL(SOURCE.ProductTotal, 0)
                                                                    , OrderDiscountAmount = ISNULL(SOURCE.DiscountAmount, 0)
                                                                    , ShippingCharges = ISNULL(SOURCE.ShippingAndHandling, 0)
                                                                    , TaxAmount = ISNULL(SOURCE.TaxAmount, 0)
                                                                    , OrderTotal = ISNULL(SOURCE.OrderTotal, 0)
   
                                                                    Output Inserted.Id, case when SOURCE.OrderNumber = '' then '' else SOURCE.OrderNumber + '-' + SOURCE.OrderGen end into @OrderHistory (OrderHistoryId, OrderNumber);
                                                      
                                                                    MERGE into OrderHistoryLine as TARGET
                                                                    USING ( select distinct oh.OrderHistoryId, ohf.Company, ohf.WebOrderNumber, ohf.LastShipDate, ohf.BillToCustomerNumber, ohf.ShipToCustomerNumber
                                                                    , ohf.LineType, ohf.LineNumber, ohf.ProductERPNumber, ohf.CustomerProductNumber, ohf.[Description]
                                                                    , ohf.WareHouse, ohf.Notes, ohf.QtyOrdered, ohf.QtyShipped, ohf.UnitOfMeasure, ohf.UnitPrice, ohf.Discountpercent,ohf.DiscountAmount
                                                                    , ohf.LineTotal
                                                                    from #OrderHistoryFilter ohf join @OrderHistory oh 
                                                                    on ohf.OrderNumber + '-' + ohf.OrderGen = oh.OrderNumber )
                                                                    as SOURCE
                                                                    on TARGET.OrderHistoryId = SOURCE.OrderHistoryId
                                                                    and TARGET.LineNumber = SOURCE.LineNumber
                                                                    when not matched then
                                                                    insert ( OrderHistoryId, LastShipDate, CustomerNumber, CustomerSequence, LineType
                                                                    , LineNumber, ReleaseNumber, ProductERPNumber, CustomerProductNumber, LinePOReference
                                                                    , [Description], WareHouse, Notes, QtyOrdered, QtyShipped, UnitOfMeasure, InventoryQtyOrdered
                                                                    , InventoryQtyShipped, UnitNetPrice, DiscountPercent, UnitDiscountAmount, --PromotionAmountApplied
	                                                                    TotalDiscountAmount
                                                                    , TotalRegularPrice,TotalNetPrice,UnitRegularPrice, RMAQtyRequested, RMAQtyReceived )
                                                                    values ( SOURCE.OrderHistoryId, case when SOURCE.LastShipDate = 0 then null else CONVERT(datetime,convert(char(8),SOURCE.LastShipDate),102) end
                                                                    , ISNULL((SOURCE.Company + SOURCE.BillToCustomerNumber), ''), ISNULL((SOURCE.Company + SOURCE.ShipToCustomerNumber), ''), ISNULL(SOURCE.LineType, ''), ISNULL(SOURCE.LineNumber, 0), 0
                                                                    , ISNULL(SOURCE.ProductERPNumber, ''), ISNULL(SOURCE.CustomerProductNumber, ''), 0
                                                                    , ISNULL(SOURCE.[Description], ''), ISNULL(SOURCE.WareHouse, ''), ISNULL(SOURCE.Notes, '')
                                                                    , ISNULL(SOURCE.QtyOrdered, 0), ISNULL(SOURCE.QtyShipped, 0), ISNULL(SOURCE.UnitOfMeasure, ''), 0, 0
                                                                    , ISNULL(SOURCE.UnitPrice, 0), ISNULL(SOURCE.DiscountPercent, 0), ISNULL(SOURCE.DiscountAmount, 0), 0
                                                                    , ISNULL(SOURCE.UnitPrice, 0) * ISNULL(SOURCE.QtyOrdered, 0)
                                                                    , ISNULL(SOURCE.UnitPrice, 0) * ISNULL(SOURCE.QtyOrdered, 0),ISNULL(SOURCE.UnitPrice, 0)
                                                                    , case when SOURCE.WebOrderNumber = '' or SOURCE.WebOrderNumber is null then 0 else '' end
                                                                    , case when SOURCE.WebOrderNumber = '' or SOURCE.WebOrderNumber is null then 0 else '' end )
                                                                    when matched then
                                                                    update set LastShipDate = case when SOURCE.LastShipDate = 0 then null else CONVERT(datetime,convert(char(8),SOURCE.LastShipDate),102) end
                                                                    , CustomerNumber = ISNULL((SOURCE.Company + SOURCE.BillToCustomerNumber), '')
                                                                    , CustomerSequence = ISNULL((SOURCE.Company + SOURCE.ShipToCustomerNumber), '')
                                                                    , LineType = ISNULL(SOURCE.LineType, '')
                                                                    , LineNumber = ISNULL(SOURCE.LineNumber, 0)
                                                                    , ReleaseNumber = 0
                                                                    , ProductERPNumber = ISNULL(SOURCE.ProductERPNumber, '')
                                                                    , CustomerProductNumber = ISNULL(SOURCE.CustomerProductNumber, '')
                                                                    , LinePOReference = 0
                                                                    , [Description] = ISNULL(SOURCE.[Description], '')
                                                                    , WareHouse = ISNULL(SOURCE.WareHouse, '')
                                                                    , Notes = ISNULL(SOURCE.Notes, '')
                                                                    , QtyOrdered = ISNULL(SOURCE.QtyOrdered, 0)
                                                                    , QtyShipped = ISNULL(SOURCE.QtyShipped, 0)
                                                                    , UnitOfMeasure = ISNULL(SOURCE.UnitOfMeasure, '')
                                                                    , InventoryQtyOrdered = 0
                                                                    , InventoryQtyShipped = 0
                                                                    , UnitNetPrice = ISNULL(SOURCE.UnitPrice, 0)
                                                                    , DiscountPercent = ISNULL(SOURCE.DiscountPercent, 0)
                                                                    , UnitDiscountAmount = 0
                                                                    , TotalDiscountAmount = 0
                                                                    , TotalRegularPrice = ISNULL(SOURCE.LineTotal, 0)
                                                                    , RMAQtyRequested = case when SOURCE.WebOrderNumber = '' or SOURCE.WebOrderNumber is null then 0 else '' end
                                                                    , RMAQtyReceived = case when SOURCE.WebOrderNumber = '' or SOURCE.WebOrderNumber is null then 0 else '' end;
                                                                    
                                                                    --Change Status to Return Requested for return orders
                                                                    update OrderHistory
                                                                    set Status = 'Return Requested'
                                                                    from RmaResponse rma join OrderHistory oh
                                                                    on oh.WebOrderNumber = rma.WebOrderNumber and oh.ERPOrderNumber = rma.ErpOrderNumber;

                                                                    Drop table #OrderHistoryFilter;";

                        using (var command = new SqlCommand(orderHistoryMerge, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
                }
                else
                {
                    LogHelper.For((object)this).Info(string.Format("Brasseler: Dataset is Empty"));
                }
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in insite management console, Please Check", this), ex);
            }
        }
    }
}
