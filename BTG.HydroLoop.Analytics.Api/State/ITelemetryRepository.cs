using BTG.HydroLoop.Analytics.Api.Models;

namespace BTG.HydroLoop.Analytics.Api.State;

public interface ITelemetryRepository
{
    void AddReading(WaterLevelReading reading);
    IReadOnlyList<WaterLevelReading> GetLastReadings(int limit = 20);
    void Clear();
}
