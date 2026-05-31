namespace BTG.HydroLoop.Analytics.Api.Models;

public static class TelemetryMapper
{
    public static WaterLevelReading ToDomain(this WaterLevelReadingEntity entity)
    {
        if (entity == null) return null!;
        return new WaterLevelReading(entity.TankId, entity.WaterLevelPercentage, entity.TimestampUtc);
    }

    public static WaterLevelReadingEntity ToEntity(this WaterLevelReading domain)
    {
        if (domain == null) return null!;
        return new WaterLevelReadingEntity
        {
            TankId = domain.TankId,
            WaterLevelPercentage = domain.WaterLevelPercentage,
            TimestampUtc = domain.TimestampUtc
        };
    }
}
