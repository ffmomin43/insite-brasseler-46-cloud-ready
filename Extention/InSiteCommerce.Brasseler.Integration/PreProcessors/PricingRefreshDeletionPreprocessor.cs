using Insite.Integration.WebService.Interfaces;
using System;
using Insite.Data.Entities;
using System.Data.SqlClient;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Dependency;

namespace InSiteCommerce.Brasseler.Integration.PreProcessors
{
    [DependencyName("PricingRefreshDeletionPreprocessor")]
    public class PricingRefreshDeletionPreprocessor : IntegrationBase, IJobPreprocessor
    {
        public IntegrationJob IntegrationJob { get; set; }
        public IJobLogger JobLogger { get; set; }


        public IntegrationJob Execute()
        {
            try
            {
                using (var sqlConnection = new SqlConnection(InsiteDbConnectionString))
                {
                    sqlConnection.Open();
                    const string pricingMerge = @" 

                                                            DELETE FROM PriceMatrix_Archived;
                                                            
                                                            MERGE INTO  PriceMatrix_Archived AS TARGET USING(
                                                            Select * from PriceMatrix where RecordType in ('Customer Price Code/Product Price Code','Customer Price Code/Product','Customer/Product Price Code','Customer/Product')and CurrencyCode ='USD') AS SOURCE ON SOURCE.ID = TARGET.ID
                                                            WHEN NOT MATCHED THEN 
                                                            INSERT  (ID,RecordType,CurrencyCode,Warehouse,UnitOfMeasure,CustomerKeyPart,ProductKeyPart,ActivateOn,DeactivateOn,CalculationFlags,
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
                                                            SOURCE.AltAmount11,SOURCE.CreatedOn,SOURCE.CreatedBy,SOURCE.ModifiedOn,SOURCE.ModifiedBy);
                                                            
                                                            DELETE FROM PRICEMATRIX WHERE RecordType in ('Customer Price Code/Product Price Code','Customer Price Code/Product','Customer/Product Price Code','Customer/Product') and CurrencyCode ='USD'";

                    using (var command = new SqlCommand(pricingMerge, sqlConnection))
                    {
                        command.CommandTimeout = CommandTimeOut;
                        command.ExecuteNonQuery();
                    }
                }
                return IntegrationJob;
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check"), ex);
                throw;
            }

        }
    }
}
