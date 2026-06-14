import { Box, Button } from "@mui/material";
import { Outlet, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);

  const [themeMode, setThemeModeState] = useState<"light" | "dark" | "auto">(() => {
    return (localStorage.getItem("theme-mode") as "light" | "dark" | "auto") || "auto";
  });

  const setThemeMode = (mode: "light" | "dark" | "auto") => {
    localStorage.setItem("theme-mode", mode);
    setThemeModeState(mode);
  };

  useEffect(() => {
    const applyTheme = (mode: string) => {
      const root = document.documentElement;
      root.classList.remove("dark-theme", "light-theme");
      
      if (mode === "dark") {
        root.classList.add("dark-theme");
      } else if (mode === "light") {
        root.classList.add("light-theme");
      } else {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDark) {
          root.classList.add("dark-theme");
        } else {
          root.classList.add("light-theme");
        }
      }
    };

    applyTheme(themeMode);

    if (themeMode === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        root.classList.remove("dark-theme", "light-theme");
        if (e.matches) {
          root.classList.add("dark-theme");
        } else {
          root.classList.add("light-theme");
        }
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  // Current logged in user info
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

  const unansweredCount = tickets.filter((t) => t.status_name?.toLowerCase() === "open").length;
  const unclosedCount = tickets.filter((t) => t.status_name?.toLowerCase() !== "closed").length;
  const unassignedCount = tickets.filter((t) => !t.assigned_to_user_code).length;
  const assignedCount = tickets.filter((t) => t.assigned_to_user_code === currentUser.user_code || t.assigned_to_user_code === currentUser.userCode).length;
  const allCount = tickets.length;

  const activePill = searchParams.get("filter") || "all";
  const isTicketListRoute = location.pathname === "/tickets";

  return (
    <Box
      sx={{
        backgroundColor: "var(--bg-app)",
        color: "var(--text)",
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
            backgroundColor: "var(--bg-app)",
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
              maxWidth: "none",
              mx: "auto",
              overflowX: "auto",
            }}
          >
            <Box sx={{ display: "flex", gap: { xs: 1, md: 2.4 }, alignItems: "center", minWidth: "max-content" }}>
              {[
                { id: "unanswered", label: "Unanswered", count: unansweredCount },
                { id: "unclosed", label: "Unclosed", count: unclosedCount },
                { id: "unassigned", label: "Unassigned", count: unassignedCount },
                { id: "assigned", label: "Assigned to you", count: assignedCount },
                { id: "all", label: "All", count: allCount },
              ].map((pill) => {
                const isActive = activePill === pill.id;
                return (
                  <Button
                    key={pill.id}
                    onClick={() => navigate(`/tickets?filter=${pill.id}`)}
                    sx={{
                      backgroundColor: isActive ? "#3A3482" : "transparent",
                      color: isActive ? "#fff" : "#475569",
                      border: "1px solid",
                      borderColor: isActive ? "#3A3482" : "transparent",
                      borderRadius: "999px",
                      textTransform: "none",
                      fontWeight: 400,
                      fontSize: 15,
                      px: isActive ? 1.7 : 1,
                      py: 0.75,
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: isActive ? "#2D2675" : "rgba(58, 52, 130, 0.08)",
                        color: isActive ? "#fff" : "#211B5A",
                      },
                      display: "flex",
                      alignItems: "center",
                      gap: 1.3,
                    }}
                  >
                    {pill.label}
                    <Box
                      sx={{
                        minWidth: 30,
                        height: 24,
                        px: 1,
                        borderRadius: "999px",
                        backgroundColor: isActive ? "#F4C63D" : "rgba(58, 52, 130, 0.12)",
                        color: isActive ? "#211B5A" : "#3A3482",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {pill.count}
                    </Box>
                  </Button>
                );
              })}
            </Box>
            <Box sx={{ display: "flex", gap: { xs: 1.3, md: 2.2 }, minWidth: "max-content" }}>
              {[
                { label: "Columns", icon: ViewColumn },
                { label: "Sort by", icon: Sort },
                { label: "Filter", icon: FilterList },
              ].map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  startIcon={<Icon sx={{ fontSize: "21px !important" }} />}
                  sx={{
                    color: "#475569",
                    textTransform: "none",
                    fontWeight: 400,
                    fontSize: 15,
                    px: 0,
                    minWidth: "auto",
                    "&:hover": { backgroundColor: "transparent", color: "#3A3482" },
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
          p: isTicketListRoute ? { xs: 2, sm: "0 40px 40px" } : { xs: 2, sm: 3, md: 4 },
          maxWidth: isTicketListRoute ? "none" : 1440,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
      >
        <Outlet />
      </Box>

      {/* Footer matching Jitbit HelpDesk */}
      <Box
        sx={{
          mt: "auto",
          py: 3,
          px: { xs: 3, md: 5 },
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Left: Theme Switcher Selector */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "rgba(0,0,0,0.03)",
            p: 0.5,
            borderRadius: "6px",
            border: "1px solid var(--border)",
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
                  color: isActive ? "#fff" : "var(--text)",
                  backgroundColor: isActive
                    ? "#3A3482"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? "#3A3482"
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
