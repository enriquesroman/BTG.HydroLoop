namespace BTG.HydroLoop.Analytics.Api.Events;

public class TelemetryEventBus : ITelemetryEventBus
{
    public event EventHandler<TelemetryIngestedEvent>? OnTelemetryIngested;

    public void Publish(TelemetryIngestedEvent telemetryEvent)
    {
        OnTelemetryIngested?.Invoke(this, telemetryEvent);
    }
}
