using Microsoft.EntityFrameworkCore;
using BTG.HydroLoop.Analytics.Api.Models;

namespace BTG.HydroLoop.Analytics.Api.Data;

/// <summary>
/// Entity Framework Core Database Context for the HydroLoop Analytics application.
/// </summary>
public class TelemetryDbContext : DbContext
{
    public TelemetryDbContext(DbContextOptions<TelemetryDbContext> options) : base(options)
    {
    }

    public DbSet<WaterLevelReadingEntity> WaterLevelReadings => Set<WaterLevelReadingEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WaterLevelReadingEntity>(entity =>
        {
            // Set Table Name explicitly
            entity.ToTable("WaterLevelReadings");

            // Configure Primary Key
            entity.HasKey(e => e.Id);

            // Configure TankId
            entity.Property(e => e.TankId)
                  .IsRequired()
                  .HasMaxLength(100);

            // Configure WaterLevelPercentage
            entity.Property(e => e.WaterLevelPercentage)
                  .IsRequired();

            // Configure TimestampUtc
            entity.Property(e => e.TimestampUtc)
                  .IsRequired();

            // Index TimestampUtc for optimized query performance when fetching the last 20 records
            entity.HasIndex(e => e.TimestampUtc);
        });
    }
}
