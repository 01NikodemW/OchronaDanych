namespace API.Models
{
    public class DecryptNoteDto
    {
        public Guid NoteId { get; set; } = default!;
        public string Password { get; set; } = default!;
    }
}