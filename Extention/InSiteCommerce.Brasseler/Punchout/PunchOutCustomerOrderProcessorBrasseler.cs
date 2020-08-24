using Insite.Cart.Services;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Results;
using Insite.Common.Logging;
using Insite.Core.Context;
using Insite.Core.Context.Services;
using Insite.Core.Interfaces.Data;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Services;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Punchout
{
   //public class PunchOutCustomerOrderProcessorBrasseler : PunchOutCustomerOrderProcessor
   // {
   //     public PunchOutCustomerOrderProcessorBrasseler(IArgumentContract argumentContract,
   //   IUnitOfWorkFactory unitOfWorkFactory,
   //   IPunchOutCustomerOrderFactory customerOrderFactory,
   //   IPunchOutProductFinder punchOutProductFinder,
   //   IPunchOutOrderRequestDataValidator punchOutOrderRequestDataValidator,
   //   IPunchOutCurrencyResolver currencyResolver,
   //   ICartService cartService,
   //   ICustomerOrderUtilities customerOrderUtilities,
   //   ICartPipeline cartPipeline,
   //   IOrderLineUtilities orderLineUtilities,
   //   IWarehouseService warehouseService,
   //   IPunchOutOrderRequestMessageLogger punchOutOrderRequestMessageLogger,
   //   PunchoutSettings punchoutSettings,
   //   IPricingPipeline pricingPipeline,
   //   CartSettings cartSettings) : base(argumentContract, unitOfWorkFactory, customerOrderFactory, punchOutProductFinder, punchOutOrderRequestDataValidator, currencyResolver, cartService, customerOrderUtilities, cartPipeline, orderLineUtilities, warehouseService,punchOutOrderRequestMessageLogger, punchoutSettings, pricingPipeline, cartSettings)
   //     {

   //     }


   //     public override void ProcessPunchOutOrder(
   //  PunchOutSession punchOutSession,
   //  PunchOutOrderRequest punchOutOrderRequest)
   //     {
   //         CustomerOrder customerOrder = this.PreProcessExistingPunchOutSessionOrder(punchOutSession, punchOutOrderRequest) ?? this.CustomerOrderFactory.CreateCustomerOrder((IWebsite)SiteContext.Current.WebsiteDto, punchOutOrderRequest);
   //         customerOrder.Status = "PunchOutOrderRequest";
   //         if (punchOutOrderRequest.PunchOutOrderRequestItemOuts == null || !punchOutOrderRequest.PunchOutOrderRequestItemOuts.Any<PunchOutOrderRequestItemOut>())
   //             punchOutOrderRequest.PunchOutOrderRequestItemOuts = (ICollection<PunchOutOrderRequestItemOut>)this.UnitOfWork.GetRepository<PunchOutOrderRequestItemOut>().GetTable().Where<PunchOutOrderRequestItemOut>((Expression<Func<PunchOutOrderRequestItemOut, bool>>)(p => p.PunchOutOrderRequestId == punchOutOrderRequest.Id)).ToList<PunchOutOrderRequestItemOut>();
   //         this.ProcessCustomer(customerOrder, punchOutOrderRequest);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing customer.");
   //         this.SetContactInformation(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing contact information.");
   //         this.SetCurrency(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing currency.");
   //         this.SetPo(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing po number.");
   //         this.SetShipPartial(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing ship partial.");
   //         this.SetOrderDate(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing order date.");
   //         this.SetRequestedShipDate(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing ship date.");
   //         this.SetShipVia(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing ship via.");
   //         this.SetOrderNotes(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing order notes.");
   //         this.SetCustomFields(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing custom fields.");
   //         this.ProcessOrderLines(customerOrder, punchOutOrderRequest);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished processing order lines.");
   //         this.CalculateShippingAndTaxes(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestDataValidator.Validate(punchOutOrderRequest, customerOrder);
   //         this.PunchOutOrderRequestMessageLogger.AddPunchOutOrderRequestMessage(punchOutOrderRequest, PunchOutOrderRequestMessageType.Info, "Finished order header validation.");
   //         this.UnitOfWork.Save();
   //         UserProfile userProfile = customerOrder.PlacedByUserProfile ?? punchOutOrderRequest.UserProfile;
   //         UpdateCartResult updateCartResult = this.CartService.UpdateCart(new UpdateCartParameter()
   //         {
   //             CartId = new Guid?(customerOrder.Id),
   //             Status = "Submitted",
   //             UserProfileId = new Guid?(userProfile.Id),
   //             BillToId = new Guid?(customerOrder.Customer.Id),
   //             ShipToId = new Guid?(customerOrder.ShipTo.Id),
   //             ShipViaId = new Guid?(customerOrder.ShipVia.Id),
   //             Notes = customerOrder.Notes,
   //             PoNumber = customerOrder.CustomerPO,
   //             TermsCode = customerOrder.Customer.TermsCode
   //         });
   //         if (updateCartResult.ResultCode != ResultCode.Success)
   //         {
   //             LogHelper.For(this).Info(updateCartResult.ResultCode + " : " + " orderID  " + punchOutOrderRequest.OrderId, "failed for" + updateCartResult.Message);
   //             throw new Exception(updateCartResult.Message);
   //         }
   //     }
   // }
}
