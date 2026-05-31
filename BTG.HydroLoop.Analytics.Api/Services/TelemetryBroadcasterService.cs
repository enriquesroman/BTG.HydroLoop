using BTG.HydroLoop.Analytics.Api.Events;
using BTG.HydroLoop.Analytics.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BTG.HydroLoop.Analytics.Api.Services;

public class TelemetryBroadcasterService : IHostedService
{
    private readonly ITelemetryEventBus _eventBus;
    private readonly IHubContext<WaterLevelHub> _hubContext;

    public TelemetryBroadcasterService(ITelemetryEventBus eventBus, IHubContext<WaterLevelHub> hubContext)
    {
        _eventBus = eventBus;
        _hubContext = hubContext;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _eventBus.OnTelemetryIngested += HandleTelemetryIngested;
        return Task.CompletedTask;
    }

    private async void HandleTelemetryIngested(object? sender, TelemetryIngestedEvent e)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveTelemetry", e.Reading);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _eventBus.OnTelemetryIngested -= HandleTelemetryIngested;
        return Task.CompletedTask;
    }
}
