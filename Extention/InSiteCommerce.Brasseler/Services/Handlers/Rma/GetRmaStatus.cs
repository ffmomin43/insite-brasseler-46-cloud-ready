using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Integration.WebService.Interfaces;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryRequestModel;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Web.Script.Serialization;

namespace InSiteCommerce.Brasseler.Services.Handlers.Rma
{
    [DependencyName("GetRmaStatus")]
    public class GetRmaStatus : HandlerBase<GetOrderParameter, GetOrderResult>
    {
        CustomSettings customSettings = new CustomSettings();
        public IJobLogger JobLogger { get; set; }

        public override int Order
        {
            get
            {
                return 1500;
            }
        }

        public override GetOrderResult Execute(IUnitOfWork unitOfWork, GetOrderParameter parameter, GetOrderResult result)
        {
            if (!string.IsNullOrEmpty(parameter.OrderNumber))
            {
                if (result.OrderHistory.Status.EqualsIgnoreCase("Return Requested"))
                {
                    var trackingNumber = "";
                    RmaResponse rmaProperties = unitOfWork.GetRepository<RmaResponse>().GetTable().Where(x => x.WebOrderNumber == parameter.OrderNumber || x.ErpOrderNumber == parameter.OrderNumber).OrderByDescending<RmaResponse, DateTimeOffset>((Func<RmaResponse, DateTimeOffset>)(desc => desc.ModifiedOn)).FirstOrDefault();
                    if (rmaProperties != null)
                    {
                        trackingNumber = rmaProperties.TrackingNumber;
                    }
                    using (HttpClient client = new HttpClient())
                    {
                        if (!string.IsNullOrEmpty(trackingNumber))
                        {
                            LabelRecoveryRequestModel labelRecoveryModel = PopulateRequestData(customSettings, trackingNumber);
                            var requestJson = new JavaScriptSerializer().Serialize(labelRecoveryModel);

                            LogHelper.For(this).Info(string.Format("{0}: LabelRecovery requestJson: {1}", string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber) ? result.OrderHistory.ErpOrderNumber : result.OrderHistory.WebOrderNumber, requestJson));

                            client.BaseAddress = new Uri(customSettings.UPS_LabelRecovery_Url);
                            client.DefaultRequestHeaders.Accept.Clear();
                            HttpContent inputContent = new StringContent(requestJson, Encoding.UTF8, "application/json");

                            HttpResponseMessage response = client.PostAsync(client.BaseAddress.ToString(), inputContent).Result;

                            if (response.IsSuccessStatusCode)
                            {
                                string responseData = response.Content.ReadAsStringAsync().Result;
                                LogHelper.For(this).Info(string.Format("{0}: LabelRecovery responseData: {1}", string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber) ? result.OrderHistory.ErpOrderNumber : result.OrderHistory.WebOrderNumber, responseData));
                                
                                LabelRecoveryResponseModel labelRecoveryResponseModel = new JavaScriptSerializer().Deserialize<LabelRecoveryResponseModel>(responseData);

                                if (labelRecoveryResponseModel.LabelRecoveryResponse != null && labelRecoveryResponseModel.LabelRecoveryResponse.Response.ResponseStatus.Description.EqualsIgnoreCase("success"))
                                {
                                    foreach (var orderHistoryLine in result.GetOrderLineResults)
                                    {
                                        if (orderHistoryLine.ProductDto != null)
                                        {
                                            ReturnRequest returnRequest = unitOfWork.GetRepository<ReturnRequest>().GetTable().Where(x => (x.WebOrderNumber == parameter.OrderNumber || x.ErpOrderNumber == parameter.OrderNumber) && x.ProductNumber == orderHistoryLine.ProductDto.ERPNumber).OrderByDescending<ReturnRequest, DateTimeOffset>((Func<ReturnRequest, DateTimeOffset>)(desc => desc.ModifiedOn)).FirstOrDefault();
                                            if (returnRequest != null)
                                            {
                                                orderHistoryLine.Properties.Add("ReturnRequest", JsonConvert.SerializeObject(returnRequest));
                                            }
                                        }
                                    }

                                    result.Properties.Add("rmaStatusGraphicImage", labelRecoveryResponseModel.LabelRecoveryResponse.LabelResults.LabelImage.GraphicImage);
                                    result.Properties.Add("rmaStatusHtmlImage", labelRecoveryResponseModel.LabelRecoveryResponse.LabelResults.LabelImage.HtmlImage);
                                }
                            }
                        }
                    }
                }
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        public LabelRecoveryRequestModel PopulateRequestData(CustomSettings customSettings, string trackingNumber)
        {
            // UPS Security
            UsernameToken usernameToken = new UsernameToken();
            usernameToken.Username = customSettings.UPSSecurity_UserToken_Username;
            usernameToken.Password = customSettings.UPSSecurity_UserToken_Password;

            ServiceAccessToken serviceAccessToken = new ServiceAccessToken();
            serviceAccessToken.AccessLicenseNumber = customSettings.UPSSecurity_ServiceAccessToken_AccessLicenseNumber;

            UPSSecurity UPSSecurity = new UPSSecurity();
            UPSSecurity.UsernameToken = usernameToken;
            UPSSecurity.ServiceAccessToken = serviceAccessToken;
            // UPS Security -END

            //  Label Specification
            LabelImageFormat labelImageFormat = new LabelImageFormat();
            labelImageFormat.Code = "GIF";

            LabelSpecification labelSpecification = new LabelSpecification();
            labelSpecification.LabelImageFormat = labelImageFormat;
            labelSpecification.HttpUserAgent = "Mozilla/4.5";
            //  Label Specification - END

            Translate translate = new Translate();
            translate.LanguageCode = "eng";
            translate.DialectCode = "US";
            translate.Code = "01";

            LabelRecoveryRequest labelRecoveryRequest = new LabelRecoveryRequest();
            labelRecoveryRequest.LabelSpecification = labelSpecification;
            labelRecoveryRequest.Translate = translate;
            labelRecoveryRequest.TrackingNumber = trackingNumber;
            // the below tracking number is allowed on the UPS test environment. 
            //labelRecoveryRequest.TrackingNumber = "1Z12345E8791315413";

            LabelRecoveryRequestModel labelRecoveryModel = new LabelRecoveryRequestModel();
            labelRecoveryModel.UPSSecurity = UPSSecurity;
            labelRecoveryModel.LabelRecoveryRequest = labelRecoveryRequest;

            return labelRecoveryModel;
        }
    }
}
