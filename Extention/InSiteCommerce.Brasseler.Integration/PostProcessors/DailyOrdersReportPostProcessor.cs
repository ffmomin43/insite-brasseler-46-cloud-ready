using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.Integration;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using Insite.Integration.WebService.Interfaces;
using InSiteCommerce.Brasseler.Integration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Dynamic;
using System.Threading;
using Insite.Core.Context;
using Insite.Common.Logging;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace Insite.Integration.WebService.PlugIns.Postprocessor
{
    [DependencyName("DailyOrdersReportPostProcessor")]
    public class DailyOrdersReportPostProcessor : IntegrationBase, IJobPostprocessor, IDependency
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;
     
        public void Cancel()
        {
            throw new NotImplementedException();
        }

        public IJobLogger JobLogger { get; set; }

        public IntegrationJob IntegrationJob { get; set; }

        protected readonly IEmailService EmailService;

        public DailyOrdersReportPostProcessor(IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, IEmailService emailService)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.IntegrationJobSchedulingService = integrationJobSchedulingService;
            this.EmailService = emailService;
        }

        public virtual void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            try
            {
                using (var sqlConnection = new SqlConnection(InsiteDbConnectionString))
                {
                    sqlConnection.Open();
                    const string query = @"select  * from OrderHistory where OrderDate between CONVERT(date,GETDATE()-1) and CONVERT(date,GETDATE()) and WebOrderNumber != '' order by OrderDate desc";
                    SqlDataAdapter da = new SqlDataAdapter(query, sqlConnection);

                    da.Fill(dataSet, "DailyOrders");

                    dynamic emailModel = new ExpandoObject();
                    this.PopulateDailyOrderEmailModel(emailModel, dataSet, UnitOfWork);
                    //var emailTo = UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("DailyOrdersReportEmailInfoTo", SiteContext.Current.Website.Id);
                    var emailTo = customSettings.Value.DailyOrdersReportEmailInfoTo;
                    var emailList = UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("DailyOrdersReportEmail", "Daily Orders Report");
                    if (emailTo != null && !string.IsNullOrEmpty(emailTo))
                        EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject + DateTime.Today.AddDays(-1).ToString("MM-dd-yy"), UnitOfWork);
                }
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", this), ex);
                throw;
            }
        }

        //Method for populating required values in email template
        protected void PopulateDailyOrderEmailModel(dynamic emailModel, DataSet ds, IUnitOfWork unitOfWork)
        {
            DataTable dt = new DataTable();
            dt = ds.Tables["DailyOrders"];
            List<ExpandoObject> DailyOrdersList = new List<ExpandoObject>();
            decimal grandTotal = 0;
            int orderCount = 0, USorderCount = 0, CAorderCount = 0;
            decimal CAtotal = 0, USATotal = 0;
            foreach (DataRow dRow in dt.Rows)
            {
                dynamic values = new ExpandoObject();
                values.WebOrderNumber = dRow["WebOrderNumber"];
                values.Status = dRow["Status"];
                values.OrderTotal = dRow["OrderTotal"];
                grandTotal = grandTotal + values.OrderTotal;
                orderCount++;

                //BUSA-806 Order Report job for Canada site start
                string order = dRow["WebOrderNumber"].ToString();
                if (!string.IsNullOrEmpty(order))
                {
                    // BUSA-1351: Punchout orders start with P 
                    string currencyCode = dRow["CurrencyCode"].ToString();
                    var orderPrefix = order.Substring(0, 1).ToUpper();
                    if ((orderPrefix == "W" || orderPrefix == "P" || orderPrefix == "S") && !string.IsNullOrEmpty(currencyCode) && (currencyCode.ToUpper() == "USD" || currencyCode == "840"))
                    {
                        USorderCount++;
                        USATotal = USATotal + Convert.ToDecimal(dRow["OrderTotal"]);
                    }
                    else if ((orderPrefix == "C" || orderPrefix == "P" || orderPrefix == "S") && !string.IsNullOrEmpty(currencyCode) && currencyCode.ToUpper() == "CAD")
                    {
                        CAorderCount++;
                        CAtotal = CAtotal + Convert.ToDecimal(dRow["OrderTotal"]);
                    }
                }
                //BUSA-806 Order Report job for Canada site end
                DailyOrdersList.Add(values);
            }
            emailModel.DailyOrdersList = DailyOrdersList;
            //BUSA-806 Order Report job for Canada site start
            emailModel.CAorderCount = CAorderCount;
            emailModel.USorderCount = USorderCount;
            emailModel.USTotal = USATotal;
            emailModel.CAtotal = CAtotal;
            //BUSA-806 Order Report job for Canada site end
            emailModel.GrandTotal = grandTotal;
            emailModel.OrderCount = orderCount;
        }
    }
}
