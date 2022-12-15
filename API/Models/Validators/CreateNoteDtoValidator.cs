using API.Entities;
using FluentValidation;

namespace API.Models.Validators
{
    public class CreateNoteDtoValidator : AbstractValidator<CreateNoteDto>
    {
        public CreateNoteDtoValidator(APIDbContext dbContext)
        {
            RuleFor(x => x.Content).NotEmpty();
        }
    }
}
