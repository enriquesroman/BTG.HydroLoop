using BTG.HydroLoop.Analytics.Api.Data;
using BTG.HydroLoop.Analytics.Api.Models;
using BTG.HydroLoop.Analytics.Api.State;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BTG.HydroLoop.Analytics.Tests;

public class TelemetryStateManagerTests
{
    private TelemetryDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TelemetryDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        
        return new TelemetryDbContext(options);
    }

    private TelemetryStateManager CreateStateManager(TelemetryDbContext dbContext)
    {
        var logger = Substitute.For<ILogger<TelemetryStateManager>>();
        return new TelemetryStateManager(dbContext, logger);
    }

    [Fact]
    public void AddReading_ShouldAddReadingSuccessfully()
    {
        // Arrange
        var dbName = nameof(AddReading_ShouldAddReadingSuccessfully);
        using var dbContext = CreateInMemoryDbContext(dbName);
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();

        var stateManager = CreateStateManager(dbContext);
        var reading = new WaterLevelReading("Tank-01", 75.5, DateTime.UtcNow);

        // Act
        stateManager.AddReading(reading);
        var readings = stateManager.GetLastReadings();

        // Assert
        Assert.Single(readings);
        Assert.Equal(reading.TankId, readings[0].TankId);
        Assert.Equal(reading.WaterLevelPercentage, readings[0].WaterLevelPercentage);
    }

    [Fact]
    public void AddReading_ShouldLimitCapacityToExactlyTwenty()
    {
        // Arrange
        var dbName = nameof(AddReading_ShouldLimitCapacityToExactlyTwenty);
        using var dbContext = CreateInMemoryDbContext(dbName);
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();

        var stateManager = CreateStateManager(dbContext);
        var baseTime = DateTime.UtcNow;

        // Act - Add 25 readings
        for (int i = 1; i <= 25; i++)
        {
            var reading = new WaterLevelReading("Tank-01", 70.0 + i, baseTime.AddSeconds(i));
            stateManager.AddReading(reading);
        }

        var readings = stateManager.GetLastReadings();

        // Assert
        Assert.Equal(20, readings.Count);
        // The first 5 should be discarded, so the first element in history should be reading index 6 (level 76.0)
        Assert.Equal(76.0, readings[0].WaterLevelPercentage);
        // The last element in history should be reading index 25 (level 95.0)
        Assert.Equal(95.0, readings[19].WaterLevelPercentage);
    }

    [Fact]
    public void GetLastReadings_ShouldReturnReadingsInChronologicalOrder()
    {
        // Arrange
        var dbName = nameof(GetLastReadings_ShouldReturnReadingsInChronologicalOrder);
        using var dbContext = CreateInMemoryDbContext(dbName);
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();

        var stateManager = CreateStateManager(dbContext);
        var time = DateTime.UtcNow;
        var r1 = new WaterLevelReading("Tank-01", 71.0, time);
        var r2 = new WaterLevelReading("Tank-01", 72.0, time.AddSeconds(1));
        var r3 = new WaterLevelReading("Tank-01", 73.0, time.AddSeconds(2));

        // Act
        stateManager.AddReading(r1);
        stateManager.AddReading(r2);
        stateManager.AddReading(r3);
        var readings = stateManager.GetLastReadings();

        // Assert
        Assert.Equal(3, readings.Count);
        Assert.Equal(r1.WaterLevelPercentage, readings[0].WaterLevelPercentage);
        Assert.Equal(r2.WaterLevelPercentage, readings[1].WaterLevelPercentage);
        Assert.Equal(r3.WaterLevelPercentage, readings[2].WaterLevelPercentage);
    }

    [Fact]
    public async Task AddReading_ShouldBeThreadSafe()
    {
        // Arrange
        var dbName = nameof(AddReading_ShouldBeThreadSafe);
        using (var initContext = CreateInMemoryDbContext(dbName))
        {
            initContext.Database.EnsureDeleted();
            initContext.Database.EnsureCreated();
        }

        int threadCount = 10;
        int itemsPerThread = 50;
        var tasks = new List<Task>();

        // Act
        for (int t = 0; t < threadCount; t++)
        {
            int threadId = t;
            tasks.Add(Task.Run(() =>
            {
                for (int i = 0; i < itemsPerThread; i++)
                {
                    // Create a separate DbContext and StateManager instance per write, 
                    // mimicking ASP.NET Core scoped DI container behavior.
                    using var threadContext = CreateInMemoryDbContext(dbName);
                    var stateManager = CreateStateManager(threadContext);
                    stateManager.AddReading(new WaterLevelReading($"Tank-{threadId}", 75.0, DateTime.UtcNow));
                }
            }));
        }

        await Task.WhenAll(tasks);

        using var verifyContext = CreateInMemoryDbContext(dbName);
        var verifyStateManager = CreateStateManager(verifyContext);
        var readings = verifyStateManager.GetLastReadings();

        // Assert
        // The capacity should still be exactly 20, even under high concurrent writes
        Assert.Equal(20, readings.Count);
    }
}
