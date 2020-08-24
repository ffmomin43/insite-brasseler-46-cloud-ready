using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using Insite.Common.Dependencies;
using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace InSiteCommerce.Brasseler.Integration
{
    public class IntegrationBase
    {
        protected readonly Lazy<CustomSettings> customSettings;

        public IntegrationBase()
        {
            customSettings = new Lazy<CustomSettings>();
        }

        public string InsiteDbConnectionString
        {
            get { return ConfigurationManager.ConnectionStrings["Insite.Commerce"].ConnectionString; }
        }

        private int _commandTimeout;
        protected virtual int CommandTimeOut
        {
            get
            {
                bool isSuccess = int.TryParse(GetApplicationSettingValue("DBCommandTimeOutValue"), out _commandTimeout);
                if (!isSuccess)
                {
                    _commandTimeout = 1200;
                    LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", _commandTimeout));
                }

                return _commandTimeout;
            }
        }

        private int _sQlbulkcopytimeout;
        protected virtual int SqlBulkCopyTimeout
        {
            get
            {
                bool isSuccess = int.TryParse("90", out _sQlbulkcopytimeout);
                if (!isSuccess)
                {
                    _sQlbulkcopytimeout = 90;
                    LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", _sQlbulkcopytimeout));
                    //.Error("SRSDistribution: IntegrationBase", string.Format("SRSDistribution: {0} is INVALID in Insite Management Console. Please Check", Constants.SQLBULKCOPYTIMEOUTKEY));
                }

                return _sQlbulkcopytimeout;
            }
        }

        protected void WriteToServer(SqlConnection sqlConnection, string destinationTable, DataTable dataTable)
        {
            new SqlBulkCopy(sqlConnection)
            {
                BulkCopyTimeout = SqlBulkCopyTimeout,
                DestinationTableName = destinationTable,

            }.WriteToServer(dataTable);
        }
        protected string GetApplicationSettingValue(string key)
        {
            string settingValue = string.Empty;

            try
            {
                var unitOfWork = DependencyLocator.Current.GetInstance<IUnitOfWorkFactory>().GetUnitOfWork();
                //settingValue = unitOfWork.GetTypedRepository<IApplicationSettingRepository>().GetOrCreateByName(key,"1200","SQL Timeout value for integration jobs");
                settingValue = Convert.ToString(customSettings.Value.DBCommandTimeOutValue);
                if (string.IsNullOrEmpty(settingValue))
                {
                    LogHelper.For((object)this).Info(string.Format("DBCommandTimeOutValue is Null"));
                    throw new Exception(string.Format("BRASSELER: IntegrationBase - {0} is INVALID in Insite Management Console. Please Check", key));
                }
            }
            catch (Exception ex)
            {

                LogHelper.For((object)this).Info(string.Format("Brasseler: {0} is INVALID in Insite Management Console. Please Check", this), ex);
                throw;
            }
            return settingValue;
        }
    }
}
