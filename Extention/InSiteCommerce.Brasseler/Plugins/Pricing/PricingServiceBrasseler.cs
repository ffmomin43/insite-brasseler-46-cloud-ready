using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using Insite.Plugins.Pricing;
using Insite.Plugins.Pricing.PriceCalculation;
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Insite.Core.Context;
using Insite.Data.Extensions;
using System.Linq.Expressions;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.SystemSetting.Groups.Catalog;
using Insite.Data.Entities.Dtos;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using Insite.Core.Interfaces.Plugins.Caching;

namespace InSiteCommerce.Brasseler.Plugins.Pricing
{
    [DependencyName("Brasseler")]
    public class PricingServiceBrasseler : PricingServiceGeneric
    {

        List<string> priceBasisList = null;
        protected readonly Lazy<CustomSettings> customSettings;

        public PricingServiceBrasseler(
            IUnitOfWorkFactory unitOfWorkFactory, 
            
            ICurrencyFormatProvider currencyFormatProvider, 
            IOrderLineUtilities orderLineUtilities, 
            IPricingServiceFactory pricingServiceFactory,
            IPerRequestCacheManager perRequestCacheManager,
            IPriceMatrixUtilities priceMatrixUtilities,
            PricingSettings pricingSettings)
      : base(
            unitOfWorkFactory, 
            currencyFormatProvider, 
            orderLineUtilities, 
            pricingServiceFactory,
            perRequestCacheManager,
            priceMatrixUtilities,
            pricingSettings)
        {
            customSettings = new Lazy<CustomSettings>();
        }

        public override PricingServiceResult ProcessPriceCalculation(PricingServiceParameter pricingServiceParameter)
        {
            //var useVolumeGroupPricing = UnitOfWork.GetTypedRepository<IWebsiteConfigurationRepository>().GetOrCreateByName<string>("UseVolumeGroupPricing", SiteContext.Current.Website.Id).ToString();
            var useVolumeGroupPricing = customSettings.Value.UseVolumeGroupPricing;

            if (useVolumeGroupPricing.ToUpper() == "TRUE")
            {
                priceBasisList = new List<string>() { "P1", "P2", "P3", "P4", "P5", "P6", "L" };
            }
            else
            {
                priceBasisList = new List<string>() { "P1", "P2", "P3", "P4", "P5", "P6" };
            }

            PricingServiceResult result;
            this.SetRecordTypePriority();
            List<PriceMatrix> priceMatrixList = this.GetPriceMatrixList(pricingServiceParameter);
            PriceAndPriceBreaks priceAndPriceBreaks1 = this.GetPriceAndPriceBreaks((IList<PriceMatrix>)priceMatrixList, pricingServiceParameter, true);
            this.ListPricing = priceAndPriceBreaks1;
            PriceAndPriceBreaks priceAndPriceBreaks2 = this.GetPriceAndPriceBreaks((IList<PriceMatrix>)priceMatrixList, pricingServiceParameter, false);
            this.PerformCurrencyConversion(pricingServiceParameter.CurrencyCode, priceAndPriceBreaks1);
            this.PerformCurrencyConversion(pricingServiceParameter.CurrencyCode, priceAndPriceBreaks2);
            result = new PricingServiceResult()
            {
                UnitListPrice = priceAndPriceBreaks1.Price,
                UnitListBreakPrices = (IList<ProductPrice>)priceAndPriceBreaks1.PriceBreaks,
                UnitRegularPrice = priceAndPriceBreaks2.Price,
                UnitRegularBreakPrices = (IList<ProductPrice>)priceAndPriceBreaks2.PriceBreaks,
                IsOnSale = priceAndPriceBreaks2.IsSalePrice,
                CurrencyRate = priceAndPriceBreaks1.CurrencyRate
            };

                //Pricing 2018 changes 
                if (SiteContext.Current.ShipTo != null && useVolumeGroupPricing.ToUpper() == "TRUE")
                {
                    var customer = !string.IsNullOrEmpty(SiteContext.Current.ShipTo.CustomerSequence) ? SiteContext.Current.ShipTo : SiteContext.Current.BillTo;

                    var DefaultPriceList = customer.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("DefaultPriceList")).FirstOrDefault().Value;

                    if (result.UnitRegularPrice == result.UnitListPrice && !string.IsNullOrEmpty(DefaultPriceList) && DefaultPriceList == "1")
                    {
                        List<PriceMatrix> volumePriceMatrixList = GetPriceMatrixList_Brasseler(pricingServiceParameter);
                        PriceAndPriceBreaks volumePriceAndPriceBreaks1 = this.GetPriceAndPriceBreaks((IList<PriceMatrix>)volumePriceMatrixList, pricingServiceParameter, true);
                        this.ListPricing = volumePriceAndPriceBreaks1;
                        PriceAndPriceBreaks volumePriceAndPriceBreaks2 = this.GetPriceAndPriceBreaks((IList<PriceMatrix>)volumePriceMatrixList, pricingServiceParameter, false);
                        this.PerformCurrencyConversion(pricingServiceParameter.CurrencyCode, volumePriceAndPriceBreaks1);
                        this.PerformCurrencyConversion(pricingServiceParameter.CurrencyCode, volumePriceAndPriceBreaks2);
                        PricingServiceResult volumePricingServiceResult = new PricingServiceResult();
                        volumePricingServiceResult.UnitListPrice = volumePriceAndPriceBreaks1.Price;
                        volumePricingServiceResult.UnitListBreakPrices = (IList<ProductPrice>)volumePriceAndPriceBreaks1.PriceBreaks;
                        volumePricingServiceResult.UnitRegularPrice = volumePriceAndPriceBreaks2.Price;
                        volumePricingServiceResult.UnitRegularBreakPrices = (IList<ProductPrice>)volumePriceAndPriceBreaks2.PriceBreaks;
                        int num1 = volumePriceAndPriceBreaks2.IsSalePrice ? 1 : 0;
                        volumePricingServiceResult.IsOnSale = num1 != 0;
                        Decimal volumeCurrencyRate = volumePricingServiceResult.CurrencyRate;
                        volumePricingServiceResult.CurrencyRate = volumeCurrencyRate;
                        result = volumePricingServiceResult;
                    }
                }            
            this.AddDisplayPrices(result, this.GetCurrency(pricingServiceParameter.CurrencyCode));
            this.AddExtendedPrices(pricingServiceParameter, result, this.GetCurrency(pricingServiceParameter.CurrencyCode));
            return result;
        }

        //Pricing 2018 get PriceMatrix
        protected virtual List<PriceMatrix> GetPriceMatrixList_Brasseler(PricingServiceParameter pricingServiceParameter)
        {
            var QtyBrkCls = this.Product.PriceBasis;

            if (!string.IsNullOrEmpty(QtyBrkCls))
            {
                return this.UnitOfWork.GetRepository<PriceMatrix>().GetTable().Where(x => x.ProductKeyPart == QtyBrkCls && x.CustomerKeyPart == "1" && x.CurrencyCode == "USD").ToList<PriceMatrix>();
            }
            else
            {
                return this.UnitOfWork.GetRepository<PriceMatrix>().GetTable().Where(x => x.ProductKeyPart == this.Product.Name && x.CustomerKeyPart == "1" && x.CurrencyCode == "USD").ToList<PriceMatrix>();
            }
        }

        protected override Decimal GetTempBasisValue(string priceBasis, IList<PriceMatrix> priceMatrixList, PricingServiceParameter pricingServiceParameter, bool regularPrice)
        {

            Decimal num = new Decimal();
            if (priceBasis.IsBlank())
                return num;
            if (!string.IsNullOrEmpty(priceBasis) && priceBasisList.Contains(priceBasis, StringComparer.OrdinalIgnoreCase))
            {
                var altAmount = GetPriceListAmount(priceBasis);
                if (!string.IsNullOrEmpty(altAmount) && decimal.TryParse(altAmount, out num))
                    return num;
            }
            return num;
        }

        protected override void SalePriceCheck(PricingServiceParameter pricingServiceParameter, PriceAndPriceBreaks priceAndBreaks, IList<PriceMatrix> priceMatrixList)
        {
            PriceMatrix selectedPriceMatrix = GetMatchedPriceMatrix(priceMatrixList);
            if (selectedPriceMatrix != null)
            {
                List<ProductPrice> list = this.GetProductPrice(priceMatrixList, pricingServiceParameter, selectedPriceMatrix, false).ToList<ProductPrice>();
                ProductPrice productPrice = null;
                if (this.OrderLine != null && !string.IsNullOrEmpty(this.OrderLine.SmartPart))
                {
                    if (Convert.ToDecimal(this.OrderLine.SmartPart) > 0)
                    {
                        productPrice = list.OrderByDescending<ProductPrice, Decimal>((Func<ProductPrice, Decimal>)(pb => pb.BreakQty)).FirstOrDefault<ProductPrice>((Func<ProductPrice, bool>)(b => b.BreakQty <= Convert.ToDecimal(this.OrderLine.SmartPart)));
                    }
                }
                else
                {
                    productPrice = list.OrderByDescending<ProductPrice, Decimal>((Func<ProductPrice, Decimal>)(pb => pb.BreakQty)).FirstOrDefault<ProductPrice>((Func<ProductPrice, bool>)(b => b.BreakQty <= pricingServiceParameter.QtyOrdered));
                }
                if (productPrice != null && productPrice.Price < priceAndBreaks.Price)
                {
                    priceAndBreaks.SetPrice(productPrice.Price, pricingServiceParameter.CurrencyCode);
                    priceAndBreaks.IsSalePrice = true;
                }
                priceAndBreaks.PriceBreaks = this.MergePriceBreaks(priceAndBreaks.PriceBreaks, list);
            }
            else
            {
                DateTimeOffset pricingDate1 = pricingServiceParameter.PricingDate;
                DateTimeOffset? nullable = this.Product.BasicSaleStartDate;
                if ((nullable.HasValue ? (pricingDate1 > nullable.GetValueOrDefault() ? 1 : 0) : 0) == 0)
                    return;
                nullable = this.Product.BasicSaleEndDate;
                if (nullable.HasValue)
                {
                    DateTimeOffset pricingDate2 = pricingServiceParameter.PricingDate;
                    nullable = this.Product.BasicSaleEndDate;
                    if ((nullable.HasValue ? (pricingDate2 < nullable.GetValueOrDefault() ? 1 : 0) : 0) == 0)
                        return;
                }
                if (!(priceAndBreaks.Price == Decimal.Zero) && (!(priceAndBreaks.Price > Decimal.Zero) || !(priceAndBreaks.Price > this.Product.BasicSalePrice)) || !(pricingServiceParameter.UnitOfMeasure == this.Product.UnitOfMeasure))
                    return;
                priceAndBreaks.SetPrice(this.Product.BasicSalePrice, this.BaseCurrency.CurrencyCode);
                priceAndBreaks.IsSalePrice = true;
            }
        }

        protected override PriceAndPriceBreaks GetPriceAndPriceBreaks(IList<PriceMatrix> priceMatrixList, PricingServiceParameter pricingServiceParameter, bool regularPrice)
        {
            PriceAndPriceBreaks priceAndPriceBreaks = new PriceAndPriceBreaks()
            {
                PriceBreaks = new List<ProductPrice>(),
                IsSalePrice = false
            };
            this.SetupRecordTypeMatrixQueries(pricingServiceParameter, regularPrice);
            this.SetupCommonMatrixQueries(pricingServiceParameter, regularPrice);
            this.SelectedPriceMatrix = GetMatchedPriceMatrix(priceMatrixList);
            if (this.SelectedPriceMatrix == null || this.GetPriceBracketByQty(this.SelectedPriceMatrix, pricingServiceParameter.QtyOrdered) == null)
            {
                this.SetBasicPricing(priceAndPriceBreaks, pricingServiceParameter, regularPrice);
                priceAndPriceBreaks.PriceBreaks = this.GetBreakPrices(this.SelectedPriceMatrix, this.GetCurrency(priceAndPriceBreaks.CurrencyCode));
            }
            else
            {
                IEnumerable<ProductPrice> productPrice1 = this.GetProductPrice(priceMatrixList, pricingServiceParameter, this.SelectedPriceMatrix, regularPrice);
                priceAndPriceBreaks.PriceBreaks.AddRange(productPrice1);

                ProductPrice productPrice2 = null;
                if (this.OrderLine != null && !string.IsNullOrEmpty(this.OrderLine.SmartPart))
                {
                    if (Convert.ToDecimal(this.OrderLine.SmartPart) > 0)
                    {
                        productPrice2 = priceAndPriceBreaks.PriceBreaks.OrderByDescending<ProductPrice, Decimal>((Func<ProductPrice, Decimal>)(pb => pb.BreakQty)).FirstOrDefault<ProductPrice>((Func<ProductPrice, bool>)(b => b.BreakQty <= pricingServiceParameter.QtyOrdered));
                    }
                }
                else
                    productPrice2 = priceAndPriceBreaks.PriceBreaks.OrderByDescending<ProductPrice, Decimal>((Func<ProductPrice, Decimal>)(pb => pb.BreakQty)).FirstOrDefault<ProductPrice>((Func<ProductPrice, bool>)(b => b.BreakQty <= pricingServiceParameter.QtyOrdered));
                if (productPrice2 != null)
                    priceAndPriceBreaks.SetPrice(productPrice2.Price, pricingServiceParameter.CurrencyCode);
            }
            if (!regularPrice)
                this.SalePriceCheck(pricingServiceParameter, priceAndPriceBreaks, priceMatrixList);
            this.ZeroPriceCheck(priceAndPriceBreaks, pricingServiceParameter, priceMatrixList);
            this.ConfigurePrice(pricingServiceParameter, priceAndPriceBreaks);
            this.AdvancedConfigurationPrice(pricingServiceParameter, priceAndPriceBreaks);
            if (priceAndPriceBreaks.Price <= Decimal.Zero)
                priceAndPriceBreaks = this.CheckUnitOfMeasurePricing(priceMatrixList, pricingServiceParameter, priceAndPriceBreaks, regularPrice);
            return priceAndPriceBreaks;
        }

        protected override List<string> GetMatrixProducts(PricingServiceParameter pricingServiceParameter)
        {
            List<string> stringList = new List<string>() { this.Product.Id.ToString() };
            var productContrCode = this.Product.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("ProductContractCode")).FirstOrDefault();
            if (productContrCode != null && !string.IsNullOrEmpty(productContrCode.Value) && !stringList.Contains(productContrCode.Value))
                stringList.Add(productContrCode.Value);
            if (!this.Product.ProductCode.IsBlank() && !stringList.Contains(this.Product.ProductCode))
            {
                stringList.Add(this.Product.ProductCode);
                // BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Starts
                if (!string.IsNullOrEmpty(this.Product.ProductCode))
                {
                    stringList.Add(this.Product.ProductCode.Substring(0, (this.Product.ProductCode.Length) - 2));
                }
                // BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Ends
            }
            return stringList;
        }

        protected override IEnumerable<ProductPrice> GetProductPrice(IList<PriceMatrix> priceMatrixList, PricingServiceParameter pricingServiceParameter, PriceMatrix selectedPriceMatrix, bool regularPrice)
        {
            List<ProductPrice> productPriceList = new List<ProductPrice>();
            List<PriceBracket> matrixBrackets = this.GetMatrixBrackets(selectedPriceMatrix);
            CurrencyDto currency = this.GetCurrency(selectedPriceMatrix.CurrencyCode);
            Decimal basePrice = this.GetBasePrice(pricingServiceParameter);
            foreach (PriceBracket priceBracket1 in matrixBrackets)
            {
                PriceData priceData1 = new PriceData();
                priceData1.PricingServiceParameter = pricingServiceParameter;
                Product product = this.Product;
                priceData1.Product = product;
                Customer billTo = this.BillTo;
                priceData1.BillTo = billTo;
                Customer shipTo = GetSiteContextShipTo();//BUSA-42 : Duplicate Customers on Production.
                priceData1.ShipTo = shipTo;
                List<PriceBracket> priceBracketList = matrixBrackets;
                priceData1.MatrixBrackets = priceBracketList;
                PriceBracket priceBracket2 = priceBracket1;
                priceData1.PriceBracket = priceBracket2;
                if (selectedPriceMatrix.RecordType.EqualsIgnoreCase("Product"))
                {
                    var priceBracket = GetAllCustomerItemPriceBracket();
                    if (priceBracket != null)
                    {
                        priceData1.PriceBracket.AdjustmentType = priceBracket.AdjustmentType;
                        priceData1.PriceBracket.PriceBasis = priceBracket.PriceBasis;
                        priceData1.PriceBracket.Amount = priceBracket.Amount;
                        priceData1.PriceBracket.AltAmount = priceBracket.AltAmount;
                    }
                }
                Decimal num = basePrice;
                priceData1.BasePrice = num;
                string calculationFlags = selectedPriceMatrix.CalculationFlags;
                priceData1.CalculationFlags = calculationFlags;
                if (selectedPriceMatrix.RecordType.EqualsIgnoreCase("Product"))
                    priceData1.TempBasis = priceData1.PriceBracket.AltAmount;
                else
                    priceData1.TempBasis = this.GetTempBasisValue(priceBracket1.PriceBasis, priceMatrixList, pricingServiceParameter, regularPrice);
                PriceData priceData = priceData1;
                IPriceCalculation priceCalculation = this.PriceCalculations.FirstOrDefault<IPriceCalculation>((Func<IPriceCalculation, bool>)(r => r.IsMatch(priceData)));
                if (priceCalculation != null)
                {
                    ProductPrice productPrice = new ProductPrice();
                    productPrice.BreakQty = priceData.PriceBracket.BreakQty;
                    if (regularPrice)
                    {
                        //Start:Revert BUSA 682 :The Base price of the product in ERP and the base price of the same product on the PDP are different.Revert BUSA: 696 Acct #78803:1076826 - Product (5011768U0) price differs in ERP and on the PDP.
                        var price = GetPriceListAmount("P2");
                        productPrice.Price = !string.IsNullOrEmpty(price) ? Convert.ToDecimal(price) : this.Product.BasicListPrice;

                        //End:Revert BUSA 682 :The Base price of the product in ERP and the base price of the same product on the PDP are different.Revert BUSA: 696 Acct #78803:1076826 - Product (5011768U0) price differs in ERP and on the PDP.
                    }
                    else
                        productPrice.Price = priceCalculation.CalculatePrice(priceData);

                    productPrice.Price = this.ApplyProductMultiplier(pricingServiceParameter, productPrice.Price);
                    productPrice.Price = selectedPriceMatrix.UnitOfMeasure == pricingServiceParameter.UnitOfMeasure || selectedPriceMatrix.UnitOfMeasure.IsBlank() && pricingServiceParameter.UnitOfMeasure == this.Product.UnitOfMeasure || priceBracket1.PriceBasis.Equals("CLM", StringComparison.OrdinalIgnoreCase) ? productPrice.Price : this.AdjustForUnitOfMeasure(pricingServiceParameter, productPrice.Price);
                    productPrice.PriceDisplay = this.CurrencyFormatProvider.GetString(productPrice.Price, currency);
                    productPriceList.Add(productPrice);
                }
            }
            return productPriceList;
        }

        public PriceMatrix GetMatchedPriceMatrix(IList<PriceMatrix> priceMatrixList)
        {
            PriceMatrix priceMatrix = null;

            //Commented for BUSA-431 : if ship to price code is null, then consider bill to price code. 
            //string currentCustomerId = this.ShipTo != null ? this.ShipTo.Id.ToString() : string.Empty;
            //string currentCustomerPriceCode = this.ShipTo != null ? this.ShipTo.PriceCode : string.Empty;

            //BUSA-42 : Duplicate Customers on Production Starts
            string currentCustomerId = string.Empty;
            var siteContextShipTo = SiteContext.Current.ShipTo;

            if (siteContextShipTo != null && siteContextShipTo.Id != null)
            {
                if (this.ShipTo.CustomerSequence.ToUpper().Contains("ISC"))
                {
                    currentCustomerId = siteContextShipTo.CustomProperties.FirstOrDefault(p => p.Name == "prevShipToId")?.Value ?? siteContextShipTo.Id.ToString();

                    //currentCustomerId = siteContextShipTo.Id.ToString();
                }
                else
                {
                    currentCustomerId = this.ShipTo != null ? this.ShipTo.Id.ToString() : this.BillTo != null ? this.BillTo.Id.ToString() : string.Empty;
                }
            }
            else
            {
                currentCustomerId = this.ShipTo != null ? this.ShipTo.Id.ToString() : this.BillTo != null ? this.BillTo.Id.ToString() : string.Empty;
            }
            //BUSA-42 : Duplicate Customers on Production Ends.

            string currentCustomerPriceCode = this.ShipTo != null ? !string.IsNullOrEmpty(this.ShipTo.PriceCode) ? this.ShipTo.PriceCode : !string.IsNullOrEmpty(this.BillTo.PriceCode) ? this.BillTo.PriceCode : string.Empty : string.Empty;

            //BUSA-431 changes end

            string currentProductId = this.Product.Id.ToString();
            string currentProductPriceCode = this.Product.ProductCode;
            var productContractCode = this.Product.CustomProperties.Where(c => c.Name.EqualsIgnoreCase("ProductContractCode")).FirstOrDefault() != null ? this.Product.CustomProperties.Where(c => c.Name.EqualsIgnoreCase("ProductContractCode")).FirstOrDefault().Value : string.Empty;
            IEnumerable<PriceMatrix> availablePriceMatrices;
            if (priceMatrixList != null && priceMatrixList.Count > 0)
            {
                if (!string.IsNullOrEmpty(currentCustomerId) && priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerId)).FirstOrDefault() != null)
                {
                    //Added if condition to exclude to exclude priceMatrix records having deactivation date in the past
                    if (priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerId)).FirstOrDefault().DeactivateOn == null || priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerId)).FirstOrDefault().DeactivateOn >= DateTime.Now)
                    {
                        availablePriceMatrices = priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerId));
                        //Customer / Item
                        if (availablePriceMatrices.Where(p => p.RecordType.EqualsIgnoreCase("Customer/Product")).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.RecordType.EqualsIgnoreCase("Customer/Product")).FirstOrDefault();
                        //Customer / Item Contract Code
                        else if (!string.IsNullOrEmpty(productContractCode) && availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(productContractCode)).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(productContractCode)).FirstOrDefault();
                        //Customer / Item Class 
                        else if (!string.IsNullOrEmpty(currentProductPriceCode) && availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(currentProductPriceCode)).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(currentProductPriceCode)).FirstOrDefault();
                    }
                }
                else if (!string.IsNullOrEmpty(currentCustomerPriceCode) && priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerPriceCode)).FirstOrDefault() != null)
                {
                    //Added if condition to exclude priceMatrix records having deactivation date in the past  
                    if (priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerPriceCode)).FirstOrDefault().DeactivateOn >= DateTime.Now || (priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerPriceCode)).FirstOrDefault().DeactivateOn) == null)
                    {
                        availablePriceMatrices = priceMatrixList.Where(p => p.CustomerKeyPart.EqualsIgnoreCase(currentCustomerPriceCode));
                        // BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Starts
                        if (availablePriceMatrices.Where(p => p.RecordType.EqualsIgnoreCase("Customer Price Code/Product Price Code")).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.RecordType.EqualsIgnoreCase("Customer Price Code/Product Price Code")).FirstOrDefault();
                        // BUSA-555 : Pricing issue for Customer 1061091 TLC FOR SMILES Ends
                        //Customer Contract Code / Item
                        if (availablePriceMatrices.Where(p => p.RecordType.EqualsIgnoreCase("Customer Price Code/Product")).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.RecordType.EqualsIgnoreCase("Customer Price Code/Product")).FirstOrDefault();
                        //Customer Contract Code / Item Contract Code
                        else if (!string.IsNullOrEmpty(productContractCode) && availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(productContractCode)).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(productContractCode)).FirstOrDefault();
                        //Customer Contract Code / Item Class
                        else if (!string.IsNullOrEmpty(currentProductPriceCode) && availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(currentProductPriceCode)).FirstOrDefault() != null)
                            return availablePriceMatrices.Where(p => p.ProductKeyPart.EqualsIgnoreCase(currentProductPriceCode)).FirstOrDefault();
                    }
                }
                else if (priceMatrixList.Count == 1 && priceMatrixList.FirstOrDefault().CustomerKeyPart == "1")
                {
                    availablePriceMatrices = priceMatrixList;
                    return availablePriceMatrices.FirstOrDefault();
                }
                else
                {
                    availablePriceMatrices = priceMatrixList.Where(p => p.RecordType.EqualsIgnoreCase("Product"));
                    //Any Customer / Item
                    if (availablePriceMatrices.FirstOrDefault() != null)
                        return availablePriceMatrices.FirstOrDefault();
                    //Any Customer / Item Class
                    else if (!string.IsNullOrEmpty(currentProductPriceCode) && priceMatrixList.Where(p => p.RecordType.EqualsIgnoreCase("Product Price Code") && p.ProductKeyPart.EqualsIgnoreCase(currentProductPriceCode)).FirstOrDefault() != null)
                        return priceMatrixList.Where(p => p.RecordType.EqualsIgnoreCase("Product Price Code") && p.ProductKeyPart.EqualsIgnoreCase(currentProductPriceCode)).FirstOrDefault();
                }
            }
            return priceMatrix;
        }

        public string GetPriceListAmount(string pricebasis)
        {
            if (!string.IsNullOrEmpty(pricebasis))
            {
                var priceListNo = 0;
                switch (pricebasis)
                {
                    case "P1":
                        priceListNo = 0;
                        break;
                    case "P2":
                        priceListNo = 1;
                        break;
                    case "P3":
                        priceListNo = 2;
                        break;
                    case "P4":
                        priceListNo = 3;
                        break;
                    case "P5":
                        priceListNo = 4;
                        break;
                    case "P6":
                        priceListNo = 5;
                        break;
                }
                var priceList = this.Product.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("Price" + priceListNo)).FirstOrDefault();
                if (priceListNo < 1 && this.ShipTo != null)
                {
                    var defaultPriceList = this.ShipTo.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("DefaultPriceList")).FirstOrDefault();
                    if (defaultPriceList != null && !string.IsNullOrEmpty(defaultPriceList.Value) && int.TryParse(defaultPriceList.Value, out priceListNo))
                        priceList = this.Product.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("Price" + priceListNo)).FirstOrDefault();
                }
                if (priceList != null)
                    return priceList.Value;
                else
                    return null;
            }
            else
                return null;
        }

        public PriceBracket GetAllCustomerItemPriceBracket()
        {
            if (this.ShipTo != null)
            {
                PriceBracket priceBracket = new PriceBracket();
                List<ERPPriceMatrixModel> lstpricematrix = new List<ERPPriceMatrixModel>();
                var erpPricematrix = this.Product.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("ERPPriceMatrix")).FirstOrDefault();
                var defaultPriceList = this.ShipTo.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("DefaultPriceList")).FirstOrDefault();
                var priceDiscountCode = this.ShipTo.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("PriceDiscountCode")).FirstOrDefault();
                if (erpPricematrix != null && !string.IsNullOrEmpty(erpPricematrix.Value) && priceDiscountCode != null && !string.IsNullOrEmpty(priceDiscountCode.Value))
                {
                    if (erpPricematrix.Value.Contains("|") && erpPricematrix.Value.Split('|').Count() > 0)
                    {
                        var pricematrices = erpPricematrix.Value.Split('|');
                        foreach (var item in pricematrices)
                        {
                            var formattedstring = "{'" + item.Replace("=", "':'").Replace(",", "','") + "'}";
                            var lstitem = JsonConvert.DeserializeObject<ERPPriceMatrixModel>(formattedstring);
                            if (lstitem != null && lstitem.CompanyNo.Equals(this.ShipTo.CustomerNumber[0].ToString()))
                                lstpricematrix.Add(lstitem);
                        }
                    }
                    if (lstpricematrix.Count > 0)
                    {
                        var matchedMatrix = lstpricematrix.Where(p => p.PriceDiscountCode.Equals(priceDiscountCode.Value)).FirstOrDefault();
                        if (matchedMatrix != null)
                        {
                            priceBracket.AdjustmentType = matchedMatrix.MarkupCode.EqualsIgnoreCase("$") ? "A" : "P";
                            string priceListNo = "1";
                            if (!string.IsNullOrEmpty(matchedMatrix.CustomerPriceList) && matchedMatrix.MarkupCode.EqualsIgnoreCase("D"))
                            {
                                if (matchedMatrix.CustomerPriceList.Equals("0") && defaultPriceList != null && !string.IsNullOrEmpty(defaultPriceList.Value))
                                    priceListNo = defaultPriceList.Value;
                                else
                                    priceListNo = matchedMatrix.CustomerPriceList;
                            }
                            priceBracket.PriceBasis = matchedMatrix.MarkupCode.EqualsIgnoreCase("$") ? "O" : "P" + priceListNo;
                            // BUSA-568 : Pricing Issue - Acct # 80899 Gary Ackerman, DDS Starts
                            var priceClass = this.Product.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("PriceClass")).FirstOrDefault();
                            if (priceClass != null && priceClass.Value == "0")
                            {
                                priceBracket.Amount = 0;
                            }
                            else
                            {
                                priceBracket.Amount = Convert.ToDecimal(matchedMatrix.MarkupCode.EqualsIgnoreCase("$") ? matchedMatrix.Discount : "-" + matchedMatrix.Discount);
                            }
                            // BUSA-568 : Pricing Issue - Acct # 80899 Gary Ackerman, DDS Ends
                            if (matchedMatrix.MarkupCode.EqualsIgnoreCase("D"))
                            {
                                var pricelist = this.Product.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("Price" + priceListNo)).FirstOrDefault();
                                //BUSA-482 : Pricing Issue Defaut Price List PL4 Starts
                                var defaultPriceListCust = this.ShipTo.CustomProperties.Where(p => p.Name.EqualsIgnoreCase("DefaultPriceList")).FirstOrDefault();

                                if (defaultPriceListCust != null)
                                {
                                    if (!string.IsNullOrEmpty(defaultPriceListCust.Value))
                                    {
                                        if (defaultPriceListCust.Value == "4")
                                        {
                                            var priceListAmt = GetPriceListAmount("P1");
                                            decimal amt = 0;
                                            if (!string.IsNullOrEmpty(priceListAmt) && decimal.TryParse(priceListAmt, out amt))
                                            {
                                                priceBracket.AdjustmentType = "A";
                                                priceBracket.PriceBasis = "O";
                                                priceBracket.Amount = amt;
                                                return priceBracket;
                                            }
                                        }
                                        else
                                        {
                                            decimal altAmount = 0;
                                            if (pricelist != null && !string.IsNullOrEmpty(pricelist.Value) && decimal.TryParse(pricelist.Value, out altAmount))
                                                priceBracket.AltAmount = altAmount;
                                        }
                                    }
                                }
                                //BUSA-482 : Pricing Issue Defaut Price List PL4 Ends
                                else
                                {
                                    decimal altAmount = 0;
                                    if (pricelist != null && !string.IsNullOrEmpty(pricelist.Value) && decimal.TryParse(pricelist.Value, out altAmount))
                                        priceBracket.AltAmount = altAmount;
                                }
                            }
                            return priceBracket;
                        }

                    }
                }

                // BUSA-498 Uncommented for the condition i.e. customer price discount code is 0. Refer line # 317 for the condition.
                var priceListAmount = GetPriceListAmount("P1");
                decimal amount = 0;
                if (!string.IsNullOrEmpty(priceListAmount) && decimal.TryParse(priceListAmount, out amount))
                {
                    priceBracket.AdjustmentType = "A";
                    priceBracket.PriceBasis = "O";
                    priceBracket.Amount = amount;
                    return priceBracket;
                }
                // BUSA-498 Ends
            }
            return null;
        }

        //BUSA-472 : Duplicate Customers on Production Starts
        protected override Customer GetPricingCustomer()
        {
            Customer shipTo = GetSiteContextShipTo();

            Customer customer = shipTo != null ? shipTo.PricingCustomer : (Customer)null;
            if (customer != null)
                return customer;
            Customer billTo = this.BillTo;
            return (billTo != null ? billTo.PricingCustomer : (Customer)null) ?? shipTo ?? this.BillTo;
        }

        public Customer GetSiteContextShipTo()
        {
            var siteShipToContext = SiteContext.Current.ShipTo;
            Customer shipTo = null;

            if (this.ShipTo != null)
            {
                if (this.ShipTo.CustomerSequence.ToUpper().Contains("ISC"))
                {
                    if (siteShipToContext != null)
                    {
                        var id = siteShipToContext.CustomProperties.FirstOrDefault(p => p.Name == "prevShipToId")?.Value ?? string.Empty;
                        if (!string.IsNullOrEmpty(id)) {
                            shipTo = this.UnitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(p => p.Id == new Guid(id)) ?? siteShipToContext;
                        }
                        else { shipTo = siteShipToContext; }
                        //shipTo = siteShipToContext;
                    }
                    else
                    {
                        shipTo = this.ShipTo;
                    }
                }
                else
                {
                    shipTo = this.ShipTo;
                }
            }
            else
            {
                shipTo = this.ShipTo;
            }
            return shipTo;
        }
        //BUSA-472 : Duplicate Customers on Production Ends
    }
}