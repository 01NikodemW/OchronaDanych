using API.Entities;
using FluentValidation;

namespace API.Models.Validators
{
    public class RegisterUserDtoValidator : AbstractValidator<RegisterUserDto>
    {
        public RegisterUserDtoValidator(APIDbContext dbContext)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("'Email' cannot be empty")
                .EmailAddress().WithMessage("'Email' must be email type");

            RuleFor(x => x.Password).MinimumLength(7)
                .Matches("[A-Z]").WithMessage("'{PropertyName}' must contain one or more capital letters.")
                .Matches("[a-z]").WithMessage("'{PropertyName}' must contain one or more lowercase letters.")
                .Matches(@"\d").WithMessage("'{PropertyName}' must contain one or more digits.")
                .Matches(@"^[^\s\r\n]*$").WithMessage("'{PropertyName}' cannot contain whitespace");

            RuleFor(x => x.ConfirmPassword).Equal(e => e.Password).WithMessage("'Confirm Password' must match password");

            RuleFor(x => x.Email)
                .Custom((value, context) =>
                {
                    var emailInUse = dbContext.Users.Any(u => u.Email == value);
                    if (emailInUse)
                    {
                        context.AddFailure("Email", "Something went wrong");
                    }
                });
        }
    }
}
