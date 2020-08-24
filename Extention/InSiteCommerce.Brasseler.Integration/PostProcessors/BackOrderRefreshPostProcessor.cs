using System;
using System.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Integration.WebService.Interfaces;
using Insite.Data.Entities;
using System.Threading;
using System.Data.SqlClient;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using Insite.Core.Plugins.Integration;
using Insite.Core.Interfaces.Plugins.Emails;
using System.Dynamic;
using System.Collections.Generic;
using System.Linq;
using Insite.Data.Repositories.Interfaces;
using Insite.Data.Extensions;
using Insite.Core.Plugins.EntityUtilities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace InSiteCommerce.Brasseler.Integration.PostProcessors
{
    [DependencyName("BackOrderRefreshPostProcessor")]
    public class BackOrderRefreshPostProcessor : IntegrationBase, IJobPostprocessor, IDependency
    {
        protected readonly IIntegrationJobSchedulingService IntegrationJobSchedulingService;
        protected readonly IUnitOfWork UnitOfWork;

        public IntegrationJob IntegrationJob { get; set; }
        public IJobLogger JobLogger { get; set; }
        protected readonly Lazy<IEmailService> EmailService;
        protected CustomSettings CustomSettings;
        protected readonly IEmailTemplateUtilities EmailTemplateUtilities;
        protected readonly IContentManagerUtilities ContentManagerUtilities;

        public BackOrderRefreshPostProcessor(Insite.Data.Entities.IntegrationJob integrationJob, IUnitOfWorkFactory unitOfWorkFactory, IIntegrationJobSchedulingService integrationJobSchedulingService, Lazy<IEmailService> emailService, IEmailTemplateUtilities emailTemplateUtilities, IContentManagerUtilities contentManagerUtilities, CustomSettings customSettings)
        {
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.IntegrationJobSchedulingService = integrationJobSchedulingService;
            this.EmailService = emailService;
            this.IntegrationJob = integrationJob;
            this.EmailTemplateUtilities = emailTemplateUtilities;
            this.ContentManagerUtilities = contentManagerUtilities;
            this.CustomSettings = customSettings;
        }

        public void Cancel()
        {
            throw new NotImplementedException();
        }
        public void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {

            LogHelper.For((object)this).Info("Post Processor start.");
            try
            {
                if (dataSet.Tables.Count > 0)
                {
                    using (var sqlConnection = new SqlConnection(InsiteDbConnectionString))
                    {
                        sqlConnection.Open();
                        const string createTempTableSql = @"Create table #BackOrderRefreshFilter 
                                                            (WebOrderNumber nvarchar(50),OrderNumber nvarchar(50), OrderGen nvarchar(50),ProductERPNumber nvarchar(50),
                                                            QtyOrdered decimal (18, 5), QtyShipped decimal (18, 5),QtyBO decimal(18, 5))";

                        using (var command = new SqlCommand(createTempTableSql, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                        WriteToServer(sqlConnection, "tempdb..#BackOrderRefreshFilter", dataSet.Tables[0]);

                        const string backOrderCustomerList = @"select distinct OH.CustomerNumber, BORF.WebOrderNumber, BO.OrderLanguage  from
                                                                #BackOrderRefreshFilter as BORF 
                                                                join OrderHistory as OH on OH.WebOrderNumber= BORF.WebOrderNumber
                                                                left join  BackOrders BO on BO.WebOrderNumber = BORF.WebOrderNumber 
                                                                where  BO.CheckedForBO = 0   
                                                                Group by OH.CustomerNumber,BORF.WebOrderNumber, BO.OrderLanguage";

                        SqlDataAdapter da = new SqlDataAdapter(backOrderCustomerList, sqlConnection);
                        da.Fill(dataSet, "CustomerLists");

                        DataTable dt = new DataTable();
                        dt = dataSet.Tables["CustomerLists"];

                        foreach (DataRow dRow in dt.Rows)
                        {
                            string emailBody = string.Empty;
                            EmailList emailList = null;
                            string htmlTemplate = string.Empty;
                            dynamic emailModel = new ExpandoObject();

                            string webOrderNumber = dRow["WebOrderNumber"].ToString();
                            string customerNumber = dRow["CustomerNumber"].ToString();
                            string languageId = dRow["OrderLanguage"].ToString();

                            var customer = this.UnitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(x => x.CustomerNumber == customerNumber);
                            if (!string.IsNullOrEmpty(customer.Email))
                            {
                                var orderHistory = this.UnitOfWork.GetRepository<OrderHistory>().GetTable().FirstOrDefault(x => x.WebOrderNumber == webOrderNumber);
                                var language = this.UnitOfWork.GetRepository<Language>().GetTable().FirstOrDefault(x => x.Id.ToString() == languageId);
                                var salesRep = this.UnitOfWork.GetRepository<Salesperson>().GetTable().FirstOrDefault(x => x.Name == orderHistory.Salesperson);

                                if (language.LanguageCode == "en-us")
                                {
                                    EmailList orCreateByName_USA = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("BackOrderUSA", "Back Orders");
                                    emailList = this.UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName_USA.Id);
                                }
                                else if (language.LanguageCode == "en-CA")
                                {
                                    EmailList orCreateByName_CA = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("BackOrderCA-EN", "Back Orders");
                                    emailList = this.UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName_CA.Id);
                                }
                                else
                                {
                                    EmailList orCreateByName_FR = this.UnitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("BackOrderCA-FR", "Back Orders");
                                    emailList = this.UnitOfWork.GetRepository<EmailList>().GetTable().Expand((EmailList x) => x.EmailTemplate).FirstOrDefault((EmailList x) => x.Id == orCreateByName_FR.Id);
                                }

                                htmlTemplate = GetHtmlTemplate(emailList);

                                this.PopulateDailyOrderEmailModel(emailModel, customer, orderHistory);

                                SendEmailParameter sendEmailParameter = new SendEmailParameter();
                                sendEmailParameter.ToAddresses.Add(customer.Email);
                                sendEmailParameter.Body = this.EmailService.Value.ParseTemplate(htmlTemplate, emailModel);
                                sendEmailParameter.Subject = emailList.Subject;
                                sendEmailParameter.FromAddress = (emailList.FromAddress.IsBlank() ? this.CustomSettings.DefaultEmailAddress : emailList.FromAddress);
                                if (!string.IsNullOrEmpty(salesRep.Email))
                                    sendEmailParameter.CCAddresses.Add(salesRep.Email);

                                this.EmailService.Value.SendEmail(sendEmailParameter, this.UnitOfWork);

                                const string mailSent = @"update BackOrders set CheckedForBO = 1 where WebOrderNumber = @WebOrderNumber";

                                using (var command = new SqlCommand(mailSent, sqlConnection))
                                {
                                    command.Parameters.AddWithValue("@WebOrderNumber", webOrderNumber);
                                    command.CommandTimeout = CommandTimeOut;
                                    command.ExecuteNonQuery();
                                }
                            }

                        }
                        const string updateNonBackOrder = @"update BO set BO.CheckedForBO = 2 from BackOrders as BO  where BO.WebOrderNumber NOT IN ( select WebOrderNumber from #BackOrderRefreshFilter);
                            Drop table #BackOrderRefreshFilter;";

                        using (var command = new SqlCommand(updateNonBackOrder, sqlConnection))
                        {
                            command.CommandTimeout = CommandTimeOut;
                            command.ExecuteNonQuery();
                        }
                    }
                }
            }
            catch (Exception ex)
            {

                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check " + ex.ToString(), this), ex);
                throw;
            }
        }

        private void PopulateDailyOrderEmailModel(dynamic emailModel, Customer customer, OrderHistory orderHistory)
        {
            emailModel.OrderNumber = orderHistory.WebOrderNumber;
            emailModel.CustomerName = customer.FirstName + " " + customer.LastName;
            emailModel.CustomerNumber = customer.CustomerNumber;
            if (customer != null && !string.IsNullOrEmpty(customer.CustomerSequence))
            {
                emailModel.CustomerShipToNumber = customer.CustomerSequence;
            }
            else
            {
                emailModel.CustomerShipToNumber = string.Empty;
            }
            List<ExpandoObject> OrderHistoryLines = new List<ExpandoObject>();
            foreach (var orderline in orderHistory.OrderHistoryLines)
            {
                dynamic values = new ExpandoObject();
                var productDetails = this.UnitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.ErpNumber == orderline.ProductErpNumber);
                if(orderline.QtyShipped < orderline.QtyOrdered)
                {
                    values.ProductName = productDetails.Name;
                    values.ProductDescription = productDetails.ShortDescription;
                    values.Quantity = orderline.QtyOrdered;
                    values.BackorderQuantity = orderline.QtyOrdered - orderline.QtyShipped;
                    OrderHistoryLines.Add(values);
                }
            }
            emailModel.OrderHistoryLines = OrderHistoryLines;
        }

        protected virtual string GetHtmlTemplate(EmailList emailList)
        {
            ContentManager contentManager = this.EmailTemplateUtilities.GetOrCreateByName(emailList.EmailTemplate.Name).ContentManager;
            return this.ContentManagerUtilities.CurrentContent(contentManager).Html;
        }
    }
}
