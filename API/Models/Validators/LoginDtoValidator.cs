using API.Entities;
using FluentValidation;

namespace API.Models.Validators
{
    public class LoginDtoValidator : AbstractValidator<LoginDto>
    {
        public LoginDtoValidator(APIDbContext dbContext)
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();;

            RuleFor(x => x.Password).MinimumLength(6);
        }
    }
}
