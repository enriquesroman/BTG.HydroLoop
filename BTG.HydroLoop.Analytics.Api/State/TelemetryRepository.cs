using BTG.HydroLoop.Analytics.Api.Data;
using BTG.HydroLoop.Analytics.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BTG.HydroLoop.Analytics.Api.State;

/// <summary>
/// Thread-safe database-backed state manager for telemetry readings.
/// </summary>
public class TelemetryRepository : ITelemetryRepository
{
    private readonly TelemetryDbContext _dbContext;
    private readonly ILogger<TelemetryRepository> _logger;

    public TelemetryRepository(TelemetryDbContext dbContext, ILogger<TelemetryRepository> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Adds a telemetry reading to the persistent SQL Server database.
    /// </summary>
    public void AddReading(WaterLevelReading reading)
    {
        try
        {
            var entity = reading.ToEntity();
            _dbContext.WaterLevelReadings.Add(entity);
            _dbContext.SaveChanges();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist telemetry reading for Tank {TankId} to SQL Server.", reading.TankId);
            throw;
        }
    }

    /// <summary>
    /// Retrieves the chronological last 20 readings from the SQL Server database.
    /// </summary>
    public IReadOnlyList<WaterLevelReading> GetLastReadings(int limit = 20)
    {
        try
        {
            return _dbContext.WaterLevelReadings
                .OrderByDescending(r => r.TimestampUtc)
                .Take(limit)
                .AsNoTracking()
                .Select(r => new WaterLevelReading(r.TankId, r.WaterLevelPercentage, r.TimestampUtc))
                .AsEnumerable()
                .Reverse() // Order chronologically: oldest to newest
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to pull last 20 telemetry readings from SQL Server.");
            return Array.Empty<WaterLevelReading>();
        }
    }

    /// <summary>
    /// Clears the stored telemetry readings (useful for testing/resets).
    /// </summary>
    public void Clear()
    {
        try
        {
            _dbContext.WaterLevelReadings.ExecuteDelete();
            _dbContext.SaveChanges();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear telemetry readings from the database.");
            throw;
        }
    }
}
