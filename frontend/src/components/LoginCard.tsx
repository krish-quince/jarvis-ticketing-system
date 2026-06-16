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
  FormHelperText,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import jarvisLogo from "../assets/logos/q-Jarvis-logo.jpg";

type Props = {
  email: string;
  password: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogin: (loginData: {
    email: string;
    password: string;
    company_code: string;
  }) => Promise<void>;
  handleRegister: (userData: {
    first_name: string;
    last_name: string;
    email: string;
    company_code: string;
    department_id: number;
    role_id: number;
    password?: string;
  }) => Promise<void>;
};

const COMPANIES = [
  { code: "QC", label: "Quince Capital" },
  { code: "ABC", label: "ABC Company" },
];

const DEPARTMENTS = [
  { id: 1, label: "IT" },
  { id: 2, label: "Support" },
  { id: 3, label: "Operations" },
  { id: 4, label: "Billing" },
];

const LoginCard = ({
  email,
  password,
  setEmail,
  setPassword,
  handleLogin,
  handleRegister,
}: Props) => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [companyCode, setCompanyCode] = useState("");

  // Registration local state
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCompanyCode, setRegCompanyCode] = useState("");
  const [regDepartmentId, setRegDepartmentId] = useState<number | "">("");
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
    if (!regCompanyCode) {
      tempErrors.company = "Company is required";
    }
    if (!regDepartmentId) {
      tempErrors.department = "Department is required";
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
        company_code: regCompanyCode,
        department_id: Number(regDepartmentId),
        role_id: 4,
        password: regPassword,
      });
      // Clear form and toggle back to login on success
      setEmail(regEmail.trim().toLowerCase());
      setPassword("");
      setMode("login");
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegCompanyCode("");
      setRegDepartmentId("");
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
    if (!companyCode) {
      tempErrors.loginCompany = "Company is required";
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    await handleLogin({ email, password, company_code: companyCode });
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
        <Typography variant="h6" sx={{ color: "#211b5a", fontWeight: 600, mt: 1 }}>
          {mode === "login" ? "Sign In to Your Account" : "Create New Account"}
        </Typography>
      </Box>

      {mode === "login" ? (
        <>
          {/* Company Selector on Login */}
          <FormControl
            fullWidth
            error={!!errors.loginCompany}
            sx={{ mt: 2 }}
          >
            <InputLabel id="login-company-label" sx={{ ml: 1 }}>Company</InputLabel>
            <Select
              labelId="login-company-label"
              value={companyCode}
              label="Company"
              onChange={(e) => setCompanyCode(e.target.value)}
              sx={{
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 1,
                },
              }}
            >
              {COMPANIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
            {errors.loginCompany && (
              <FormHelperText>{errors.loginCompany}</FormHelperText>
            )}
          </FormControl>

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
              "&:hover": { color: "#211b5a" },
            }}
          >
            Forgot Password?
          </Typography>

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onLoginSubmit}
              sx={{
                backgroundColor: "#F4C63D",
                color: "#211b5a",
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
                color: "#211b5a",
                borderColor: "#D9D9D9",
                textTransform: "none",
                fontWeight: 600,
                height: 50,
                "&:hover": {
                  borderColor: "#211b5a",
                  backgroundColor: "rgba(30, 58, 138, 0.05)",
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

          {/* Company Dropdown */}
          <FormControl
            fullWidth
            error={!!errors.company}
            sx={{ mt: 2.5 }}
          >
            <InputLabel id="reg-company-label" sx={{ ml: 1 }}>Company</InputLabel>
            <Select
              labelId="reg-company-label"
              value={regCompanyCode}
              label="Company"
              onChange={(e) => setRegCompanyCode(e.target.value)}
              sx={{
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 1,
                },
              }}
            >
              {COMPANIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
            {errors.company && (
              <FormHelperText>{errors.company}</FormHelperText>
            )}
          </FormControl>

          {/* Department Dropdown — now uses department_id */}
          <FormControl
            fullWidth
            error={!!errors.department}
            sx={{ mt: 2.5 }}
          >
            <InputLabel id="reg-department-label" sx={{ ml: 1 }}>Department</InputLabel>
            <Select
              labelId="reg-department-label"
              value={regDepartmentId}
              label="Department"
              onChange={(e) => setRegDepartmentId(Number(e.target.value))}
              sx={{
                borderRadius: "30px",
                backgroundColor: "#EAF1FF",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 1,
                },
              }}
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
            {errors.department && (
              <FormHelperText>{errors.department}</FormHelperText>
            )}
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

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onRegisterSubmit}
              sx={{
                backgroundColor: "#F4C63D",
                color: "#211b5a",
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
                color: "#211b5a",
                borderColor: "#D9D9D9",
                textTransform: "none",
                fontWeight: 600,
                height: 50,
                "&:hover": {
                  borderColor: "#211b5a",
                  backgroundColor: "rgba(30, 58, 138, 0.05)",
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