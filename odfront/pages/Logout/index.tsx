import {
  Alert,
  Box,
  Button,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import Head from "next/head";
import router from "next/router";
import { useEffect, useState } from "react";
import mostCommonPasswords from "../../utils/mostCommonPasswords";

enum PasswordStrength {
  None,
  Weak,
  Medium,
  Strong,
}

type LoginType = {
  email: string;
  password: string;
};

type RegisterType = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function MainPage() {
  const [loginEmailValue, setLoginEmailValue] = useState<string>("");
  const [loginPasswordValue, setLoginPasswordValue] = useState<string>("");
  const [registerEmailValue, setRegisterEmailValue] = useState<string>("");
  const [registerPasswordValue, setRegisterPasswordValue] =
    useState<string>("");
  const [registerRepeatPasswordValue, setRegisterRepeatPasswordValue] =
    useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(
    PasswordStrength.None
  );
  const [showLoginPage, setShowLoginPage] = useState<boolean>(true);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string>("");
  const [blockLogin, setBlockLogin] = useState<boolean>(false);

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
        : passwordEntropy < 4
        ? PasswordStrength.Medium
        : PasswordStrength.Strong
    );

    if (mostCommonPasswords.includes(newPassword) || passwordLength < 7) {
      setPasswordStrength(PasswordStrength.Weak);
    }
    if (passwordLength === 0) {
      setPasswordStrength(PasswordStrength.None);
    }

    setRegisterPasswordValue(newPassword);
  };

  const setAllToEmpty = () => {
    setLoginEmailValue("");
    setLoginPasswordValue("");
    setRegisterEmailValue("");
    setRegisterPasswordValue("");
    setRegisterRepeatPasswordValue("");
  };

  const onGoToRegisterClickHandler = () => {
    setAllToEmpty();
    setShowLoginPage(false);
  };
  const onGoToLoginClickHandler = () => {
    setAllToEmpty();
    setShowLoginPage(true);
  };

  const onLoginClickHandler = () => {
    Login({
      email: loginEmailValue,
      password: loginPasswordValue,
    });
  };
  const onRegisterClickHandler = () => {
    Register({
      email: registerEmailValue,
      password: registerPasswordValue,
      confirmPassword: registerRepeatPasswordValue,
    });
  };

  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  async function Login(loginData: LoginType) {
    setBlockLogin(true);
    const response = await fetch("https://localhost:7154/api/account/login/", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(loginData),
    });
    if (!response.ok) {
      setBlockLogin(false);
      if (response.status == 408) {
        setIsErrorModalOpen(true);
        setModalErrorMessage("Przekroczono ilość prób, proszę czekać");
        return;
      }
      setIsErrorModalOpen(true);
      setModalErrorMessage("Błąd w trakcie logowania");
      return;
    }
    // setBlockLogin(false);
    const data = await response.text();
    localStorage.setItem("token", data);

    router.push("/MainPage");
  }

  async function Register(registerData: RegisterType) {
    const response = await fetch(
      "https://localhost:7154/api/account/register/",
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(registerData),
      }
    );
    if (!response.ok) {
      if (response.status == 404) {
        setIsErrorModalOpen(true);
        setModalErrorMessage("Błąd w trakcie rejestracji");
        return;
      }

      setIsErrorModalOpen(true);
      setModalErrorMessage(await response.text());
      return;
    }
    Login({
      email: registerData.email,
      password: registerData.password,
    });
  }

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
          <Box sx={{ visibility: "hidden" }}> d</Box>
          {showLoginPage && (
            <Box
              sx={{
                bgcolor: "#43506C",
                width: "60%",
                margin: "auto",
                // minHeight: "500px",
                height: "540px",
                marginTop: "100px",
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  paddingTop: "50px",
                  color: "#E9E9EB",
                }}
              >
                Logowanie
              </Typography>
              <TextField
                label="Email"
                value={loginEmailValue}
                onChange={(e) => {
                  setLoginEmailValue(e.target.value);
                }}
                sx={{
                  marginTop: "30px",
                  input: {
                    color: "white",
                  },
                }}
              />
              <TextField
                label="Hasło"
                type={"password"}
                value={loginPasswordValue}
                onChange={(e) => {
                  setLoginPasswordValue(e.target.value);
                }}
                sx={{
                  marginTop: "30px",
                  marginBottom: "15px",
                  input: {
                    color: "white",
                  },
                }}
              />
              <Button
                // disabled={loginEmailValue.length == 0 || loginPasswordValue.length == 0}

                sx={{
                  bgcolor: "#E9E9EB",
                  color: "#3D619B",
                  border: "3px solid #E9E9EB",
                  marginTop: "20px",
                  "&:hover": {
                    bgcolor: "#E9E9EB",
                    color: "#3D619B",
                    border: "3px solid #EF4B4C",
                  },
                }}
                disabled={blockLogin}
                onClick={onLoginClickHandler}
              >
                Zaloguj się
              </Button>
              <Button
                sx={{ color: "#E9E9EB", width: "220px", marginTop: "130px" }}
                onClick={onGoToRegisterClickHandler}
              >
                Nie masz konta? Zarejestruj się
              </Button>
            </Box>
          )}
          {!showLoginPage && (
            <Box
              sx={{
                bgcolor: "#43506C",
                width: "60%",
                margin: "auto",
                // minHeight: "500px",
                height: "540px",
                marginTop: "100px",
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  paddingTop: "50px",
                  color: "#E9E9EB",
                }}
              >
                Rejestracja
              </Typography>
              <TextField
                label="Email"
                value={registerEmailValue}
                onChange={(e) => {
                  setRegisterEmailValue(e.target.value);
                }}
                sx={{
                  marginTop: "30px",
                  input: {
                    color: "white",
                  },
                }}
              />
              <TextField
                label="Hasło"
                type={"password"}
                value={registerPasswordValue}
                onChange={changePasswordStrength}
                sx={{
                  marginTop: "20px",
                  input: {
                    color: "white",
                  },
                }}
              />
              <TextField
                label="Powtórzone hasło"
                type={"password"}
                value={registerRepeatPasswordValue}
                onChange={(e) => {
                  setRegisterRepeatPasswordValue(e.target.value);
                }}
                sx={{
                  marginTop: "20px",
                  marginBottom: "20px",
                  input: {
                    color: "white",
                  },
                }}
              />
              {passwordStrength === PasswordStrength.None && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
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
                    justifyContent: "center",
                    width: "100%",
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
                    justifyContent: "center",
                    width: "100%",
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
                    justifyContent: "center",
                    width: "100%",
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
              <Button
                disabled={
                  registerEmailValue.length == 0 ||
                  registerPasswordValue.length == 0 ||
                  registerRepeatPasswordValue.length == 0
                }
                sx={{
                  bgcolor: "#E9E9EB",
                  color: "#3D619B",
                  border: "3px solid #E9E9EB",
                  marginTop: "20px",
                  "&:hover": {
                    bgcolor: "#E9E9EB",
                    color: "#3D619B",
                    border: "3px solid #EF4B4C",
                  },
                }}
                onClick={onRegisterClickHandler}
              >
                Zarejestruj się
              </Button>
              <Button
                sx={{ color: "#E9E9EB", width: "220px", marginTop: "80px" }}
                onClick={onGoToLoginClickHandler}
              >
                Wróć do logowania
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      <Modal
        open={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
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
