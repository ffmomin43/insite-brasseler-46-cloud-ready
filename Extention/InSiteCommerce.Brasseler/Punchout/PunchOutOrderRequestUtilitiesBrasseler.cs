using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using Insite.Plugins.EntityUtilities;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Punchout
{
    public class PunchOutOrderRequestUtilitiesBrasseler: PunchOutOrderRequestUtilities
    {

        public PunchOutOrderRequestUtilitiesBrasseler(IUnitOfWorkFactory unitOfWorkFactory): base(unitOfWorkFactory) {}

        public override string GetSupplierAuxilliartPartId(PunchOutOrderRequest punchOutOrderRequest)
        {
            if (!punchOutOrderRequest.PunchOutOrderRequestItemOuts.Count.Equals(0))
            {
                var SupplierPartAuxiliaryIds = punchOutOrderRequest.PunchOutOrderRequestItemOuts.Select(x => new Guid(x.SupplierPartAuxiliaryId)).ToList();

                if (SupplierPartAuxiliaryIds != null && SupplierPartAuxiliaryIds.Distinct().Count() == 1)
                {
                    var id = SupplierPartAuxiliaryIds[0].ToString();
                    var existingId = this.UnitOfWork.GetRepository<PunchOutOrderRequest>().GetTable().Where(x => x.PunchOutSessionId == new Guid(id));
                    if (existingId.Count() == 0)
                    {
                        return punchOutOrderRequest.PunchOutOrderRequestItemOuts.First<PunchOutOrderRequestItemOut>().SupplierPartAuxiliaryId;
                    }
                }
            }
            return string.Empty;
        }
    }
}
