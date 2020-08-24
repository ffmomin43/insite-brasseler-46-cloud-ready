//using Insite.Core.Interfaces.Data;
//using Insite.Data.Entities;
//using Insite.PunchOut.HttpHandlers;
//using Insite.PunchOut.HttpHandlers.Interfaces;
//using System;

///*
// *  Set URL for cancel mode.
// */

//namespace InSiteCommerce.Brasseler.Punchout
//{
//    public class PunchOutSubmitPoRequisitionServiceBrasseler : PunchOutSubmitPoRequisitionService
//    {
//        public PunchOutSubmitPoRequisitionServiceBrasseler(IUnitOfWorkFactory unitOfWorkFactory, ICurrentPunchOutSessionProvider currentPunchOutSessionProvider, IPunchOutProviderMessageFactory punchOutProviderMessageFactory, IArgumentContract argumentContract) : base(unitOfWorkFactory, currentPunchOutSessionProvider, punchOutProviderMessageFactory, argumentContract) { }

//        public override string HandlePoRequisitionRequest(string mode)
//        {
//            PunchOutSession currentPunchOutSession = this.CurrentPunchOutSessionProvider.GetCurrentPunchOutSession();
//            PunchOutSessionMode result;
//            Enum.TryParse<PunchOutSessionMode>(mode, true, out result);
//            if (mode.IsBlank() || result == PunchOutSessionMode.Unknown)
//                return this.PunchOutProviderMessageFactory.CreatePoRequisitionMessage(currentPunchOutSession);
//            currentPunchOutSession.PunchOutSessionMode = result.ToString();
//            this.UnitOfWork.Save();
//            if(mode == "Cancel")
//                currentPunchOutSession.BrowserFormPost = currentPunchOutSession.BrowserFormPost + "?redirect=1";
//            return this.PunchOutProviderMessageFactory.CreatePoRequisitionMessage(currentPunchOutSession);
//        }
//    }
//}
