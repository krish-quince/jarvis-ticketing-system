import {
  AppBar,
  Toolbar,
  Box,
  OutlinedInput,
  InputAdornment,
  Typography,
  Button,
  Avatar,
  Popover,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add,
  KeyboardArrowDown,
  ConfirmationNumberOutlined,
  MenuBookOutlined,
  Inventory2Outlined,
  InsertChartOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createTicket } from "../services/ticketService";

const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // User details
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  
  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "KB";
  const userName = user.first_name || "Krish";
  const isAdmin = user.role_id === 1;

  // Profile Menu Popover state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // New Ticket dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General Issues");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      setToast({ open: true, message: "Please fill in all fields", severity: "error" });
      return;
    }

    try {
      setSubmitting(true);
      await createTicket({
        subject,
        description,
        category_name: category,
        priority_name: priority,
      });

      setToast({ open: true, message: "Ticket created successfully!", severity: "success" });
      setOpenDialog(false);
      setSubject("");
      setDescription("");
      setCategory("General Issues");
      setPriority("Medium");

      // Reload page content if we are on the tickets view
      if (location.pathname === "/tickets") {
        window.location.reload();
      } else {
        navigate("/tickets");
      }
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to create ticket",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: "#211B5A", color: "#fff" }}>
      <Toolbar
        sx={{
          minHeight: "76px !important",
          px: { xs: 2, sm: 3, md: 4 },
          py: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "none",
            mx: "auto",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
            onClick={() => navigate("/tickets")}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.05, fontSize: { xs: 20, md: 24 } }}>
                Quincecapital Helpdesk
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.25, md: 2 } }}>
            <OutlinedInput
              size="small"
              placeholder="search... (or ticket ID)"
              sx={{
                width: { xs: 0, md: 320 },
                display: { xs: "none", md: "flex" },
                borderRadius: "8px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.15)",
                },
                "& input": {
                  color: "#fff",
                  fontSize: "15px",
                  py: 0.9,
                },
                "& input::placeholder": {
                  color: "rgba(255, 255, 255, 0.65)",
                  opacity: 1,
                },
                bgcolor: "#312A70",
              }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#F4C63D", fontSize: 22 }} />
                </InputAdornment>
              }
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 } }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
                sx={{
                  backgroundColor: "#3A3482",
                  color: "#fff",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  fontSize: 15,
                  px: 1.7,
                  py: 0.8,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#2D2675",
                    boxShadow: "none",
                  },
                }}
              >
                New ticket
              </Button>

              {/* User Profile dropdown */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={handleOpenMenu}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    fontSize: "14px",
                    fontWeight: 700,
                    backgroundColor: "#F4C63D",
                    color: "#211B5A",
                  }}
                >
                  {userInitials}
                </Avatar>
                <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600, fontSize: 15, display: { xs: "none", sm: "block" } }}>
                  {userName}
                </Typography>
                <KeyboardArrowDown sx={{ color: "#F4C63D", fontSize: 22 }} />
              </Box>

              {/* Custom Dark Profile Popover Pop-up matching Jitbit reference */}
              <Popover
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                slotProps={{
                  paper: {
                    sx: {
                      p: 3,
                      width: 290,
                      borderRadius: 3,
                      backgroundColor: "#242038", // custom dark shade from Jitbit dropdown
                      color: "#fff",
                      boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.35)",
                      mt: 1.5,
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      fontSize: "18px",
                      fontWeight: 700,
                      backgroundColor: "rgba(255, 255, 255, 0.12)",
                      color: "#fff",
                    }}
                  >
                    {userInitials}
                  </Avatar>
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {userName}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: "rgba(255, 255, 255, 0.55)", display: "block", mt: 0.2 }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 1.5 }} />

                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.35)", fontWeight: 600, display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Recently viewed tickets
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: "12px",
                        fontWeight: 700,
                        backgroundColor: "#3A3482",
                        color: "#fff",
                      }}
                    >
                      C
                    </Avatar>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCloseMenu}
                    sx={{
                      backgroundColor: "#3A3482",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      "&:hover": { backgroundColor: "#2D2675" },
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleLogout}
                    sx={{
                      backgroundColor: "#4A5568",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      "&:hover": { backgroundColor: "#2D3748" },
                    }}
                  >
                    Log out
                  </Button>
                </Box>
              </Popover>
            </Box>
          </Box>
        </Box>
      </Toolbar>

      {/* Secondary Navigation Row (Tabs) */}
      <Box
        sx={{
          backgroundColor: "#3A3482",
          display: "flex",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, width: "100%", maxWidth: "none", mx: "auto", overflowX: "auto" }}>
          {[
            { label: "Tickets", path: "/tickets", icon: ConfirmationNumberOutlined },
            { label: "Knowledge base", path: "/knowledge-base", disabled: true, icon: MenuBookOutlined },
            { label: "Assets", path: "/assets", disabled: true, icon: Inventory2Outlined },
            { label: "Reports", path: "/reports", disabled: true, icon: InsertChartOutlined },
            ...(isAdmin ? [{ label: "Administration", path: "/users", icon: SettingsOutlined }] : [{ label: "Administration", path: "/users", disabled: true, icon: SettingsOutlined }]),
          ].map((tab) => {
            const isTabActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Button
                key={tab.label}
                onClick={() => {
                  if (tab.disabled) {
                    setToast({ open: true, message: `${tab.label} module is coming soon!`, severity: "success" });
                  } else {
                    navigate(tab.path);
                  }
                }}
                sx={{
                  color: isTabActive ? "#F4C63D" : "rgba(255, 255, 255, 0.88)",
                  fontWeight: 600,
                  fontSize: 15,
                  py: 1.45,
                  px: 0,
                  textTransform: "none",
                  borderRadius: 0,
                  borderBottom: isTabActive ? "2px solid #F4C63D" : "2px solid transparent",
                  transition: "all 0.15s ease",
                  minWidth: "max-content",
                  "&:hover": {
                    color: "#F4C63D",
                    backgroundColor: "transparent",
                  },
                }}
                startIcon={<Icon sx={{ fontSize: "22px !important", color: isTabActive ? "#F4C63D" : "rgba(255, 255, 255, 0.62)" }} />}
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
      </Box>

      {/* New Ticket Dialog Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "#211B5A" }}>Create New Ticket</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            autoFocus
            label="Subject / Ticket Title"
            variant="outlined"
            fullWidth
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <TextField
            label="Describe the issue or request"
            variant="outlined"
            fullWidth
            required
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="dialog-category-label">Category</InputLabel>
              <Select
                labelId="dialog-category-label"
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="General Issues">General Issues</MenuItem>
                <MenuItem value="Technical">Technical</MenuItem>
                <MenuItem value="Bug reports">Bug reports</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="dialog-priority-label">Priority</InputLabel>
              <Select
                labelId="dialog-priority-label"
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTicket}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: "#211B5A",
              color: "#fff",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#3A3482" },
            }}
          >
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: "100%", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Topbar;
