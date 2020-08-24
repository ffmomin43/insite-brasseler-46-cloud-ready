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
    //Product Restriction Refresh job
    [DependencyName("ProductRestrictionRefreshPostprocessor")]
    public class ProductRestrictionRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #ProductFilterRestriction 
                                                            (Name varchar(32),ERPDescription varchar(max),ProductCode varchar(50),PriceCode varchar(50),RestrictionCode varchar(10))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#ProductFilterRestriction", dataSet.Tables[0]);

                        // Merge the data from the Temp Table


                        const string productMerge = @"Update #ProductFilterRestriction set
                                                    Name =RTRIM(LTRIM(Name)), ERPDescription =RTRIM(LTRIM(ERPDescription)), ProductCode =RTRIM(LTRIM(ProductCode)),
                                                    PriceCode =RTRIM(LTRIM(PriceCode)),RestrictionCode = LTRIM(RTRIM(RestrictionCode))

													select distinct pr.Id as ProductId,pf.Name,pf.ERPDescription,pf.ProductCode,pf.RestrictionCode,
                                                    stuff((SELECT '|'+ concat('CompanyNo=' +cast(mxcono as varchar(25))+',PriceDiscountCode='+
                                                    cast(mxprds as varchar(25))+',Discount='+cast(mxdscp as varchar(25))+',MarkupCode='+
                                                    cast(mxdsmr as varchar(25))+',CustomerPriceList=',mxcprl)
                                                    FROM OEMTX WHERE mxprcl = pf.PriceCode FOR XML PATH('')),1,1,'') as ERPPriceMatrix
                                                    into #UpdateProductList from #ProductFilterRestriction pf join Product pr on pr.Name= pf.Name
                                                    left outer join OEMTX otx on otx.mxprcl= pf.pricecode


                                                    DELETE FROM RestrictionGroupProductAddition

													MERGE INTO RestrictionGroupProductAddition AS TARGET USING
                                                    (select distinct pf.Name,pf.ERPDescription,pf.ProductCode,pf.PriceCode,pf.RestrictionCode,prd.id ,prd.name as Productname, 
                                                    stuff((SELECT '|'+ concat('CompanyNo=' +cast(mxcono as varchar(25))+',PriceDiscountCode='+
                                                    cast(mxprds as varchar(25))+',Discount='+cast(mxdscp as varchar(25))+',MarkupCode='+cast(mxdsmr as varchar(25))+
                                                    ',CustomerPriceList=',mxcprl)FROM OEMTX WHERE mxprcl = pf.PriceCode FOR XML PATH('')),1,1,'') as ERPPriceMatrix
                                                    from #ProductFilterRestriction pf left outer join OEMTX otx on otx.mxprcl= pf.pricecode
													join Product Prd on pf.Name = Prd.Name
													WHERE pf.Name NOT LIKE '%.%') AS SOURCE
                                                       
                                                    ON TARGET.ProductId =SOURCE.Id and TARGET.RestrictionGroupId=(select Id from RestrictionGroup where Name = SOURCE.RestrictionCode)
                                                    WHEN NOT MATCHED THEN 
                                                    INSERT(RestrictionGroupId,ProductId)
                                                    VALUES((select Id from RestrictionGroup where Name=SOURCE.RestrictionCode),SOURCE.Id);
                                          --BUSA-1075 start
                                           Update Product set DefaultVisibility ='Show';

                                            MERGE INTO PRODUCT AS TARGET USING 
                                            (select distinct  pf.Name ,pf.ERPDescription,pf.RestrictionCode,rg.Id,rg.DisplayType               from #ProductFilterRestriction pf
                                            join RestrictionGroup rg on pf.RestrictionCode = rg.Name
                                            ) AS SOURCE
                                            ON SOURCE.Name = LTRIM(RTRIM(TARGET.Name)) and SOURCE.ERPDescription = LTRIM(RTRIM                (TARGET.ERPDescription))
                                            WHEN MATCHED THEN
                                            UPDATE SET TARGET.DefaultVisibility = (CASE WHEN SOURCE.DisplayType ='Show' THEN 'Hide'            ELSE 'Show' END);
                                            
                                            DROP TABLE #ProductFilterRestriction
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
