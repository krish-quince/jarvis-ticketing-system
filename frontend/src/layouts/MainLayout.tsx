import {
  Box,
  Button,
  Popover,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Typography,
  MenuList,
} from "@mui/material";
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
  ViewColumn,
  ImportExport,
  Tune,
} from "@mui/icons-material";
import Topbar from "../components/Topbar";
import { getTickets } from "../services/ticketService";
import { useThemeMode } from "../hooks/useThemeMode";
import { getUsers } from "../services/userService";
import {
  getPriorities,
  getStatuses,
  getDepartments,
} from "../services/masterService";

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
  const isFullWidthRoute =
    location.pathname === "/tickets" || location.pathname === "/my-tickets";

  // Dark mode palette
  const darkBg = "#0f1117";
  const darkBorder = "rgba(255,255,255,0.08)";
  const darkText = "rgba(255,255,255,0.88)";
  const darkSubtext = "rgba(255,255,255,0.45)";

  const lightBg = "#f8fafc";
  const lightBorder = "rgba(0,0,0,0.08)";
  const lightText = "#111827";

  const bg = isDark ? darkBg : lightBg;
  const border = isDark ? darkBorder : lightBorder;
  const text = isDark ? darkText : lightText;

  const pillInactiveColor = isDark ? darkText : "#374151";
  const pillCountInactiveBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(33,27,90,0.1)";
  const pillCountInactiveColor = isDark ? darkText : "#374151";

  // --- Feature 1: Columns Visibility State ---
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    Priority: true,
    Status: true,
    Date: true,
    Due: true,
    Tech: true,
    Updated: true,
  });

  // --- Feature 2: Sort By State ---
  const [sortBy, setSortBy] = useState<string>("Updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // --- Feature 3: Filter State ---
  const [filters, setFilters] = useState<any>({
    date: "",
    dueInDays: "",
    updated: "",
    status: "",
    priority: "",
    from: "",
    company: "",
    department: "",
    tech: "",
    subscribedOnly: false,
  });

  const [tempFilters, setTempFilters] = useState<any>({ ...filters });

  // Options for filter form
  const [filterOptions, setFilterOptions] = useState<{
    statuses: any[];
    priorities: any[];
    departments: any[];
    technicians: any[];
  }>({
    statuses: [],
    priorities: [],
    departments: [],
    technicians: [],
  });

  const loadFilterOptions = async () => {
    try {
      const [statusesData, prioritiesData, departmentsData, usersData] = await Promise.all([
        getStatuses().catch(() => []),
        getPriorities().catch(() => []),
        getDepartments().catch(() => []),
        getUsers().catch(() => []),
      ]);

      setFilterOptions({
        statuses: statusesData || [],
        priorities: prioritiesData || [],
        departments: departmentsData || [],
        technicians: usersData || [],
      });
    } catch (e) {
      console.error("Error loading filter options:", e);
    }
  };

  useEffect(() => {
    if (currentUser.company_code) {
      loadFilterOptions();
    }
  }, [currentUser.company_code]);

  // Popover Anchor Elements
  const [columnsAnchor, setColumnsAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  const handleToggleColumn = (col: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const handleSortSelect = (opt: string) => {
    if (sortBy === opt) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(opt);
      setSortOrder("asc");
    }
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFilterAnchor(null);
  };

  const isColumnsOpen = Boolean(columnsAnchor);
  const isSortOpen = Boolean(sortAnchor);
  const isFilterOpen = Boolean(filterAnchor);

  const sortOptions = [
    "Ticket number",
    "Subject",
    "From",
    "Company",
    "Priority",
    "Status",
    "Date",
    "Due",
    "Tech",
    "Updated",
  ];

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
                { id: "unclosed", label: "Unclosed", count: unclosedCount },
                { id: "unassigned", label: "Unassigned", count: unassignedCount },
                { id: "assigned", label: "Assigned to you", count: assignedCount },
                { id: "all", label: "All", count: allCount },
              ].map((pill) => {
                const isActive = activePill === pill.id;
                return (
                  <Button
                    key={pill.id}
                    onClick={() => navigate(`${location.pathname}?filter=${pill.id}`)}
                    sx={{
                      backgroundColor: isActive ? "#211b5a" : "transparent",
                      color: isActive ? "#fff" : pillInactiveColor,
                      border: "1px solid",
                      borderColor: isActive ? "#211b5a" : "transparent",
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
                          color: "#fff",
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
                        color: isActive ? "#fff" : pillCountInactiveColor,
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

            {/* Columns / Sort / Filter Buttons */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.3, md: 2 },
                minWidth: "max-content",
              }}
            >
              <Button
                startIcon={<ViewColumn sx={{ fontSize: "20px !important" }} />}
                onClick={(e) => setColumnsAnchor(e.currentTarget)}
                sx={{
                  color: isColumnsOpen
                    ? (isDark ? "#ffffff" : "#211b5a")
                    : (isDark ? "rgba(255, 255, 255, 0.54)" : "rgba(0, 0, 0, 0.54)"),
                  backgroundColor: isColumnsOpen
                    ? (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(33, 27, 90, 0.06)")
                    : "transparent",
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: 14,
                  m: "2px",
                  p: "8px 12px",
                  minWidth: 0,
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: isDark ? "#ffffff" : "#211b5a",
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                Columns
              </Button>

              <Button
                startIcon={<ImportExport sx={{ fontSize: "20px !important" }} />}
                onClick={(e) => setSortAnchor(e.currentTarget)}
                sx={{
                  color: isSortOpen
                    ? (isDark ? "#ffffff" : "#211b5a")
                    : (isDark ? "rgba(255, 255, 255, 0.54)" : "rgba(0, 0, 0, 0.54)"),
                  backgroundColor: isSortOpen
                    ? (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(33, 27, 90, 0.06)")
                    : "transparent",
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: 14,
                  m: "2px",
                  p: "8px 12px",
                  minWidth: 0,
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: isDark ? "#ffffff" : "#211b5a",
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                Sort by
              </Button>

              <Button
                startIcon={<Tune sx={{ fontSize: "20px !important" }} />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{
                  color: isFilterOpen
                    ? (isDark ? "#ffffff" : "#211b5a")
                    : (isDark ? "rgba(255, 255, 255, 0.54)" : "rgba(0, 0, 0, 0.54)"),
                  backgroundColor: isFilterOpen
                    ? (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(33, 27, 90, 0.06)")
                    : "transparent",
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: 14,
                  m: "2px",
                  p: "8px 12px",
                  minWidth: 0,
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: isDark ? "#ffffff" : "#211b5a",
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                Filter
              </Button>

              {/* Column Visibility Popover */}
              <Popover
                open={isColumnsOpen}
                anchorEl={columnsAnchor}
                onClose={() => setColumnsAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      p: 0,
                      width: 130,
                      backgroundColor: isDark
                        ? "rgba(22, 27, 39, 0.6)"
                        : "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(8px)",
                      border: `1px solid ${border}`,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                      borderRadius: "8px",
                      color: text,
                      overflow: "hidden",
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", p: "4px", gap: "2px" }}>
                  {Object.keys(columnVisibility).map((col) => (
                    <FormControlLabel
                      key={col}
                      control={
                        <Checkbox
                          size="small"
                          checked={columnVisibility[col]}
                          onChange={() => handleToggleColumn(col)}
                          sx={{
                            p: "4px",
                            color: "var(--accent)",
                            "&.Mui-checked": { color: "#211B5A" },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: 13, color: text, ml: 0.5 }}>
                          {col}
                        </Typography>
                      }
                      sx={{
                        m: 0,
                        px: "6px",
                        py: "3px",
                        borderRadius: "4px",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        "&:hover": {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Popover>

              {/* Sort By Popover */}
              <Popover
                open={isSortOpen}
                anchorEl={sortAnchor}
                onClose={() => setSortAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      py: 0,
                      width: 190,
                      backgroundColor: isDark
                        ? "rgba(22, 27, 39, 0.6)"
                        : "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(8px)",
                      border: `1px solid ${border}`,
                      borderRadius: "8px",
                      color: text,
                      overflow: "hidden",
                    },
                  },
                }}
              >
                <MenuList sx={{ pt: "2px", pb: 0, px: 0 }}>
                  {sortOptions.map((opt) => {
                    const isActive = sortBy === opt;
                    return (
                      <MenuItem
                        key={opt}
                        onClick={() => handleSortSelect(opt)}
                        sx={{
                          fontSize: 14,
                          py: "8px",
                          px: "12px",
                          mx: "2px",
                          mb: "2px",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: isActive
                            ? "#3531b2 !important"
                            : "transparent",
                          color: isActive
                            ? "#ffffff !important"
                            : isDark
                              ? "#d1d5db"
                              : "#374151",
                          fontWeight: isActive ? 500 : 400,
                          "&:hover": {
                            backgroundColor: isActive
                              ? "#3531b2 !important"
                              : isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: 14, fontWeight: isActive ? 500 : 400, color: "inherit" }}>
                          {opt}
                        </Typography>
                        {isActive && (
                          <Typography sx={{ fontWeight: 600, color: "#ffffff" }}>
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </Typography>
                        )}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Popover>

              {/* Filter Popover */}
              <Popover
                open={isFilterOpen}
                anchorEl={filterAnchor}
                onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      p: 3,
                      width: 320,
                      maxHeight: "85vh",
                      overflowY: "auto",
                      backgroundColor: isDark
                        ? "rgba(22, 27, 39, 0.6)"
                        : "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(8px)",
                      border: `1px solid ${border}`,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      borderRadius: "16px",
                      color: text,
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Date Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="filter-date-label">Date</InputLabel>
                    <Select
                      labelId="filter-date-label"
                      value={tempFilters.date}
                      label="Date"
                      onChange={(e) =>
                        setTempFilters((prev: any) => ({ ...prev, date: e.target.value }))
                      }
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">Any time</MenuItem>
                      <MenuItem value="Today">Today</MenuItem>
                      <MenuItem value="Last 7 days">Last 7 days</MenuItem>
                      <MenuItem value="Last 30 days">Last 30 days</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Due In Filter */}
                  <TextField
                    fullWidth
                    label="Due in (days)"
                    placeholder="Due in"
                    size="small"
                    type="number"
                    value={tempFilters.dueInDays}
                    onChange={(e) =>
                      setTempFilters((prev: any) => ({
                        ...prev,
                        dueInDays: e.target.value,
                      }))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                    }}
                  />

                  {/* Updated Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="filter-updated-label">Updated</InputLabel>
                    <Select
                      labelId="filter-updated-label"
                      value={tempFilters.updated}
                      label="Updated"
                      onChange={(e) =>
                        setTempFilters((prev: any) => ({ ...prev, updated: e.target.value }))
                      }
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">Any time</MenuItem>
                      <MenuItem value="Today">Today</MenuItem>
                      <MenuItem value="Last 7 days">Last 7 days</MenuItem>
                      <MenuItem value="Last 30 days">Last 30 days</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Status Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="filter-status-label">Status</InputLabel>
                    <Select
                      labelId="filter-status-label"
                      value={tempFilters.status}
                      label="Status"
                      onChange={(e) =>
                        setTempFilters((prev: any) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">Status</MenuItem>
                      {filterOptions.statuses.map((s) => (
                        <MenuItem key={s.status_id} value={s.status_name}>
                          {s.status_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Priority Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="filter-priority-label">Priority</InputLabel>
                    <Select
                      labelId="filter-priority-label"
                      value={tempFilters.priority}
                      label="Priority"
                      onChange={(e) =>
                        setTempFilters((prev: any) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">Priority</MenuItem>
                      {filterOptions.priorities.map((p) => (
                        <MenuItem key={p.priority_id} value={p.priority_name}>
                          {p.priority_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* From Filter */}
                  <TextField
                    fullWidth
                    label="From"
                    placeholder="Email or username"
                    size="small"
                    value={tempFilters.from}
                    onChange={(e) =>
                      setTempFilters((prev: any) => ({ ...prev, from: e.target.value }))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                    }}
                  />



                  {/* Tech Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="filter-tech-label">Tech</InputLabel>
                    <Select
                      labelId="filter-tech-label"
                      value={tempFilters.tech}
                      label="Tech"
                      onChange={(e) =>
                        setTempFilters((prev: any) => ({ ...prev, tech: e.target.value }))
                      }
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">Tech</MenuItem>
                      {filterOptions.technicians.map((u) => (
                        <MenuItem key={u.user_code} value={u.user_code}>
                          {u.first_name} {u.last_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Subscribed Only Checkbox */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={tempFilters.subscribedOnly}
                        onChange={(e) =>
                          setTempFilters((prev: any) => ({
                            ...prev,
                            subscribedOnly: e.target.checked,
                          }))
                        }
                        sx={{
                          color: "var(--accent)",
                          "&.Mui-checked": { color: "#211B5A" },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: text }}>
                        Only tickets I'm subscribed to
                      </Typography>
                    }
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleApplyFilters}
                    sx={{
                      backgroundColor: "#211b5a",
                      color: "#fff",
                      borderRadius: "8px",
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#15103c" },
                    }}
                  >
                    Apply
                  </Button>
                </Box>
              </Popover>
            </Box>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          p: isFullWidthRoute
            ? { xs: 2, sm: "0 32px 40px" }
            : { xs: 2, sm: 3, md: 4 },
          maxWidth: isFullWidthRoute ? "none" : 1440,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
      >
        <Outlet
          context={{
            columnVisibility,
            sortBy,
            sortOrder,
            handleSortSelect,
            filters,
          }}
        />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          mt: "auto",
          py: 2.5,
          px: { xs: 3, md: 5 },
          borderTop: `1px solid ${border}`,
          backgroundColor: "#f8fafc",
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