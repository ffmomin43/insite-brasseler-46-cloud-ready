using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Integration.WebService.Interfaces;
using Insite.Core.Services.Handlers;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Net.Http;
using System.Text;
using System.Web.Script.Serialization;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel;
using Insite.Common.Logging;
using System.Linq;
using Insite.Core.Context;
using Insite.Order.Services.Dtos;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.Services.Handlers.Rma
{
    [DependencyName("RMALabel")]
    public class RMALabel : HandlerBase<AddRmaParameter, AddRmaResult>
    {
        CustomSettings customSettings = new CustomSettings();
        public IJobLogger JobLogger { get; set; }

        public override int Order
        {
            get
            {
                return 750;
            }
        }

        public override AddRmaResult Execute(IUnitOfWork unitOfWork, AddRmaParameter parameter, AddRmaResult result)
        {
            if (result.OrderHistory.CustomerNumber.ElementAt(0) != '1')
            {
                result.OrderHistory.Status = "Return Requested";
                unitOfWork.Save();

                return base.NextHandler.Execute(unitOfWork, parameter, result);
            }

            using (HttpClient client = new HttpClient())
            {
                client.BaseAddress = new Uri(customSettings.UPS_Ship_Url);
                client.DefaultRequestHeaders.Accept.Clear();

                ShipRequestModel rmaModel = PopulateRequestData(customSettings, result, unitOfWork);
                var requestJson = new JavaScriptSerializer().Serialize(rmaModel);
                HttpContent inputContent = new StringContent(requestJson, Encoding.UTF8, "application/json");

                LogHelper.For(this).Info(string.Format("{0}: Ship requestJson: {1}", string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber)? result.OrderHistory.ErpOrderNumber: result.OrderHistory.WebOrderNumber, requestJson));

                HttpResponseMessage response = client.PostAsync(client.BaseAddress.ToString(), inputContent).Result;

                if (response.IsSuccessStatusCode)
                {
                    string responseData = response.Content.ReadAsStringAsync().Result;
                    LogHelper.For(this).Info(string.Format("{0}: Ship responseDate: {1}", string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber) ? result.OrderHistory.ErpOrderNumber : result.OrderHistory.WebOrderNumber, responseData));
                    var rmaResponse = new JavaScriptSerializer().Deserialize<ShipResponseModel>(responseData);


                    if (rmaResponse.ShipmentResponse != null && rmaResponse.ShipmentResponse.Response.ResponseStatus.Description.EqualsIgnoreCase("success"))
                    {
                        RmaResponse rma = new RmaResponse();
                        rma.Id = new Guid();
                        rma.WebOrderNumber = result.OrderHistory.WebOrderNumber;
                        rma.ErpOrderNumber = result.OrderHistory.ErpOrderNumber;
                        rma.TrackingNumber = rmaResponse.ShipmentResponse.ShipmentResults.PackageResults.TrackingNumber;
                        rma.GraphicImage = rmaResponse.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage;
                        rma.HtmlImage = rmaResponse.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.HtmlImage;
                        rma.JsonValue = rmaResponse.ToJson();

                        var returnRquestRepository = unitOfWork.GetRepository<ReturnRequest>();
                        foreach (Insite.Data.Entities.OrderHistoryLine orderHistoryLine in result.OrderHistory.OrderHistoryLines)
                        {
                            RmaLineDto rmaLineDto = parameter.RmaLines.FirstOrDefault<RmaLineDto>((RmaLineDto r) => r.Line.Equals(orderHistoryLine.LineNumber)) ?? new RmaLineDto();
                            if(rmaLineDto.RmaQtyRequested != 0)
                            {
                                ReturnRequest returnRequest = new ReturnRequest();
                                returnRequest.Id = new Guid();
                                returnRequest.WebOrderNumber = result.OrderHistory.WebOrderNumber;
                                returnRequest.ErpOrderNumber = result.OrderHistory.ErpOrderNumber;
                                returnRequest.ProductNumber = orderHistoryLine.ProductErpNumber;
                                returnRequest.QtyToReturn = rmaLineDto.RmaQtyRequested;
                                returnRequest.ReturnReason = rmaLineDto.RmaReasonCode;
                                returnRequest.RmaNotes = parameter.Notes;
                                returnRequest.ReturnDate = DateTime.Now.Date;
                                returnRquestRepository.Insert(returnRequest);
                            }
                        }

                        var rmaRepository = unitOfWork.GetRepository<RmaResponse>();
                        rmaRepository.Insert(rma);
                        result.OrderHistory.Status = "Return Requested";

                        unitOfWork.Save();
                    }
                }
            }
            return base.NextHandler.Execute(unitOfWork, parameter, result);
        }

        public ShipRequestModel PopulateRequestData(CustomSettings customSettings, AddRmaResult result, IUnitOfWork unitOfWork)
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

            // Request Object
            TransactionReference transactionReference = new TransactionReference();
            transactionReference.CustomerContext = result.OrderHistory.ErpOrderNumber;

            Request request = new Request();
            request.RequestOption = "nonvalidate";
            request.TransactionReference = transactionReference;
            // Request Object -END

            // Shipper Object
            Shipper shipper = new Shipper();
            shipper.Name = string.IsNullOrEmpty(result.OrderHistory.STCompanyName) ? result.OrderHistory.BTCompanyName : result.OrderHistory.STCompanyName;
            shipper.ShipperNumber = customSettings.Shipper_ShipperNumber;

            Address shipToAddress = new Address();
            shipToAddress.AddressLine = string.IsNullOrEmpty(result.OrderHistory.STAddress1) ? result.OrderHistory.BTAddress1 : result.OrderHistory.STAddress1;
            shipToAddress.City = string.IsNullOrEmpty(result.OrderHistory.STCity) ? result.OrderHistory.BTCity : result.OrderHistory.STCity;
            shipToAddress.StateProvinceCode = GetStateCode(result.OrderHistory, unitOfWork);
            shipToAddress.PostalCode = string.IsNullOrEmpty(result.OrderHistory.STPostalCode) ? result.OrderHistory.BTPostalCode : result.OrderHistory.STPostalCode;

            var country = result.OrderHistory.CustomerNumber.ElementAt(0) == '1' ? "US": "CA";
            shipToAddress.CountryCode = country;

            shipper.Address = shipToAddress;
            // Shipper Object - END

            // Website address same for both US and CA
            Ship shipTo = new Ship();
            shipTo.Name = "Brasseler USA";
            shipTo.AttentionName = "RETURNS DEPT";

            Phone shipTophone = new Phone();
            shipTophone.Number = "9129258525";

            shipTo.Phone = shipTophone;

            Address websiteAddress = new Address();
            websiteAddress.AddressLine = "1 Brasseler Blvd";
            websiteAddress.City = "Savannah";
            websiteAddress.StateProvinceCode = "GA";
            websiteAddress.PostalCode = "31419";
            websiteAddress.CountryCode = "US";

            shipTo.Address = websiteAddress;
            // Website address same for both US and CA - END

            // Ship From Addresses
            Ship shipFrom = new Ship();
            shipFrom.Name = string.IsNullOrEmpty(result.OrderHistory.STCompanyName) ? result.OrderHistory.BTCompanyName : result.OrderHistory.STCompanyName;

            Phone shipFromphone = new Phone();
            shipFromphone.Number = "9129258525";

            shipFrom.Phone = shipFromphone;

            Address shipFromAddress = new Address();
            shipFromAddress.AddressLine = string.IsNullOrEmpty(result.OrderHistory.STAddress1) ? result.OrderHistory.BTAddress1 : result.OrderHistory.STAddress1;
            shipFromAddress.City = string.IsNullOrEmpty(result.OrderHistory.STCity) ? result.OrderHistory.BTCity : result.OrderHistory.STCity;
            shipFromAddress.StateProvinceCode = GetStateCode(result.OrderHistory, unitOfWork);
            shipFromAddress.PostalCode = string.IsNullOrEmpty(result.OrderHistory.STPostalCode) ? result.OrderHistory.BTPostalCode : result.OrderHistory.STPostalCode;
            shipFromAddress.CountryCode = country;

            shipFrom.Address = shipFromAddress;
            // Ship From Addresses - END

            // Payment Information
            BillShipper billShipper = new BillShipper();
            billShipper.AccountNumber = customSettings.PaymentInformation_ShipmentCharge_AccountNumber;

            ShipmentCharge shipmentCharge = new ShipmentCharge();
            shipmentCharge.Type = "01";
            shipmentCharge.BillShipper = billShipper;

            PaymentInformation paymentInformation = new PaymentInformation();
            paymentInformation.ShipmentCharge = shipmentCharge;
            // Payment Information - END

            //  Service Object
            LabelImageFormat service = new LabelImageFormat();
            service.Code = "03";
            service.Description = "Ground";
            //  Service Object - END

            // Return Service Object
            LabelImageFormat retrunService = new LabelImageFormat();
            retrunService.Code = "9";
            retrunService.Description = "Print Return Label";
            // Return Service Object - END

            // Package Object
            Package package = new Package();

            List<ReferenceNumber> referenceNumber = new List<ReferenceNumber>();

            ReferenceNumber erpReferenceNumber = new ReferenceNumber();
            erpReferenceNumber.Code = "01";
            erpReferenceNumber.Value = "Customer #: " + (string.IsNullOrEmpty(result.OrderHistory.CustomerSequence) ? result.OrderHistory.CustomerNumber : result.OrderHistory.CustomerSequence);
            referenceNumber.Add(erpReferenceNumber);

            ReferenceNumber invoiceRefNumber = new ReferenceNumber();
            invoiceRefNumber.Code = "02";
            invoiceRefNumber.Value = "Invoice #: " + GetInvoiceNumber(result.OrderHistory.ErpOrderNumber, unitOfWork);
            referenceNumber.Add(invoiceRefNumber);

            LabelImageFormat packaging = new LabelImageFormat();
            packaging.Code = "02";
            packaging.Description = "Description";

            LabelImageFormat unitOfMeasurement = new LabelImageFormat();
            unitOfMeasurement.Code = "LBS";
            unitOfMeasurement.Description = "Pounds";

            PackageWeight packageWeight = new PackageWeight();
            packageWeight.UnitOfMeasurement = unitOfMeasurement;
            packageWeight.Weight = "1";

            package.ReferenceNumber = referenceNumber;
            package.Description = "Dental instruments/equipment";
            package.Packaging = packaging;
            package.PackageWeight = packageWeight;
            // Package Object - END

            // Shipment Object
            Shipment shipment = new Shipment();
            shipment.Description = "Return Label";
            shipment.Shipper = shipper;
            shipment.ShipTo = shipTo;
            shipment.ShipFrom = shipFrom;
            shipment.PaymentInformation = paymentInformation;
            shipment.Service = service;
            shipment.ReturnService = retrunService;
            shipment.Package = package;
            // Shipment Object - END

            //  Label Specification
            LabelImageFormat labelImageFormat = new LabelImageFormat();
            labelImageFormat.Code = "GIF";
            labelImageFormat.Description = "GIF";

            LabelSpecification labelSpecification = new LabelSpecification();
            labelSpecification.LabelImageFormat = labelImageFormat;
            labelSpecification.HttpUserAgent = "Mozilla/4.5";
            //  Label Specification - END

            // Shipment Request
            ShipmentRequest shipmentRequest = new ShipmentRequest();
            shipmentRequest.Request = request;
            shipmentRequest.Shipment = shipment;
            shipmentRequest.LabelSpecification = labelSpecification;
            // Shipment Request - END

            //  RMA Model
            ShipRequestModel shipRequestModel = new ShipRequestModel();
            shipRequestModel.UPSSecurity = UPSSecurity;
            shipRequestModel.ShipmentRequest = shipmentRequest;
            //  RMA Model - END
            return shipRequestModel;
        }

        private string GetInvoiceNumber(string erpOrderNumber, IUnitOfWork unitOfWork)
        {
            if (!string.IsNullOrEmpty(erpOrderNumber))
            {
                var erpNumber = erpOrderNumber.Split('-')[0];
                var invoiceQuery = (from ih in unitOfWork.GetRepository<Insite.Data.Entities.InvoiceHistory>().GetTable()
                                    join ihl in unitOfWork.GetRepository<Insite.Data.Entities.InvoiceHistoryLine>().GetTable()
                                    on ih.Id equals ihl.InvoiceHistoryId
                                    where ihl.ErpOrderNumber == erpNumber
                                    select ih.InvoiceNumber);
                if (!string.IsNullOrEmpty(invoiceQuery.FirstOrDefault()))
                {
                    return invoiceQuery.FirstOrDefault().Split('-')[0].ToString();
                }
            }
            return "N/A";
        }
        private string GetStateCode(Insite.Data.Entities.OrderHistory order, IUnitOfWork unitOfWork)
        {
            if (string.IsNullOrEmpty(order.STState))
            {
                if (order.BTState.Length <= 2)
                {
                    return order.BTState;
                }
                else
                {
                    var state = unitOfWork.GetRepository<Insite.Data.Entities.State>().GetTable().FirstOrDefault(x => x.Name == order.BTState);
                    return state.Abbreviation;
                }
            }
            else
            {
                if (order.STState.Length <= 2)
                {
                    return order.STState;
                }
                else
                {
                    var state = unitOfWork.GetRepository<Insite.Data.Entities.State>().GetTable().FirstOrDefault(x => x.Name == order.STState);
                    return state.Abbreviation;
                }
            }
        }
    }
}
