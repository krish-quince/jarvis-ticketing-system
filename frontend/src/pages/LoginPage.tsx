import { Box } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import LoginCard from "../components/LoginCard";
import Carousel from "../components/Carousel";

import { login } from "../services/authService";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data: any = await login(
        email,
        password
      );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      console.log("Login Success:", data);

      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      alert("Invalid Email or Password");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Header />

      <Box
        sx={{
          minHeight: "calc(100vh - 70px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
          px: 4,

          "@media (max-width:900px)": {
            flexDirection: "column",
            gap: 4,
            py: 4,
          },
        }}
      >
        <LoginCard
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          handleLogin={handleLogin}
        />

        <Box
          sx={{
            width: 500,

            "@media (max-width:900px)": {
              width: "100%",
              maxWidth: 450,
            },
          }}
        >
          <Carousel />
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;