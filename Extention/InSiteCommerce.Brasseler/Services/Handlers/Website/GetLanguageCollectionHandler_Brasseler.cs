using Insite.Core.Services.Handlers;
using Insite.Websites.Services.Parameters;
using Insite.Websites.Services.Results;
using System;
using System.Linq;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using System.Linq.Expressions;
using Insite.Common.DynamicLinq;

/*
    This handler gets the values for the Website with its specified languages. 
*/

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("GetLanguageCollectionHandler_Brasseler")]
    public class GetLanguageCollectionHandler_Brasseler : HandlerBase<GetLanguageCollectionParameter, GetLanguageCollectionResult>
    {
        public override int Order
        {
            get
            {
                return 600;
            }
        }

        public override GetLanguageCollectionResult Execute(IUnitOfWork unitOfWork, GetLanguageCollectionParameter parameter, GetLanguageCollectionResult result)
        {

            var language = unitOfWork.GetRepository<Language>().GetTable().Select(x => new { Description = x.Description, Id = x.Id });
            var websiteLanguage = unitOfWork.GetRepository<WebsiteLanguage>().GetTable().Select(x => new { WebsiteId = x.WebsiteId, LanguageId = x.LanguageId });
            var website = unitOfWork.GetRepository<Website>().GetTable().Where<Website>((Expression<Func<Website, bool>>)(x => x.ParentWebsiteId == null)).Select(x => new { Name = x.Name, Id = x.Id, Domain = x.DomainName });

            var webLang = (
                        from l in language
                        join wl in websiteLanguage on l.Id equals wl.LanguageId
                        join w in website on wl.WebsiteId equals w.Id
                        select new
                        {
                            id = l.Id,
                            language = l.Description,
                            website = w.Name,
                            domain = w.Domain
                        }).GroupBy(x => x.website)
                        .Select(grp => grp.ToList())
                        .ToList();

            this.AddObjectToResultProperties(result, "AllLanguages", webLang);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
