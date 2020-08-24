using System;
using System.Collections.Generic;
using System.Linq;
using System.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Integration.WebService.Interfaces;
using Insite.Data.Entities;
using System.Threading;
using System.Data.SqlClient;
using Insite.Common.Logging;
using System.Dynamic;
using Insite.Core.Interfaces.Data;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.Plugins.Integration;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Context;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("NewUserCountPostprocessor")]
    class NewUserCountPostprocessor : IntegrationBase, IJobPostprocessor, IDependency
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;
        protected List<Guid> DefaultCustomerIdList = new List<Guid>();
      
        public NewUserCountPostprocessor(Insite.Data.Entities.IntegrationJob integrationJob, IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, IEmailService emailService)
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

                    //var defaultCustomernumbers = UnitOfWork.GetTypedRepository<IApplicationSettingRepository>().GetOrCreateByName("Brasseler_MultisiteCustomerNumbers", "11055357", "This setting is to have brasseler's guest customer numbers.");
                    var defaultCustomernumbers = customSettings.Value.Brasseler_MultisiteCustomerNumbers;
                    const string defaultCustomerIds = @"Create table #CustomerId(
                                                             Ids uniqueidentifier)";
                    using (var command = new SqlCommand(defaultCustomerIds, sqlConnection))
                    {
                        command.CommandTimeout = CommandTimeOut;
                        command.ExecuteNonQuery();
                        foreach (string value in defaultCustomernumbers.Split(','))
                        {
                            Guid id = UnitOfWork.GetRepository<Customer>().GetTable().Where(cn => cn.CustomerNumber == value).FirstOrDefault().Id;
                            DefaultCustomerIdList.Add(id);
                            command.CommandText = "INSERT INTO #CustomerId (Ids) VALUES ('" + id + "')"; command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
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
                    }
                    const string query = @"WITH Rel AS
                        ( SELECT DISTINCT UserProfileId
                          FROM newusercreated
                        )
                        SELECT R.UserProfileId
                        , X.CustomerId, X.CreatedOn,X.ModifiedOn
                        FROM Rel R
                        CROSS APPLY
                          (SELECT  RT.UserProfileId, RT.CustomerId,RT.CreatedOn,rt.ModifiedOn
                           FROM newusercreated RT
                           WHERE R.UserProfileId = RT.UserProfileId 
                           --BUSA-712: New users count start.
						   and (case when CustomerId IN (select Ids from #CustomerId) then convert(date,RT.ModifiedOn) else convert(date,RT.CreatedOn) End)
                           --BUSA-712: New users count job end. 
                           between @FromDate  and @ToDate
                           group by RT.UserProfileId, RT.CustomerId,RT.CreatedOn,rt.ModifiedOn
                           ORDER BY CreatedOn asc
                           offset 1 rows
                           fetch next 1 row only
                          ) AS X
                         DROP TABLE #CustomerId";

                    SqlDataAdapter da = new SqlDataAdapter(query, sqlConnection);
                    da.SelectCommand.Parameters.AddWithValue("@FromDate", FromDate);
                    da.SelectCommand.Parameters.AddWithValue("@ToDate", ToDate);
                    //BUSA-712: New users count job.
                    da.Fill(dataSet, "NewUsers");
                    dynamic emailModel = new ExpandoObject();
                    this.PopulateNewUsersEmailModel(emailModel, dataSet, UnitOfWork);
                    //var emailTo = UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName("NewUserCountInfoTo", SiteContext.Current.Website.Id);
                    var emailTo = customSettings.Value.NewUserCountInfoTo;
                    var emailList = UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("New User Count", "New User Count");
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
                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check " + ex.ToString(), this), ex);
                throw;
            }
        }

        protected void PopulateNewUsersEmailModel(dynamic emailModel, DataSet ds, IUnitOfWork unitOfWork)
        {
            DataTable dt = new DataTable();
            dt = ds.Tables["NewUsers"];
            List<ExpandoObject> NewUsersList = new List<ExpandoObject>();
            int NewUserWithExistingCustomerUSA = 0;
            int NewUserCountUSA = 0;
            int NewUserWithExistingCustomerCA = 0;
            int NewUserCountCA = 0;
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow dRow in dt.Rows)
                {
                    dynamic values = new ExpandoObject();
                    values.UserProfileId = dRow["UserProfileId"];
                    string UserId = Convert.ToString(values.UserProfileId);
                    values.CustomerId = dRow["CustomerId"];
                    string CustomerId = Convert.ToString(values.CustomerId);
                    values.FirstName = unitOfWork.GetRepository<UserProfile>().GetTable().Where(cn => cn.Id.ToString() == UserId).FirstOrDefault().FirstName;
                    values.LastName = unitOfWork.GetRepository<UserProfile>().GetTable().Where(cn => cn.Id.ToString() == UserId).FirstOrDefault().LastName;
                    values.CustomerNumber = unitOfWork.GetRepository<Customer>().GetTable().Where(cn => cn.Id.ToString() == CustomerId).FirstOrDefault().CustomerNumber;
                    if (DefaultCustomerIdList.Contains(values.CustomerId))
                    {
                        if (values.CustomerNumber.Substring(0, 1) == "3")
                        { NewUserCountCA++; }
                        else
                        { NewUserCountUSA++; }
                    }
                    else
                    {
                        if (values.CustomerNumber.Substring(0, 1) == "3")
                        { NewUserWithExistingCustomerCA++; }
                        else
                        { NewUserWithExistingCustomerUSA++; }
                    }
                    NewUsersList.Add(values);
                }
            }
            if (NewUsersList.Count > 0)
            {   
                emailModel.NewUsersList = NewUsersList;
                emailModel.NewUserCountUSA = NewUserCountUSA;
                emailModel.NewUserCountCA = NewUserCountCA;
                emailModel.NewUserWithExistingCustomerUSA = NewUserWithExistingCustomerUSA;
                emailModel.NewUserWithExistingCustomerCA = NewUserWithExistingCustomerCA;
                emailModel.NewUserTotalCount = NewUserCountUSA + NewUserCountCA+ NewUserWithExistingCustomerUSA+ NewUserWithExistingCustomerCA;
            }
            else
            {
                emailModel.NewUsersList = NewUsersList;
                emailModel.NewUserCountUSA = 0;
                emailModel.NewUserCountCA = 0;
                emailModel.NewUserWithExistingCustomerUSA = 0;
                emailModel.NewUserWithExistingCustomerCA = 0;
                emailModel.NewUserTotalCount = 0;
            }
        }
    }
}