using System.CodeDom.Compiler;
using System.ServiceModel;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [GeneratedCode("System.ServiceModel", "4.0.0.0")]
    [ServiceContract(ConfigurationName = "TokenWebService.Tokens")]
    public interface Tokens
    {

        //[OperationContract(Action = "http://tempuri.org/Tokens/AddAchToken", ReplyAction = "http://tempuri.org/Tokens/AddAchTokenResponse")]
        //AddAchTokenResponse AddAchToken(AddAchTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/AddAchToken", ReplyAction = "http://tempuri.org/Tokens/AddAchTokenResponse")]
        //System.Threading.Tasks.Task<AddAchTokenResponse> AddAchTokenAsync(AddAchTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/AddCardToken", ReplyAction = "http://tempuri.org/Tokens/AddCardTokenResponse")]
        //AddCardTokenResponse AddCardToken(AddCardTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/AddCardToken", ReplyAction = "http://tempuri.org/Tokens/AddCardTokenResponse")]
        //System.Threading.Tasks.Task<AddCardTokenResponse> AddCardTokenAsync(AddCardTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/GetToken", ReplyAction = "http://tempuri.org/Tokens/GetTokenResponse")]
        //GetTokenResponse GetToken(GetTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/GetToken", ReplyAction = "http://tempuri.org/Tokens/GetTokenResponse")]
        //System.Threading.Tasks.Task<GetTokenResponse> GetTokenAsync(GetTokenRequest request);

        [OperationContract(Action = "http://tempuri.org/Tokens/UseToken", ReplyAction = "http://tempuri.org/Tokens/UseTokenResponse")]
        UseTokenResponse UseToken(UseTokenRequest request);

        [OperationContract(Action = "http://tempuri.org/Tokens/UseToken", ReplyAction = "http://tempuri.org/Tokens/UseTokenResponse")]
        Task<UseTokenResponse> UseTokenAsync(UseTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/ModifyAchToken", ReplyAction = "http://tempuri.org/Tokens/ModifyAchTokenResponse")]
        //ModifyAchTokenResponse ModifyAchToken(ModifyAchTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/ModifyAchToken", ReplyAction = "http://tempuri.org/Tokens/ModifyAchTokenResponse")]
        //System.Threading.Tasks.Task<ModifyAchTokenResponse> ModifyAchTokenAsync(ModifyAchTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/ModifyCardToken", ReplyAction = "http://tempuri.org/Tokens/ModifyCardTokenResponse")]
        //ModifyCardTokenResponse ModifyCardToken(ModifyCardTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/ModifyCardToken", ReplyAction = "http://tempuri.org/Tokens/ModifyCardTokenResponse")]
        //System.Threading.Tasks.Task<ModifyCardTokenResponse> ModifyCardTokenAsync(ModifyCardTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/DeleteAchToken", ReplyAction = "http://tempuri.org/Tokens/DeleteAchTokenResponse")]
        //DeleteAchTokenResponse DeleteAchToken(DeleteAchTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/DeleteAchToken", ReplyAction = "http://tempuri.org/Tokens/DeleteAchTokenResponse")]
        //System.Threading.Tasks.Task<DeleteAchTokenResponse> DeleteAchTokenAsync(DeleteAchTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/DeleteCardToken", ReplyAction = "http://tempuri.org/Tokens/DeleteCardTokenResponse")]
        //DeleteCardTokenResponse DeleteCardToken(DeleteCardTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/DeleteCardToken", ReplyAction = "http://tempuri.org/Tokens/DeleteCardTokenResponse")]
        //System.Threading.Tasks.Task<DeleteCardTokenResponse> DeleteCardTokenAsync(DeleteCardTokenRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/GenerateCryptoToken", ReplyAction = "http://tempuri.org/Tokens/GenerateCryptoTokenResponse")]
        //GenerateCryptoResponse GenerateCryptoToken(GenerateCryptoRequest request);

        //[OperationContract(Action = "http://tempuri.org/Tokens/GenerateCryptoToken", ReplyAction = "http://tempuri.org/Tokens/GenerateCryptoTokenResponse")]
        //System.Threading.Tasks.Task<GenerateCryptoResponse> GenerateCryptoTokenAsync(GenerateCryptoRequest request);
    }
}
