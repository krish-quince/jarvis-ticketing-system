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
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add,
  KeyboardArrowDown,
  ConfirmationNumberOutlined,
  InsertChartOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // User details
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const userInitials =
    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
    "KB";
  const userName = user.first_name || "Krish";
  const isAdmin = user.role_id == 1;

  console.log(user);

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

  const [searchText, setSearchText] = useState("");
  const [searchParams] = useSearchParams();

  // Toast feedback state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ backgroundColor: "#211B5A", color: "#fff" }}
    >
      <Toolbar
        sx={{
          minHeight: "100px  !important",
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
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
            }}
            onClick={() => navigate("/tickets")}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.05,
                  fontSize: { xs: 20, md: 24 },
                }}
              >
                Quincecapital Helpdesk
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.25, md: 2 },
            }}
          >
            <OutlinedInput
              size="small"
              placeholder="Search... (or ticket ID)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/tickets?search=${encodeURIComponent(searchText)}`);
                }
              }}
              sx={{
                width: { xs: 0, md: 320 },
                display: { xs: "none", md: "flex" },
                borderRadius: "8px",

                bgcolor: isDark ? "#312A70" : "#fff",

                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)",
                },

                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(0,0,0,0.3)",
                },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F4C63D",
                },

                "& input": {
                  color: "#F4C63D",
                  fontSize: "15px",
                  py: 0.9,
                },

                "& input::placeholder": {
                  color: "#F4C63D",
                  opacity: 1,
                },
              }}
              startAdornment={
                <InputAdornment
                  position="start"
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    navigate(
                      `/tickets?search=${encodeURIComponent(searchText)}`,
                    );
                  }}
                >
                  <SearchIcon
                    sx={{
                      color: "#F4C63D",
                      fontSize: 22,
                    }}
                  />
                </InputAdornment>
              }
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, md: 1.5 },
              }}
            >
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/tickets/new")}
                sx={{
                  backgroundColor: "#211b5a",
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
                onClick={handleOpenMenu}
              >
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 15,
                    display: { xs: "none", sm: "block" },
                  }}
                >
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
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
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
                    <Typography
                      variant="subtitle1"
                      noWrap
                      sx={{ fontWeight: 700, lineHeight: 1.2 }}
                    >
                      {userName}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        color: "rgba(255, 255, 255, 0.55)",
                        display: "block",
                        mt: 0.2,
                      }}
                    >
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider
                  sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 1.5 }}
                />

                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.35)",
                      fontWeight: 600,
                      display: "block",
                      mb: 1,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Recently viewed tickets
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: "12px",
                        fontWeight: 700,
                        backgroundColor: "#211b5a",
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
                      backgroundColor: "#211b5a",
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
                      backgroundColor: "#211b5a",
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
          backgroundColor: "#211b5a",
          display: "flex",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: { xs: 2, md: 3 },
            width: "100%",
            maxWidth: "none",
            mx: "auto",
            overflowX: "auto",
          }}
        >
          {[
            {
              label: "Tickets",
              path: "/tickets",
              icon: ConfirmationNumberOutlined,
            },
            {
              label: "Reports",
              path: "/reports",
              disabled: true,
              icon: InsertChartOutlined,
            },
            ...(isAdmin
              ? [
                  {
                    label: "Administration",
                    path: "/users",
                    icon: SettingsOutlined,
                  },
                ]
              : []),
          ].map((tab) => {
            const isTabActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Button
                key={tab.label}
                onClick={() => {
                  if (tab.disabled) {
                    setToast({
                      open: true,
                      message: `${tab.label} module is coming soon!`,
                      severity: "success",
                    });
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
                  borderBottom: isTabActive
                    ? "2px solid #F4C63D"
                    : "2px solid transparent",
                  transition: "all 0.15s ease",
                  minWidth: "max-content",
                  "&:hover": {
                    color: "#F4C63D",
                    backgroundColor: "transparent",
                  },
                }}
                startIcon={
                  <Icon
                    sx={{
                      fontSize: "22px !important",
                      color: isTabActive
                        ? "#F4C63D"
                        : "rgba(255, 255, 255, 0.62)",
                    }}
                  />
                }
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
      </Box>

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
          sx={{
            width: "100%",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Topbar;
