using Insite.Catalog.Services;
using Insite.Catalog.Services.Parameters;
using Insite.Catalog.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("GetProduct_Brasseler")]
    public  class GetProduct_Brasseler : HandlerBase<GetProductParameter, GetProductResult>
    {
        private readonly IProductService productService;

        public GetProduct_Brasseler(IProductService productService)
        {
            this.productService = productService;
        }

        public override int Order
        {
            get
            {
                return 550;
            }
        }

        public override GetProductResult Execute(IUnitOfWork unitOfWork, GetProductParameter parameter, GetProductResult result)
        {
            //BUSA-636 Pricing 2018 Added related products for PDP
            if (parameter.ProductId != null)
            {
                var QtyBrkCls = unitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.Id == parameter.ProductId).PriceBasis;

                if (!string.IsNullOrEmpty(QtyBrkCls))
                {
                    List<Product> relatedProduct = new List<Product>();
                    var products = unitOfWork.GetRepository<Product>().GetTable().Where(x => x.PriceBasis == QtyBrkCls && (x.DeactivateOn == null || x.DeactivateOn >= DateTime.Now));


                    if (SiteContext.Current.ShipTo != null && SiteContext.Current.BillTo != null)
                    {
                        //var Customer = !string.IsNullOrEmpty(SiteContext.Current.ShipTo.CustomerSequence) ? SiteContext.Current.ShipTo.RestrictionGroups : SiteContext.Current.BillTo.RestrictionGroups;

                        //List<Guid?> restrictionGrps = new List<Guid?>();
                        //foreach (var restrictionGrp in Customer)
                        //{
                        //    restrictionGrps.Add(restrictionGrp.Id);
                        //}

                        foreach (var product in products)
                        {
                            //if (product.RestrictionGroups.FirstOrDefault().Id != null && restrictionGrps.Contains(product.RestrictionGroups.FirstOrDefault().Id))
                            //{
                                relatedProduct.Add(product);
                            //}
                            //else if (product.RestrictionGroups.FirstOrDefault().Id == null)
                            //{
                            //    relatedProduct.Add(product);
                            //}
                        }
                    }
                    Object relatedProducts = relatedProduct.Select(c => new { Name = c.Name, Description = c.ShortDescription });
                    this.AddObjectToResultProperties(result, "VDGRelatedProducts", relatedProducts);
                }
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
