import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Business,
  Delete,
  Edit,
  People,
  Restore,
  Save,
} from "@mui/icons-material";

import { createCompany, getCompanies, updateCompany, deleteCompany, restoreCompany } from "../services/masterService";
import { getUsersWithAllData } from "../services/userService";
import { ROLE_CONFIG } from "./users/roleConfig";
import type { UserRecord } from "./users/userTypes";

type CompanyRecord = {
  company_code: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  is_deleted?: boolean;
};

const emptyCompany = {
  company_code: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
};

const AdminCompaniesPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [form, setForm] = useState(emptyCompany);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(selectedCompany);

  const selectedUsers = useMemo(
    () => users.filter((user) => user.company_code === selectedCompany?.company_code),
    [selectedCompany, users],
  );

  const loadCompanies = async () => {
    const companyData = await getCompanies();
    setCompanies(companyData || []);
  };

  const loadUsers = async (companyCode?: string) => {
    const userData = await getUsersWithAllData(companyCode);
    setUsers(userData || []);
  };

  useEffect(() => {
    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

    if (Number(currentUser.role_id) !== 4) {
      navigate("/admin");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        await Promise.all([loadCompanies(), loadUsers()]);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load companies");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const openCreateDialog = () => {
    setSelectedCompany(null);
    setForm(emptyCompany);
    setDialogOpen(true);
  };

  const openEditDialog = (company: CompanyRecord) => {
    setSelectedCompany(company);
    setForm({
      company_code: company.company_code || "",
      company_name: company.company_name || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
    });
    setDialogOpen(true);
  };

  const saveCompany = async () => {
    if (!form.company_code.trim() || !form.company_name.trim()) {
      setError("Company code and company name are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        company_code: form.company_code.trim().toUpperCase(),
        company_name: form.company_name.trim(),
      };

      if (selectedCompany) {
        const updated = await updateCompany(selectedCompany.company_code, payload);
        setSelectedCompany(updated);
      } else {
        await createCompany(payload);
      }

      await loadCompanies();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "var(--bg)", p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <IconButton size="small" onClick={() => navigate("/admin")}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Business sx={{ color: "var(--accent)" }} />
          <Box>
            <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>
              Administration
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--text-h)" }}>
              Companies
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
          sx={{ backgroundColor: "var(--accent)", textTransform: "none", fontWeight: 700 }}
        >
          Add company
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" }, gap: 3 }}>
        <Paper elevation={0} sx={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid var(--border)" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)" }}>
              Company list
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            companies.map((company) => (
              <Box
                key={company.company_code}
                onClick={() => {
                  setSelectedCompany(company);
                  loadUsers(company.company_code);
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: selectedCompany?.company_code === company.company_code
                    ? "rgba(99,102,241,0.08)"
                    : "transparent",
                  "&:hover": { backgroundColor: "var(--bg-row-hover)" },
                  opacity: company.is_deleted ? 0.6 : 1,
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--text-h)", display: "flex", alignItems: "center", gap: 1 }}>
                  {company.company_name}
                  {company.is_deleted && (
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: "4px", backgroundColor: "#ffe4e6", color: "#be123c", fontWeight: 600 }}>
                      Deleted
                    </span>
                  )}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--text-sub)", fontFamily: "monospace" }}>
                  {company.company_code}
                </Typography>
              </Box>
            ))
          )}
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          {selectedCompany ? (
            <>
              <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, color: "var(--text-h)" }}>
                    {selectedCompany.company_name}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 13, color: "var(--text-sub)" }}>
                    {selectedCompany.company_code}
                  </Typography>
                  <Typography sx={{ mt: 1.5, fontSize: 13, color: "var(--text)" }}>
                    {selectedCompany.address || "No company details added"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {selectedCompany.is_deleted ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Restore />}
                      onClick={async () => {
                        try {
                          const updated = await restoreCompany(selectedCompany.company_code);
                          setSelectedCompany(updated);
                          await loadCompanies();
                        } catch (err: any) {
                          setError(err.response?.data?.message || "Failed to restore company");
                        }
                      }}
                      sx={{ height: 38, textTransform: "none", whiteSpace: "nowrap" }}
                    >
                      Restore Company
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => openEditDialog(selectedCompany)}
                        sx={{ height: 38, textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        Edit details
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate(`/admin/users/new?companyCode=${selectedCompany.company_code}&roleId=1`)}
                        sx={{ height: 38, textTransform: "none", whiteSpace: "nowrap", backgroundColor: "var(--accent)" }}
                      >
                        Add Admin User
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${selectedCompany.company_name}? Users of this company will not be able to log in.`)) {
                            try {
                              const updated = await deleteCompany(selectedCompany.company_code);
                              setSelectedCompany(updated);
                              await loadCompanies();
                            } catch (err: any) {
                              setError(err.response?.data?.message || "Failed to delete company");
                            }
                          }
                        }}
                        sx={{ height: 38, textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        Delete Company
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              <Divider />

              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <People sx={{ fontSize: 18, color: "var(--accent)" }} />
                  <Typography sx={{ fontWeight: 700, color: "var(--text-h)" }}>
                    Company users
                  </Typography>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["User", "Name", "Email", "Role"].map((head) => (
                          <TableCell key={head} sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-sub)" }}>
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedUsers.map((user) => {
                        const role = ROLE_CONFIG[Number(user.role_id)] ?? ROLE_CONFIG[3];
                        return (
                          <TableRow key={user.user_code}>
                            <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{user.user_code}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{user.first_name} {user.last_name}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{user.email}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{role.label}</TableCell>
                          </TableRow>
                        );
                      })}
                      {selectedUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 5, color: "var(--text-sub)" }}>
                            No users in this company
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          ) : (
            <Box sx={{ minHeight: 360, display: "grid", placeItems: "center", color: "var(--text-sub)" }}>
              Select a company to view details and users
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? "Edit company" : "Add company"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            label="Company code"
            value={form.company_code}
            disabled={isEditing}
            onChange={(event) => setForm((prev) => ({ ...prev, company_code: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Company name"
            value={form.company_name}
            onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Company details"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            disabled={saving}
            onClick={saveCompany}
            sx={{ backgroundColor: "var(--accent)", textTransform: "none" }}
          >
            Save company
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCompaniesPage;
