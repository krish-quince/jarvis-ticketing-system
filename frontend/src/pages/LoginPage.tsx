import { Box, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import LoginCard from "../components/LoginCard";
import Carousel from "../components/Carousel";

import { login, register } from "../services/authService";

const LoginPage = () => {
  const navigate = useNavigate();

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleLogin = async (loginData: {
    user_code: string;
    password: string;
  }) => {
    try {
      const data: any = await login(loginData.user_code, loginData.password);

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login Success:", data);

      navigate("/tickets");
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        message: "Invalid Email or Password",
        severity: "error",
      });
    }
  };

  const handleRegister = async (userData: {
    first_name: string;
    last_name: string;
    email: string;

    company_code: string;
    department_id: number;
    role_id: number;

    password?: string;
  }) => {
    try {
      // Generate a unique user code (e.g. QC_KRIS_4321)
      const namePrefix =
        `${userData.first_name.slice(0, 3)}${userData.last_name.slice(0, 3)}`.toUpperCase();
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const userCode = `${userData.company_code}_${namePrefix}_${uniqueSuffix}`;

      // Call backend auth/register mapping standard required DB fields
      const result = await register({
        company_code: userData.company_code,

        role_id: userData.role_id,

        user_code: userCode,

        first_name: userData.first_name,

        last_name: userData.last_name,

        email: userData.email,

        password: userData.password || "password123",

        phone: "",

        department_id: userData.department_id,
      });

      setToast({
        open: true,
        message: `User ${result.user?.first_name || userData.first_name} registered successfully!`,
        severity: "success",
      });
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      setToast({
        open: true,
        message: errMsg,
        severity: "error",
      });
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
        <LoginCard handleLogin={handleLogin} handleRegister={handleRegister} />

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

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{
            width: "100%",
            borderRadius: "16px",
            fontWeight: 600,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
