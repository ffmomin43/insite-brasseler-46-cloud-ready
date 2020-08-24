using Insite.Common.Logging;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Interfaces.Plugins.PunchOut;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using Insite.Data.Extensions;
using Insite.Punchout.Enums;
using Insite.Punchout.HttpHandlers.Interfaces;
using Insite.PunchOut.HttpHandlers;
using Insite.PunchOut.HttpHandlers.Interfaces;
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Web;

namespace InSiteCommerce.Brasseler.Punchout
{
    //public class PunchOutOrderRequestServiceBrasseler: PunchOutOrderRequestService
    //{

    //    public PunchOutOrderRequestServiceBrasseler(IUnitOfWorkFactory unitOfWorkFactory, IPunchOutOrderRequestParser punchOutOrderRequestParser, IPunchOutProviderMessageFactory punchOutProviderMessageFactory, IPunchOutRequestValidator requestValidator, IArgumentContract argumentContract, IPunchOutOrderRequestMessageFormatValidator orderRequestMessageValidator, IPunchOutCustomerOrderProcessor customerOrderSubmitter, IPunchOutRequestObfuscator punchOutRequestObfuscator, IPunchOutOrderRequestUtilities punchOutOrderRequestUtilities, IPunchOutOrderRequestMessageLogger punchOutOrderRequestMessageLogger, PunchoutSettings punchoutSettings, IEmailService emailService) : base(unitOfWorkFactory,punchOutOrderRequestParser, punchOutProviderMessageFactory, requestValidator,argumentContract, orderRequestMessageValidator, customerOrderSubmitter, punchOutRequestObfuscator, punchOutOrderRequestUtilities, punchOutOrderRequestMessageLogger, punchoutSettings, emailService) {}

    //    public override string HandlePunchOutOrderMessage(string xmlRequest, string ipAddress, string currentDomain)
    //    {
    //        IRepository<PunchOutOrderRequest> repository = this.UnitOfWork.GetRepository<PunchOutOrderRequest>();
    //        PunchOutOrderRequest punchOutOrderRequest1 = new PunchOutOrderRequest()
    //        {
    //            RequestUrl = HttpContext.Current.Request.Url.AbsoluteUri
    //        };
    //        repository.Insert(punchOutOrderRequest1);
    //        this.UnitOfWork.Save();
    //        try
    //        {
    //            this.UnitOfWork.BeginTransaction();
    //            if (!this.OrderRequestMessageValidator.IsValidRequest(xmlRequest))
    //                throw new ArgumentException("The PunchOutOrder Request is not in a known format");
    //            punchOutOrderRequest1 = this.PunchOutOrderRequestParser.CreatePunchOutOrderMessageFromXml(punchOutOrderRequest1, xmlRequest, currentDomain);
    //            this.UnitOfWork.Save();
    //            this.UnitOfWork.CommitTransaction();
    //            this.UnitOfWork.Clear(true);
    //            string secretWord = punchOutOrderRequest1.SecretWord;
    //            punchOutOrderRequest1 = this.UnitOfWork.GetRepository<PunchOutOrderRequest>().Get(punchOutOrderRequest1.Id);
    //            punchOutOrderRequest1.SecretWord = secretWord;
    //            this.UnitOfWork.BeginTransaction();
    //            PunchOutValidationResult validationResult = this.RequestValidator.ValidateRequest((IPunchOutValidatable)punchOutOrderRequest1);
    //            Tuple<string, string> tuple = validationResult.IsValid ? new Tuple<string, string>(this.ResultCode(PunchOutMessageResultCode.Success), "OK") : new Tuple<string, string>(this.ResultCode(PunchOutMessageResultCode.Error), validationResult.Message);
    //            if (!validationResult.IsValid)
    //                throw new ArgumentException(validationResult.Message);
    //            punchOutOrderRequest1.UserProfile = validationResult.UserProfile;
    //            punchOutOrderRequest1.UserProfileId = new Guid?(validationResult.UserProfile.Id);
    //            this.UnitOfWork.Save();
    //            string auxilliartPartId = this.PunchOutOrderRequestUtilities.GetSupplierAuxilliartPartId(punchOutOrderRequest1);
                
    //            PunchOutSession punchOutSession;
    //            if (string.IsNullOrEmpty(auxilliartPartId))
    //                punchOutSession = (PunchOutSession)null;
    //            else
    //            {
    //                Guid puchOutSessionId = new Guid(auxilliartPartId);
    //                punchOutSession = this.UnitOfWork.GetRepository<PunchOutSession>().GetTable().Expand<PunchOutSession, CustomerOrder>((Expression<Func<PunchOutSession, CustomerOrder>>)(p => p.CustomerOrder)).First<PunchOutSession>((Expression<Func<PunchOutSession, bool>>)(p => p.Id == puchOutSessionId));
    //            }
    //            this.CustomerOrderSubmitter.ProcessPunchOutOrder(punchOutSession, punchOutOrderRequest1);
    //            string orderRequestResponse = this.PunchOutProviderMessageFactory.CreateOrderRequestResponse(tuple.Item1, tuple.Item2, currentDomain);
    //            punchOutOrderRequest1.OrderResponse = orderRequestResponse;
    //            this.UnitOfWork.Save();
    //            this.UnitOfWork.CommitTransaction();
    //            this.UnitOfWork.Clear(true);
    //            punchOutOrderRequest1 = this.UnitOfWork.GetRepository<PunchOutOrderRequest>().Get(punchOutOrderRequest1.Id);
    //            punchOutOrderRequest1.Status = this.RetrievePunchOutOrderRequestStatus(punchOutOrderRequest1).ToString();
    //            this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest1, PunchOutOrderRequestMessageType.Info, string.Format("Successfully processed order request. Web Order Number: {0}", (object)punchOutOrderRequest1.CustomerOrder.OrderNumber));
    //            this.UnitOfWork.Save();
    //            return orderRequestResponse;
    //        }
    //        catch (Exception ex)
    //        {
    //            this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest1, PunchOutOrderRequestMessageType.Fatal, "  OrderID :   " + punchOutOrderRequest1.OrderId + " failed for " + ex.StackTrace.ToString() + ex.Message);
    //            this.UnitOfWork.RollbackTransaction();
    //            this.UnitOfWork.Clear(true);
    //            this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest1, PunchOutOrderRequestMessageType.Fatal, ex.Message);
    //            string orderRequestResponse = this.PunchOutProviderMessageFactory.CreateOrderRequestResponse(this.ResultCode(PunchOutMessageResultCode.Error), ex.Message, currentDomain);
    //            PunchOutOrderRequest punchOutOrderRequest2 = repository.Get(punchOutOrderRequest1.Id);
    //            punchOutOrderRequest2.PunchOutOrderRequestCXml = this.PunchOutRequestObfuscator.Obfuscate(xmlRequest);
    //            punchOutOrderRequest2.OrderResponse = orderRequestResponse;
    //            this.UnitOfWork.Save();
    //            this.UnitOfWork.Clear(true);
    //            PunchOutOrderRequest punchOutOrderRequest3 = this.UnitOfWork.GetRepository<PunchOutOrderRequest>().Get(punchOutOrderRequest2.Id);
    //            punchOutOrderRequest3.Status = this.RetrievePunchOutOrderRequestStatus(punchOutOrderRequest3).ToString();
    //            this.SendPunchOutFailedOrderEmail(punchOutOrderRequest3);
    //            this.UnitOfWork.Save();
    //            return orderRequestResponse;
    //        }
    //    }
    //}
}
