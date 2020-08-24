using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.EnumTypes;
using Insite.Core.Plugins.RulesEngine;
using Insite.Core.Interfaces.Data;
using Insite.Core.Services;

namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    [DependencyName("OverideVolumeDiscount")]
    public class CriteriaTypeOverideVolumeDiscount : CriteriaTypeBase
    {
        public override string CriteriaObject
        {
            get
            {
                return "CustomerOrder";
            }
        }



        public override string DisplayName
        {
            get
            {
                return "Override Volume Discount";
            }
        }

        public override bool RequiresCriteriaObject
        {
            get
            {
                return false;
            }
        }

        public override bool RequiresCriteriaProperty
        {
            get
            {
                return false;
            }
        }

        public override bool RequiresCriteriaValue
        {
            get
            {
                return true;
            }
        }

        public override string CriteriaValueLabel
        {
            get
            {
                return string.Empty;
            }
        }

        public override bool RequiresValueType
        {
            get
            {
                return false;
            }
        }

        public override bool RequiresGeocode
        {
            get
            {
                return false;
            }
        }

        public override IList<RuleClauseComparisonOperator> ValidRuleClauseComparisonOperators
        {
            get
            {
                return (IList<RuleClauseComparisonOperator>)new List<RuleClauseComparisonOperator>()
        {
          RuleClauseComparisonOperator.Equals,

        };
            }
        }

        public override Dictionary<string, CriteriaTypeParameter> ParameterDescriptions
        {
            get
            {
                Dictionary<string, CriteriaTypeParameter> dictionary1 = new Dictionary<string, CriteriaTypeParameter>();
                dictionary1.Add("CriteriaValue", new CriteriaTypeParameter()
                {
                    Label = "Overide Volume Discount",
                    PossibleValues = (ICollection<EnumModel>)new EnumModel[2]
        {
          new EnumModel() { Value = "Yes" },
          new EnumModel() { Value = "No" }
        }
                });
                return dictionary1;
            }
        }

        public override bool Validate(RuleClause ruleClause, object argument)
        {
            CustomerOrder customerOrder = argument as CustomerOrder;

            if (customerOrder == null)
                throw new ArgumentException("argument must be of type CustomerOrder");
            bool yes = ruleClause.CriteriaValue.EqualsIgnoreCase("Yes");
            if (yes)
                return true;

            return false;
        }
    }
}