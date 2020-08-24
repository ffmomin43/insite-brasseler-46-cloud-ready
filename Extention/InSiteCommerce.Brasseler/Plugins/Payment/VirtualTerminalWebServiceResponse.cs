using System;
using System.CodeDom.Compiler;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace InSiteCommerce.Brasseler.Plugins.Payment
{
    [DebuggerStepThrough]
    [GeneratedCode("System.Runtime.Serialization", "4.0.0.0")]
    [DataContract(Name = "VirtualTerminalWebServiceResponse", Namespace = "http://schemas.datacontract.org/2004/07/Acriter.ABI.CenPOS.EPayment.VirtualTerminal.Common")]  //may be remove token V6
    [Serializable]
    //[KnownType(typeof(AddCardTokenResponse))]
    //[KnownType(typeof(GetTokenResponse))]
    [KnownType(typeof(UseTokenResponse))]
    //[KnownType(typeof(ModifyAchTokenResponse))]
    //[KnownType(typeof(ModifyCardTokenResponse))]
    //[KnownType(typeof(DeleteAchTokenResponse))]
    //[KnownType(typeof(DeleteCardTokenResponse))]
    //[KnownType(typeof(GenerateCryptoResponse))]
    //[KnownType(typeof(AddAchTokenResponse))]
    public class VirtualTerminalWebServiceResponse : ClientWebServiceResponse
    {
    }
}
