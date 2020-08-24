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
    [DependencyName("AttributeRefreshPostprocessor")]
    public class AttributeRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #AttributeFilter 
                                                            (ERPNumber varchar(max),HeadSize varchar(max),USNumber varchar(max),SingleUseSterile varchar(max),Taper varchar(max),
                                                             [Length] varchar(max),GTIN varchar(max),ISONumber varchar(max),QtyPerPk varchar(max),MaxRPM varchar(max),
                                                             RXOnly varchar(max),SingleUse varchar(max),Sterilization varchar(max),Image1 varchar(max))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#AttributeFilter", dataSet.Tables[0]);

                        // Merge the data from the Temp Table
                        const string AttributeMerge = @"  
                                                         		Update #AttributeFilter
                                                        set
                                                        ERPNumber =RTRIM(LTRIM(ERPNumber)), HeadSize =RTRIM(LTRIM(HeadSize)), USNumber =RTRIM(LTRIM(USNumber)),
                                                        SingleUseSterile =RTRIM(LTRIM(SingleUseSterile)), Taper =RTRIM(LTRIM(Taper)), [Length] =RTRIM(LTRIM([Length])),
                                                        GTIN =RTRIM(LTRIM(GTIN)), ISONumber =RTRIM(LTRIM(ISONumber)), QtyPerPk =RTRIM(LTRIM(QtyPerPk)), 
                                                        MaxRPM =RTRIM(LTRIM(MaxRPM)), RXOnly =RTRIM(LTRIM(RXOnly)), SingleUse =RTRIM(LTRIM(SingleUse)),
                                                        Sterilization =RTRIM(LTRIM(Sterilization)), Image1 =RTRIM(LTRIM(Image1))
                                                        
                                                        Create table #UpdatedAttributeFilter 
                                                        (ERPNumber varchar(max),Attribute varchar(max),Value varchar(max),AttributeId varchar(max),ValueId varchar(max))
                                                             

                                                         -- BEGIN ProductAttributeValueRefresh --
                                                    	MERGE INTO #UpdatedAttributeFilter  AS TARGET 
														USING (SELECT ERPNumber, Attribute, Value FROM 
	                                                        (SELECT ERPNumber,HeadSize,USNumber,SingleUseSterile,Taper,[Length],GTIN,ISONumber,QtyPerPk,MaxRPM,RXOnly,SingleUse,Sterilization,Image1 FROM #AttributeFilter) cbp 
	                                                        UNPIVOT (Value FOR Attribute IN (HeadSize,USNumber,SingleUseSterile,Taper,[Length],GTIN,ISONumber,QtyPerPk,MaxRPM,RXOnly,SingleUse,Sterilization,Image1)) as cbppvt ) 
	                                                        AS SOURCE
														on TARGET.ERPNumber = SOURCE.ERPNumber and TARGET.Value= SOURCE.Value and TARGET.Attribute = SOURCE.Attribute
                                                        WHEN NOT MATCHED and SOURCE.Value <> '' THEN 
                                                            INSERT(ERPNumber,Attribute,Value,AttributeId)
                                                            VALUES(SOURCE.ERPNumber,SOURCE.Attribute,SOURCE.Value,(select Id from AttributeType where Name = SOURCE.Attribute));

                                                        MERGE INTO AttributeValue AS TARGET 
														USING (select distinct Value,AttributeId from #UpdatedAttributeFilter) as source
                                                        ON TARGET.AttributeTypeId = source.AttributeId and TARGET.Value=SOURCE.Value
                                                        WHEN NOT MATCHED THEN 
                                                        INSERT(AttributeTypeId,Value,IsActive,SortOrder)
                                                        VALUES(SOURCE.AttributeId,SOURCE.Value,1,0);

	                                                    Merge into #UpdatedAttributeFilter  AS TARGET 
                                                        USING (SELECT Id,AttributeTypeId,Value FROM  AttributeValue) as source
                                                        on TARGET.Value = SOURCE.Value and TARGET.AttributeId = SOURCE.AttributeTypeId
                                                         WHEN MATCHED THEN 
                                                         UPDATE set ValueId=  Id;

                                                        Merge into ProductAttributeValue as target 
														using (select	a.ERPNumber,ValueId from #UpdatedAttributeFilter a inner join Product b on a.ERPNumber =b.ERPNumber) as source
														on (select Id from Product where ERPNUmber = source.ERPNumber) =target.ProductId and target.AttributeValueId = source.ValueId 
														when not matched then 
														insert(ProductId,AttributeValueId)
														values((select Id from Product where ERPNUmber = source.ERPNumber),source.ValueId);
														drop table #UpdatedAttributeFilter;
                                                        drop table #AttributeFilter;
                                                        -- END ProductAttributeValueRefresh --

                        ";

                        using (var command = new SqlCommand(AttributeMerge, sqlConnection))
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
