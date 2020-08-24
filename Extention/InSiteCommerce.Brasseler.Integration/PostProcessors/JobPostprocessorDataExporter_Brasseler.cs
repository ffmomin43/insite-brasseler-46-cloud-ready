using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Providers;
using Insite.Data.Entities;
using Insite.Integration.WebService.Extensions;
using Insite.Integration.WebService.Interfaces;
using Insite.Integration.WebService.PlugIns.Postprocessor.DataImportExport.Shared.Interfaces;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;

namespace Insite.Integration.WebService.PlugIns.Postprocessor.DataImportExport.DataExporter
{
    [DependencyName("DataExporter")]
    public class JobPostprocessorDataExporter_Brasseler : IJobPostprocessor, IDependency
    {
        protected readonly IDataExporterFactory DataExporterFactory;

        protected readonly IDataService DataService;

        protected readonly IDataSetStorage DataSetStorage;

        protected readonly IEntityDefinitionHelper EntityDefinitionHelper;

        protected readonly ISpreadsheetService SpreadsheetService;

        protected IUnitOfWork UnitOfWork;

        public IntegrationJob IntegrationJob
        {
            get;
            set;
        }

        public IJobLogger JobLogger
        {
            get;
            set;
        }

        public JobPostprocessorDataExporter_Brasseler(IUnitOfWorkFactory unitOfWorkFactory, IEntityDefinitionHelper entityDefinitionHelper, IDataSetStorage dataSetStorage, ISpreadsheetService spreadsheetService, IDataService dataService, IDataExporterFactory dataExporterFactory)
        {
            this.DataService = dataService;
            this.UnitOfWork = unitOfWorkFactory.GetUnitOfWork();
            this.EntityDefinitionHelper = entityDefinitionHelper;
            this.SpreadsheetService = spreadsheetService;
            this.DataSetStorage = dataSetStorage;
            this.DataExporterFactory = dataExporterFactory;
        }

        protected virtual void AddAuditRecord(string entityName)
        {
            string objectLabel = this.GetEntityNamePluralizedLabel(entityName);
            AuditLogProvider.Current.Log(this.IntegrationJob.CreatedBy, "Export", string.Format("Exporting {0} {1} - Job #{2}", this.IntegrationJob.RecordCount, objectLabel, this.IntegrationJob.JobNumber), "");
            this.UnitOfWork.Save();
        }

        public virtual void Cancel()
        {
        }

        protected virtual void CompleteIntegrationJob()
        {
            this.UnitOfWork.Save();
        }

        public virtual void Execute(DataSet dataSet, CancellationToken cancellationToken)
        {
            this.IntegrationJob = this.UnitOfWork.GetRepository<IntegrationJob>().Get(this.IntegrationJob.Id);
            this.DataService.UserNameToRunAs = this.IntegrationJob.CreatedBy;
            this.DataService.BaseUri = this.IntegrationJob.SiteUrl;
            this.DataService.UserLocalDateTimeOffset = int.Parse(this.GetParameter(this.IntegrationJob, "LocalTimeOffset"));
            this.SpreadsheetService.Create(this.IntegrationJob.ExportObject);
            this.JobLogger.Info(string.Concat("Export Object: ", this.GetEntityNameLabel(this.IntegrationJob.ExportObject)));
            this.JobLogger.Info(string.Concat("Export Columns: ", this.IntegrationJob.ExportColumnList));
            this.JobLogger.Debug(string.Concat("Export Query: ", this.IntegrationJob.ExportQuery));
            List<string> columns = (
                from o in this.IntegrationJob.ExportColumnList.Split(new char[] { ',' })
                select o.Trim()).ToList<string>();
            this.FilterColumns(this.IntegrationJob.ExportObject, columns);
            IDataExporter exportService = this.DataExporterFactory.GetDataExporter(this.IntegrationJob.ExportObject, this.DataService);
            int recordCount = 0;
            try
            {
                recordCount = exportService.GetRecordCount(this.IntegrationJob.ExportObject, this.IntegrationJob.ExportQuery, columns);
            }
            catch (DataException dataException)
            {
                this.JobLogger.Error(dataException.Message);
                return;
            }
            this.UpdateIntegrationJob(this.IntegrationJob.ExportObject);
            this.UpdateIntegrationJobWithRecordCount(recordCount);
            this.AddAuditRecord(this.IntegrationJob.ExportObject);
            int rowNumber = 0;
            try
            {
                IEnumerable<List<List<KeyValuePair<string, string>>>> data = exportService.GetData(this.IntegrationJob.ExportObject, this.IntegrationJob.ExportQuery, columns);
                IEnumerable<string> keys = this.EntityDefinitionHelper.GetNaturalKeys((
                    from o in this.IntegrationJob.ExportObject.Split(new char[] { '.' })
                    select o.Trim()).ToList<string>()[0]);
                IEnumerable<string> keyLabels = this.EntityDefinitionHelper.GetNaturalKeyLabels((
                    from o in this.IntegrationJob.ExportObject.Split(new char[] { '.' })
                    select o.Trim()).ToList<string>()[0]);
                string[] columnHeaders = this.GetColumnHeaders(this.IntegrationJob.ExportObject, columns, keys).ToArray<string>();
                this.SpreadsheetService.WriteHeader(columnHeaders, keyLabels);
                foreach (List<List<KeyValuePair<string, string>>> dataPage in data)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    int dataPageCount = dataPage.Count - rowNumber;
                    this.UpdateRecordExportedCount(dataPage.Count);
                    IEnumerable<List<KeyValuePair<string, string>>> sortedData = this.SortData(dataPage.GetRange(rowNumber, dataPageCount), columnHeaders);
                    List<KeyValuePair<string, string>>[] array = sortedData as List<KeyValuePair<string, string>>[] ?? sortedData.ToArray<List<KeyValuePair<string, string>>>();
                    this.SpreadsheetService.WriteRowsToSpreadsheet(array, rowNumber, dataPageCount);
                    rowNumber = rowNumber + dataPageCount;
                }
            }
            catch (TaskCanceledException taskCanceledException)
            {
                return;
            }
            catch (DataException dataException1)
            {
                this.JobLogger.Error(dataException1.Message);
                return;
            }
            this.UpdateIntegrationJobWithRecordCount(rowNumber);
            this.SpreadsheetService.SaveSpreadsheet(this.IntegrationJob.DatasetFileLocation);
            this.CompleteIntegrationJob();
        }

        private void FilterColumns(string exportObject, List<string> columns)
        {
            List<string> exportObjects = (
                from o in exportObject.Split(new char[] { '.' })
                select o.Trim()).ToList<string>();
            string[] array = columns.ToArray();
            for (int i = 0; i < (int)array.Length; i++)
            {
                string column = array[i];
                Type propertyType = this.EntityDefinitionHelper.GetPropertyType(exportObjects[0], column);
                if ((propertyType == typeof(Guid) || propertyType == typeof(Guid?)) && column != "parentId")
                {
                    columns.Remove(column);
                }
            }
            columns.Add("id");
            if (!columns.Contains("modifiedOn"))
            {
                columns.Add("modifiedOn");
            }
        }

        protected virtual IEnumerable<string> GetColumnHeaders(string exportObject, IEnumerable<string> columns, IEnumerable<string> keys)
        {
            List<string> headers = new List<string>();
            List<string> list = (
                from o in exportObject.Split(new char[] { '.' })
                select o.Trim()).ToList<string>();
            IEnumerable<string> sortedColumns = this.SortColumns(columns, keys);
            if (list.Count > 1)
            {
                string propertyTypeName = this.EntityDefinitionHelper.GetPropertyTypeName(list[0], list[1]);
                headers.AddRange(
                    from o in sortedColumns
                    where !o.EqualsIgnoreCase("ContentManager")
                    select o into column
                    select this.EntityDefinitionHelper.GetPropertyLabel(propertyTypeName, column));
                if (sortedColumns.Contains<string>("ContentManager"))
                {
                    headers.Add("CurrentDefaultContent");
                }
                IEnumerable<string> naturalKeysOfParentEntity = this.EntityDefinitionHelper.GetNaturalKeys(list[0]);
                if (naturalKeysOfParentEntity.Count<string>() <= 1)
                {
                    headers.Add(this.EntityDefinitionHelper.GetEntityLabel(list[0]));
                }
                else
                {
                    headers.AddRange(
                        from naturalKey in naturalKeysOfParentEntity
                        select EntityDefinitionHelper.GetPropertyWithEntityLabel(exportObjects[0], naturalKey));
                }
                return headers;
            }
            foreach (string str in sortedColumns)
            {
                if (str.EqualsIgnoreCase("ContentManager"))
                {
                    headers.Add("CurrentDefaultContent");
                }
                else if (this.EntityDefinitionHelper.IsPropertyComplexObject(list[0], str))
                {
                    IEnumerable<string> naturalKeys = this.EntityDefinitionHelper.GetNaturalKeysOfProperty(list[0], str);
                    if (naturalKeys.Count<string>() <= 1)
                    {
                        headers.Add(this.EntityDefinitionHelper.GetPropertyLabel(list[0], str));
                    }
                    else
                    {
                        headers.AddRange(
                            from o in naturalKeys
                            select this.EntityDefinitionHelper.GetPropertyWithParentEntityLabel(list[0], str, o));
                    }
                }
                else if (this.EntityDefinitionHelper.EntityHasProperty(list[0], str))
                {
                    headers.Add(this.EntityDefinitionHelper.GetPropertyLabel(list[0], str));
                }
                else if (!str.EqualsIgnoreCase("originalText"))
                {
                    headers.Add(str);
                }
                else
                {
                    headers.Add("Original Text");
                }
            }
            return headers;
        }

        protected virtual string GetEntityNameLabel(string entityName)
        {
            List<string> entityNames = (
                from o in entityName.Split(new char[] { '.' })
                select o.Trim()).ToList<string>();
            if (entityNames.Count == 1)
            {
                return this.EntityDefinitionHelper.GetEntityLabel(entityNames[0]);
            }
            return this.EntityDefinitionHelper.GetPropertyLabel(entityNames[0], entityNames[1]);
        }

        protected virtual string GetEntityNamePluralizedLabel(string entityName)
        {
            List<string> entityNames = (
                from o in entityName.Split(new char[] { '.' })
                select o.Trim()).ToList<string>();
            if (entityNames.Count == 1)
            {
                return this.EntityDefinitionHelper.GetEntityPluralizedLabel(entityNames[0]);
            }
            return this.EntityDefinitionHelper.GetPropertyLabel(entityNames[0], entityNames[1]);
        }

        protected virtual IEnumerable<string> SortColumns(IEnumerable<string> columns, IEnumerable<string> keys)
        {
            List<string> strs = new List<string>();
            strs.AddRange(
                from o in columns
                where !o.EqualsIgnoreCase("Id")
                where !o.EqualsIgnoreCase("modifiedOn")
                select o);
            strs.Add("modifiedOn");
            strs.Add("id");
            return strs;
        }

        protected virtual IEnumerable<List<KeyValuePair<string, string>>> SortData(IEnumerable<List<KeyValuePair<string, string>>> data, IEnumerable<string> columns)
        {
            List<List<KeyValuePair<string, string>>> sortedData = new List<List<KeyValuePair<string, string>>>();
            foreach (List<KeyValuePair<string, string>> dataRow in data)
            {
                List<KeyValuePair<string, string>> row = new List<KeyValuePair<string, string>>();
                foreach (string column in columns)
                {
                    row.AddRange(
                        from o in dataRow
                        where o.Key.EqualsIgnoreCase(column)
                        select o);
                }
                sortedData.Add(row);
            }
            return sortedData;
        }

        protected virtual void UpdateIntegrationJob(string exportObject)
        {
            string objectLabel = this.GetEntityNamePluralizedLabel(exportObject);
            this.IntegrationJob.Notes = string.Concat("Exporting ", objectLabel);
            this.IntegrationJob.DatasetFileLocation = string.Format("Export_{0}_{1}_{2}.xlsx", objectLabel, this.IntegrationJob.JobNumber, Guid.NewGuid());
            this.IntegrationJob.IsActive = true;
            this.UnitOfWork.Save();
        }

        protected virtual void UpdateIntegrationJobWithRecordCount(int recordCount)
        {
            this.IntegrationJob.RecordCount = recordCount;
            this.UnitOfWork.Save();
        }

        protected virtual void UpdateRecordExportedCount(int count)
        {
            this.JobLogger.Debug(string.Format("{0} records written to file.", count));
            this.IntegrationJob.RecordsAdded = count;
            this.UnitOfWork.Save();
        }
    }
}