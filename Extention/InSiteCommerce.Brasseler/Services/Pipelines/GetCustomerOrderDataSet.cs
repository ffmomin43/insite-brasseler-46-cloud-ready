using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Pipelines.Results;
using Insite.Common.Helpers;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines;
using Insite.Data.Entities;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Services.Pipelines
{
    public class GetCustomerOrderDataSet : IPipe<GetCartDataSetParameter, GetCartDataSetResult>, IMultiInstanceDependency, IDependency, IExtension
    {

        private readonly ICustomerOrderUtilities customerOrderUtilities;

        public GetCustomerOrderDataSet(ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }
        public int Order => 1650;

        public GetCartDataSetResult Execute(IUnitOfWork unitOfWork, GetCartDataSetParameter parameter, GetCartDataSetResult result)
        {
            if (result.DataSet != null && result.DataSet.Tables.Count > 0 && result.DataSet.Tables["CustomerOrder"].Rows.Count > 0)
            {
                result.DataSet.Tables["CustomerOrder"].Columns.Add("ShippingDiscount", typeof(string));
                result.DataSet.AcceptChanges();

                if (result.DataSet.Tables["CustomerOrder"].Rows[0]["ShippingDiscount"] != null)
                {
                    result.DataSet.Tables["CustomerOrder"].Rows[0]["ShippingDiscount"] = (object)this.customerOrderUtilities.GetPromotionShippingDiscountTotal(parameter.Cart);
                }
                result.DataSet.AcceptChanges();
            }
            
            return result;
        }
    }
}
