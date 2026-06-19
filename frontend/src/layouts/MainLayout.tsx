import { Box, Button } from "@mui/material";
import {
  Outlet,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Contrast as AutoModeIcon,
  FilterList,
  Sort,
  ViewColumn,
} from "@mui/icons-material";
import Topbar from "../components/Topbar";
import { getTickets } from "../services/ticketService";
import { useThemeMode } from "../hooks/useThemeMode";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);

  const { themeMode, setThemeMode, isDark } = useThemeMode();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const fetchTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets for global counts:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [location.pathname]);

  const unansweredCount = tickets.filter(
    (t) => t.status_name?.toLowerCase() === "open",
  ).length;
  const unclosedCount = tickets.filter(
    (t) => t.status_name?.toLowerCase() !== "closed",
  ).length;
  const unassignedCount = tickets.filter(
    (t) => !t.assigned_to_user_code,
  ).length;
  const assignedCount = tickets.filter(
    (t) =>
      t.assigned_to_user_code === currentUser.user_code ||
      t.assigned_to_user_code === currentUser.userCode,
  ).length;
  const allCount = tickets.length;

  const activePill = searchParams.get("filter") || "all";
  const isTicketListRoute = location.pathname === "/tickets";

  // Dark mode palette — matches the dark bg visible in the screenshot
  const darkBg = "#0f1117";
  const darkCard = "#161b27";
  const darkBorder = "rgba(255,255,255,0.08)";
  const darkText = "rgba(255,255,255,0.88)";
  const darkSubtext = "rgba(255,255,255,0.45)";

  const lightBg = "#eff6ff";
  const lightCard = "#eff6ff";
  const lightBorder = "rgba(0,0,0,0.08)";
  const lightText = "#111827";

  const bg = isDark ? darkBg : lightBg;
  const cardBg = isDark ? darkCard : lightCard;
  const border = isDark ? darkBorder : lightBorder;
  const text = isDark ? darkText : lightText;

  // Pill: inactive styling
  const pillInactiveBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(33,27,90,0.06)";
  const pillInactiveColor = isDark ? darkText : "#374151";
  const pillCountInactiveBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(33,27,90,0.1)";
  const pillCountInactiveColor = isDark ? darkText : "#374151";

  return (
    <Box
      sx={{
        backgroundColor: bg,
        color: text,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      <Topbar />

      {isTicketListRoute && (
        <Box
          sx={{
            backgroundColor: bg,
            pt: 2,
            pb: 3,
            px: { xs: 2, sm: 3, md: 4 },
            display: "flex",
            alignItems: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              width: "100%",
              overflowX: "auto",
            }}
          >
            {/* Filter Pills */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, md: 1.5 },
                alignItems: "center",
                minWidth: "max-content",
              }}
            >
              {[
                { id: "unanswered", label: "Unanswered", count: unansweredCount },
                { id: "unclosed",   label: "Unclosed",   count: unclosedCount   },
                { id: "unassigned", label: "Unassigned", count: unassignedCount },
                { id: "assigned",   label: "Assigned to you", count: assignedCount },
                { id: "all",        label: "All",        count: allCount        },
              ].map((pill) => {
                const isActive = activePill === pill.id;
                return (
                  <Button
                    key={pill.id}
                    onClick={() => navigate(`/tickets?filter=${pill.id}`)}
                    sx={{
                      backgroundColor: isActive ? "#211b5a" : pillInactiveBg,
                      color: isActive ? "#fff" : pillInactiveColor,
                      border: "1px solid",
                      borderColor: isActive
                        ? "#211b5a"
                        : isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(33,27,90,0.12)",
                      borderRadius: "999px",
                      textTransform: "none",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 14,
                      px: 1.5,
                      py: 0.65,
                      minWidth: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#211b5a",
                        color: isDark ? "#fff" : "#fff",
                        borderColor: isDark ? "rgba(255,255,255,0.2)" : "#211b5a",
                        "& .pill-count": {
                          backgroundColor: "#F4C63D",
                          color: "#211b5a",
                        },
                      },
                    }}
                  >
                    {pill.label}
                    <Box
                      className="pill-count"
                      sx={{
                        minWidth: 26,
                        height: 22,
                        px: 0.8,
                        borderRadius: "999px",
                        backgroundColor: isActive ? "#F4C63D" : pillCountInactiveBg,
                        color: isActive ? "#211b5a" : pillCountInactiveColor,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {pill.count}
                    </Box>
                  </Button>
                );
              })}
            </Box>

            {/* Columns / Sort / Filter */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.3, md: 2 },
                minWidth: "max-content",
              }}
            >
              {[
                { label: "Columns", icon: ViewColumn },
                { label: "Sort by", icon: Sort },
                { label: "Filter",  icon: FilterList },
              ].map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  startIcon={<Icon sx={{ fontSize: "20px !important" }} />}
                  sx={{
                    color: isDark ? darkSubtext : "#6b7280",
                    textTransform: "none",
                    fontWeight: 400,
                    fontSize: 14,
                    px: 0,
                    minWidth: "auto",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: isDark ? "#fff" : "#211b5a",
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          p: isTicketListRoute
            ? { xs: 2, sm: "0 40px 40px" }
            : { xs: 2, sm: 3, md: 4 },
          maxWidth: isTicketListRoute ? "none" : 1440,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          mt: "auto",
          py: 2.5,
          px: { xs: 3, md: 5 },
          borderTop: `1px solid ${border}`,
          backgroundColor: cardBg,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Theme switcher */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            p: 0.5,
            borderRadius: "6px",
            border: `1px solid ${border}`,
          }}
        >
          {(["light", "dark", "auto"] as const).map((mode) => {
            const isActive = themeMode === mode;
            const Icon =
              mode === "light"
                ? LightModeIcon
                : mode === "dark"
                ? DarkModeIcon
                : AutoModeIcon;
            return (
              <Button
                key={mode}
                onClick={() => setThemeMode(mode)}
                size="small"
                variant={isActive ? "contained" : "text"}
                disableElevation
                sx={{
                  textTransform: "capitalize",
                  px: 1.5,
                  py: 0.5,
                  minWidth: 0,
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  color: isActive ? "#fff" : isDark ? darkSubtext : "#6b7280",
                  backgroundColor: isActive ? "#211b5a" : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? "#211b5a"
                      : isDark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.04)",
                  },
                }}
                startIcon={<Icon sx={{ fontSize: "14px !important" }} />}
              >
                {mode}
              </Button>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;