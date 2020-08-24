using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Handlers
{
    public class CartSubscriptionDtoHandler
    {
        protected readonly IUnitOfWork unitOfWork;

        public CartSubscriptionDtoHandler(IUnitOfWorkFactory unitOfWorkFactory)
        {
            this.unitOfWork = unitOfWorkFactory.GetUnitOfWork();
        }

        public void PostCartSubscriptionDto(CartSubscriptionDto cartSubscriptionDto)
        {
            var subBrasseler = this.unitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().Where(x => x.CustomerOrderId == cartSubscriptionDto.CustomerOrderId).FirstOrDefault();
            if (subBrasseler != null)
            {
                subBrasseler.Frequency = cartSubscriptionDto.Frequency;
                subBrasseler.ActivationDate = cartSubscriptionDto.ActivationDate;
                subBrasseler.DeActivationDate = cartSubscriptionDto.DeActivationDate;
                subBrasseler.NextDelieveryDate = new DateTimeOffset(cartSubscriptionDto.NextDelieveryDate.Date, TimeSpan.Zero);
                subBrasseler.PaymentMethod = cartSubscriptionDto.PaymentMethod;
                subBrasseler.ParentCustomerOrderId = cartSubscriptionDto.ParentCustomerOrderId;//BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders.
                subBrasseler.ShipNow = cartSubscriptionDto.ShipNow;
                subBrasseler.IsModified = cartSubscriptionDto.IsModified; //BUSA -762.
            }
            this.unitOfWork.Save();
        }
    }
}
