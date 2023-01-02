using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API
{
    public static class Seeder
    {
        public static void SeedData(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<LoginAttempts>().HasData(GetLoginAttempts());
        }
        private static LoginAttempts GetLoginAttempts()
        {
            var loginAttempts = new LoginAttempts()
            {
                Id = Guid.Parse("c3f5ffa5-fc8a-4190-8521-8a75af4dea02"),
                NumberOfFailedLoginAttempts = 0,
                TimeToLoginAgain = 0,
            };

            return loginAttempts;
        }
    }
}