using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    public partial class RenameTimeToLoginAgain : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TimeToLoginAgatin",
                table: "Users",
                newName: "TimeToLoginAgain");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TimeToLoginAgain",
                table: "Users",
                newName: "TimeToLoginAgatin");
        }
    }
}
