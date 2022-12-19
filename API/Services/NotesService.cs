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

        //TODELETE
        public IEnumerable<Note> GetAllNotes()
        {
            var notes = _dbContext.Notes.ToList();
            return notes;
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


        // public string EncryptNote(string keyString, string note)
        // {
        //     if (keyString.Length != 32)
        //     {
        //         // If the key string is not the correct length, add extra characters to the key string
        //         // until it is the correct length
        //         while (keyString.Length < 32)
        //         {
        //             keyString += "0";
        //         }
        //     }

        //     byte[] key = Encoding.UTF8.GetBytes(keyString);
        //     using (Aes aes = Aes.Create())
        //     {
        //         // Set the key for the AES algorithm
        //         aes.Key = key;

        //         // Create a new instance of the encryptor
        //         ICryptoTransform encryptor = aes.CreateEncryptor();

        //         // Convert the plaintext string to a byte array
        //         byte[] plainTextBytes = Encoding.UTF8.GetBytes(note);

        //         // Encrypt the plaintext string
        //         byte[] cipherTextBytes = encryptor.TransformFinalBlock(plainTextBytes, 0, plainTextBytes.Length);

        //         // Convert the encrypted string to a base64 string
        //         string cipherText = Convert.ToBase64String(cipherTextBytes);

        //         // Print the encrypted string
        //         return cipherText;
        //     } 


        // }


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



        // public string DecryptNote(Guid noteId, Guid userId, string password)
        // {
        //     var note = _dbContext.Notes.FirstOrDefault(x => x.Id == noteId);
        //     if (note is null)
        //     {
        //         throw new Exception("Something went wrong");
        //     }
        //     if (note.UserId != userId)
        //     {
        //         throw new Exception("Something went wrong");
        //     }

        //     var result = _passwordHasher.VerifyHashedPassword(note, note.PasswordHash, password);
        //     if (result == PasswordVerificationResult.Failed)
        //     {
        //         throw new Exception("Wrong password");
        //     }

        //     var keyString = password;

        //     if (keyString.Length != 32)
        //     {
        //         while (keyString.Length < 32)
        //         {
        //             keyString += "0";
        //         }
        //     }

        //     byte[] key = Encoding.UTF8.GetBytes(keyString);
        //     using (Aes aes = Aes.Create())
        //     {
        //         aes.Key = key;
        //         var decryptor = aes.CreateDecryptor();
        //         // var input = Convert.FromBase64String(note.Content);
        //         // var input = Encoding.UTF8.GetBytes(note.Content);
        //         var input = new byte[32];


        //         var output = decryptor.TransformFinalBlock(input, 0, input.Length);

        //         var decrypted = Encoding.UTF8.GetString(output);

        //         return decrypted;
        //     }


        //     // throw new NotImplementedException();
        // }


        // public string DecryptStringFromBytes_Aes(byte[] cipherText, byte[] Key, )
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
                throw new TimeoutException("You have to wait to login again");
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


    }
}
