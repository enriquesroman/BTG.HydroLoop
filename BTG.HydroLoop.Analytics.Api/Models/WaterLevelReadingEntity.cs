namespace BTG.HydroLoop.Analytics.Api.Models;

/// <summary>
/// Database-mapped entity for telemetry readings, isolating database details from the public domain model.
/// </summary>
public class WaterLevelReadingEntity
{
    public int Id { get; set; }
    public string TankId { get; set; } = string.Empty;
    public double WaterLevelPercentage { get; set; }
    public DateTime TimestampUtc { get; set; }
}
