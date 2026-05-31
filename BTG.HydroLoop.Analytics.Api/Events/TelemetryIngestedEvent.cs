using BTG.HydroLoop.Analytics.Api.Models;

namespace BTG.HydroLoop.Analytics.Api.Events;

public record TelemetryIngestedEvent(WaterLevelReading Reading);
