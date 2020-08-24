using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using System.Data;
using System.Data.SqlClient;
using Insite.Common.Logging;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("OrderShipmentRefreshPostProcessor")]
    public class OrderShipmentRefreshPostProcessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create table #OrderShipmentFilter
                                                            (ShipmentNumber nvarchar(50), ShipDate nvarchar(50), Company nvarchar(50), CustomerNumber nvarchar(50),
                                                            ShipToNumber nvarchar(50), ERPOrderNumber nvarchar(50), OrderGeneration nvarchar(50), ShipmentId nvarchar(50),
                                                            NumberOfPackages nvarchar(50), Carrier nvarchar(100), TrackingNumber nvarchar(50), Freight decimal(18, 5),
                                                            PackageNumber nvarchar(100), ShipVia nvarchar(100))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#OrderShipmentFilter", dataSet.Tables[0]);

                        const string orderShipmentMerge = @"
                                                            Update #OrderShipmentFilter set ShipmentNumber = LTRIM(RTRIM(ShipmentNumber)), ShipDate = LTRIM(RTRIM(ShipDate)),
							                                                               Company = LTRIM(RTRIM(Company)), CustomerNumber = LTRIM(RTRIM(CustomerNumber)),
							                                                               ShipToNumber = LTRIM(RTRIM(ShipToNumber)), ERPOrderNumber = LTRIM(RTRIM(ERPOrderNumber)),
							                                                               OrderGeneration = LTRIM(RTRIM(OrderGeneration)), ShipmentId = LTRIM(RTRIM(ShipmentId)),
							                                                               NumberOfPackages = LTRIM(RTRIM(NumberOfPackages)), Carrier = LTRIM(RTRIM(Carrier)),
							                                                               TrackingNumber = LTRIM(RTRIM(TrackingNumber)), Freight = LTRIM(RTRIM(Freight)),
							                                                               PackageNumber = LTRIM(RTRIM(PackageNumber)), ShipVia = LTRIM(RTRIM(ShipVia))

                                                            Delete from #OrderShipmentFilter where shipmentid is null or packagenumber is null

                                                            Declare @OrderShipmentHistory table ( ShipmentId uniqueidentifier, ShipmentNumber nvarchar(50))

                                                            MERGE INTO Shipment AS TARGET
	                                                            USING (select distinct ShipmentNumber, case when ShipDate = '0' then '' else CONVERT(datetime, convert(char(8), ShipDate), 102) end as ShipDate,
		                                                               ERPOrderNumber + '-' + OrderGeneration as ERPOrderNumber from #OrderShipmentFilter)
	                                                            AS SOURCE
                                                            ON TARGET.ShipmentNumber = SOURCE.ShipmentNumber
                                                            WHEN NOT MATCHED THEN
	                                                            INSERT ( ShipmentNumber, ShipmentDate, EmailSentDate, ASNSentDate, WebOrderNumber, ERPOrderNumber )
	                                                            VALUES ( SOURCE.ShipmentNumber, SOURCE.ShipDate, '', '', '', SOURCE.ERPOrderNumber )
                                                            Output Inserted.Id, SOURCE.ShipmentNumber into @OrderShipmentHistory;
	
                                                            -- Merging the records with ShipmentPackage table
                                                            MERGE INTO ShipmentPackage AS TARGET
	                                                            USING ( select distinct osh.ShipmentId, osf.Carrier, osf.TrackingNumber, osf.Freight, osf.packageNumber, osf.ShipVia
			                                                            from #OrderShipmentFilter osf join @OrderShipmentHistory osh on osh.ShipmentNumber = osf.ShipmentNumber)
	                                                            AS SOURCE
                                                            ON TARGET.ShipmentId = SOURCE.ShipmentId AND TARGET.PackageNumber = SOURCE.PackageNumber
                                                            WHEN NOT MATCHED THEN
	                                                            INSERT ( ShipmentId, Carrier, TrackingNumber, Freight, PackageNumber, ShipVia)
	                                                            VALUES ( SOURCE.ShipmentId,'UPS', ISNULL(SOURCE.TrackingNumber, ''), ISNULL(SOURCE.Freight, 0),
			                                                             ISNULL(SOURCE.PackageNumber, ''), ISNULL(SOURCE.ShipVia, ''));
                                                           
                                                            Drop table #OrderShipmentFilter;";

                        using (var command = new SqlCommand(orderShipmentMerge, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
                }
                else
                {
                    LogHelper.For((object) this).Info(string.Format("Brasseler: Dataset is Empty"));
                }
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in insite management console, Please Check", this, ex));
            }
        }

    }
}
