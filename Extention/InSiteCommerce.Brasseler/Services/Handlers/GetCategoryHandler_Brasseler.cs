using Insite.Catalog.Services.Parameters;
using Insite.Catalog.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("GetCategoryHandler_Brasseler")]
    public class GetCategoryHandler_Brasseler : HandlerBase<GetCategoryParameter, GetCategoryResult>
    {
       
        public override int Order
        {
            get
            {
                return 600;
            }
        }

        public override GetCategoryResult Execute(IUnitOfWork unitOfWork, GetCategoryParameter parameter, GetCategoryResult result)
        {
            Category category = unitOfWork.GetRepository<Category>().Get(parameter.CategoryId);
            result.Category = category;
            if (category != null && category.GetProperty("IsShoppingList", "false") != null)
            {
                var isShoppingList = category.GetProperty("IsShoppingList", "false");
                result.Properties.Add("IsShoppingList", isShoppingList); 
            }          
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }


    }
}
