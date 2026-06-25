import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Link,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SecurityIcon from "@mui/icons-material/Security";

import servicedeskLogo from "../assets/logos/servicedesk-logo.png";
import { login, register } from "../services/authService";

const COMPANIES = [
  { code: "QC", label: "Quince Capital" },
  { code: "ATNG", label: "Alpha TNG" },
];

const DEPARTMENTS: Record<string, { id: number; label: string }[]> = {
  QC: [
    { id: 1, label: "Sales" },
    { id: 2, label: "HR" },
    { id: 3, label: "IT" },
    { id: 4, label: "Finance" },
  ],
  ATNG: [
    { id: 5, label: "Sales" },
    { id: 6, label: "HR" },
    { id: 7, label: "IT" },
    { id: 8, label: "Finance" },
  ],
};

// SVG Google Logo
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.62v3.02h3.87c2.26-2.08 3.58-5.14 3.58-8.49z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.17v3.13C3.15 21.25 7.28 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.24 14.22c-.25-.72-.39-1.5-.39-2.3 0-.8.14-1.58.39-2.3V6.49H1.17c-.83 1.66-1.3 3.52-1.3 5.51s.47 3.85 1.3 5.51l4.07-3.13z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.96 1.19 15.24 0 12 0 7.28 0 3.15 2.75 1.17 6.49l4.07 3.13c.95-2.88 3.61-5.01 6.76-5.01z"
    />
  </svg>
);

// SVG Microsoft Logo
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" style={{ marginRight: 8 }}>
    <path fill="#f35022" d="M0 0h11v11H0z" />
    <path fill="#7fbb00" d="M12 0h11v11H12z" />
    <path fill="#00a1f1" d="M0 12h11v11H0z" />
    <path fill="#ffb900" d="M12 12h11v11H12z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [userCode, setUserCode] = useState("");
  const [password, setPassword] = useState("");

  // Registration states
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCompanyCode, setRegCompanyCode] = useState("");
  const [regDepartmentId, setRegDepartmentId] = useState<number | "">("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const validateEmail = (emailStr: string) => /\S+@\S+\.\S+/.test(emailStr);

  const handleLogin = async () => {
    const tempErrors: { [key: string]: string } = {};
    if (!userCode.trim()) tempErrors.userCode = "User Code or Email is required";
    if (!password) tempErrors.loginPassword = "Password is required";

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    try {
      const data: any = await login(userCode.trim(), password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (Number(data.user.role_id) === 4) {
        navigate("/admin");
      } else {
        navigate("/tickets");
      }
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        message: "Invalid User Code/Email or Password",
        severity: "error",
      });
    }
  };

  const handleRegister = async () => {
    const tempErrors: { [key: string]: string } = {};
    if (!regFirstName.trim()) tempErrors.firstName = "First name is required";
    if (!regLastName.trim()) tempErrors.lastName = "Last name is required";
    if (!regEmail.trim()) {
      tempErrors.email = "Email is required";
    } else if (!validateEmail(regEmail)) {
      tempErrors.email = "Please enter a valid email";
    }
    if (!regCompanyCode) tempErrors.company = "Company is required";
    if (!regDepartmentId) tempErrors.department = "Department is required";
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
      const clean = (value: string) =>
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      const calculatedUserCode = [
        regCompanyCode.toUpperCase(),
        "employee",
        clean(`${regFirstName} ${regLastName}`),
      ].filter(Boolean).join("_");

      await register({
        company_code: regCompanyCode,
        role_id: 4, // Employee role
        user_code: calculatedUserCode,
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        phone: "",
        department_id: Number(regDepartmentId),
      });

      setToast({
        open: true,
        message: `Registered successfully! Your User Code is ${calculatedUserCode}`,
        severity: "success",
      });
      setMode("login");
      // Reset form
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegCompanyCode("");
      setRegDepartmentId("");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Registration failed";
      setToast({
        open: true,
        message: errMsg,
        severity: "error",
      });
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "#fcfdfe",
      "&.Mui-focused fieldset": {
        borderColor: "#211B5A",
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#211B5A",
      // paddingTop: "12px",

    },
  };

  const selectSx = {
    borderRadius: "10px",
    backgroundColor: "#fcfdfe",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#211B5A",
    },
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ─── Top White Header Bar ─── */}
      <Box
        sx={{
          width: "100%",
          height: "70px",
          flexShrink: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1.5px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <img
          src={`${servicedeskLogo}?v=3`}
          alt="Service Desk Pro Logo"
          style={{ height: 65, objectFit: "cover" }}
        />
      </Box>

      {/* Main Split Section */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flex: 1,
          overflow: "hidden",
          "@media (max-width:900px)": {
            flexDirection: "column",
            overflowY: "auto",
          },
        }}
      >
        {/* Left Panel */}
        <Box
          sx={{
            width: "50%",
            backgroundColor: "#211B5A",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            overflow: "hidden",
            position: "relative",
            "@media (max-width:900px)": {
              width: "100%",
              p: 4,
            },
          }}
        >
          {/* Decorative circle — top left */}
          <Box
            sx={{
              position: "absolute",
              top: "-100px",
              left: "-100px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.09)",
              pointerEvents: "none",
            }}
          />
          {/* Decorative circle — bottom right */}
          <Box
            sx={{
              position: "absolute",
              bottom: "-70px",
              right: "-70px",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              px: { xs: 4, md: 7 },
              py: { xs: 4, md: 0 },
              maxWidth: "480px",
            }}
          >
            {/* Heading */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: "34px", md: "50px" },
                lineHeight: 1.15,
                fontFamily: "'InterVariable', sans-serif",
                color: "#ffffff",
              }}
            >
              ServiceDesk Pro
            </Typography>

            {/* Description */}
            <Typography
              sx={{
                fontSize: { xs: "14px", md: "15.5px" },
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.88)",
                mb: 5,
                fontFamily: "'InterVariable', sans-serif",
              }}
            >
              Smart Ticketing &amp; Service Management Platform designed to
              streamline support operations, automate workflows, and accelerate
              issue resolution.
            </Typography>

            {/* Feature Checklist */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {[
                "Ticket Management",
                "SLA Tracking",
                "Workflow Automation",
                "Reports & Dashboards",
              ].map((feature) => (
                <Box
                  key={feature}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Typography
                    sx={{
                      fontSize: "17px",
                      color: "#ffffff",
                      fontWeight: 700,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: "14px", md: "15.5px" },
                      fontWeight: 500,
                      color: "#ffffff",
                      fontFamily: "'InterVariable', sans-serif",
                    }}
                  >
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            width: "50%",
            p: { xs: 3, md: 5 },
            pt: { xs: 4, md: 7 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            overflow: "hidden",
            "@media (max-width:900px)": {
              width: "100%",
              p: 4,
              pt: 4,
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >



            {/* Heading */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 0.8,
                fontSize: { xs: "26px", md: "32px" },
                color: "#211B5A",
                fontFamily: "'InterVariable', sans-serif",
              }}
            >
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </Typography>

            <Typography
              variant="body2"
              align="left"
              sx={{
                color: "#64748b",
                mb: 3,
                fontSize: "14px",
                fontFamily: "'InterVariable', sans-serif",
              }}
            >
              {mode === "login"
                ? "Sign in to access your ServiceDesk Pro account"
                : "Register to get started with Jarvis Helpdesk"}
            </Typography>

            {mode === "login" ? (
              <Box component="form" noValidate sx={{ display: "flex", flexDirection: "column", pt: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="User Code or Email Address"
                  placeholder="Enter your User Code or Email"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  error={!!errors.userCode}
                  helperText={errors.userCode}
                  sx={{ mb: 1.5, ...inputSx }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Password"
                  placeholder="Enter Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.loginPassword}
                  helperText={errors.loginPassword}
                  sx={{ mb: 1.5, ...inputSx }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePassword} edge="end" size="small">
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.8,
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox size="small" sx={{ color: "#211B5A", "&.Mui-checked": { color: "#211B5A" } }} />}
                    label={
                      <Typography variant="body2" sx={{ color: "#475569", fontSize: "13px" }}>
                        Remember Me
                      </Typography>
                    }
                  />
                  <Link
                    href="#"
                    underline="none"
                    sx={{
                      fontSize: "13px",
                      color: "#211B5A",
                      fontWeight: 500,
                      "&:hover": { color: "#151944" },
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    sx={{
                      backgroundColor: "#2563EB",
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontWeight: 700,
                      textTransform: "none",
                      py: 1.4,
                      fontSize: "15px",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                      "&:hover": { backgroundColor: "#1d4ed8" },
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
                      borderRadius: "10px",
                      color: "#211B5A",
                      borderColor: "#211B5A",
                      textTransform: "none",
                      fontWeight: 600,
                      py: 1.2,
                      fontSize: "14px",
                      "&:hover": {
                        borderColor: "#151944",
                        backgroundColor: "rgba(33, 27, 90, 0.05)",
                      },
                    }}
                  >
                    Register
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "12px",
                    mb: 1.5,
                    "&::before, &::after": {
                      content: '""',
                      flex: 1,
                      borderBottom: "1px solid #e2e8f0",
                    },
                    "&::before": { marginRight: 2 },
                    "&::after": { marginLeft: 2 },
                  }}
                >
                  OR
                </Box>

                <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderRadius: "10px",
                      borderColor: "#dbe3ef",
                      color: "#334155",
                      textTransform: "none",
                      py: 1,
                      fontSize: "12.5px",
                      fontWeight: 500,
                      "&:hover": {
                        borderColor: "#cbd5e1",
                        backgroundColor: "#f8fafc",
                      },
                    }}
                  >
                    <MicrosoftIcon /> Microsoft 365
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderRadius: "10px",
                      borderColor: "#dbe3ef",
                      color: "#334155",
                      textTransform: "none",
                      py: 1,
                      fontSize: "12.5px",
                      fontWeight: 500,
                      "&:hover": {
                        borderColor: "#cbd5e1",
                        backgroundColor: "#f8fafc",
                      },
                    }}
                  >
                    <GoogleIcon /> Google Workspace
                  </Button>
                </Box>

                {/* MFA security note */}
                <Box
                  sx={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <SecurityIcon sx={{ color: "#211B5A", fontSize: 16 }} />
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "#1e293b", fontWeight: 600, fontSize: "12.5px" }}
                    >
                      Multi-Factor Authentication Enabled
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "11.5px", lineHeight: 1.4 }}>
                    Identity verification via secure authenticator app is required post-login.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box component="form" noValidate sx={{ display: "flex", flexDirection: "column", overflowY: "auto", pr: 0.5, maxH: "55vh", pt: 1 }}>
                <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="First Name"
                    placeholder="First Name"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    sx={inputSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Last Name"
                    placeholder="Last Name"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    sx={inputSx}
                  />
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  placeholder="name@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{ mb: 1.5, ...inputSx }}
                />

                <FormControl fullWidth size="small" error={!!errors.company} sx={{ mb: 1.5 }}>
                  <InputLabel id="reg-company-label">Company</InputLabel>
                  <Select
                    labelId="reg-company-label"
                    value={regCompanyCode}
                    label="Company"
                    onChange={(e) => {
                      setRegCompanyCode(e.target.value);
                      setRegDepartmentId("");
                    }}
                    sx={selectSx}
                  >
                    {COMPANIES.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.company && <FormHelperText>{errors.company}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth size="small" error={!!errors.department} sx={{ mb: 1.5 }}>
                  <InputLabel id="reg-department-label">Department</InputLabel>
                  <Select
                    labelId="reg-department-label"
                    value={regDepartmentId}
                    label="Department"
                    onChange={(e) => setRegDepartmentId(Number(e.target.value))}
                    sx={selectSx}
                    disabled={!regCompanyCode}
                  >
                    {(DEPARTMENTS[regCompanyCode] || []).map((d) => (
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
                  size="small"
                  label="Password"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  sx={{ mb: 1.5, ...inputSx }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePassword} edge="end" size="small">
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  sx={{ mb: 2, ...inputSx }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePassword} edge="end" size="small">
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleRegister}
                    sx={{
                      backgroundColor: "#211B5A",
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontWeight: 600,
                      textTransform: "none",
                      py: 1.2,
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(33, 27, 90, 0.2)",
                      "&:hover": { backgroundColor: "#151944" },
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
                      borderRadius: "10px",
                      color: "#211B5A",
                      borderColor: "#211B5A",
                      textTransform: "none",
                      fontWeight: 600,
                      py: 1.2,
                      fontSize: "14px",
                      "&:hover": {
                        borderColor: "#151944",
                        backgroundColor: "rgba(33, 27, 90, 0.05)",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
              }}
            >
              <Typography
                align="center"
                sx={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  fontFamily: "'InterVariable', sans-serif",
                }}
              >
                © 2026 ServiceDesk Pro | Streamlining Support, Accelerating Resolution
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{
            width: "100%",
            borderRadius: "12px",
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
