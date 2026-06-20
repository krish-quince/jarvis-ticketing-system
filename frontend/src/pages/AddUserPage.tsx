import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  CheckCircleOutlined,
  Home,
  KeyboardArrowDown,
  Key,
  Save,
} from "@mui/icons-material";

import { createUser } from "../services/userService";
import { getCompanies, getDepartments, getRoles } from "../services/masterService";

type Option = {
  value: string;
  label: string;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

const makePassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  return Array.from({ length: 12 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
};

const AddUserPage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    email: "",
    user_code: "",
    first_name: "",
    last_name: "",
    company_code: currentUser.company_code || currentUser.companyCode || "",
    department_id: "",
    role_id: "",
    password: "",
    send_welcome_email: true,
    must_change_password: false,
  });

  useEffect(() => {
    if (Number(currentUser.role_id) !== 1) {
      navigate("/tickets");
      return;
    }

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [companyData, departmentData, roleData] = await Promise.all([
          getCompanies(),
          getDepartments(),
          getRoles(),
        ]);

        const nextCompanies = (companyData || []).map((company: any) => ({
          value: String(company.company_code),
          label: company.company_name || company.company_code,
        }));
        const nextDepartments = (departmentData || []).map((department: any) => ({
          value: String(department.department_id),
          label: department.department_name,
        }));
        const nextRoles = (roleData || []).map((role: any) => ({
          value: String(role.role_id),
          label: role.role_name,
        }));

        setCompanies(nextCompanies);
        setDepartments(nextDepartments);
        setRoles(nextRoles);

        setForm((prev) => ({
          ...prev,
          company_code: prev.company_code || nextCompanies[0]?.value || "",
          role_id:
            prev.role_id ||
            nextRoles.find((role: Option) => role.label.toLowerCase() === "employee")?.value ||
            nextRoles[0]?.value ||
            "",
        }));
      } catch (error: any) {
        setToast({
          open: true,
          severity: "error",
          message: error.response?.data?.message || "Failed to load form options",
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [currentUser, navigate]);

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.email || !form.user_code || !form.password || !form.company_code || !form.role_id) {
      setToast({
        open: true,
        severity: "error",
        message: "Fill email, username, company, role, and password before creating the user.",
      });
      return;
    }

    try {
      setSaving(true);
      await createUser({
        email: form.email.trim(),
        user_code: form.user_code.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        company_code: form.company_code,
        department_id: form.department_id || null,
        role_id: Number(form.role_id),
        password: form.password,
      });

      setToast({
        open: true,
        severity: "success",
        message: "User created successfully",
      });

      setTimeout(() => navigate("/admin/users"), 600);
    } catch (error: any) {
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to create user",
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--bg-card)",
      borderRadius: "7px",
      fontSize: 14,
      minHeight: 47,
      "& fieldset": { borderColor: "var(--border)" },
      "&:hover fieldset": { borderColor: "var(--accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--accent)", borderWidth: "1px" },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, rgba(248,250,252,0.96), rgba(244,247,251,0.9)), var(--bg)",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3, color: "var(--text-sub)" }}>
          <Tooltip title="Back to users">
            <IconButton size="small" onClick={() => navigate("/admin/users")}>
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>
          <Home sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 18, color: "var(--text-sub)" }}>›</Typography>
          <Typography
            onClick={() => navigate("/admin")}
            sx={{ fontSize: 14, cursor: "pointer", "&:hover": { color: "var(--accent)" } }}
          >
            Administration
          </Typography>
          <Typography sx={{ fontSize: 18, color: "var(--text-sub)" }}>›</Typography>
          <Typography
            onClick={() => navigate("/admin/users")}
            sx={{ fontSize: 14, cursor: "pointer", "&:hover": { color: "var(--accent)" } }}
          >
            Users, companies and permissions
          </Typography>
          <Typography sx={{ fontSize: 18, color: "var(--text-sub)" }}>›</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-sub)" }}>New</Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            backgroundColor: "var(--bg-card)",
            boxShadow: "0 12px 34px rgba(15, 23, 42, 0.08)",
            px: { xs: 3, md: 5 },
            py: { xs: 3, md: 4.5 },
          }}
        >
          <Typography sx={{ fontSize: 30, lineHeight: 1.15, fontWeight: 500, color: "var(--text-h)", mb: 4 }}>
            Add user
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, gap: 3.2, alignItems: "center" }}>
            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Email *</Typography>
            <TextField
              autoFocus
              fullWidth
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              sx={fieldSx}
            />

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Username *</Typography>
            <TextField
              fullWidth
              value={form.user_code}
              onChange={(event) => updateField("user_code", event.target.value)}
              sx={fieldSx}
            />

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>First name</Typography>
            <TextField
              fullWidth
              value={form.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
              sx={fieldSx}
            />

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Last name</Typography>
            <TextField
              fullWidth
              value={form.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
              sx={fieldSx}
            />

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Company</Typography>
            <TextField
              select
              fullWidth
              value={form.company_code}
              disabled={loadingOptions}
              onChange={(event) => updateField("company_code", event.target.value)}
              slotProps={{
                select: { IconComponent: KeyboardArrowDown, displayEmpty: true },
              }}
              sx={fieldSx}
            >
              <MenuItem value="" disabled>Type for suggestions or enter new value</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.value} value={company.value}>{company.label}</MenuItem>
              ))}
            </TextField>

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Department</Typography>
            <TextField
              select
              fullWidth
              value={form.department_id}
              disabled={loadingOptions}
              onChange={(event) => updateField("department_id", event.target.value)}
              slotProps={{
                select: { IconComponent: KeyboardArrowDown, displayEmpty: true },
              }}
              sx={fieldSx}
            >
              <MenuItem value="">No department</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.value} value={department.value}>{department.label}</MenuItem>
              ))}
            </TextField>

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Role *</Typography>
            <TextField
              select
              fullWidth
              value={form.role_id}
              disabled={loadingOptions}
              onChange={(event) => updateField("role_id", event.target.value)}
              slotProps={{
                select: { IconComponent: KeyboardArrowDown, displayEmpty: true },
              }}
              sx={fieldSx}
            >
              <MenuItem value="" disabled>Select role</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
              ))}
            </TextField>

            <Typography sx={{ color: "var(--text)", fontSize: 15 }}>Password *</Typography>
            <Box sx={{ display: "flex", gap: 1, maxWidth: 372 }}>
              <TextField
                fullWidth
                type="text"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key sx={{ fontSize: 18, color: "var(--text-sub)" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={fieldSx}
              />
              <Button
                variant="outlined"
                onClick={() => updateField("password", makePassword())}
                sx={{
                  minWidth: 118,
                  borderColor: "var(--border)",
                  color: "var(--text)",
                  textTransform: "none",
                  borderRadius: "7px",
                  "&:hover": { borderColor: "var(--accent)", backgroundColor: "rgba(99,102,241,0.06)" },
                }}
              >
                generate
              </Button>
            </Box>

            <Box />
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.send_welcome_email}
                    onChange={(event) => updateField("send_welcome_email", event.target.checked)}
                    icon={<CheckCircleOutlined />}
                    checkedIcon={<CheckCircleOutlined />}
                    sx={{ color: "var(--text-sub)", "&.Mui-checked": { color: "var(--accent)" } }}
                  />
                }
                label="Send welcome email (Disabled in trial)"
                sx={{ m: 0, color: "var(--text)", "& .MuiFormControlLabel-label": { fontSize: 15 } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.must_change_password}
                    onChange={(event) => updateField("must_change_password", event.target.checked)}
                    sx={{ color: "var(--text-sub)", "&.Mui-checked": { color: "var(--accent)" } }}
                  />
                }
                label="User must change password on next login"
                sx={{ m: 0, color: "var(--text)", "& .MuiFormControlLabel-label": { fontSize: 15 } }}
              />
            </Box>

            <Box />
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <Save />}
              disabled={saving || loadingOptions}
              onClick={handleSubmit}
              sx={{
                mt: 2,
                width: "fit-content",
                backgroundColor: "var(--accent)",
                borderRadius: "7px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 15,
                px: 2.5,
                py: 1.2,
                "&:hover": { backgroundColor: "var(--accent-dark, var(--accent))" },
              }}
            >
              Create and continue
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddUserPage;
