using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTG.HydroLoop.Analytics.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WaterLevelReadings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TankId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    WaterLevelPercentage = table.Column<double>(type: "float", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterLevelReadings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WaterLevelReadings_TimestampUtc",
                table: "WaterLevelReadings",
                column: "TimestampUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WaterLevelReadings");
        }
    }
}
