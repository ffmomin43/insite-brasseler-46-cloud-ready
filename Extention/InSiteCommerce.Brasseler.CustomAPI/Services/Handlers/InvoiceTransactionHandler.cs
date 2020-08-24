using Insite.Core.Interfaces.Data;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Handlers
{
    public class InvoiceTransactionHandler
    {
        protected readonly IUnitOfWork unitOfWork;

        public InvoiceTransactionHandler(IUnitOfWorkFactory unitOfWorkFactory)
        {
            this.unitOfWork = unitOfWorkFactory.GetUnitOfWork();
        }

        public void CreateInvoiceTransaction(PayOpenInvoicesRequest invoiceRequest,string reason,Boolean status)
        {
            InvoiceInforTransaction invoiceInforTransaction = new InvoiceInforTransaction();            

            if (invoiceRequest != null)
            {
                invoiceInforTransaction.TransactionId = Guid.NewGuid() ;
                invoiceInforTransaction.PostedToInfor = status;
                invoiceInforTransaction.InvoiceNumber = invoiceRequest.Invoice.ToJson();
                invoiceInforTransaction.CCMaskedCard = invoiceRequest.CreditCard.CCMaskedCard;
                invoiceInforTransaction.CardType = invoiceRequest.CreditCard.CCCardType;
                invoiceInforTransaction.AuthCode = invoiceRequest.CreditCard.CCAuthorizationNumber;
                invoiceInforTransaction.CCReferenceNumber = invoiceRequest.CreditCard.CCReferenceNumber;
                invoiceInforTransaction.InforMessage = reason;
                invoiceInforTransaction.CustomerNumber = invoiceRequest.Head.CompanyNumber + invoiceRequest.Head.CustomerNumber; //BUSA-1123 To add customer number in Infor table.
                this.unitOfWork.GetRepository<InvoiceInforTransaction>().Insert(invoiceInforTransaction);


                for (int i = 0; i < invoiceRequest.Invoice.Count; i++)
                {
                    InvoiceTransaction invoiceTransaction = new InvoiceTransaction();
                    invoiceTransaction.InvoiceInforTransactionId = invoiceInforTransaction.TransactionId;
                    invoiceTransaction.InvoiceNumber = invoiceRequest.Invoice[i].InvoiceNo;
                    invoiceTransaction.AmountPaid = Convert.ToDecimal(invoiceRequest.Invoice[i].PaymentAmount, CultureInfo.CreateSpecificCulture("en-US"));
                    invoiceTransaction.PostedToInfor = status;
                    invoiceTransaction.CCReferenceNumber = invoiceRequest.CreditCard.CCReferenceNumber;
                    invoiceTransaction.CustomerNumber = invoiceRequest.Head.CompanyNumber + invoiceRequest.Head.CustomerNumber;//BUSA-1123 To add customer number in Infor table.
                    this.unitOfWork.GetRepository<InvoiceTransaction>().Insert(invoiceTransaction);

                    
                }
            }
        }
    }
}
