using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using System;
using System.Linq;


namespace Insite.Cart.Services.Handlers.UpdateCartHandler
{
    [DependencyName("CreateOrderHistory_Brasseler")]
    public class CreateOrderHistory_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {   
     
        public CreateOrderHistory_Brasseler()
        {
            
        }

        public override int Order
        {
            get
            {
                return 3350;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            var orderhistory = unitOfWork.GetRepository<OrderHistory>().GetTable().FirstOrDefault(oh => oh.WebOrderNumber == result.GetCartResult.Cart.OrderNumber);
            if (orderhistory == null)
                this.NextHandler.Execute(unitOfWork, parameter, result);
            orderhistory.ShippingCharges = result.GetCartResult.ShippingAndHandling;
            //Populate Backorder object
            BackOrders backOrders = new BackOrders();
            backOrders.WebOrderNumber = orderhistory.WebOrderNumber;
            backOrders.CustomerNumber = orderhistory.CustomerNumber;
            backOrders.OrderLanguage = SiteContext.Current.LanguageDto.Id;
            unitOfWork.GetRepository<BackOrders>().Insert(backOrders);
            unitOfWork.Save();
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }        
    }
}
