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
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCompanySettings } from "../services/masterService";

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const getLogoUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
};

const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const [companyInfo, setCompanyInfo] = useState<{ company_name: string; logo_url?: string; favicon_url?: string; helpdesk_title?: string; title_link?: string } | null>(null);

  const updateFavicon = (faviconUrl?: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = faviconUrl ? getLogoUrl(faviconUrl) : "/favicon.ico";
  };

  const fetchAndSetSettings = () => {
    if (user.company_code) {
      getCompanySettings()
        .then((settings) => {
          if (settings) {
            setCompanyInfo(settings);
            if (settings.favicon_url) {
              updateFavicon(settings.favicon_url);
            }
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchAndSetSettings();

    window.addEventListener("company-settings-updated", fetchAndSetSettings);
    return () => {
      window.removeEventListener("company-settings-updated", fetchAndSetSettings);
    };
  }, [user.company_code]);

  const userInitials =
    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
    "KB";
  const userName = user.first_name || "Krish";
  const isAdmin = [1, 4].includes(Number(user.role_id));
  const isSuperAdmin = Number(user.role_id) === 4;

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
          px: { xs: 2, md: 4 },
          py: 0,
          minHeight: "64px !important",
        }}
      >
        {/* ── Zone 1: Logo (left) ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            flexShrink: 0,
          }}
          onClick={() => {
            if (companyInfo?.title_link) {
              window.open(companyInfo.title_link, "_blank", "noopener,noreferrer");
            } else {
              navigate("/tickets");
            }
          }}
        >
          {companyInfo?.logo_url ? (
            <Avatar
              src={getLogoUrl(companyInfo.logo_url)}
              variant="rounded"
              sx={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.2)" }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 14, fontWeight: 700 }}
            >
              {user.company_code ? user.company_code.substring(0, 2).toUpperCase() : "JH"}
            </Avatar>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.05,
              fontSize: { xs: 16, md: 20 },
              whiteSpace: "nowrap",
            }}
          >
            {companyInfo?.helpdesk_title || companyInfo?.company_name || "Jarvis Helpdesk"}
          </Typography>
        </Box>

        {/* ── Zone 2: Search (center, expands to fill space) ── */}
        {!isSuperAdmin ? (
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              px: 4,
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
              width: "100%",
              maxWidth: 480,
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
                onClick={() =>
                  navigate(`/tickets?search=${encodeURIComponent(searchText)}`)
                }
              >
                <SearchIcon sx={{ color: "#F4C63D", fontSize: 22 }} />
              </InputAdornment>
            }
          />
        </Box>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        {/* ── Zone 3: Actions (right) ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 1.5 },
            flexShrink: 0,
            ml: { xs: "auto", md: 0 },
          }}
        >
          {!isSuperAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/tickets/new")}
              sx={{
                backgroundColor: "#F4C63D",
                color: "#211B5A",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "8px",
                fontSize: 15,
                px: 2,
                py: 0.8,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: "#e0b22d",
                  boxShadow: "none",
                },
              }}
            >
              New ticket
            </Button>
          )}

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

          {/* Profile Popover */}
          <Popover
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  p: 3,
                  width: 290,
                  borderRadius: 3,
                  backgroundColor: "#242038",
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
      </Toolbar>

      {/* Secondary Navigation Row (Tabs) */}
      <Box
        sx={{
          backgroundColor: "",
          display: "flex",
          px: { xs: 0, md: 4 },
          
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: { xs: 0, md: 3 },
            width: "100%",
            overflowX: "auto",
          }}
        >
          {[
            ...(!isSuperAdmin
              ? [
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
                ]
              : []),
            ...(isAdmin
              ? [
                  {
                    label: "Administration",
                    path: "/admin",
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
