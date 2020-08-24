using System;
using System.Threading;
using System.Web.UI;
using Insite.Common.Dependencies;
using Insite.Core.HealthCheck;

public partial class QuickPing : Page
{
    protected HealthCheckResults HealthCheckResults { get; set; }

    protected void Page_Load(object sender, EventArgs e)
    {
        this.RegisterAsyncTask(new PageAsyncTask(async () =>
        {
            var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            var combined = CancellationTokenSource.CreateLinkedTokenSource(timeout.Token, this.Context.Request.TimedOutToken, this.Context.Response.ClientDisconnectedToken);

            var healthCheckManager = DependencyLocator.Current.GetInstance<IHealthCheckManager>();
            this.HealthCheckResults = await healthCheckManager.CheckHealth(combined.Token);
        }));
    }
}