using DotLiquid;
using System.IO;

namespace InSiteCommerce.Brasseler.Tags
{
    public class WhiteSpaceRegex : Tag
    {
        public WhiteSpaceRegex()
        {

        }

        public override void Render(Context context, TextWriter result)
        {
            result.Write("^\\s*(\\w.*)$".Replace("\\", "\\\\"));
        }
    }
    
}
