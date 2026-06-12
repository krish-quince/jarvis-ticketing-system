import { Box } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import LoginCard from "../components/LoginCard";
import Carousel from "../components/Carousel";

import { login } from "../services/authService";
import { createUser } from "../services/userService";

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

  const handleRegister = async (userData: {
    first_name: string;
    last_name: string;
    email: string;
    department: string;
  }) => {
    try {
      // Default to "User" role for newly registered portal users
      const data = await createUser({
        ...userData,
        role_id: "User"
      });
      alert(`User ${data.first_name} ${data.last_name} registered successfully!`);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Registration failed. Please try again.";
      throw new Error(errMsg);
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
          handleRegister={handleRegister}
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