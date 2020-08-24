using AutoMapper;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using Insite.Core.BootStrapper;
using Insite.Core.Interfaces.BootStrapper;
using Insite.Core.Interfaces.Dependency;
using System.Diagnostics.CodeAnalysis;
using Insite.Data.Entities;
using System;
using System.Linq.Expressions;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using Owin;
using System.Web.Http;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers
{
    [ExcludeFromCodeCoverage]
    [BootStrapperOrder(1000)]
    public class UserPaymentProfileMapperStartupTask : IStartupTask, IDependency
    {
        public void Run(IAppBuilder app, HttpConfiguration config)
        {
            Mapper.CreateMap<UserPaymentProfileCollectionParameter, GetUserPaymentProfileCollectionParameter>().ForMember((Expression<Func<GetUserPaymentProfileCollectionParameter, object>>)(x => (object)x.UserProfileId), (Action<IMemberConfigurationExpression<UserPaymentProfileCollectionParameter>>)(y => y.MapFrom<Guid?>((Expression<Func<UserPaymentProfileCollectionParameter, Guid?>>)(x => x.UserProfileId)))).ForMember((Expression<Func<GetUserPaymentProfileCollectionParameter, object>>)(x => x.UserProfileId), (Action<IMemberConfigurationExpression<UserPaymentProfileCollectionParameter>>)(y => y.MapFrom<Guid>((Expression<Func<UserPaymentProfileCollectionParameter, Guid>>)(x => x.UserProfileId))));

            Mapper.CreateMap<GetUserPaymentProfileResult, UserPaymentProfileModel>();

            Mapper.CreateMap<UserPaymentProfile, UserPaymentProfileModel>();
        }        
    }
}
