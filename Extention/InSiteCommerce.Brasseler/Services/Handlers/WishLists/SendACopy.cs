using Insite.Common;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Localization;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.CopyServices;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using Insite.WishLists.Services.Parameters;
using Insite.WishLists.Services.Results;
using System;
using System.Dynamic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.WishLists
{
    [DependencyName("SendACopy")]
    public class SendACopy: HandlerBase<UpdateWishListSendACopyParameter, UpdateWishListSendACopyResult>
    {
        private readonly IWishListCopyService wishListCopyService;

        private readonly Lazy<IEmailService> emailService;

        private readonly ITranslationLocalizer translationLocalizer;

        private readonly IWebsiteUtilities websiteUtilities;

        public override int Order
        {
            get
            {
                return 600;
            }
        }

        public SendACopy(IWishListCopyService wishListCopyService, Lazy<IEmailService> emailService, ITranslationLocalizer translationLocalizer, IWebsiteUtilities websiteUtilities)
        {
            this.wishListCopyService = wishListCopyService;
            this.emailService = emailService;
            this.translationLocalizer = translationLocalizer;
            this.websiteUtilities = websiteUtilities;
        }

        public override UpdateWishListSendACopyResult Execute(IUnitOfWork unitOfWork, UpdateWishListSendACopyParameter parameter, UpdateWishListSendACopyResult result)
        {
            if (parameter.SenderName.IsBlank())
            {
                return this.CreateErrorServiceResult<UpdateWishListSendACopyResult>(result, SubCode.BadRequest, string.Format(MessageProvider.Current.Field_Required, "SenderName"));
            }
            if (parameter.RecipientEmailAddress.IsBlank())
            {
                return this.CreateErrorServiceResult<UpdateWishListSendACopyResult>(result, SubCode.BadRequest, MessageProvider.Current.AddressInfo_EmailAddress_Validation);
            }
            string[] array = (
                from o in parameter.RecipientEmailAddress.Split(new char[] { ',' })
                select o.Trim()).Where<string>(new Func<string, bool>(RegularExpressionLibrary.IsValidEmail)).ToArray<string>();
            if (array.Length == 0)
            {
                return this.CreateErrorServiceResult<UpdateWishListSendACopyResult>(result, SubCode.BadRequest, MessageProvider.Current.AddressInfo_EmailAddress_Validation);
            }
            WishList wishList = this.wishListCopyService.Copy(result.GetWishListResult.WishList, true);
            wishList.ShareOption = "Static";
            result.CopiedWishList = wishList;
            string str = string.Format(this.translationLocalizer.TranslateLabel("{0} has shared a {1} shared list"), parameter.SenderName, SiteContext.Current.WebsiteDto.Name);
            EmailList orCreateByName = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SendAListCopy", "Send A List Copy", "");

            dynamic expandoObjects = new ExpandoObject();
            expandoObjects.ListName = wishList.Name;
            expandoObjects.Message = parameter.Message;
            expandoObjects.DisplayName = parameter.SenderName;
            //BUSA-1090 Wish list email notification (share)
            expandoObjects.SenderName = result.GetWishListResult.UserProfile.Email;
            string str1 = this.websiteUtilities.WebsiteUri(SiteContext.Current.WebsiteDto);
            expandoObjects.ListUrl = string.Format("{0}/RedirectTo/{1}?id={2}", str1, "StaticListPage", wishList.Id);
            string[] strArrays = array;
            for (int i = 0; i < (int)strArrays.Length; i++)
            {
                string str2 = strArrays[i];
                this.emailService.Value.SendEmailList(orCreateByName.Id, new string[] { str2 }, expandoObjects, str, unitOfWork, SiteContext.Current.WebsiteDto.Id);
            }
            return base.NextHandler.Execute(unitOfWork, parameter, result);
        }

    }
}
