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
    [DependencyName("OrderedProductPriceFromCategory")]
    public class CriteriaTypeOrderedProductPriceFromCategory_Brasseler : CriteriaTypeBase
    {
        protected readonly IEnumModelProvider EnumModelProvider;

        public CriteriaTypeOrderedProductPriceFromCategory_Brasseler(IEnumModelProvider enumModelProvider)
        {
            EnumModelProvider = enumModelProvider;
        }

        public override string CriteriaObject
        {
            get
            {
                return "CustomerOrder";
            }
        }

        public override string LookupObject
        {
            get
            {
                return "Category";
            }
        }

        public override string DisplayName
        {
            get
            {
                return "Ordered Product Price From Category";
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
                Dictionary<string, CriteriaTypeParameter> dictionary2 = dictionary1;
                string key = "ComparisonOperator";
                CriteriaTypeParameter criteriaTypeParameter = new CriteriaTypeParameter();
                criteriaTypeParameter.Label = "Select Based On";
                criteriaTypeParameter.PossibleValues = this.ValidRuleClauseComparisonOperators.Select<RuleClauseComparisonOperator, EnumModel>((Func<RuleClauseComparisonOperator, EnumModel>)(x => new EnumModel()
                {
                    Value = x.ToString(),
                    Label = this.EnumModelProvider.GetLabelFor(typeof(RuleClauseComparisonOperator), (object)x)
                })).ToArray<EnumModel>();

                dictionary2.Add(key, criteriaTypeParameter);


                dictionary1.Add("SimpleValue", new CriteriaTypeParameter()
                {
                    Label = "Category",
                    LookupField = true
                });
                dictionary1.Add("CriteriaValue", new CriteriaTypeParameter()
                {
                    Label = "BasePrice",
                    PossibleValues = (ICollection<EnumModel>)new EnumModel[1]
                {
                     new EnumModel() { Value = "BasePrice" },
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
            Guid categoryId = this.TryParseGuid("SimpleValue", ruleClause.SimpleValue);
            bool isBasePrice = ruleClause.CriteriaValue.EqualsIgnoreCase("BasePrice");

            var is_PromotionBasePrice = customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(o =>
            {
                ICollection<Category> categories = o.Product.Categories;
                int count = 0;
                foreach (Category category in categories)
                {
                    if (categoryId == category.Id)
                    {
                        count++;
                    }
                }
                if (count == 0)
                {
                    return false;
                }
                if (o.Product.IsQuoteRequired)
                    return ruleClause.RuleManager.Name != "Promotion";
                return true;
            })).Where(o => o.UnitNetPrice == o.UnitListPrice);

            if (is_PromotionBasePrice.Count() > 0 && isBasePrice)
            {
                return true;
            }
            return false;
        }
    }
}