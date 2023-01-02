using System.Security.Claims;
using API.Entities;
using API.Models;
using Microsoft.AspNetCore.Identity;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace API.Services
{
    public class AccountService : IAccountService
    {
        private readonly APIDbContext _dbContext;

        private readonly IPasswordHasher<User> _passwordHasher;

        private readonly AuthenticationSettings _authenticationSettings;

        public AccountService(
            APIDbContext dbContext,
            IPasswordHasher<User> passwordHasher,
            AuthenticationSettings authenticationSettings
        )
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _authenticationSettings = authenticationSettings;
        }

        public void RegisterUser(RegisterUserDto dto)
        {
            var newUser = new User() { Email = dto.Email };
            var passwordHash =
                _passwordHasher.HashPassword(newUser, dto.Password);

            newUser.PasswordHash = passwordHash;
            _dbContext.Users.Add(newUser);
            _dbContext.SaveChanges();
        }

        public string GenerateJwt(LoginDto dto)
        {
            var user = _dbContext.Users
                .FirstOrDefault(u => u.Email == dto.Email);
            var loginAttempts = _dbContext.LoginAttempts.FirstOrDefault(x => x.TimeToLoginAgain != -10);

            if (loginAttempts is null)
            {
                throw new Exception("Sth went wrong");
            }

            if (DateTimeOffset.Now.ToUnixTimeSeconds() < loginAttempts.TimeToLoginAgain)
            {
                throw new TimeoutException("You have to wait to login again");
            }

            if (user is null)
            {
                if (loginAttempts.NumberOfFailedLoginAttempts >= 2)
                {
                    loginAttempts.TimeToLoginAgain = DateTimeOffset.Now.ToUnixTimeSeconds() + 30;
                    loginAttempts.NumberOfFailedLoginAttempts = 0;
                    _dbContext.SaveChanges();
                    throw new TimeoutException("You have to wait to login again");
                }
                else
                {
                    loginAttempts.NumberOfFailedLoginAttempts = loginAttempts.NumberOfFailedLoginAttempts + 1;
                    _dbContext.SaveChanges();
                    throw new Exception("Invalid username or password");
                }
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                if (loginAttempts.NumberOfFailedLoginAttempts >= 2)
                {
                    loginAttempts.TimeToLoginAgain = DateTimeOffset.Now.ToUnixTimeSeconds() + 30;
                    loginAttempts.NumberOfFailedLoginAttempts = 0;
                    _dbContext.SaveChanges();
                    throw new TimeoutException("You have to wait to login again");
                }
                else
                {
                    loginAttempts.NumberOfFailedLoginAttempts = loginAttempts.NumberOfFailedLoginAttempts + 1;
                    _dbContext.SaveChanges();
                    throw new Exception("Invalid username or password");
                }
            }


            loginAttempts.NumberOfFailedLoginAttempts = 0;
            loginAttempts.TimeToLoginAgain = 0;
            _dbContext.SaveChanges();

            var claims = new List<Claim>()
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email.ToString()),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authenticationSettings.JwtKey));
            var cred = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(_authenticationSettings.JwtExpireDays);

            var token = new JwtSecurityToken(_authenticationSettings.JwtIssuer,
                _authenticationSettings.JwtIssuer,
                claims,
                expires: expires,
                signingCredentials: cred);

            var tokenHandler = new JwtSecurityTokenHandler();
            return tokenHandler.WriteToken(token);

        }

        //TODELETE
        public IEnumerable<User> GetAllUsers()
        {
            var users = _dbContext.Users.ToList();
            return users;
        }


        //TODELETE
        public void DeleteUser(Guid id)
        {
            var user = _dbContext.Users.FirstOrDefault(p => p.Id == id);
            if (user is null)
                throw new NullReferenceException("User to delete found");

            _dbContext.Users.Remove(user);
            _dbContext.SaveChanges();
        }
    }
}
