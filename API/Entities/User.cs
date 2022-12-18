namespace API.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = default!;
        public string PasswordHash { get; set; } = default!;
        public virtual IEnumerable<Note> Notes { get; set; }
        public int NumberOfFailedLoginAttempts { get; set; } = 0;
        public long TimeToLoginAgain { get; set; }
    }
}
