//using Insite.Core.Interfaces.Data;
//using Insite.Core.Interfaces.Dependency;
//using Insite.Core.Localization;
//using Insite.Core.Plugins.Utilities;
//using Insite.Core.Services.Handlers;
//using Insite.Data.Entities;
//using Insite.Data.Entities.Dtos.Interfaces;
//using Insite.Promotions.Services.Dtos;
//using Insite.Promotions.Services.Parameters;
//using Insite.Promotions.Services.Results;
//using System;
//using System.Collections.Generic;
//using System.Linq;

//namespace InSiteCommerce.Brasseler.Plugins.Promotions
//{
//    [DependencyName("CreatePromotionDtos")]
//    public sealed class CreatePromotionDtosBrasseler : HandlerBase<GetPromotionCollectionParameter, GetPromotionCollectionResult>
//    {
//        private readonly ICurrencyFormatProvider currencyFormatProvider;
//        private readonly IPromotionAmountProvider promotionProvider;
//        private readonly IEntityTranslationService entityTranslationService;

//        public CreatePromotionDtosBrasseler(ICurrencyFormatProvider currencyFormatProvider, IPromotionAmountProvider promotionProvider, IEntityTranslationService entityTranslationService)
//        {
//            this.currencyFormatProvider = currencyFormatProvider;
//            this.promotionProvider = promotionProvider;
//            this.entityTranslationService = entityTranslationService;
//        }

//        public override int Order
//        {
//            get
//            {
//                return 599;
//            }
//        }

//        public override GetPromotionCollectionResult Execute(IUnitOfWork unitOfWork, GetPromotionCollectionParameter parameter, GetPromotionCollectionResult result)
//        {
//            var promotionAmounForPromotion = (from x in result.Cart.CustomerOrderPromotions
//                              group x by x.PromotionId into promotionItem
//                              select new
//                              {
//                                  Amount = promotionItem.Sum(x => x.Amount),
//                                  Id = promotionItem.Key
//                              }).ToList();

//            if(promotionAmounForPromotion.Count > 0)
//            {
//                IList<PromotionDto> promotionDtos = new List<PromotionDto>();
//                promotionAmounForPromotion.ForEach(promoItem =>
//                {
//                    var promoApplied = result.Cart.CustomerOrderPromotions.Where(x => x.PromotionId == promoItem.Id).FirstOrDefault();
//                    promoApplied.Amount = promoItem.Amount;

//                    var pDTo = new PromotionDto(promoApplied, this.currencyFormatProvider, this.promotionProvider, this.entityTranslationService, result.Cart.Currency);
//                    pDTo.Amount = 
//                });
//                result.Promotions = promotionDtos;
//            }
//            else
//            {
//                result.Promotions = result.Cart.CustomerOrderPromotions.Select(o =>
//                    new PromotionDto(o, this.currencyFormatProvider, this.promotionProvider, this.entityTranslationService, result.Cart.Currency)).ToList<PromotionDto>();
//            }
//            //result.Promotions = (List<PromotionDto>)tem.GroupBy(p => p.Id);

//            return this.NextHandler.Execute(unitOfWork, parameter, result);
//        }
//    }
//}
