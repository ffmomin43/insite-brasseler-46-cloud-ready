using System.CodeDom.Compiler;
using System.Diagnostics;
using System.ServiceModel;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.ServiceModel", "4.0.0.0")]
    public class TokensClient : ClientBase<Tokens>, Tokens
    {

        public TokensClient()
        {
        }

        public TokensClient(string endpointConfigurationName) :
                base(endpointConfigurationName)
        {
        }

        public TokensClient(string endpointConfigurationName, string remoteAddress) :
                base(endpointConfigurationName, remoteAddress)
        {
        }

        public TokensClient(string endpointConfigurationName, System.ServiceModel.EndpointAddress remoteAddress) :
                base(endpointConfigurationName, remoteAddress)
        {
        }

        public TokensClient(System.ServiceModel.Channels.Binding binding, System.ServiceModel.EndpointAddress remoteAddress) :
                base(binding, remoteAddress)
        {
        }

        //public AddAchTokenResponse AddAchToken(AddAchTokenRequest request)
        //{
        //    return base.Channel.AddAchToken(request);
        //}

        //public Task<AddAchTokenResponse> AddAchTokenAsync(AddAchTokenRequest request)
        //{
        //    return base.Channel.AddAchTokenAsync(request);
        //}

        //public AddCardTokenResponse AddCardToken(AddCardTokenRequest request)
        //{
        //    return base.Channel.AddCardToken(request);
        //}

        //public Task<AddCardTokenResponse> AddCardTokenAsync(AddCardTokenRequest request)
        //{
        //    return base.Channel.AddCardTokenAsync(request);
        //}

        //public GetTokenResponse GetToken(GetTokenRequest request)
        //{
        //    return base.Channel.GetToken(request);
        //}

        //public Task<GetTokenResponse> GetTokenAsync(GetTokenRequest request)
        //{
        //    return base.Channel.GetTokenAsync(request);
        //}

        public UseTokenResponse UseToken(UseTokenRequest request)
        {
            return base.Channel.UseToken(request);
        }

        public Task<UseTokenResponse> UseTokenAsync(UseTokenRequest request)
        {
            return base.Channel.UseTokenAsync(request);
        }

    //    public ModifyAchTokenResponse ModifyAchToken(ModifyAchTokenRequest request)
    //    {
    //        return base.Channel.ModifyAchToken(request);
    //    }

    //    public Task<ModifyAchTokenResponse> ModifyAchTokenAsync(ModifyAchTokenRequest request)
    //    {
    //        return base.Channel.ModifyAchTokenAsync(request);
    //    }

    //    public ModifyCardTokenResponse ModifyCardToken(ModifyCardTokenRequest request)
    //    {
    //        return base.Channel.ModifyCardToken(request);
    //    }

    //    public Task<ModifyCardTokenResponse> ModifyCardTokenAsync(ModifyCardTokenRequest request)
    //    {
    //        return base.Channel.ModifyCardTokenAsync(request);
    //    }

    //    public DeleteAchTokenResponse DeleteAchToken(DeleteAchTokenRequest request)
    //    {
    //        return base.Channel.DeleteAchToken(request);
    //    }

    //    public Task<DeleteAchTokenResponse> DeleteAchTokenAsync(DeleteAchTokenRequest request)
    //    {
    //        return base.Channel.DeleteAchTokenAsync(request);
    //    }

    //    public DeleteCardTokenResponse DeleteCardToken(DeleteCardTokenRequest request)
    //    {
    //        return base.Channel.DeleteCardToken(request);
    //    }

    //    public Task<DeleteCardTokenResponse> DeleteCardTokenAsync(DeleteCardTokenRequest request)
    //    {
    //        return base.Channel.DeleteCardTokenAsync(request);
    //    }

    //    public GenerateCryptoResponse GenerateCryptoToken(GenerateCryptoRequest request)
    //    {
    //        return base.Channel.GenerateCryptoToken(request);
    //    }

    //    public Task<GenerateCryptoResponse> GenerateCryptoTokenAsync(GenerateCryptoRequest request)
    //    {
    //        return base.Channel.GenerateCryptoTokenAsync(request);
    //    }
    }
}
