namespace BTG.HydroLoop.Analytics.Api.Services;

public interface ITelemetryService
{
    (bool Success, string Message) IngestTelemetry(string tankId, double waterLevelPercentage, DateTime timestampUtc);
}
