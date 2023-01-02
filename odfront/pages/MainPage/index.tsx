import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import Head from "next/head";
import { useEffect, useState } from "react";
import { TextareaAutosize } from "@mui/material";
import ReactMarkdown from "react-markdown";
import jwt_decode from "jwt-decode";
import router from "next/router";
import mostCommonPasswords from "../../utils/mostCommonPasswords";

type NoteType = {
  id: string;
  isNotePublic: boolean;
  passwordHash: string;
  content: string;
  userId: string;
};

type NoteToSend = {
  content: string;
  isNotePublic: boolean;
  passwordHash: string;
};

enum PasswordStrength {
  None,
  Weak,
  Medium,
  Strong,
}

export default function MainPage() {
  const [showCreateNote, setShowCreateNote] = useState<boolean>(false);
  const [noteValue, setNoteValue] = useState<string>(``);
  const [publicNoteChecked, setPublicNoteChecked] = useState(true);
  const [privateNoteChecked, setPrivateNoteChecked] = useState(false);
  const [notePassword, setNotePassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [myNotes, setMyNotes] = useState<NoteType[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string>("");
  const [isInsertPasswordModalOpen, setIsInsertPasswordModalOpen] =
    useState<boolean>(false);
  const [notePasswordToDecrypt, setNotePasswordToDecrypt] =
    useState<string>("");
  const [noteIdToDecrypt, setNoteIdToDecrypt] = useState<string>("");
  const [decryptedNote, setDecryptedNote] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(
    PasswordStrength.None
  );
  const [blockDecryption, setBlockDecryption] = useState<boolean>(false);

  console.log("passwordStrength ", passwordStrength);

  async function decryptData() {
    setBlockDecryption(true)
    const response = await fetch("https://localhost:7154/api/notes/decrypt", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },

      body: JSON.stringify({
        noteId: noteIdToDecrypt,
        password: notePasswordToDecrypt,
      }),
    });
    if (!response.ok) {
      setBlockDecryption(false)
      if (response.status == 408) {
        setIsErrorModalOpen(true);
        setModalErrorMessage("Przekroczono ilość prób, proszę czekać");
        return;
      }
      setIsErrorModalOpen(true);
      setModalErrorMessage("Błąd w trakcie odszyfrowywania");
      return;
    }
    const data = await response.text();
    setDecryptedNote(data);
    console.log(data);
  }

  async function changeAccessibility(noteId: string) {
    const response = await fetch("https://localhost:7154/api/notes", {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },

      body: JSON.stringify({
        noteId: noteId,
      }),
    });
    if (!response.ok) {
      console.log("not ok");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async function sendNote(note: NoteToSend) {
    console.log(note);
    const response = await fetch("https://localhost:7154/api/notes", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },

      body: JSON.stringify(note),
    });
    if (!response.ok) {
      setIsErrorModalOpen(true);
      setModalErrorMessage(await response.text());
      return;
      // console.log("not ok");
      // throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async function getMyNotes() {
    const response = await fetch("https://localhost:7154/api/notes/mynotes", {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    data.forEach((d: any) => {
      setMyNotes((prev) => [
        ...prev,
        {
          id: d.id,
          isNotePublic: d.isNotePublic,
          passwordHash: d.passwordHash,
          content: d.content,
          userId: d.userId,
        },
      ]);
    });
  }

  const onSendNoteHandler = () => {
    setShowCreateNote(false);
    setPasswordStrength(PasswordStrength.None);
    if (publicNoteChecked && notePassword.length > 0) {
      setModalErrorMessage("Szyfrowana notatka nie może być publiczna");
      setIsErrorModalOpen(true);
    } else {
      const note: NoteToSend = {
        content: noteValue,
        isNotePublic: publicNoteChecked,
        passwordHash: notePassword,
      };
      sendNote(note);
    }
  };

  const onPublicNoteClickHandler = () => {
    setPublicNoteChecked(true);
    setPrivateNoteChecked(false);
  };

  const onPrivateNoteClickHandler = () => {
    setPublicNoteChecked(false);
    setPrivateNoteChecked(true);
  };

  const onLogoutHandler = () => {
    localStorage.removeItem("token");
    router.push("/Logout");
  };

  const onCloseDecryptModalHandler = () => {
    setIsInsertPasswordModalOpen(false);
    setDecryptedNote("");
    setNotePasswordToDecrypt("");
    setBlockDecryption(false)
  };

  const changePasswordStrength = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const array = new Array(256).fill(0);
    const newPassword = event.target.value;
    const passwordLength = newPassword.length;
    for (let i = 0; i < passwordLength; i++) {
      array[newPassword.charAt(i).charCodeAt(0)] += 1;
    }
    let passwordEntropy = 0;
    for (let i = 0; i < 256; i++) {
      if (array[i] > 0) {
        passwordEntropy =
          passwordEntropy -
          (array[i] / passwordLength) * Math.log2(array[i] / passwordLength);
      }
    }
    setPasswordStrength(
      passwordEntropy < 2
        ? PasswordStrength.Weak
        : passwordEntropy < 3
        ? PasswordStrength.Medium
        : PasswordStrength.Strong
    );

    if (mostCommonPasswords.includes(newPassword) || passwordLength < 7) {
      setPasswordStrength(PasswordStrength.Weak);
    }
    if (passwordLength === 0) {
      setPasswordStrength(PasswordStrength.None);
    }

    setNotePassword(newPassword);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    const decoded = jwt_decode(token);
    const values = Object.values(decoded);

    setId(values[0]);
    setEmail(values[1]);
    setMyNotes([]);
    getMyNotes();
  }, []);

  return (
    <>
      <Head>
        <title>Moje Notatki</title>
        <meta name="MyParcels" content="MyParcels" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box
        sx={{
          bgcolor: "#43506C",
        }}
      >
        <Box
          sx={{
            width: "80%",
            margin: "auto",
            minHeight: "100vh",
            bgcolor: "#3D619B",
            paddingX: "50px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              height: "100px",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "#E9E9EB",
              }}
            >
              {email}
            </Typography>
            <Button
              sx={{
                bgcolor: "#E9E9EB",
                color: "#3D619B",
                border: "3px solid #E9E9EB",
                "&:hover": {
                  bgcolor: "#E9E9EB",
                  color: "#3D619B",
                  border: "3px solid #EF4B4C",
                },
              }}
              onClick={onLogoutHandler}
            >
              Wyloguj
            </Button>
          </Box>
          <Box
            sx={{
              width: "100%",
              height: "1px",
              margin: "auto",
              marginY: "10px",
              bgcolor: "#E9E9EB",
            }}
          />
          {!showCreateNote && (
            <Button
              sx={{
                bgcolor: "#E9E9EB",
                color: "#3D619B",
                border: "3px solid #E9E9EB",
                "&:hover": {
                  bgcolor: "#E9E9EB",
                  color: "#3D619B",
                  border: "3px solid #EF4B4C",
                },
              }}
              onClick={() => {
                setShowCreateNote(true);
              }}
            >
              Stwórz notatkę
            </Button>
          )}
          {showCreateNote && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  paddingBottom: "20px",
                }}
              >
                <Button
                  sx={{
                    bgcolor: "#E9E9EB",
                    color: "#3D619B",
                    border: "3px solid #E9E9EB",
                    "&:hover": {
                      bgcolor: "#E9E9EB",
                      color: "#3D619B",
                      border: "3px solid #EF4B4C",
                    },
                  }}
                  onClick={() => {
                    setShowCreateNote(false);
                    setPasswordStrength(PasswordStrength.None);
                    setNoteValue("");
                  }}
                >
                  Anuluj
                </Button>
                <Button
                  sx={{
                    bgcolor: "#E9E9EB",
                    color: "#3D619B",
                    border: "3px solid #E9E9EB",
                    "&:hover": {
                      bgcolor: "#E9E9EB",
                      color: "#3D619B",
                      border: "3px solid #EF4B4C",
                    },
                  }}
                  onClick={onSendNoteHandler}
                >
                  Zapisz
                </Button>
              </Box>
              <TextareaAutosize
                id="textarea"
                aria-label="Enter your article ..."
                placeholder="Enter your article ..."
                autoFocus={true}
                style={{
                  backgroundColor: "#E9E9EB",
                  color: "black",
                  padding: "10px",
                  fontFamily: "system-ui",
                  maxHeight: "100px",
                  minHeight: "100px",
                  maxWidth: "100%",
                  minWidth: "100%",
                }}
                onChange={(e) => {
                  setNoteValue(e.target.value);
                }}
              />
              <Box
                sx={{
                  minHeight: "100px",
                  paddingX: "10px",
                  paddingY: "1px",
                  bgcolor: "#E9E9EB",
                  color: "black",
                }}
              >
                <ReactMarkdown children={noteValue} />
              </Box>
              <FormGroup sx={{ color: "#E9E9EB" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked
                      checked={publicNoteChecked}
                      onClick={onPublicNoteClickHandler}
                      // iconStyle={{ fill: 'white' }}
                      sx={{
                        color: "#E9E9EB",
                        "&.Mui-checked": {
                          color: "#EF4B4C",
                        },
                      }}
                    />
                  }
                  label="publiczna"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={privateNoteChecked}
                      onClick={onPrivateNoteClickHandler}
                      sx={{
                        color: "#E9E9EB",
                        "&.Mui-checked": {
                          color: "#EF4B4C",
                        },
                      }}
                    />
                  }
                  label="prywatna"
                />
              </FormGroup>
              <Box sx={{}}>
                <TextField
                  label="hasło"
                  sx={{
                    input: {
                      color: "black",
                      bgcolor: "white",
                      bordeColor: "white",
                    },
                  }}
                  onChange={changePasswordStrength}
                />

                {passwordStrength === PasswordStrength.None && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "left",
                      width: "100%",
                      ml: "15px",
                      mt: "15px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "#43506C",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "#43506C",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "#43506C",
                        border: "1px solid black",
                      }}
                    />
                  </Box>
                )}
                {passwordStrength === PasswordStrength.Weak && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "left",
                      width: "100%",
                      ml: "15px",
                      mt: "15px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "red",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "#43506C",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "#43506C",
                        border: "1px solid black",
                      }}
                    />
                  </Box>
                )}
                {passwordStrength === PasswordStrength.Medium && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "left",
                      width: "100%",
                      ml: "15px",
                      mt: "15px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "yellow",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "yellow",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "#43506C",
                        border: "1px solid black",
                      }}
                    />
                  </Box>
                )}
                {passwordStrength === PasswordStrength.Strong && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "left",
                      width: "100%",
                      ml: "15px",
                      mt: "15px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "green",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "green",
                        border: "1px solid black",
                      }}
                    />
                    <Box
                      sx={{
                        width: "50px",
                        height: "5px",
                        bgcolor: "green",
                        border: "1px solid black",
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}
          <Box
            sx={{
              width: "100%",
              height: "1px",
              margin: "auto",
              marginY: "10px",
              bgcolor: "#E9E9EB",
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: "#E9E9EB",
            }}
          >
            Moje notatki
          </Typography>
          <List>
            {myNotes.map((note) => (
              <ListItem>
                <Box
                  sx={{
                    width: "100%",
                    paddingX: "10px",
                    paddingY: "1px",
                    bgcolor: "#E9E9EB",
                  }}
                >
                  {note.passwordHash.length > 0 && (
                    <Box
                      sx={{
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: "black",
                        }}
                      >
                        Notatka zaszyfrowana
                      </Typography>
                      <Button
                        onClick={() => {
                          setNoteIdToDecrypt(note.id);
                          setIsInsertPasswordModalOpen(true);
                        }}
                      >
                        Podaj hasło
                      </Button>
                    </Box>
                  )}
                  {
                    note.passwordHash.length < 1 && (
                      <Box
                        sx={{
                          height: "50px",
                          display: "flex",
                          alignItems: "center",
                          color: "black",
                          justifyContent: "space-between",
                        }}
                      >
                        <ReactMarkdown children={note.content} />
                        {note.userId === id && (
                          <Button
                            onClick={() => {
                              changeAccessibility(note.id);
                            }}
                          >
                            Zmien na{" "}
                            {note.isNotePublic ? "prywatną" : "publiczną"}
                          </Button>
                        )}
                      </Box>
                    )
                    // <ReactMarkdown children={note.content}/>
                  }
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
      <Modal
        open={isInsertPasswordModalOpen}
        onClose={onCloseDecryptModalHandler}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "50vw",
            bgcolor: "transparent",
          }}
        >
          <Box
            sx={{
              width: "800px",
              height: "500px",
              bgcolor: "#E9E9EB",
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <TextField
              label="Haslo do notatki"
              value={notePasswordToDecrypt}
              onChange={(e) => {
                setNotePasswordToDecrypt(e.target.value);
              }}
              sx={{
                marginTop: "30px",
                input: {
                  color: "black",
                },
              }}
            />
            <Button
              sx={{ paddingTop: "20px" }}
              onClick={() => {
                decryptData();
              }}
              disabled={blockDecryption}
            >
              Zatwierdź
            </Button>
            <Box
              sx={{
                minHeight: "100px",
                paddingX: "10px",
                paddingY: "1px",
                color: "black",
                bgcolor: "#E9E9EB",
              }}
            >
              <ReactMarkdown children={decryptedNote} />
            </Box>
          </Box>
        </Box>
      </Modal>
      <Modal
        open={isErrorModalOpen}
        onClose={() => {
          setIsErrorModalOpen(false);
          setNoteValue("");
          setPasswordStrength(PasswordStrength.None);
          setNotePassword("");
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "50vw",
            bgcolor: "transparent",
          }}
        >
          <Alert severity="error">{modalErrorMessage}</Alert>
        </Box>
      </Modal>
    </>
  );
}
