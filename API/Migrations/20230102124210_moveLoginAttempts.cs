using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    public partial class moveLoginAttempts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoginAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NumberOfFailedLoginAttempts = table.Column<int>(type: "INTEGER", nullable: false),
                    TimeToLoginAgain = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginAttempts", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "LoginAttempts",
                columns: new[] { "Id", "NumberOfFailedLoginAttempts", "TimeToLoginAgain" },
                values: new object[] { new Guid("c3f5ffa5-fc8a-4190-8521-8a75af4dea02"), 0, 0L });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoginAttempts");
        }
    }
}
