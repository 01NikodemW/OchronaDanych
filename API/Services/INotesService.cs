using API.Entities;
using API.Models;

namespace API.Services
{
    public interface INotesService
    {
        IEnumerable<Note> GetMyNotes(Guid id);

        Guid CreateNote(CreateNoteDto dto, Guid id);

        void ChangeAccessibility(Guid noteId, Guid userId);

        string EncryptNote(string key, string note);

        string DecryptNote(Guid noteId, Guid userId, string password);
    }
}
