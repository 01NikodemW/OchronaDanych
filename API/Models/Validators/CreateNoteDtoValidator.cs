using API.Entities;
using FluentValidation;

namespace API.Models.Validators
{
    public class CreateNoteDtoValidator : AbstractValidator<CreateNoteDto>
    {
        public CreateNoteDtoValidator(APIDbContext dbContext)
        {
            RuleFor(x => x.Content).NotEmpty();

            RuleFor(x => x.PasswordHash)
                .MinimumLength(7).WithMessage("The length of Password must be at least 7 characters. ").When(x => x.PasswordHash != "")
                .Matches("[A-Z]").WithMessage("Password must contain one or more capital letters.").When(x => x.PasswordHash != "")
                .Matches("[a-z]").WithMessage("Password must contain one or more lowercase letters.").When(x => x.PasswordHash != "")
                .Matches(@"\d").WithMessage("Password must contain one or more digits.").When(x => x.PasswordHash != "")
                .Matches(@"^[^\s\r\n]*$").WithMessage("Password cannot contain whitespace").When(x => x.PasswordHash != "");
        }
    }
}
