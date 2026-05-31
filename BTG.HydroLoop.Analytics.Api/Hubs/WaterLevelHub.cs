using Microsoft.AspNetCore.SignalR;
using BTG.HydroLoop.Analytics.Api.State;

namespace BTG.HydroLoop.Analytics.Api.Hubs;

/// <summary>
/// SignalR Hub that manages real-time socket connections with Angular dashboards.
/// </summary>
public class WaterLevelHub : Hub
{
    private readonly ITelemetryRepository _repository;

    public WaterLevelHub(ITelemetryRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Invoked automatically when a client connects. 
    /// Sends the historical last 20 readings directly to the caller.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var history = _repository.GetLastReadings();
        await Clients.Caller.SendAsync("ReceiveHistory", history);
        await base.OnConnectedAsync();
    }
}
