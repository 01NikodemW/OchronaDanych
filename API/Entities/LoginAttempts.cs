namespace API.Entities
{
    public class LoginAttempts
    {
        public Guid Id { get; set; }
        public int NumberOfFailedLoginAttempts { get; set; }
        public long TimeToLoginAgain { get; set; } 
    }
}
