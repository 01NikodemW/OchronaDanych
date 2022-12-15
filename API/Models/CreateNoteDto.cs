namespace API.Models
{
    public class CreateNoteDto
    {
        public string Content { get; set; } = default!;
        public Boolean isNotePublic { get; set; }
        public string PasswordHash { get; set; } = default!;
    }
}