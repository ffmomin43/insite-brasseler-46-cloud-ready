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
    [DependencyName("InvoiceRefreshPostProcessor")]
    public class InvoiceRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #InvoiceHistoryFilter 
                                                            (InvoiceNumber varchar(max),InvoiceDate varchar(max),Company varchar(max), CustomerNumber varchar(max), CustomerSequence varchar(max),CustomerPO varchar(max),
                                                                CurrencyCode varchar(max),Terms varchar(max),ShipCode varchar(max), Salesperson varchar(max),
                                                                BTCompanyName varchar(max),BTAddress1 varchar(max),BTAddress2 varchar(max),BTCity varchar(max),
                                                                BTState varchar(max),BTPostalCode varchar(max),BTCountry varchar(max),
		                                                        STCompanyName varchar(max),STAddress1 varchar(max),STAddress2 varchar(max),STCity varchar(max),STState varchar(max),
                                                                STPostalCode varchar(max),STCountry varchar(max),Notes varchar(max),ProductTotal varchar(max), 
                                                                DiscountAmount varchar(max),ShippingAndHandling varchar(max),TaxAmount varchar(max),InvoiceTotal varchar(max),
                                                                LineType varchar(max),ERPOrderNumber varchar(max),LineNumber varchar(max), ProductERPNumber varchar(max),
                                                                CustomerProductNumber varchar(max), Description varchar(max),Warehouse varchar(max), QtyInvoiced varchar(max),
                                                                UnitOfMeasure varchar(max), UnitPrice varchar(max),DiscountPercent varchar(max), LineTotal varchar(max),
                                                                ShipmentNumber varchar(max),InvoiceHistoryId varchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#InvoiceHistoryFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table
                        const string InvoiceHistoryMerge = @"   
                                                             Update #InvoiceHistoryFilter
                                                                set
                                                                InvoiceNumber =RTRIM(LTRIM(InvoiceNumber)),InvoiceDate  =RTRIM(LTRIM(InvoiceDate)), CustomerNumber  =RTRIM(LTRIM(Company+CustomerNumber)), 
                                                                CustomerSequence  =RTRIM(LTRIM(Company+CustomerSequence)),CustomerPO  =RTRIM(LTRIM(CustomerPO)),CurrencyCode  =RTRIM(LTRIM(CurrencyCode)),
                                                                Terms  =RTRIM(LTRIM(Terms)),ShipCode  =RTRIM(LTRIM(ShipCode)), Salesperson  =RTRIM(LTRIM(Salesperson)),
                                                                BTCompanyName  =RTRIM(LTRIM(BTCompanyName)),BTAddress1  =RTRIM(LTRIM(BTAddress1)),BTAddress2  =RTRIM(LTRIM(BTAddress2)),
                                                                BTCity  =RTRIM(LTRIM(BTCity)),BTState  =RTRIM(LTRIM(BTState)),BTPostalCode  =RTRIM(LTRIM(BTPostalCode)),
                                                                BTCountry  =RTRIM(LTRIM(BTCountry)),STCompanyName  =RTRIM(LTRIM(STCompanyName)),STAddress1  =RTRIM(LTRIM(STAddress1)),
                                                                STAddress2  =RTRIM(LTRIM(STAddress2)),STCity  =RTRIM(LTRIM(STCity)),STState  =RTRIM(LTRIM(STState)),
                                                                STPostalCode  =RTRIM(LTRIM(STPostalCode)),STCountry  =RTRIM(LTRIM(STCountry)),Notes  =RTRIM(LTRIM(Notes)),
                                                                ProductTotal  =RTRIM(LTRIM(ProductTotal)), DiscountAmount  =RTRIM(LTRIM(DiscountAmount)),ShippingAndHandling  =RTRIM(LTRIM(ShippingAndHandling)),
                                                                TaxAmount  =RTRIM(LTRIM(TaxAmount)),InvoiceTotal  =RTRIM(LTRIM(InvoiceTotal)),LineType  =RTRIM(LTRIM(LineType)),
                                                                ERPOrderNumber  =RTRIM(LTRIM(ERPOrderNumber)),LineNumber  =RTRIM(LTRIM(LineNumber)), ProductERPNumber  =RTRIM(LTRIM(ProductERPNumber)),
                                                                CustomerProductNumber  =RTRIM(LTRIM(CustomerProductNumber)), Description  =RTRIM(LTRIM(Description)),Warehouse  =RTRIM(LTRIM(Warehouse)), 
                                                                QtyInvoiced  =RTRIM(LTRIM(QtyInvoiced)),UnitOfMeasure  =RTRIM(LTRIM(UnitOfMeasure)), UnitPrice  =RTRIM(LTRIM(UnitPrice)),
                                                                DiscountPercent  =RTRIM(LTRIM(DiscountPercent)), LineTotal  =RTRIM(LTRIM(LineTotal)),ShipmentNumber =RTRIM(LTRIM(ShipmentNumber)),InvoiceHistoryId = RTRIM(LTRIM(InvoiceHistoryId)) 

                                                              MERGE INTO InvoiceHistory AS TARGET USING
                                                              (select distinct InvoiceNumber,InvoiceDate, CustomerNumber, CustomerSequence,CustomerPO,CurrencyCode,Terms,ShipCode, Salesperson,
                                                                BTCompanyName,BTAddress1,BTAddress2,BTCity,BTState,BTPostalCode,BTCountry,
		                                                        STCompanyName,STAddress1,STAddress2,STCity,STState,STPostalCode,STCountry,Notes,ProductTotal, 
                                                                DiscountAmount,ShippingAndHandling,TaxAmount,InvoiceTotal,InvoiceHistoryId from #InvoiceHistoryFilter) AS SOURCE
                                                            ON TARGET.InvoiceNumber=SOURCE.InvoiceNumber +'-'+ SOURCE.InvoiceHistoryId
                                                            WHEN NOT MATCHED THEN
                                                            INSERT(InvoiceNumber,InvoiceDate, CustomerNumber, CustomerSequence,CustomerPO,CurrencyCode,Terms,ShipCode, Salesperson,
                                                                BTCompanyName,BTAddress1,BTAddress2,BTCity,BTState,BTPostalCode,BTCountry,
		                                                        STCompanyName,STAddress1,STAddress2,STCity,STState,STPostalCode,STCountry,Notes,ProductTotal, 
                                                                DiscountAmount,ShippingAndHandling,TaxAmount,InvoiceTotal)
                               
                                                            Values(SOURCE.InvoiceNumber +'-'+ SOURCE.InvoiceHistoryId,ISNULL(SOURCE.InvoiceDate ,''),SOURCE.CustomerNumber,SOURCE.CustomerSequence,ISNULL(SOURCE.CustomerPO ,''),
			                                                        ISNULL(SOURCE.CurrencyCode ,''),ISNULL(SOURCE.Terms ,''),ISNULL(SOURCE.ShipCode ,''),ISNULL(SOURCE.Salesperson ,''),
                                                                    ISNULL(SOURCE.BTCompanyName ,''),ISNULL(SOURCE.BTAddress1 ,''),
			                                                        ISNULL(SOURCE.BTAddress2 ,''),ISNULL(SOURCE.BTCity ,''),ISNULL(SOURCE.BTState ,''),ISNULL(SOURCE.BTPostalCode ,''),ISNULL(SOURCE.BTCountry ,''),
			                                                        ISNULL(SOURCE.STCompanyName ,''),ISNULL(SOURCE.STAddress1 ,''),ISNULL(SOURCE.STAddress2 ,''),ISNULL(SOURCE.STCity ,''),
			                                                        ISNULL(SOURCE.STState ,''),ISNULL(SOURCE.STPostalCode ,''),ISNULL(SOURCE.STCountry ,''),ISNULL(SOURCE.Notes,''),ISNULL(SOURCE.ProductTotal ,0),
			                                                        ISNULL(SOURCE.DiscountAmount ,0),ISNULL(SOURCE.ShippingAndHandling ,0),ISNULL(SOURCE.TaxAmount ,0),
			                                                        ISNULL(SOURCE.InvoiceTotal ,0))
                                                            WHEN MATCHED THEN
	                                                        UPDATE SET 
                                                            InvoiceNumber=SOURCE.InvoiceNumber +'-'+ SOURCE.InvoiceHistoryId,InvoiceDate=ISNULL(SOURCE.InvoiceDate ,''),
                                                            CustomerNumber=SOURCE.CustomerNumber,CustomerSequence=SOURCE.CustomerSequence,CustomerPO=ISNULL(SOURCE.CustomerPO ,''),
                                                            CurrencyCode=ISNULL(SOURCE.CurrencyCode ,''),Terms=ISNULL(SOURCE.Terms ,''),ShipCode=ISNULL(SOURCE.ShipCode ,''),Salesperson=ISNULL(SOURCE.Salesperson ,''),
                                                            BTCompanyName=ISNULL(SOURCE.BTCompanyName ,''),BTAddress1=ISNULL(SOURCE.BTAddress1 ,''),BTAddress2=ISNULL(SOURCE.BTAddress2 ,''),
                                                            BTCity=ISNULL(SOURCE.BTCity ,''),BTState=ISNULL(SOURCE.BTState ,''),BTPostalCode=ISNULL(SOURCE.BTPostalCode ,''),
                                                            BTCountry=ISNULL(SOURCE.BTCountry ,''),STCompanyName=ISNULL(SOURCE.STCompanyName ,''),STAddress1=ISNULL(SOURCE.STAddress1 ,''),
                                                            STAddress2=ISNULL(SOURCE.STAddress2 ,''),STCity=ISNULL(SOURCE.STCity ,''),STState=ISNULL(SOURCE.STState ,''),
                                                            STPostalCode=ISNULL(SOURCE.STPostalCode ,''),STCountry=ISNULL(SOURCE.STCountry ,''),Notes=ISNULL(SOURCE.Notes,''),
                                                            ProductTotal=ISNULL(SOURCE.ProductTotal ,0),DiscountAmount=ISNULL(SOURCE.DiscountAmount ,0),ShippingAndHandling=ISNULL(SOURCE.ShippingAndHandling ,0),
                                                            TaxAmount=ISNULL(SOURCE.TaxAmount ,0),InvoiceTotal=ISNULL(SOURCE.InvoiceTotal ,0);

                                                          
                                                            MERGE INTO InvoiceHistoryLine AS TARGET USING
                                                            (select inf.InvoiceNumber,inf.LineType, inf.ERPOrderNumber,inf.LineNumber,  inf.ProductERPNumber, inf.CustomerProductNumber,
                                                            inf.Description,inf.Warehouse,  inf.QtyInvoiced,inf.UnitOfmeasure, inf.UnitPrice,inf.DiscountPercent, inf.LineTotal,inf.ShipmentNumber,inf.InvoiceHistoryId
                                                            from #InvoiceHistoryFilter inf join InvoiceHistory inh on inh.InvoiceNumber = inf.InvoiceNumber + '-'+ inf.InvoiceHistoryId) AS SOURCE

                                                            ON TARGET.InvoiceHistoryId = (select Id from InvoiceHistory where [InvoiceNumber] = SOURCE.InvoiceNumber + '-' + SOURCE.InvoiceHistoryId) AND TARGET.LineNumber = SOURCE.LineNumber 

                                                            WHEN NOT MATCHED THEN
                                                            INSERT(InvoiceHistoryId,LineType,ERPOrderNumber,LineNumber, ProductERPNumber,CustomerProductNumber, Description,Warehouse, QtyInvoiced,
                                                                    UnitOfMeasure, UnitPrice,DiscountPercent, LineTotal,ShipmentNumber)

                                                            VALUES((select Id from InvoiceHistory where [InvoiceNumber] = SOURCE.InvoiceNumber + '-' + SOURCE.InvoiceHistoryId), ISNULL(SOURCE.LineType,''), ISNULL(SOURCE.ERPOrderNumber,''),
                                                                    ISNULL(SOURCE.LineNumber,''),ISNULL(SOURCE.ProductERPNumber,''), ISNULL(SOURCE.CustomerProductNumber,''),  ISNULL(SOURCE.Description,''), 
                                                                    ISNULL(SOURCE.Warehouse,''), ISNULL(SOURCE.QtyInvoiced,0),ISNULL(SOURCE.UnitOfmeasure,''),ISNULL(SOURCE.UnitPrice,0),
                                                                    ISNULL(SOURCE.DiscountPercent,0), ISNULL(SOURCE.LineTotal,0),ISNULL(SOURCE.ShipmentNumber,''))

                                                            WHEN MATCHED THEN
                                                            UPDATE SET 
                                                            InvoiceHistoryId=(select Id from InvoiceHistory  where [InvoiceNumber] = SOURCE.InvoiceNumber + '-' + SOURCE.InvoiceHistoryId), 
                                                            LineType =ISNULL(SOURCE.LineType,''),ERPOrderNumber=ISNULL(SOURCE.ERPOrderNumber,''),LineNumber=ISNULL(SOURCE.LineNumber,''),
                                                            ProductERPNumber=  ISNULL(SOURCE.ProductERPNumber,''),CustomerProductNumber=ISNULL(SOURCE.CustomerProductNumber,''), 
                                                            Description=ISNULL(SOURCE.Description,''),Warehouse=ISNULL(SOURCE.Warehouse,''), QtyInvoiced=ISNULL(SOURCE.QtyInvoiced,0),
                                                            UnitOfMeasure=ISNULL(SOURCE.UnitOfmeasure,''), UnitPrice=ISNULL(SOURCE.UnitPrice,0),DiscountPercent=ISNULL(SOURCE.DiscountPercent,0),
                                                           LineTotal=ISNULL(SOURCE.LineTotal,0),ShipmentNumber=ISNULL(SOURCE.ShipmentNumber,'');

                                                            --  MERGE InvoiceHistoryLine AS TARGET USING 
                                                            --      (select ikl.InvoiceNumber,ikl.InvoiceHistoryId from #InvoiceHistoryFilter ikl join InvoiceHistory ih on ih.InvoiceNumber = ikl.InvoiceNumber  + '-' + ikl.InvoiceHistoryId )
                                                            --          AS SOURCE
                                                            --      ON TARGET.InvoiceHistoryId = (select Id from InvoiceHistory  where [InvoiceNumber] = SOURCE.InvoiceNumber  + '-' + SOURCE.InvoiceHistoryId)
                                                            --      WHEN NOT MATCHED BY SOURCE  THEN
                                                            --      DELETE;
                                                        
                                                              -- MERGE InvoiceHistory AS TARGET USING
                                                              --      (select InvoiceNumber,InvoiceHistoryId from #InvoiceHistoryFilter) AS SOURCE
                                                              --      ON TARGET.InvoiceNumber = SOURCE.InvoiceNumber   + '-' + SOURCE.InvoiceHistoryId
                                                              --
                                                              --      WHEN NOT MATCHED BY SOURCE THEN
                                                              --      DELETE;

                                                        -- updating the IsOpen as true when the current balance of an invoice is positive
                                                           update invoicehistory set IsOpen = 1 where CurrentBalance > 0

                                                           DROP TABLE #InvoiceHistoryFilter;

                        ";

                        using (var command = new SqlCommand(InvoiceHistoryMerge, sqlConnection))
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
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check"), ex);
                throw;
            }
        }

    }
}
