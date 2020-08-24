using Insite.Core.Interfaces.Dependency;
using Insite.Integration.WebService.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using Insite.Data.Entities;
using System.Data;
using System.Threading;
using Insite.Core.Plugins.Integration;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Plugins.Emails;
using System.Data.SqlClient;
using Insite.Common.Logging;
using System.Dynamic;
using Insite.Core.Context;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
//BUSA-518: To Create a job for promotions reporting
namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("PromotionsReportingPostprocessor")]
    class PromotionsReportingPostprocessor : IntegrationBase, IJobPostprocessor, IDependency
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;

        public PromotionsReportingPostprocessor(Insite.Data.Entities.IntegrationJob integrationJob, IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, IEmailService emailService)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.IntegrationJobSchedulingService = integrationJobSchedulingService;
            this.EmailService = emailService;
            this.IntegrationJob = integrationJob;
        }


        public void Cancel()
        {
            throw new NotImplementedException();
        }

        public IJobLogger JobLogger { get; set; }

        public IntegrationJob IntegrationJob { get; set; }

        protected readonly IEmailService EmailService;

        public void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            try
            {
                using (var sqlConnection = new SqlConnection(InsiteDbConnectionString))
                {
                    sqlConnection.Open();
                    string FromDate = null;
                    string ToDate = null;
                    string listOfPromotions = null;
                    bool showAllActivePromo = false;
                    var Dates = this.IntegrationJob.IntegrationJobParameters.ToList();
                    foreach (var item in Dates)
                    {
                        if (!string.IsNullOrEmpty(item.JobDefinitionParameter.Name) && item.JobDefinitionParameter.Name.ToUpper().Equals("FROMDATE"))
                        {
                            FromDate = item.Value;
                        }
                        else if (!string.IsNullOrEmpty(item.JobDefinitionParameter.Name) && item.JobDefinitionParameter.Name.ToUpper().Equals("TODATE"))
                        {
                            ToDate = item.Value;
                        }
                        else if (!string.IsNullOrEmpty(item.JobDefinitionParameter.Name) && item.JobDefinitionParameter.Name.ToUpper().Equals("LISTOFPROMOTIONS"))
                        {
                            listOfPromotions = item.Value;
                        }
                        else if (!string.IsNullOrEmpty(item.JobDefinitionParameter.Name) && item.JobDefinitionParameter.Name.ToUpper().Equals("SHOWALLACTIVEPROMO"))
                        {
                            showAllActivePromo = Convert.ToBoolean(item.Value.ToLower());
                        }
                    }

                    const string createPromotionList = @"Create table #PromotionList(
                                                             PromotionName nvarchar(max))";
                    using (var command = new SqlCommand(createPromotionList, sqlConnection))
                    {
                        command.CommandTimeout = CommandTimeOut;
                        command.ExecuteNonQuery();
                        foreach (string value in listOfPromotions.Split('|'))
                        {
                          string  value1=value.Replace("'", "''");
                            command.CommandText = "INSERT INTO #PromotionList (PromotionName) VALUES ('" + value1 + "')"; command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }


                    const string query = @"
                                        if @showAllActivePromo = 'false'
                                        select cop.PromotionId,pro.Name,count(*) as Ordersplaced
                                        from CustomerOrder co join CustomerOrderPromotion cop on co.Id=cop.CustomerOrderId         join Promotion pro on pro.Id=cop.PromotionId and co.Status='Submitted' 
                                        and co.OrderDate between @FromDate and @ToDate 
                                        where cop.PromotionId  in (
                                        select id  from Promotion where Name in
                                        (select PromotionName from #PromotionList ) )
                                        group by cop.PromotionId,pro.Name
                                        else
                                        select cop.PromotionId,pro.Name,count(*) as Ordersplaced
                                        from CustomerOrder co join CustomerOrderPromotion cop on co.Id=cop.CustomerOrderId         join Promotion pro on pro.Id=cop.PromotionId and co.Status='Submitted' 
                                        and co.OrderDate between @FromDate and @ToDate 
                                        where cop.PromotionId  in (select id  from Promotion where IsLive='1')
                                        group by cop.PromotionId,pro.Name
                                        DROP TABLE #PromotionList";

                    SqlDataAdapter da = new SqlDataAdapter(query, sqlConnection);
                    da.SelectCommand.Parameters.AddWithValue("@FromDate", FromDate);
                    da.SelectCommand.Parameters.AddWithValue("@ToDate", ToDate);
                    da.SelectCommand.Parameters.AddWithValue("@showAllActivePromo", showAllActivePromo);
                    da.SelectCommand.Parameters.AddWithValue("@listOfPromotions", listOfPromotions);
                    da.Fill(dataSet, "PromotionsReporting");
                    dynamic emailModel = new ExpandoObject();
                    this.PopulateNewUsersEmailModel(emailModel, dataSet, UnitOfWork);
                    //var emailTo = UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("PromotionsReportTo", SiteContext.Current.Website.Id);
                    var emailTo = customSettings.Value.PromotionsReportTo;
                    var emailList = UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("Promotions Report", "");
                    emailModel.FromDate = Convert.ToDateTime(FromDate).ToShortDateString();
                    emailModel.ToDate = Convert.ToDateTime(ToDate).ToShortDateString();
                    if (!string.IsNullOrEmpty(emailTo))
                    {
                        EmailService.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject, UnitOfWork);
                    }
                }
            }
            catch (Exception ex)
            {
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", this), ex);
                throw;
            }
        }

        protected void PopulateNewUsersEmailModel(dynamic emailModel, DataSet ds, IUnitOfWork unitOfWork)
        {
            DataTable dt = new DataTable();
            dt = ds.Tables["PromotionsReporting"];
            List<ExpandoObject> PromotionsOrderList = new List<ExpandoObject>();
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow dRow in dt.Rows)
                {
                    dynamic values = new ExpandoObject();
                    values.PromotionName = dRow["Name"];
                   
                    values.NumberOfOrders = dRow["Ordersplaced"];
                    


                    PromotionsOrderList.Add(values);
                }
            }
            if (PromotionsOrderList.Count > 0)
            {
                emailModel.PromotionsOrderList = PromotionsOrderList;
                emailModel.PromotionsOrderCount = PromotionsOrderList.Count;
                        }
            else
            {
                emailModel.PromotionsOrderList = PromotionsOrderList;
                emailModel.PromotionsOrderCount = 0;
            }
        }
    }

}

