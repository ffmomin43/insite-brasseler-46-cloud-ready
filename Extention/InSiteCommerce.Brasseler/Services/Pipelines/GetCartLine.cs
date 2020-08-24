using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Pipelines.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
/*
    Customized to avoid duplicating orderline.  // 5021262U0
*/

namespace InSiteCommerce.Brasseler.Services.Pipelines
{
    public sealed class GetCartLine : IPipe<AddCartLineParameter, AddCartLineResult>, IMultiInstanceDependency, IDependency, IExtension
    {
        private readonly IOrderLineUtilities orderLineUtilities;

        public int Order
        {
            get
            {
                return 99;
            }
        }

        public GetCartLine(IOrderLineUtilities orderLineUtilities)
        {
            this.orderLineUtilities = orderLineUtilities;
        }

        public AddCartLineResult Execute(IUnitOfWork unitOfWork, AddCartLineParameter parameter, AddCartLineResult result)
        {
            if (parameter.CartLine != null)
            {
                result.CartLine = parameter.CartLine;
                return result;
            }
            string str = parameter.UnitOfMeasure.IsBlank() ? parameter.Product.UnitOfMeasure : parameter.UnitOfMeasure;
            foreach (OrderLine orderLine in parameter.Cart.OrderLines.OrderBy<OrderLine, int>((Func<OrderLine, int>)(o => o.Line)).ToList<OrderLine>())
            {
                if (!(orderLine.ProductId != parameter.Product.Id) && orderLine.UnitOfMeasure.Equals(str, StringComparison.OrdinalIgnoreCase) && !orderLine.IsPromotionItem && (parameter.CustomProperties == null || !parameter.CustomProperties.Any<CustomProperty>() || this.orderLineUtilities.PropertiesAreTheSame(orderLine, (ICollection<CustomProperty>)parameter.CustomProperties)))
                {
                    result.CartLine = orderLine;
                    break;
                }
                else if (orderLine.ProductId == parameter.Product.Id && (orderLine.UnitOfMeasure.Equals(str, StringComparison.OrdinalIgnoreCase) && !orderLine.IsPromotionItem))
                {
                    result.CartLine = orderLine;
                    if (orderLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() == 0)
                    {
                        CustomProperty cp = new CustomProperty();
                        cp.Name = "IsSubscriptionOpted";
                        cp.Value = "true";
                        cp.Id = new Guid();
                        cp.ParentId = orderLine.Id;
                        cp.ParentTable = "OrderLine";
                        result.CartLine.CustomProperties.Add(cp);
                    }
                    break;
                }
            }
            return result;
        }
    }
}
