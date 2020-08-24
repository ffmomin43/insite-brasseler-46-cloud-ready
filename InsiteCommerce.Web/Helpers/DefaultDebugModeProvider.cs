// --------------------------------------------------------------------------------------------------------------------
// <copyright file="DefaultDebugModeProvider.cs" company="Insite Software">
//   Copyright © 2019. Insite Software. All rights reserved.
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

namespace InsiteCommerce.Web.Helpers
{
    using Insite.Core.Providers;

    public class DefaultDebugModeProvider : IDebugModeProvider
    {
        public bool IsDebugEnabled => this.IsPreprocessorDebugEnabled;

        private bool IsPreprocessorDebugEnabled { get; }

        public DefaultDebugModeProvider()
        {
#if DEBUG
            this.IsPreprocessorDebugEnabled = true;
#endif
        }
    }
}