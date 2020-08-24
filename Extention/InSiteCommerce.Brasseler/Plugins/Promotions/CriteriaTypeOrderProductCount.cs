using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.EnumTypes;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.RulesEngine;
using Insite.Core.Services;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
//BUSA-1170 Added criteria in promotion to get product count in cart.
namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    [DependencyName("OrderProductCount")]
    public class CriteriaTypeOrderProductCount : CriteriaTypeBase
    {
        protected readonly IEnumModelProvider EnumModelProvider;
        protected readonly IOrderLineUtilities OrderLineUtilities;

        public CriteriaTypeOrderProductCount(
          IOrderLineUtilities orderLineUtilities,
          IEnumModelProvider enumModelProvider)
        {
            OrderLineUtilities = orderLineUtilities;
            EnumModelProvider = enumModelProvider;
        }


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
                return "Order Product Count";
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
                return new List<RuleClauseComparisonOperator>()
        {
          RuleClauseComparisonOperator.Equals,
          RuleClauseComparisonOperator.NotEquals,
          RuleClauseComparisonOperator.GreaterThan,
          RuleClauseComparisonOperator.GreaterThanOrEqual,
          RuleClauseComparisonOperator.LessThan,
          RuleClauseComparisonOperator.LessThanOrEqual,
          RuleClauseComparisonOperator.Range
        };
            }
        }

        /// <summary>The parameter descriptions.</summary>
        public override Dictionary<string, CriteriaTypeParameter> ParameterDescriptions
        {
            get
            {
                return new Dictionary<string, CriteriaTypeParameter>()
        {
          {
            "ComparisonOperator",
            new CriteriaTypeParameter()
            {
              Label = "Select Based On",
              PossibleValues =  ValidRuleClauseComparisonOperators.Select( x => new EnumModel()
              {
                Value = x.ToString(),
                Label = EnumModelProvider.GetLabelFor(typeof (RuleClauseComparisonOperator),  x)
              }).ToArray()
            }
          },
          {
            "SimpleValue",
            new CriteriaTypeParameter()
            {
              Label = "Order Product Count",
              AvailableComparisonOperators =  new List<RuleClauseComparisonOperator>()
              {
                RuleClauseComparisonOperator.Equals,
                RuleClauseComparisonOperator.NotEquals,
                RuleClauseComparisonOperator.GreaterThan,
                RuleClauseComparisonOperator.GreaterThanOrEqual,
                RuleClauseComparisonOperator.LessThan,
                RuleClauseComparisonOperator.LessThanOrEqual
              }
            }
          },
          {
            "ValueMinimum",
            new CriteriaTypeParameter()
            {
              Label = "Minimum Order Product Count",
              ValueType = "number",
              AvailableComparisonOperators =  new List<RuleClauseComparisonOperator>()
              {
                RuleClauseComparisonOperator.Range
              }
            }
          },
          {
            "ValueMaximum",
            new CriteriaTypeParameter()
            {
              Label = "Maximum Order Product Count",
              ValueType = "number",
              AvailableComparisonOperators =  new List<RuleClauseComparisonOperator>()
              {
                RuleClauseComparisonOperator.Range
              }
            }
          }
        };
            }
        }

        public override bool Validate(RuleClause ruleClause, object argument)
        {
            if (!(argument is CustomerOrder))
                throw new ArgumentException("argument must be of type CustomerOrder");
            int num = ((CustomerOrder)argument).OrderLines.Sum(o =>
            {
                if (!OrderLineUtilities.GetIsActive(o))
                    return 0;
                //if (o.Product.IsQuoteRequired)
                //    return ruleClause.RuleManager.Name != "Promotion";
                return (int)o.QtyOrdered;
            });
            string comparisonOperator1 = ruleClause.ComparisonOperator;
            RuleClauseComparisonOperator comparisonOperator2 = RuleClauseComparisonOperator.Range;
            string str1 = comparisonOperator2.ToString();
            if (comparisonOperator1 == str1)
            {
                int result1;
                if (!int.TryParse(ruleClause.ValueMinimum, NumberStyles.Any, CultureInfo.InvariantCulture, out result1))
                    throw new ArgumentException("ValueMinimum must be integer, it was " + ruleClause.ValueMinimum);
                int result2;
                if (!int.TryParse(ruleClause.ValueMaximum, NumberStyles.Any, CultureInfo.InvariantCulture, out result2))
                    throw new ArgumentException("ValueMaximum must be integer, it was " + ruleClause.ValueMaximum);
                if (result1 <= num)
                    return num <= result2;
                return false;
            }
            int result;
            if (!int.TryParse(ruleClause.SimpleValue, NumberStyles.Any, CultureInfo.InvariantCulture, out result))
                throw new ArgumentException("SimpleValue must be integer, it was " + ruleClause.SimpleValue);
            string comparisonOperator3 = ruleClause.ComparisonOperator;
            comparisonOperator2 = RuleClauseComparisonOperator.Equals;
            string str2 = comparisonOperator2.ToString();
            if (comparisonOperator3 == str2)
                return result == num;
            string comparisonOperator4 = ruleClause.ComparisonOperator;
            comparisonOperator2 = RuleClauseComparisonOperator.NotEquals;
            string str3 = comparisonOperator2.ToString();
            if (comparisonOperator4 == str3)
                return result != num;
            string comparisonOperator5 = ruleClause.ComparisonOperator;
            comparisonOperator2 = RuleClauseComparisonOperator.GreaterThan;
            string str4 = comparisonOperator2.ToString();
            if (comparisonOperator5 == str4)
                return result < num;
            string comparisonOperator6 = ruleClause.ComparisonOperator;
            comparisonOperator2 = RuleClauseComparisonOperator.GreaterThanOrEqual;
            string str5 = comparisonOperator2.ToString();
            if (comparisonOperator6 == str5)
                return result <= num;
            string comparisonOperator7 = ruleClause.ComparisonOperator;
            comparisonOperator2 = RuleClauseComparisonOperator.LessThan;
            string str6 = comparisonOperator2.ToString();
            if (comparisonOperator7 == str6)
                return result > num;
            string comparisonOperator8 = ruleClause.ComparisonOperator;
            comparisonOperator2 = RuleClauseComparisonOperator.LessThanOrEqual;
            string str7 = comparisonOperator2.ToString();
            if (comparisonOperator8 == str7)
                return result >= num;
            throw new ArgumentException("ComparisonOperator is not valid, it was " + ruleClause.ComparisonOperator);
        }
    }
}


