using Insite.Common.Providers;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using Insite.Promotions.Services.Parameters;
using Insite.Promotions.Services.Results;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("ApplyPromotion")]
    public class ApplyPromotionOverride : HandlerBase<AddPromotionParameter, AddPromotionResult>
    {
        private readonly IPromotionEngine promotionEngine;
        private readonly CheckoutSettings checkoutSettings;

        public ApplyPromotionOverride(IPromotionEngine promotionEngine, CheckoutSettings checkoutSettings)
        {
            this.promotionEngine = promotionEngine;
            this.checkoutSettings = checkoutSettings;
        }

        public override int Order
        {
            get
            {
                return 690;
            }
        }

        public override AddPromotionResult Execute(IUnitOfWork unitOfWork, AddPromotionParameter parameter, AddPromotionResult result)
        {
            OrderPromotionCode orderPromotionCode = new OrderPromotionCode()
            {
                Code = parameter.PromotionCode
            };
            this.AddPromotionCode(unitOfWork, result.Cart, orderPromotionCode);
            this.promotionEngine.ApplyPromotions(result.Cart);
            unitOfWork.Save();
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        private void AddPromotionCode(IUnitOfWork unitOfWork, CustomerOrder customerOrder, OrderPromotionCode orderPromotionCode)
        {
            if (this.promotionEngine.ListContainsPromotionCode(customerOrder.OrderPromotionCodes.Select<OrderPromotionCode, string>((Func<OrderPromotionCode, string>)(o => o.Code)), orderPromotionCode.Code))
                return;
            IRepository<OrderPromotionCode> repository = unitOfWork.GetRepository<OrderPromotionCode>();
            foreach (OrderPromotionCode deleted in customerOrder.OrderPromotionCodes.ToList<OrderPromotionCode>())
                repository.Delete(deleted);
            unitOfWork.Save();

            orderPromotionCode.CustomerOrder = customerOrder;
            customerOrder.OrderPromotionCodes.Add(orderPromotionCode);
            repository.Insert(orderPromotionCode);
            customerOrder.RecalculatePromotions = true;
            customerOrder.ShippingCalculationNeededAsOf = DateTimeProvider.Current.Now;
            customerOrder.RecalculateTax = true;
        }

    }
}
