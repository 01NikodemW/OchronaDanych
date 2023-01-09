using System.Security.Claims;
using API.Entities;
using API.Models;
using API.Models.Validators;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/notes")]

    public class NotesController : ControllerBase
    {
        private readonly INotesService _notesService;

        private readonly APIDbContext _dbContext;

        public NotesController(
            INotesService notesService,
            APIDbContext dbContext
        )
        {
            _dbContext = dbContext;
            _notesService = notesService;
        }



        [Authorize]
        [HttpGet("mynotes")]
        public ActionResult<IEnumerable<Note>> GetNotesForMe()
        {
            var id = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier).Value;
            if (id is null)
            {
                return BadRequest();
            }
            var notes = _notesService.GetMyNotes(Guid.Parse(id));
            return Ok(notes);
        }

        [Authorize]
        [HttpPost]
        public ActionResult<Guid> CreateNote([FromBody] CreateNoteDto dto)
        {
            var validator = new CreateNoteDtoValidator(_dbContext);
            var validationResult = validator.Validate(dto);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult.ToString());
            }
            var id = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier).Value;
            if (id is null)
            {
                return BadRequest();
            }
            var noteId = _notesService.CreateNote(dto, Guid.Parse(id));
            return Ok(noteId);
        }

        [Authorize]
        [HttpPost("decrypt")]
        public ActionResult<string> DecryptNote([FromBody] DecryptNoteDto dto)
        {
            var userId = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier).Value;
            if (userId is null)
            {
                return BadRequest();
            }
            // var noteContent = _notesService.DecryptNote(dto.NoteId, Guid.Parse(userId), dto.Password);
            // return Ok(noteContent);

            int milliseconds = 2000;
            Thread.Sleep(milliseconds);
            try
            {
                var noteContent = _notesService.DecryptNote(dto.NoteId, Guid.Parse(userId), dto.Password);
                return Ok(noteContent);
            }
            catch (TimeoutException e)
            {
                return StatusCode(408, "Limit o decrypt attempt, please wait");
            }
        }

        [Authorize]
        [HttpPut]
        public ActionResult ChangeAccessibility([FromBody] ChangeAccessibilityDto dto)
        {
            var userId = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier).Value;
            if (userId is null)
            {
                return BadRequest();
            }
            _notesService.ChangeAccessibility(dto.NoteId, Guid.Parse(userId));
            return Ok();
        }

        //TODELETE
        [HttpDelete]
        public ActionResult Delete()
        {
            _notesService.RemoveAllNotes();

            return Ok();
        }

        //TODELETE
        [HttpGet]
        public ActionResult<IEnumerable<Note>> GetAll()
        {
            var notes = _notesService.GetAllNotes();
            return Ok(notes);
        }

    }
}
