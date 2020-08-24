<%@ Page Async="true" Language="C#" AutoEventWireup="true" CodeBehind="QuickPing.aspx.cs" Inherits="QuickPing" %>
<%@ Import Namespace="Insite.Core.HealthCheck" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title></title>
</head>
<body>
<form id="form1" runat="server">
    <div>
        <%
            var siteName = ConfigurationManager.AppSettings["SiteIdentifier"] ?? "InsiteCommerce";
            Response.Write(siteName + " QuickPing is " + (this.HealthCheckResults.Status == HealthCheckStatus.Healthy ? "good" : "bad") + " <br/><br/>");

            foreach (var healthCheckResult in this.HealthCheckResults.Results)
            {
                Response.Write((healthCheckResult.Name + " " + healthCheckResult).Replace(Environment.NewLine,"<br />") + " <br/><br/>");
            }

            Response.Write("QuickPing Duration: " + this.HealthCheckResults.Duration + " <br/><br/>");
        %>
    </div>
</form>
</body>
</html>
