using BTG.HydroLoop.Analytics.Api.Hubs;
using BTG.HydroLoop.Analytics.Api.Models;
using BTG.HydroLoop.Analytics.Api.Services;
using BTG.HydroLoop.Analytics.Api.State;
using BTG.HydroLoop.Analytics.Api.Data;
using BTG.HydroLoop.Analytics.Api.Events;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add services to the container.
builder.Services.AddGrpc();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

// Register Entity Framework Core DbContext with SQL Server configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<TelemetryDbContext>(options =>
    options.UseSqlServer(connectionString));

// Register the thread-safe database-backed telemetry repository as a Scoped service
builder.Services.AddScoped<ITelemetryRepository, TelemetryRepository>();

builder.Services.AddScoped<ITelemetryService, TelemetryService>();
builder.Services.AddSingleton<ITelemetryEventBus, TelemetryEventBus>();
builder.Services.AddHostedService<TelemetryBroadcasterService>();

// Configure robust CORS policy for the Angular UI client running on localhost:4200
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularCorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR WebSocket handshake
    });
});

var app = builder.Build();

// Automatically apply database migrations on application startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TelemetryDbContext>();
    dbContext.Database.Migrate();
}

// 2. Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Apply CORS policy before routing/endpoints
app.UseCors("AngularCorsPolicy");

// 3. Map endpoints
// Map the gRPC Telemetry Ingestion Service
app.MapGrpcService<WaterLevelIngestionService>();

// Map the SignalR Telemetry Broadcasting Hub
app.MapHub<WaterLevelHub>("/hubs/waterlevel");

// Helpful REST endpoint to easily push telemetry data from the UI simulation panel
app.MapPost("/api/telemetry", (
    TelemetryPayload payload, 
    ITelemetryService telemetryService) =>
{
    DateTime timestampUtc = payload.TimestampUtc > 0 
        ? DateTimeOffset.FromUnixTimeSeconds(payload.TimestampUtc).UtcDateTime 
        : DateTime.UtcNow;

    var result = telemetryService.IngestTelemetry(payload.TankId, payload.WaterLevelPercentage, timestampUtc);

    if (!result.Success)
    {
        return Results.BadRequest(new { Success = false, Message = result.Message });
    }

    return Results.Ok(new { Success = true, Message = result.Message });
})
.WithName("PushTelemetryRest");

// Optional status endpoint
app.MapGet("/api/telemetry/status", (ITelemetryRepository repository) =>
{
    var currentReadings = repository.GetLastReadings();
    if (!currentReadings.Any())
    {
        return Results.Ok(new { Count = 0, Message = "No telemetry readings available." });
    }

    return Results.Ok(new
    {
        Count = currentReadings.Count,
        LastReading = currentReadings.Last(),
        Min = currentReadings.Min(r => r.WaterLevelPercentage),
        Max = currentReadings.Max(r => r.WaterLevelPercentage),
        Average = Math.Round(currentReadings.Average(r => r.WaterLevelPercentage), 2)
    });
})
.WithName("GetTelemetryStatus");

app.Run();

// Helper record for REST API payloads
public record TelemetryPayload(string TankId, double WaterLevelPercentage, long TimestampUtc);
