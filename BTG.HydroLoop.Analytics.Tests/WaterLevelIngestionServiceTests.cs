using Grpc.Core;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using NSubstitute;
using BTG.HydroLoop.Analytics.Api.Hubs;
using BTG.HydroLoop.Analytics.Api.Models;
using BTG.HydroLoop.Analytics.Api.Protos;
using BTG.HydroLoop.Analytics.Api.Services;
using BTG.HydroLoop.Analytics.Api.State;
using BTG.HydroLoop.Analytics.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BTG.HydroLoop.Analytics.Tests;

public class WaterLevelIngestionServiceTests : IDisposable
{
    private readonly TelemetryDbContext _dbContext;
    private readonly TelemetryStateManager _stateManager;
    private readonly IHubContext<WaterLevelHub> _hubContext;
    private readonly IHubClients _hubClients;
    private readonly IClientProxy _clientProxy;
    private readonly ILogger<WaterLevelIngestionService> _logger;
    private readonly WaterLevelIngestionService _service;

    public WaterLevelIngestionServiceTests()
    {
        var options = new DbContextOptionsBuilder<TelemetryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new TelemetryDbContext(options);
        _dbContext.Database.EnsureCreated();

        var stateManagerLogger = Substitute.For<ILogger<TelemetryStateManager>>();
        _stateManager = new TelemetryStateManager(_dbContext, stateManagerLogger);

        _hubContext = Substitute.For<IHubContext<WaterLevelHub>>();
        _hubClients = Substitute.For<IHubClients>();
        _clientProxy = Substitute.For<IClientProxy>();
        _logger = Substitute.For<ILogger<WaterLevelIngestionService>>();

        // Setup mock SignalR call hierarchy
        _hubContext.Clients.Returns(_hubClients);
        _hubClients.All.Returns(_clientProxy);

        _service = new WaterLevelIngestionService(_stateManager, _hubContext, _logger);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    [Fact]
    public async Task PushTelemetry_ShouldSucceedAndBroadcast_WhenRequestIsValid()
    {
        // Arrange
        var request = new TelemetryRequest
        {
            TankId = "Tank-QA-01",
            WaterLevelPercentage = 78.45,
            TimestampUtc = 1717150000 // Fixed epoch timestamp
        };

        // Act
        var response = await _service.PushTelemetry(request, CreateMockServerCallContext());
        var storedReadings = _stateManager.GetLastReadings();

        // Assert
        Assert.True(response.Success);
        Assert.Contains("successfully", response.Message);
        
        // Assert State Updates
        Assert.Single(storedReadings);
        var reading = storedReadings[0];
        Assert.Equal("Tank-QA-01", reading.TankId);
        Assert.Equal(78.45, reading.WaterLevelPercentage);
        Assert.Equal(DateTimeOffset.FromUnixTimeSeconds(1717150000).UtcDateTime, reading.TimestampUtc);

        // Assert SignalR Broadcast
        await _clientProxy.Received(1).SendCoreAsync(
            "ReceiveTelemetry", 
            Arg.Is<object[]>(args => 
                args.Length == 1 && 
                args[0] is WaterLevelReading && 
                ((WaterLevelReading)args[0]).TankId == "Tank-QA-01" &&
                ((WaterLevelReading)args[0]).WaterLevelPercentage == 78.45
            )
        );
    }

    [Fact]
    public async Task PushTelemetry_ShouldFail_WhenTankIdIsEmpty()
    {
        // Arrange
        var request = new TelemetryRequest
        {
            TankId = "",
            WaterLevelPercentage = 75.0,
            TimestampUtc = 1717150000
        };

        // Act
        var response = await _service.PushTelemetry(request, CreateMockServerCallContext());
        var storedReadings = _stateManager.GetLastReadings();

        // Assert
        Assert.False(response.Success);
        Assert.Contains("Invalid TankId", response.Message);
        Assert.Empty(storedReadings);

        // Assert SignalR Broadcast did not occur
        await _clientProxy.DidNotReceiveWithAnyArgs().SendCoreAsync(default!, default!);
    }

    [Theory]
    [InlineData(-1.5)]
    [InlineData(100.1)]
    [InlineData(150.0)]
    public async Task PushTelemetry_ShouldFail_WhenPercentageOutOfBounds(double invalidPercentage)
    {
        // Arrange
        var request = new TelemetryRequest
        {
            TankId = "Tank-01",
            WaterLevelPercentage = invalidPercentage,
            TimestampUtc = 1717150000
        };

        // Act
        var response = await _service.PushTelemetry(request, CreateMockServerCallContext());
        var storedReadings = _stateManager.GetLastReadings();

        // Assert
        Assert.False(response.Success);
        Assert.Contains("Invalid WaterLevelPercentage", response.Message);
        Assert.Empty(storedReadings);

        // Assert SignalR Broadcast did not occur
        await _clientProxy.DidNotReceiveWithAnyArgs().SendCoreAsync(default!, default!);
    }

    [Fact]
    public async Task PushTelemetry_ShouldFallbackToUtcNow_WhenTimestampIsZeroOrNegative()
    {
        // Arrange
        var request = new TelemetryRequest
        {
            TankId = "Tank-01",
            WaterLevelPercentage = 82.0,
            TimestampUtc = 0
        };

        var beforeCall = DateTime.UtcNow;

        // Act
        var response = await _service.PushTelemetry(request, CreateMockServerCallContext());
        var readings = _stateManager.GetLastReadings();

        var afterCall = DateTime.UtcNow;

        // Assert
        Assert.True(response.Success);
        Assert.Single(readings);
        
        var reading = readings[0];
        Assert.True(reading.TimestampUtc >= beforeCall.AddSeconds(-2));
        Assert.True(reading.TimestampUtc <= afterCall.AddSeconds(2));
    }

    private ServerCallContext CreateMockServerCallContext()
    {
        return Substitute.For<ServerCallContext>();
    }
}
