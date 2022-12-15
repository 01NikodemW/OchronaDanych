using API.Entities;
using API.Enum;
using API.Models;
using AutoMapper;

namespace API
{
    public class NotesMappingProfile : Profile
    {
        public NotesMappingProfile()
        {
            CreateMap<CreateNoteDto, Note>();
        }
    }
}
