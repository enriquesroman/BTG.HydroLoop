namespace BTG.HydroLoop.Analytics.Api.Events;

public interface ITelemetryEventBus
{
    event EventHandler<TelemetryIngestedEvent>? OnTelemetryIngested;
    void Publish(TelemetryIngestedEvent telemetryEvent);
}
