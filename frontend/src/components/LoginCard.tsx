import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import jarvisLogo from "../assets/logos/q-Jarvis-logo.jpg";

type Props = {
  email: string;
  password: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogin: () => Promise<void>;
  handleRegister: (userData: {
    first_name: string;
    last_name: string;
    email: string;
    department: string;
  }) => Promise<void>;
};

const LoginCard = ({
  email,
  password,
  setEmail,
  setPassword,
  handleLogin,
  handleRegister,
}: Props) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Registration local state
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDepartment, setRegDepartment] = useState("General");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const onRegisterSubmit = async () => {
    const tempErrors: { [key: string]: string } = {};
    if (!regFirstName.trim()) tempErrors.firstName = "First name is required";
    if (!regLastName.trim()) tempErrors.lastName = "Last name is required";
    if (!regEmail.trim()) {
      tempErrors.email = "Email is required";
    } else if (!validateEmail(regEmail)) {
      tempErrors.email = "Please enter a valid email";
    }
    if (!regPassword) {
      tempErrors.password = "Password is required";
    } else if (regPassword.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }
    if (regPassword !== regConfirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    try {
      await handleRegister({
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        email: regEmail.trim().toLowerCase(),
        department: regDepartment,
      });
      // Clear form and toggle back to login on success
      setEmail(regEmail.trim().toLowerCase());
      setPassword("");
      setMode("login");
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegDepartment("General");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err: any) {
      alert(err.message || "Registration failed");
    }
  };

  const onLoginSubmit = async () => {
    const tempErrors: { [key: string]: string } = {};
    if (!email.trim()) {
      tempErrors.loginEmail = "Email is required";
    } else if (!validateEmail(email)) {
      tempErrors.loginEmail = "Please enter a valid email";
    }
    if (!password) {
      tempErrors.loginPassword = "Password is required";
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    await handleLogin();
  };

  return (
    <Paper
      elevation={5}
      sx={{
        width: 480,
        maxWidth: "100%",
        borderRadius: "32px",
        p: 4,
        backgroundColor: "#FFFFFF",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <Box sx={{ textAlign: "center", mb: mode === "register" ? 2 : 4 }}>
        <img
          src={jarvisLogo}
          alt="Jarvis"
          style={{
            width: 160,
          }}
        />
        <Typography variant="h6" sx={{ color: "#3A3482", fontWeight: 600, mt: 1 }}>
          {mode === "login" ? "Sign In to Your Account" : "Create New Account"}
        </Typography>
      </Box>

      {mode === "login" ? (
        <>
          <TextField
            fullWidth
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.loginEmail}
            helperText={errors.loginEmail}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
              },
            }}
          />

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.loginPassword}
            helperText={errors.loginPassword}
            sx={{
              mt: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Typography
            align="right"
            sx={{
              mt: 1.5,
              color: "#808080",
              fontSize: "14px",
              cursor: "pointer",
              "&:hover": { color: "#3A3482" },
            }}
          >
            Forgot Password?
          </Typography>

          <Box
            sx={{
              mt: 4,
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onLoginSubmit}
              sx={{
                backgroundColor: "#F4C63D",
                color: "#3A3482",
                borderRadius: "30px",
                fontWeight: 600,
                textTransform: "none",
                height: 50,
                boxShadow: "0px 4px 12px rgba(244, 198, 61, 0.3)",
                "&:hover": {
                  backgroundColor: "#e2b635",
                },
              }}
            >
              Sign In
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setMode("register");
                setErrors({});
              }}
              sx={{
                borderRadius: "30px",
                color: "#3A3482",
                borderColor: "#D9D9D9",
                textTransform: "none",
                fontWeight: 600,
                height: 50,
                "&:hover": {
                  borderColor: "#3A3482",
                  backgroundColor: "rgba(58, 52, 130, 0.05)",
                },
              }}
            >
              Register
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              placeholder="First Name"
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "30px",
                  backgroundColor: "#EAF1FF",
                },
              }}
            />
            <TextField
              fullWidth
              placeholder="Last Name"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              error={!!errors.lastName}
              helperText={errors.lastName}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "30px",
                  backgroundColor: "#EAF1FF",
                },
              }}
            />
          </Box>

          <TextField
            fullWidth
            placeholder="Email Address"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            sx={{
              mt: 2.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
              },
            }}
          />

          <FormControl
            fullWidth
            sx={{
              mt: 2.5,
            }}
          >
            <InputLabel id="reg-department-label" sx={{ ml: 1 }}>Department</InputLabel>
            <Select
              labelId="reg-department-label"
              id="reg-department-select"
              value={regDepartment}
              label="Department"
              onChange={(e) => setRegDepartment(e.target.value)}
              sx={{
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 1,
                },
              }}
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="Support">Support</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
              <MenuItem value="Billing">Billing</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            sx={{
              mt: 2.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={regConfirmPassword}
            onChange={(e) => setRegConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            sx={{
              mt: 2.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box
            sx={{
              mt: 4,
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onRegisterSubmit}
              sx={{
                backgroundColor: "#F4C63D",
                color: "#3A3482",
                borderRadius: "30px",
                fontWeight: 600,
                textTransform: "none",
                height: 50,
                boxShadow: "0px 4px 12px rgba(244, 198, 61, 0.3)",
                "&:hover": {
                  backgroundColor: "#e2b635",
                },
              }}
            >
              Submit
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setMode("login");
                setErrors({});
              }}
              sx={{
                borderRadius: "30px",
                color: "#3A3482",
                borderColor: "#D9D9D9",
                textTransform: "none",
                fontWeight: 600,
                height: 50,
                "&:hover": {
                  borderColor: "#3A3482",
                  backgroundColor: "rgba(58, 52, 130, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default LoginCard;