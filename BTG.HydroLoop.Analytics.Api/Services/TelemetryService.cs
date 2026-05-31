using BTG.HydroLoop.Analytics.Api.Events;
using BTG.HydroLoop.Analytics.Api.Models;
using BTG.HydroLoop.Analytics.Api.State;

namespace BTG.HydroLoop.Analytics.Api.Services;

public class TelemetryService : ITelemetryService
{
    private readonly ITelemetryRepository _repository;
    private readonly ITelemetryEventBus _eventBus;
    private readonly ILogger<TelemetryService> _logger;

    public TelemetryService(
        ITelemetryRepository repository,
        ITelemetryEventBus eventBus,
        ILogger<TelemetryService> logger)
    {
        _repository = repository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public (bool Success, string Message) IngestTelemetry(string tankId, double waterLevelPercentage, DateTime timestampUtc)
    {
        if (string.IsNullOrWhiteSpace(tankId))
        {
            _logger.LogWarning("Telemetry push failed: Tank ID is empty.");
            return (false, "Invalid TankId. It must not be empty or whitespace.");
        }

        if (waterLevelPercentage < 0.0 || waterLevelPercentage > 100.0)
        {
            _logger.LogWarning("Telemetry push failed: Water level {Level}% out of bounds.", waterLevelPercentage);
            return (false, "Invalid WaterLevelPercentage. Must be between 0.0 and 100.0 inclusive.");
        }

        var reading = new WaterLevelReading(
            tankId,
            Math.Round(waterLevelPercentage, 2),
            timestampUtc
        );

        _repository.AddReading(reading);

        _logger.LogInformation(
            "Telemetry successfully ingested: Tank {TankId}, Level {Level}%, Time {Time:yyyy-MM-dd HH:mm:ss} UTC", 
            reading.TankId, 
            reading.WaterLevelPercentage, 
            reading.TimestampUtc
        );

        _eventBus.Publish(new TelemetryIngestedEvent(reading));

        return (true, "Telemetry ingested and broadcasted successfully.");
    }
}
