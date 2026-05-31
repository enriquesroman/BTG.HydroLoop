using Grpc.Core;
using Microsoft.AspNetCore.SignalR;
using BTG.HydroLoop.Analytics.Api.Protos;
using BTG.HydroLoop.Analytics.Api.State;
using BTG.HydroLoop.Analytics.Api.Models;
using BTG.HydroLoop.Analytics.Api.Hubs;

namespace BTG.HydroLoop.Analytics.Api.Services;

/// <summary>
/// Implements the gRPC ingestion service for external telemetry push clients.
/// </summary>
public class WaterLevelIngestionService : WaterLevelService.WaterLevelServiceBase
{
    private readonly ITelemetryService _telemetryService;
    private readonly ILogger<WaterLevelIngestionService> _logger;

    public WaterLevelIngestionService(
        ITelemetryService telemetryService,
        ILogger<WaterLevelIngestionService> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    /// <summary>
    /// Processes a telemetry push request. Validates readings, updates state, and broadcasts to SignalR clients.
    /// </summary>
    public override async Task<TelemetryResponse> PushTelemetry(TelemetryRequest request, ServerCallContext context)
    {
        DateTime timestampUtc;
        if (request.TimestampUtc <= 0)
        {
            timestampUtc = DateTime.UtcNow;
        }
        else
        {
            try
            {
                timestampUtc = DateTimeOffset.FromUnixTimeSeconds(request.TimestampUtc).UtcDateTime;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse telemetry timestamp: {Timestamp}", request.TimestampUtc);
                timestampUtc = DateTime.UtcNow;
            }
        }

        var result = _telemetryService.IngestTelemetry(request.TankId, request.WaterLevelPercentage, timestampUtc);

        return new TelemetryResponse
        {
            Success = result.Success,
            Message = result.Message
        };
    }
}
