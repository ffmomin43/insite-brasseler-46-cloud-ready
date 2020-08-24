using Insite.Core.WebApi;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels
{
    public class UserPaymentProfileCollectionModel : BaseModel
    {
        public ICollection<UserPaymentProfileModel> listUserPaymentProfileModel { get; set; }

        public UserPaymentProfileCollectionModel()
        {
            this.listUserPaymentProfileModel = (ICollection<UserPaymentProfileModel>) new List<UserPaymentProfileModel>();
        }
    }
}
