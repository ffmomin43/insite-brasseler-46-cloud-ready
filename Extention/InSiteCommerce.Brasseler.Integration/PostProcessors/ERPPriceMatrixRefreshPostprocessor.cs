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
    [DependencyName("ERPPriceMatrixRefreshPostprocessor")]
    public class ERPPriceMatrixRefreshPostprocessor : IntegrationBase, IJobPostprocessor
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
                        const string createTempTableSql = @"Create Table #OEMTXFilter
                                                            (MXCONO nvarchar(5),MXPRCL nvarchar(5),MXPRDS nvarchar(5),MXDSCP nvarchar(25),MXDSMR nvarchar(2),MXCPRL nvarchar(5))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#OEMTXFilter", dataSet.Tables[0]);

                        const string priceMatrixMerge = @" 
                                                            Update #OEMTXFilter set MXCONO=LTRIM(RTRIM(MXCONO)), MXPRCL=LTRIM(RTRIM(MXPRCL)), MXPRDS=LTRIM(RTRIM(MXPRDS)),
					                                                                MXDSCP=LTRIM(RTRIM(MXDSCP)), MXDSMR=LTRIM(RTRIM(MXDSMR)), MXCPRL=LTRIM(RTRIM(MXCPRL))

                                                            MERGE INTO OEMTX AS TARGET USING
	                                                            (select * from #OEMTXFilter) AS SOURCE
                                                            ON TARGET.MXCONO =SOURCE.MXCONO and TARGET.MXPRCL=SOURCE.MXPRCL and TARGET.MXPRDS=SOURCE.MXPRDS 
                                                            WHEN NOT MATCHED THEN
	                                                            INSERT(MXCONO,MXPRCL,MXPRDS,MXDSCP,MXDSMR,MXCPRL)
	                                                            VALUES(SOURCE.MXCONO,SOURCE.MXPRCL,SOURCE.MXPRDS,SOURCE.MXDSCP,SOURCE.MXDSMR,SOURCE.MXCPRL)
                                                            WHEN MATCHED THEN
	                                                            UPDATE SET MXDSCP=SOURCE.MXDSCP,MXDSMR=SOURCE.MXDSMR,MXCPRL=SOURCE.MXCPRL
                                                            WHEN NOT MATCHED BY SOURCE THEN
	                                                            DELETE;

                                                            DROP TABLE #OEMTXFilter";

                        using (var command = new SqlCommand(priceMatrixMerge, sqlConnection))
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
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", this), ex);
                throw;
            }
        }
    }
}
