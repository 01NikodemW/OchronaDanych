using API.Entities;
using API.Models;
using API.Models.Validators;
using API.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/account")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        private readonly APIDbContext _dbContext;

        public AccountController(
            IAccountService accountService,
            APIDbContext dbContext
        )
        {
            _dbContext = dbContext;
            _accountService = accountService;
        }

        [HttpPost("register")]
        public ActionResult RegisterUser([FromBody] RegisterUserDto dto)
        {
            var validator = new RegisterUserDtoValidator(_dbContext);
            var validationResult = validator.Validate(dto);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult.ToString());
            }
            _accountService.RegisterUser(dto);
            return Ok();
        }

        [HttpPost("login")]
        public ActionResult Login([FromBody] LoginDto dto)
        {

            int milliseconds = 2000;
            Thread.Sleep(milliseconds);
            try
            {
                string token = _accountService.GenerateJwt(dto);
                return Ok(token);
            }
            catch (TimeoutException e)
            {
                return StatusCode(408, "Limit o login attempt, please wait");
            }
            catch (Exception e)
            {
                return StatusCode(400, "Limit o login attempt, please wait");
            }

        }

    }
}
