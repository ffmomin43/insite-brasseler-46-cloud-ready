using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Inventory;
using Insite.Core.Plugins.Pipelines.Inventory;
using Insite.Core.Plugins.Pipelines.Inventory.Parameters;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.Catalog;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("ProcessInventory")]
    public class ProcessInventory_Override : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly Lazy<IProductUtilities> productUtilities;
        private readonly Lazy<IInventoryPipeline> inventoryPipeline;
        private readonly InventorySettings inventorySettings;

        public override int Order
        {
            get
            {
                return 2399;
            }
        }

        public ProcessInventory_Override(
          Lazy<IProductUtilities> productUtilities,
          Lazy<IInventoryPipeline> inventoryPipeline,
          InventorySettings inventorySettings)
        {
            this.productUtilities = productUtilities;
            this.inventoryPipeline = inventoryPipeline;
            this.inventorySettings = inventorySettings;
        }

        public override UpdateCartResult Execute(
          IUnitOfWork unitOfWork,
          UpdateCartParameter parameter,
          UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            CustomerOrder cart = result.GetCartResult.Cart;
            int isOutOfStock = 0;
            for (int index = cart.OrderLines.Count - 1; index >= 0; --index)
            {
                OrderLine orderLine = cart.OrderLines.ElementAt<OrderLine>(index);
                if (orderLine.Product.TrackInventory && (!this.productUtilities.Value.IsQuoteRequired(orderLine.Product) || !(cart.Status != "QuoteProposed")))
                    this.ProcessOrderLineInventory(orderLine);

                if ((!this.productUtilities.Value.IsQuoteRequired(orderLine.Product) || cart.Status == "QuoteProposed") && cart.Status == "Cart")
                {
                    Decimal quantityToDecrement = this.GetQuantityToDecrement(orderLine);
                    if (quantityToDecrement <= Decimal.Zero)
                        isOutOfStock += 1;
                }
        }
            if(isOutOfStock > 0)
            {
                StringBuilder outOfStockProductName = new StringBuilder();
                outOfStockProductName.Append("Inventory-");
                return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.CartAlreadySubmitted, outOfStockProductName.ToString().TrimEnd(',') + " is/are out of stock.");
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        private void ProcessOrderLineInventory(OrderLine orderLine)
        {
            Decimal quantityToDecrement = this.GetQuantityToDecrement(orderLine);
            if (quantityToDecrement <= Decimal.Zero)
                return;
            this.inventoryPipeline.Value.DecrementQtyOnHand(new DecrementQtyOnHandParameter()
            {
                DecrementInventoryParameter = new DecrementInventoryParameter()
                {
                    QtyToDecrement = quantityToDecrement,
                    ProductId = orderLine.Product.Id
                }
            });
        }

        private Decimal GetQuantityToDecrement(OrderLine orderLine)
        {
            Decimal num1 = orderLine.QtyOrdered;
            if (!orderLine.Product.UnitOfMeasure.EqualsIgnoreCase(orderLine.UnitOfMeasure))
            {
                ProductUnitOfMeasure productUnitOfMeasure = orderLine.Product.ProductUnitOfMeasures.FirstOrDefault<ProductUnitOfMeasure>((Func<ProductUnitOfMeasure, bool>)(o => o.UnitOfMeasure.Equals(orderLine.UnitOfMeasure, StringComparison.OrdinalIgnoreCase)));
                if (productUnitOfMeasure != null)
                    num1 *= productUnitOfMeasure.QtyPerBaseUnitOfMeasure;
            }
            if (!this.inventorySettings.AllowNegativeQtyOnHand && this.inventorySettings.InventoryService != "RealTime")
            {
                ProductInventory inventory = this.inventoryPipeline.Value.GetQtyOnHand(new GetQtyOnHandParameter(false)
                {
                    GetInventoryParameter = new GetInventoryParameter()
                    {
                        ProductIds = new List<Guid>()
            {
              orderLine.Product.Id
            },
                        Products = new List<Product>()
            {
              orderLine.Product
            }
                    }
                }).Inventories[orderLine.Product.Id];
                Decimal num2 = inventory != null ? inventory.QtyOnHand : Decimal.Zero;
                if (num2 < num1)
                    num1 = num2;
            }
            if (!(num1 > Decimal.Zero))
                return Decimal.Zero;
            return num1;
        }
    }
}
