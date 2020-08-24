<%@ Page Language="C#" AutoEventWireup="true" %>
<%@ Import Namespace="Insite.Common.Dependencies" %>
<%@ Import Namespace="Insite.Core.Interfaces.Data" %>
<%@ Import Namespace="Insite.Data.Entities" %>
<%@ Import Namespace="Insite.Catalog.Services" %>
<%@ Import Namespace="Insite.Core.Plugins.Search" %>
<%@ Import Namespace="System.Net" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title></title>
</head>
<body>
<form id="form1" runat="server">
    <div>
        <%
            var isGood = true;

            try
            {
                var unitOfWork = DependencyLocator.Current.GetInstance<IUnitOfWorkFactory>().GetUnitOfWork();
                unitOfWork.GetRepository<Website>().GetTable().First();
                Response.Write("Database Check: Passed <br/>");
            }
            catch (Exception)
            {
                isGood = false;
                Response.Write("Database Check: Failed <br/>");

                if (Request.IsLocal)
                {
                    throw;
                }
            }

            try
            {

                var searchResults = DependencyLocator.Current.GetInstance<IProductSearchProvider>().GetSearchResults(new ProductSearchParameter
                {
                    PageSize = 1
                });
                if (searchResults.SortOptions == null)
                {
                    isGood = false;
                    Response.Write("Product Search Check: Failed <br/>");
                }
                else
                {
                    Response.Write("Product Search Check: Passed <br/>");
                }
            }
            catch (Exception)
            {
                isGood = false;

                Response.Write("Product Search Check: Failed <br/>");

                if (Request.IsLocal)
                {
                    throw;
                }
            }

        %>
        <br/>
        <% if (isGood)
           { %>
            <%= ConfigurationManager.AppSettings["SiteIdentifier"] ?? "InsiteCommerce" %> SimplePing is good
        <% } %>
        <%
           else
           {%>
            <% Response.StatusCode = 500; %>
            <%= ConfigurationManager.AppSettings["SiteIdentifier"] ?? "InsiteCommerce" %> SimplePing is bad
           <%} %>

    </div>
</form>
</body>
</html>
