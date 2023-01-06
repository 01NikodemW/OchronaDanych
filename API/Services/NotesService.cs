using System.Security.Cryptography;
using System.Text;
using API.Entities;
using API.Enum;
using API.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace API.Services
{
    public class NotesService : INotesService
    {
        private readonly APIDbContext _dbContext;
        public readonly IMapper _mapper;
        private readonly IPasswordHasher<Note> _passwordHasher;

        public NotesService(APIDbContext dbContext, IMapper mapper

        , IPasswordHasher<Note> passwordHasher
        )
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _passwordHasher = passwordHasher;
        }



        public Guid CreateNote(CreateNoteDto dto, Guid id)
        {
            var note = _mapper.Map<Note>(dto);
            note.UserId = id;
            if (dto.PasswordHash.Length > 0)
            {
                note.PasswordHash = _passwordHasher.HashPassword(note, dto.PasswordHash);
                note.Content = EncryptNote(dto.PasswordHash, dto.Content);
            }
            _dbContext.Notes.Add(note);
            _dbContext.SaveChanges();
            return note.Id;
        }


        public string EncryptNote(string keyString, string note)
        {

            while (keyString.Length < 16)
            {
                keyString += "0";
            }

            var IV = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

            byte[] Key = Encoding.UTF8.GetBytes(keyString);

            AesManaged aes = new AesManaged();
            aes.Key = Key;
            aes.IV = IV;

            MemoryStream memoryStream = new MemoryStream();
            CryptoStream cryptoStream = new CryptoStream(memoryStream, aes.CreateEncryptor(), CryptoStreamMode.Write);

            byte[] InputBytes = Encoding.UTF8.GetBytes(note);
            cryptoStream.Write(InputBytes, 0, InputBytes.Length);
            cryptoStream.FlushFinalBlock();

            byte[] Encrypted = memoryStream.ToArray();
            // Return encrypted data    
            return Convert.ToBase64String(Encrypted);

            // return Encoding.ASCII.GetString(encrypted);
        }


        public string DecryptNote(Guid noteId, Guid userId, string password)
        {
            var note = _dbContext.Notes.FirstOrDefault(x => x.Id == noteId);
            if (note is null)
            {
                throw new Exception("Something went wrong");
            }
            if (note.UserId != userId)
            {
                throw new Exception("Something went wrong");
            }

            if (DateTimeOffset.Now.ToUnixTimeSeconds() < note.TimeToDecryptAgain)
            {
                throw new TimeoutException("You have to wait to decrypt again");
            }

            var result =  _passwordHasher.VerifyHashedPassword(note, note.PasswordHash, password);
            if (result == PasswordVerificationResult.Failed)
            {
                if (note.NumberOfFailedNoteDecryptAttempts >= 2)
                {
                    note.TimeToDecryptAgain = DateTimeOffset.Now.ToUnixTimeSeconds() + 30;
                    note.NumberOfFailedNoteDecryptAttempts = 0;
                    _dbContext.SaveChanges();
                    throw new TimeoutException("You have to wait to login again");
                }
                else
                {
                    note.NumberOfFailedNoteDecryptAttempts = note.NumberOfFailedNoteDecryptAttempts + 1;
                    _dbContext.SaveChanges();
                    throw new Exception("Invalid password");
                }
            }

            var keyString = password;


            while (keyString.Length < 16)
            {
                keyString += "0";
            }

            var IV = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

            byte[] Key = Encoding.UTF8.GetBytes(keyString);

            // Create a new AesManaged.    
            AesManaged aes = new AesManaged();
            aes.Key = Key;
            aes.IV = IV;

            MemoryStream memoryStream = new MemoryStream();
            CryptoStream cryptoStream = new CryptoStream(memoryStream, aes.CreateDecryptor(), CryptoStreamMode.Write);

            byte[] InputBytes = Convert.FromBase64String(note.Content);
            cryptoStream.Write(InputBytes, 0, InputBytes.Length);
            cryptoStream.FlushFinalBlock();

            byte[] Decrypted = memoryStream.ToArray();
            // Return encrypted data    
            return UTF8Encoding.UTF8.GetString(Decrypted, 0, Decrypted.Length);
        }


        public IEnumerable<Note> GetMyNotes(Guid id)
        {

            var notes =
                _dbContext
                    .Notes
                    .Where(x =>
                        x.UserId == id ||
                        x.isNotePublic == true);
            return notes;
        }

        public void ChangeAccessibility(Guid noteId, Guid userId)
        {

            var note = _dbContext.Notes.FirstOrDefault(x => x.Id == noteId);
            if (note is null)
            {
                throw new Exception("Something went wrong");
            }

            if (note.UserId != userId)
            {
                throw new Exception("You cannot modify this note");
            }

            if (note.PasswordHash is not null && note.PasswordHash != "")
            {
                throw new Exception("Something went wrong");
            }


            if (note.isNotePublic == true)
            {
                note.isNotePublic = false;
            }
            else if (note.isNotePublic == false)
            {
                note.isNotePublic = true;
            }

            _dbContext.SaveChanges();
        }

        //TODELETE
        public void RemoveAllNotes()
        {
            var notes = GetAllNotes();
            _dbContext.RemoveRange(notes);
            _dbContext.SaveChanges();
        }

                //TODELETE
        public IEnumerable<Note> GetAllNotes()
        {
            var notes = _dbContext.Notes.ToList();
            return notes;
        }


    }
}
