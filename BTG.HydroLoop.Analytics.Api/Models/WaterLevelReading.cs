namespace BTG.HydroLoop.Analytics.Api.Models;

/// <summary>
/// Domain model representing a single water level reading from a tank.
/// </summary>
/// <param name="TankId">The unique identifier of the tank.</param>
/// <param name="WaterLevelPercentage">The level of water, guaranteed to be in the range [0, 100].</param>
/// <param name="TimestampUtc">The UTC date and time the reading was taken.</param>
public record WaterLevelReading(
    string TankId, 
    double WaterLevelPercentage, 
    DateTime TimestampUtc
);
