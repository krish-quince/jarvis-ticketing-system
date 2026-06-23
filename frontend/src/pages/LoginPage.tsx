import { useState, useMemo } from "react";
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
  Checkbox,
  FormControlLabel,
  Link,
  Snackbar,
  Alert,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Can be email or user_code
  const [loginPassword, setLoginPassword] = useState("");

  // Registration inputs
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCompanyCode, setRegCompanyCode] = useState("");
  const [regDepartmentId, setRegDepartmentId] = useState<number | "">("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: Record<string, string> = {};
    if (!loginIdentifier.trim()) {
      tempErrors.loginIdentifier = "Username or email is required";
    }
    if (!loginPassword) {
      tempErrors.loginPassword = "Password is required";
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    try {
      const data: any = await login(loginIdentifier.trim(), loginPassword);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/tickets");
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        message: "Invalid Username/Email or Password",
        severity: "error",
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: Record<string, string> = {};
    if (!regFirstName.trim()) tempErrors.firstName = "First name is required";
    if (!regLastName.trim()) tempErrors.lastName = "Last name is required";
    if (!regEmail.trim()) {
      tempErrors.email = "Email is required";
    } else if (!validateEmail(regEmail)) {
      tempErrors.email = "Please enter a valid email";
    }
    if (!regCompanyCode) tempErrors.companyCode = "Company is required";
    if (!regDepartmentId) tempErrors.departmentId = "Department is required";
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
      const cleanName = (val: string) =>
        val
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      const generatedCode = [
        regCompanyCode.toUpperCase(),
        "employee",
        cleanName(`${regFirstName} ${regLastName}`),
      ].filter(Boolean).join("_");

      await register({
        company_code: regCompanyCode,
        role_id: 3,
        user_code: generatedCode,
        first_name: regFirstName,
        last_name: regLastName,
        email: regEmail,
        password: regPassword,
        phone: "",
        department_id: Number(regDepartmentId),
      });

      setToast({
        open: true,
        message: "Account created successfully! Please log in.",
        severity: "success",
      });
      setMode("login");
      setLoginIdentifier(regEmail);
      setLoginPassword(regPassword);
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Registration failed. Try again.",
        severity: "error",
      });
    }
  };

  const departmentsList = useMemo(() => {
    if (!regCompanyCode) return [];
    return DEPARTMENTS[regCompanyCode] || [];
  }, [regCompanyCode]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        backgroundColor: "#fff",
      }}
    >
      {/* Left Panel: Hero Section */}
      <Box
        sx={{
          width: { xs: "100%", md: "45%" },
          background: "linear-gradient(135deg, #1e40af, #2563eb)",
          color: "#fff",
          p: { xs: 5, md: 8, lg: 10 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: { xs: "auto", md: "100vh" },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "34px", md: "44px", lg: "50px" },
            fontWeight: 700,
            mb: 2,
            lineHeight: 1.2,
          }}
        >
          ServiceDesk Pro
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "15px", lg: "16px" },
            lineHeight: 1.8,
            opacity: 0.9,
            mb: 4,
          }}
        >
          Enterprise Helpdesk & Service Management Platform for IT, HR, Operations, Finance and Business Support Teams.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
          <Typography variant="body2" sx={{ fontSize: "15px", fontWeight: 500 }}>✓ Incident & Ticket Management</Typography>
          <Typography variant="body2" sx={{ fontSize: "15px", fontWeight: 500 }}>✓ SLA & Escalation Tracking</Typography>
          <Typography variant="body2" sx={{ fontSize: "15px", fontWeight: 500 }}>✓ Asset Management</Typography>
          <Typography variant="body2" sx={{ fontSize: "15px", fontWeight: 500 }}>✓ Knowledge Base</Typography>
          <Typography variant="body2" sx={{ fontSize: "15px", fontWeight: 500 }}>✓ Workflow Automation</Typography>
          <Typography variant="body2" sx={{ fontSize: "15px", fontWeight: 500 }}>✓ Audit Logs & Security</Typography>
        </Box>
      </Box>

      {/* Right Panel: Interactive Form */}
      <Box
        sx={{
          width: { xs: "100%", md: "55%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 4, md: 6, lg: 8 },
          minHeight: { xs: "auto", md: "100vh" },
          overflowY: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "480px" }}>
          {mode === "login" ? (
            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
              <Typography
                variant="h2"
                sx={{
                  color: "#1e3a8a",
                  fontSize: "36px",
                  fontWeight: 700,
                  textAlign: "center",
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#64748b",
                  textAlign: "center",
                  mb: 4.5,
                  fontSize: "15px",
                }}
              >
                Sign in securely to access your dashboard
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Username or Email Address"
                  placeholder="name@company.com or userCode"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  error={!!errors.loginIdentifier}
                  helperText={errors.loginIdentifier}
                  size="small"
                  slotProps={{
                    htmlInput: { style: { padding: "12px 14px" } }
                  }}
                />

                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Enter Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  error={!!errors.loginPassword}
                  helperText={errors.loginPassword}
                  size="small"
                  slotProps={{
                    htmlInput: { style: { padding: "12px 14px" } },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePassword} edge="end" size="small">
                            {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: -0.5,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{ color: "#dbe3ef", "&.Mui-checked": { color: "#2563eb" } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: "14px", color: "#334155" }}>Remember Me</Typography>}
                  />
                  <Link href="#" sx={{ fontSize: "14px", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                    Forgot Password?
                  </Link>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    py: 1.6,
                    textTransform: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                  }}
                >
                  Sign In
                </Button>

                {/* SSO Buttons */}
                <Box
                  sx={{
                    textAlign: "center",
                    position: "relative",
                    my: 1.5,
                    color: "#94a3b8",
                    fontSize: "14px",
                    "&::before, &::after": {
                      content: '""',
                      position: "absolute",
                      top: "50%",
                      width: "42%",
                      height: "1px",
                      backgroundColor: "#e2e8f0",
                    },
                    "&::before": { left: 0 },
                    "&::after": { right: 0 },
                  }}
                >
                  OR
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    py: 1.4,
                    textTransform: "none",
                    color: "#0078D4",
                    borderColor: "#dbe3ef",
                    borderRadius: "10px",
                    fontWeight: 500,
                    fontSize: "14px",
                    backgroundColor: "#fff",
                    "&:hover": { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
                  }}
                >
                  🪟 Sign in with Microsoft 365
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    py: 1.4,
                    textTransform: "none",
                    color: "#DB4437",
                    borderColor: "#dbe3ef",
                    borderRadius: "10px",
                    fontWeight: 500,
                    fontSize: "14px",
                    backgroundColor: "#fff",
                    "&:hover": { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
                  }}
                >
                  🔵 Sign in with Google Workspace
                </Button>

                {/* 2FA Enabled Box */}
                <Box
                  sx={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    p: 2.5,
                    mt: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 1, fontSize: "14px" }}>
                    🔐 Multi-Factor Authentication Enabled
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontSize: "13px", mt: 0.5, lineHeight: 1.6 }}>
                    After successful login, users will be prompted to verify their identity using a secure authenticator application.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.2, mt: 2 }}>
                    <Box sx={{ backgroundColor: "#e0e7ff", color: "#1e40af", px: 1.8, py: 0.6, borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                      Microsoft Authenticator
                    </Box>
                    <Box sx={{ backgroundColor: "#e0e7ff", color: "#1e40af", px: 1.8, py: 0.6, borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                      Google Authenticator
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ textAlign: "center", mt: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: "14px", color: "#64748b" }}>
                    Don't have an account?{" "}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setErrors({});
                      }}
                      sx={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", fontSize: "14px" }}
                    >
                      Sign Up
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
              <Typography
                variant="h2"
                sx={{
                  color: "#1e3a8a",
                  fontSize: "36px",
                  fontWeight: 700,
                  textAlign: "center",
                  mb: 1,
                }}
              >
                Create Account
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#64748b",
                  textAlign: "center",
                  mb: 4.5,
                  fontSize: "15px",
                }}
              >
                Register to get started with ServiceDesk Pro
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    size="small"
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  size="small"
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl fullWidth size="small" error={!!errors.companyCode}>
                    <InputLabel id="reg-company-label">Company</InputLabel>
                    <Select
                      labelId="reg-company-label"
                      label="Company"
                      value={regCompanyCode}
                      onChange={(e) => {
                        setRegCompanyCode(e.target.value);
                        setRegDepartmentId("");
                      }}
                    >
                      {COMPANIES.map((c) => (
                        <MenuItem key={c.code} value={c.code}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" error={!!errors.departmentId} disabled={!regCompanyCode}>
                    <InputLabel id="reg-dept-label">Department</InputLabel>
                    <Select
                      labelId="reg-dept-label"
                      label="Department"
                      value={regDepartmentId}
                      onChange={(e) => setRegDepartmentId(Number(e.target.value))}
                    >
                      {departmentsList.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    label="Confirm Password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    size="small"
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    py: 1.6,
                    mt: 1,
                    textTransform: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                  }}
                >
                  Sign Up
                </Button>

                <Box sx={{ textAlign: "center", mt: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: "14px", color: "#64748b" }}>
                    Already have an account?{" "}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrors({});
                      }}
                      sx={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", fontSize: "14px" }}
                    >
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Typography
            sx={{
              mt: 5,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            © 2026 ServiceDesk Pro | Secure Access • SSO • 2FA Enabled
          </Typography>
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
