using API.Entities;
using API.Models;

namespace API.Services
{
    public interface IAccountService
    {
        void RegisterUser(RegisterUserDto dto);
        string GenerateJwt(LoginDto dto);
        //TODELETE
        IEnumerable<User> GetAllUsers();
        //TODELETE
        void DeleteUser(Guid id);
    }
}
