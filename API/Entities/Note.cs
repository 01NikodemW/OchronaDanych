using System.ComponentModel.DataAnnotations;
using API.Enum;

namespace API.Entities
{
    public class Note
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = default!;
        public AccessibilityStatus AccessibilityStatus { get; set; }
        public Boolean isNotePublic { get; set; }
        public string? PasswordHash { get; set; } = default!;
        public Guid UserId { get; set; }
        public virtual User User { get; set; }

        public int NumberOfFailedNoteDecryptAttempts { get; set; } = 0;
        public long TimeToDecryptAgain { get; set; }
    }
}