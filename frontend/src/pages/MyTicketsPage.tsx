import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp, PushPin } from "@mui/icons-material";
import { getTickets } from "../services/ticketService";
import { getUserByCode, updateUser } from "../services/userService";

type Ticket = {
  ticket_id: number;
  ticket_no?: string;
  subject?: string;
  department?: string;
  category_name?: string;
  parent_category_name?: string | null;
  priority_name?: string;
  status_name?: string;
  raised_by_user_code?: string;
  raised_by_name?: string | null;
  assigned_to_user_code?: string | null;
  assigned_to_name?: string | null;
  allocated_to_user_code?: string | null;
  allocated_to_name?: string | null;
  subcategory_name?: string | null;
  due_date?: string | null;
  created_at?: string | null;
  update_timestamp?: string | null;
  company_code?: string | null;
  is_pinned?: boolean;
  tags?: { tag_id: number | string; tag_name: string; tag_color: string | null }[];
};

type CategoryTreeItem = {
  label: string;
  indent: number;
  isParent: boolean;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { columnVisibility, sortBy, sortOrder, handleSortSelect, filters } = useOutletContext<any>();
  const getColSpanCount = () => {
    let count = 1; // Subject
    if (columnVisibility.status) count++;
    if (columnVisibility.priority) count++;
    if (columnVisibility.created_at) count++;
    if (columnVisibility.due_date) count++;
    if (columnVisibility.updated_at) count++;
    return count;
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const [searchParams] = useSearchParams();
  const searchText = searchParams.get("search") || "";
  const [searchVal, setSearchVal] = useState(searchText);

  useEffect(() => {
    setSearchVal(searchText);
  }, [searchText]);

  const [activePill, setActivePill] = useState<"open" | "closed" | "updated">("open");
  const [selectedCategory, setSelectedCategory] = useState("All categories");

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });
  if (toast.open) {
    console.log("Toast:", toast.message);
  }

  // User popover states
  const [userPopoverAnchor, setUserPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverAlign, setPopoverAlign] = useState<"left" | "right">("left");
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [popoverUserCode, setPopoverUserCode] = useState<string | null>(null);
  const [popoverUserDetail, setPopoverUserDetail] = useState<any | null>(null);
  const [popoverUserLoading, setPopoverUserLoading] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotesText, setEditNotesText] = useState("");

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();



  const handleUserClick = async (
    event: React.MouseEvent<HTMLElement>,
    userCode: string,
    align: "left" | "right" = "left"
  ) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = align === "left" ? rect.left : rect.right;
    const y = rect.bottom;
    setPopoverPosition({ top: y, left: x });
    setUserPopoverAnchor(event.currentTarget);
    setPopoverAlign(align);
    setPopoverUserCode(userCode);
    setPopoverUserLoading(true);
    setIsEditingNotes(false);
    setEditNotesText("");
    try {
      const data = await getUserByCode(userCode);
      const u = data?.data ?? data;
      setPopoverUserDetail(u);
      setEditNotesText(u?.notes || "");
    } catch (error) {
      console.error("Error fetching user details:", error);
      setPopoverUserDetail(null);
    } finally {
      setPopoverUserLoading(false);
    }
  };

  const handleUserPopoverClose = () => {
    setUserPopoverAnchor(null);
    setPopoverPosition(null);
    setPopoverUserCode(null);
    setPopoverUserDetail(null);
    setIsEditingNotes(false);
    setEditNotesText("");
  };

  const handleSaveNotes = async () => {
    if (!popoverUserCode) return;
    try {
      await updateUser(popoverUserCode, { notes: editNotesText });
      setPopoverUserDetail((prev: any) => (prev ? { ...prev, notes: editNotesText } : null));
      setIsEditingNotes(false);
      setToast({
        open: true,
        severity: "success",
        message: "Admin notes updated successfully",
      });
    } catch (error) {
      console.error("Failed to update user notes:", error);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update admin notes",
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const ticketsData = await getTickets(searchText, sortBy, sortOrder);
      // Filter to only show tickets raised by the current user
      const userCode = currentUser.userCode || currentUser.user_code;
      const userTickets = (ticketsData || []).filter(
        (t: Ticket) => t.raised_by_user_code === userCode
      );
      setTickets(userTickets);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchText, sortBy, sortOrder]);

  const buildCategoryTree = (): CategoryTreeItem[] => {
    const tree: CategoryTreeItem[] = [
      { label: "All categories", indent: 0, isParent: false },
    ];
    const catToSubs: Record<string, Set<string>> = {};

    tickets.forEach((ticket) => {
      const cat = ticket.category_name || null;
      const sub = ticket.subcategory_name || null;
      if (cat) {
        if (!catToSubs[cat]) {
          catToSubs[cat] = new Set();
        }
        if (sub) {
          catToSubs[cat].add(sub);
        }
      }
    });

    Object.keys(catToSubs).sort().forEach((catName) => {
      const hasSubs = catToSubs[catName].size > 0;
      tree.push({ label: catName, indent: 0, isParent: hasSubs });
      if (hasSubs && !collapsedParents.has(catName)) {
        Array.from(catToSubs[catName]).sort().forEach((subName) => {
          tree.push({ label: subName, indent: 1, isParent: false });
        });
      }
    });

    return tree;
  };

  const categoryTree = buildCategoryTree();

  const toggleParent = (label: string) => {
    setCollapsedParents((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const getPriorityInfo = (name?: string) => {
    switch (name?.toLowerCase()) {
      case "critical":
        return { color: "#ff727e", label: "Critical" };
      case "high":
        return { color: "#ff9b45", label: "High" };
      case "medium":
        return { color: "#149447", label: "Normal" };
      case "low":
      default:
        return { color: "#687386", label: "Low" };
    }
  };

  const getStatusInfo = (name?: string) => {
    switch (name?.toLowerCase()) {
      case "new":
        return { color: "#ff727e", label: "New" };
      case "in progress":
        return { color: "#149447", label: "In Progress" };
      case "closed":
        return { color: "#687386", label: "Closed" };
      default:
        return { color: "#687386", label: name || "Unknown" };
    }
  };

  const wasUpdatedByTech = (ticket: Ticket) => {
    if (!ticket.assigned_to_user_code) return false;
    if (!ticket.update_timestamp || !ticket.created_at) return false;
    return new Date(ticket.update_timestamp) > new Date(ticket.created_at);
  };

  const filterPill = (ticket: Ticket) => {
    switch (activePill) {
      case "closed":
        return ticket.status_name?.toLowerCase() === "closed";
      case "updated":
        return wasUpdatedByTech(ticket);
      case "open":
      default:
        return ticket.status_name?.toLowerCase() !== "closed";
    }
  };

  const filterCategory = (ticket: Ticket) => {
    if (selectedCategory === "All categories") return true;
    return (
      ticket.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
      ticket.subcategory_name?.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  const filterCustom = (ticket: Ticket) => {
    if (!filters) return true;

    // 1. Date filter (created_at)
    if (filters.date) {
      if (!ticket.created_at) return false;
      const createdDate = new Date(ticket.created_at);
      const now = new Date();
      if (filters.date === "Today") {
        if (createdDate.toDateString() !== now.toDateString()) return false;
      } else if (filters.date === "Last week") {
        const diff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (diff < 0 || diff > 7) return false;
      } else if (filters.date === "30 days") {
        const diff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (diff < 0 || diff > 30) return false;
      } else if (filters.date === "Custom...") {
        if (filters.customDateStart) {
          const start = new Date(filters.customDateStart);
          start.setHours(0, 0, 0, 0);
          if (createdDate < start) return false;
        }
        if (filters.customDateEnd) {
          const end = new Date(filters.customDateEnd);
          end.setHours(23, 59, 59, 999);
          if (createdDate > end) return false;
        }
      }
    }

    // 2. Due in days filter (due_date)
    if (filters.dueInDays) {
      if (!ticket.due_date) return false;
      const dueDate = new Date(ticket.due_date);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 0 || diffDays > Number(filters.dueInDays)) return false;
    }

    // 3. Updated filter (update_timestamp)
    if (filters.updated) {
      if (!ticket.update_timestamp) return false;
      const updatedDate = new Date(ticket.update_timestamp);
      const now = new Date();
      if (filters.updated === "Today") {
        if (updatedDate.toDateString() !== now.toDateString()) return false;
      } else if (filters.updated === "Last week") {
        const diff = (now.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24);
        if (diff < 0 || diff > 7) return false;
      } else if (filters.updated === "30 days") {
        const diff = (now.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24);
        if (diff < 0 || diff > 30) return false;
      } else if (filters.updated === "Custom...") {
        if (filters.customUpdatedStart) {
          const start = new Date(filters.customUpdatedStart);
          start.setHours(0, 0, 0, 0);
          if (updatedDate < start) return false;
        }
        if (filters.customUpdatedEnd) {
          const end = new Date(filters.customUpdatedEnd);
          end.setHours(23, 59, 59, 999);
          if (updatedDate > end) return false;
        }
      }
    }

    // 4. Status filter (multi-select)
    const statusFilter = Array.isArray(filters.status) ? filters.status : (filters.status ? [filters.status] : []);
    if (statusFilter.length > 0) {
      if (!ticket.status_name || !statusFilter.map((s: string) => s.toLowerCase()).includes(ticket.status_name.toLowerCase())) {
        return false;
      }
    }

    // 5. Priority filter (multi-select)
    const priorityFilter = Array.isArray(filters.priority) ? filters.priority : (filters.priority ? [filters.priority] : []);
    if (priorityFilter.length > 0) {
      if (!ticket.priority_name || !priorityFilter.map((p: string) => p.toLowerCase()).includes(ticket.priority_name.toLowerCase())) {
        return false;
      }
    }

    // 6. From filter
    if (filters.from) {
      const match =
        ticket.raised_by_user_code?.toLowerCase().includes(filters.from.toLowerCase()) || false;
      if (!match) return false;
    }

    // 7. Company filter
    if (filters.company) {
      const match =
        ticket.company_code?.toLowerCase().includes(filters.company.toLowerCase()) || false;
      if (!match) return false;
    }

    // 8. Department filter
    if (filters.department) {
      if (ticket.department?.toLowerCase() !== filters.department.toLowerCase()) return false;
    }

    return true;
  };

  const filteredTickets = tickets.filter(
    (t) => filterPill(t) && filterCategory(t) && filterCustom(t)
  );

  const getSortValue = (ticket: Ticket, opt: string) => {
    switch (opt) {
      case "Ticket number": {
        const match = ticket.ticket_no?.match(/\d+/);
        return match ? parseInt(match[0], 10) : (ticket.ticket_no || "");
      }
      case "Subject":
        return (ticket.subject || "").toLowerCase();
      case "Category":
        return (ticket.category_name || "").toLowerCase();
      case "Subcategory":
        return ((ticket as any).subcategory_name || "").toLowerCase();
      case "Department":
        return ((ticket as any).department || "").toLowerCase();
      case "From":
        return (ticket.raised_by_user_code || "").toLowerCase();
      case "Company":
        return (ticket.company_code || "").toLowerCase();
      case "Priority": {
        const pName = ticket.priority_name?.toLowerCase();
        if (pName === "critical") return 4;
        if (pName === "high") return 3;
        if (pName === "medium" || pName === "normal") return 2;
        return 1;
      }
      case "Status":
        return (ticket.status_name || "").toLowerCase();
      case "Date": {
        const d = ticket.created_at ? new Date(ticket.created_at).getTime() : 0;
        return Number.isNaN(d) ? 0 : d;
      }
      case "Due": {
        const d = ticket.due_date ? new Date(ticket.due_date).getTime() : 0;
        return Number.isNaN(d) ? 0 : d;
      }
      case "Updated":
      default: {
        const d = ticket.update_timestamp ? new Date(ticket.update_timestamp).getTime() : 0;
        return Number.isNaN(d) ? 0 : d;
      }
    }
  };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (!sortBy) return 0;
    const valA = getSortValue(a, sortBy);
    const valB = getSortValue(b, sortBy);
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getCategoryCount = (name: string) => {
    if (name === "All categories") return tickets.length;
    return tickets.filter(
      (t) =>
        t.category_name?.toLowerCase() === name.toLowerCase() ||
        t.subcategory_name?.toLowerCase() === name.toLowerCase()
    ).length;
  };

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          backgroundColor: "transparent",
        }}
      >
        <CircularProgress size={44} sx={{ color: "var(--accent)" }} />
      </Box>
    );
  }

  // Count helper variables for pills
  const openCount = tickets.filter((t) => t.status_name?.toLowerCase() !== "closed").length;
  const closedCount = tickets.filter((t) => t.status_name?.toLowerCase() === "closed").length;
  const updatedCount = tickets.filter((t) => wasUpdatedByTech(t)).length;

  const pillInactiveColor = isDark ? "rgba(255,255,255,0.88)" : "#374151";
  const pillCountInactiveBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(33,27,90,0.1)";
  const pillCountInactiveColor = isDark ? "rgba(255,255,255,0.88)" : "#374151";

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        color: "var(--text)",
        minHeight: "calc(100vh - 255px)",
        pt: 3,
      }}
    >
      {/* Search overlay matching standard search layout */}
      {searchText && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#cbd5e1"}`,
            borderRadius: "8px",
            p: 2.5,
            mb: 3,
          }}
        >
          <TextField
            size="small"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/my-tickets?search=${encodeURIComponent(searchVal)}`);
              }
            }}
            sx={{
              width: "360px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "6px",
                bgcolor: isDark ? "#0f172a" : "#fff",
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => navigate(`/my-tickets?search=${encodeURIComponent(searchVal)}`)}
            sx={{
              backgroundColor: "#211B5A",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 0.8,
              borderRadius: "6px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#1c164d",
                boxShadow: "none",
              },
            }}
          >
            Search
          </Button>
        </Box>
      )}

      {/* Top Filter Pills specific to My Tickets Page */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, alignItems: "center" }}>
        {[
          { id: "open", label: "Open", count: openCount },
          { id: "closed", label: "Closed", count: closedCount },
          { id: "updated", label: "Updated", count: updatedCount },
        ].map((pill) => {
          const isActive = activePill === pill.id;
          return (
            <Button
              key={pill.id}
              onClick={() => setActivePill(pill.id as any)}
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
                  color: "#fff",
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
          gap: { xs: 2, lg: 3 },
          alignItems: "start",
        }}
      >
        {/* Category sidebar */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            color: "var(--text)",
            p: 0.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {categoryTree.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            const isExpanded = !collapsedParents.has(cat.label);

            return (
              <Box
                key={cat.label}
                onClick={() => {
                  if (cat.isParent) toggleParent(cat.label);
                  setSelectedCategory(cat.label);
                }}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  pl: cat.indent ? 2.5 : 1.5,
                  pr: 1.5,
                  py: 1,
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: isSelected ? "var(--accent)" : "var(--text)",
                  transition: "color 0.15s ease, background-color 0.15s ease",
                  "&:hover": {
                    color: "var(--accent)",
                    backgroundColor: "var(--accent-light)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: cat.label === "All categories" || cat.isParent ? 600 : 400,
                      fontSize: 14,
                      lineHeight: "20px",
                      color: "inherit",
                    }}
                  >
                    {cat.label}
                  </Typography>
                </Box>

                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                  {cat.isParent &&
                    (isExpanded ? (
                      <KeyboardArrowUp sx={{ fontSize: 17, color: "var(--text-sub)" }} />
                    ) : (
                      <KeyboardArrowDown sx={{ fontSize: 17, color: "var(--text-sub)" }} />
                    ))}
                  <Chip
                    label={getCategoryCount(cat.label)}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 28,
                      borderRadius: "999px",
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                      color: "var(--text)",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Card>

        {/* Tickets table (No checkboxes, No Tech column) */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            color: "var(--text)",
            overflow: "visible",
          }}
        >
          <Table sx={{ minWidth: 700, "& th:first-of-type, & td:first-of-type": { pl: "24px !important" } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "var(--bg-header)" }}>
                <TableCell
                  sx={{
                    ...headCellSx,
                    width: "55%",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => handleSortSelect("Subject")}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Subject
                    {sortBy === "Subject" && (
                      sortOrder === "asc" ? (
                        <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} />
                      ) : (
                        <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )
                    )}
                  </Box>
                </TableCell>
                {columnVisibility.status && (
                  <TableCell
                    sx={{ ...headCellSx, width: 120, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortSelect("Status")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Status
                      {sortBy === "Status" && (
                        sortOrder === "asc" ? <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} /> : <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )}
                    </Box>
                  </TableCell>
                )}
                {columnVisibility.priority && (
                  <TableCell
                    sx={{ ...headCellSx, width: 100, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortSelect("Priority")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Priority
                      {sortBy === "Priority" && (
                        sortOrder === "asc" ? <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} /> : <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )}
                    </Box>
                  </TableCell>
                )}
                {columnVisibility.created_at && (
                  <TableCell
                    sx={{ ...headCellSx, width: 150, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortSelect("Date")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Date
                      {sortBy === "Date" && (
                        sortOrder === "asc" ? <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} /> : <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )}
                    </Box>
                  </TableCell>
                )}
                {columnVisibility.due_date && (
                  <TableCell
                    sx={{ ...headCellSx, width: 110, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortSelect("Due")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Due
                      {sortBy === "Due" && (
                        sortOrder === "asc" ? <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} /> : <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )}
                    </Box>
                  </TableCell>
                )}
                {columnVisibility.updated_at && (
                  <TableCell
                    sx={{ ...headCellSx, width: 150, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortSelect("Updated")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Updated
                      {sortBy === "Updated" && (
                        sortOrder === "asc" ? <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} /> : <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={getColSpanCount()}
                    align="center"
                    sx={{
                      py: 5,
                      color: "var(--text-sub)",
                      borderColor: "var(--border)",
                      fontSize: 14,
                      backgroundColor: "var(--bg-card)",
                    }}
                  >
                    No tickets found matching your selection.
                  </TableCell>
                </TableRow>
              ) : (
                sortedTickets.map((ticket, index) => {
                  const statusInfo = getStatusInfo(ticket.status_name);
                  const priorityInfo = getPriorityInfo(ticket.priority_name);
                  const updByTech = wasUpdatedByTech(ticket);

                  return (
                    <TableRow
                      key={ticket.ticket_id}
                      sx={{
                        cursor: "pointer",
                        backgroundColor:
                          index % 2 === 0 ? "var(--bg-card)" : "var(--bg-row-alt)",
                        "&:hover": {
                          backgroundColor: "var(--bg-row-hover) !important",
                        },
                        "& td": { borderColor: "var(--border)" },
                      }}
                      onClick={() => navigate(`/my-tickets/${ticket.ticket_no}`)}
                    >
                      {/* Subject */}
                      <TableCell sx={{ py: 1.8, backgroundColor: "inherit" }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {columnVisibility.subject && (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: "var(--text-h)",
                                  fontSize: "1rem",
                                  lineHeight: "1.5rem",
                                  mb: 0.5,
                                  cursor: "pointer",
                                  transition: "color 0.15s ease",
                                  "&:hover": { color: "#211b5a" },
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                }}
                              >
                                {ticket.is_pinned && (
                                  <PushPin
                                    sx={{
                                      fontSize: 16,
                                      color: "var(--text-h)",
                                      transform: "rotate(45deg)",
                                    }}
                                  />
                                )}
                                {ticket.subject}
                              </Typography>
                            )}
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: "16px",
                                fontSize: 13,
                                mt: 0.5,
                              }}
                            >
                              {/* Raised By */}
                              {columnVisibility.raised_by && (
                                <Box
                                  component="span"
                                  title="Click here for preview"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (ticket.raised_by_user_code) {
                                      handleUserClick(e, ticket.raised_by_user_code, "left");
                                    }
                                  }}
                                  sx={{
                                    color: "#6366f1",
                                    fontSize: 13,
                                    display: "inline-block",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {ticket.raised_by_name || ticket.raised_by_user_code}
                                </Box>
                              )}

                              {/* Company */}
                              {columnVisibility.company && ((ticket as any).company_name || ticket.company_code) && (
                                <Box
                                  component="span"
                                  sx={{
                                    color: "#6366f1",
                                    fontSize: 13,
                                    fontWeight: 500,
                                  }}
                                >
                                  {(ticket as any).company_name || ticket.company_code}
                                </Box>
                              )}

                              {/* Category */}
                              {columnVisibility.category && (
                                <Box
                                  component="span"
                                  sx={{ color: "var(--text-muted)", fontSize: 13 }}
                                >
                                  {ticket.category_name}
                                  {ticket.subcategory_name ? " - " + ticket.subcategory_name : ""}
                                </Box>
                              )}

                              {/* Ticket No */}
                              {columnVisibility.ticket_no && (
                                <Box
                                  component="span"
                                  sx={{ color: "#a1a1aa", fontSize: 13 }}
                                >
                                  #{ticket.ticket_no}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      {columnVisibility.status && (
                        <TableCell
                          sx={{ py: 1.8, verticalAlign: "top", backgroundColor: "inherit" }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: statusInfo.color,
                                flex: "0 0 auto",
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: statusInfo.label === "New" ? "#ff727e" : "var(--text-muted)",
                                fontSize: 13,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {statusInfo.label}
                            </Typography>
                          </Box>
                          {updByTech && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--accent)",
                                fontSize: 11,
                                display: "block",
                                mt: 0.3,
                              }}
                            >
                              Upd by tech
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {/* Priority */}
                      {columnVisibility.priority && (
                        <TableCell
                          sx={{ py: 1.8, verticalAlign: "top", backgroundColor: "inherit" }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <Box
                              sx={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                backgroundColor: priorityInfo.color,
                                boxShadow: `0 0 0 3px ${priorityInfo.color}33`,
                              }}
                            />
                            <Typography variant="body2" sx={{ color: "var(--text-muted)", fontSize: 13 }}>
                              {priorityInfo.label}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}

                      {/* Date */}
                      {columnVisibility.created_at && (
                        <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>
                          {ticket.created_at ? formatDateTime(ticket.created_at) : "-"}
                        </TableCell>
                      )}

                      {/* Due Date */}
                      {columnVisibility.due_date && (
                        <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>
                          {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString("en-US") : "-"}
                        </TableCell>
                      )}

                      {/* Updated Date */}
                      {columnVisibility.updated_at && (
                        <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>
                          {formatDateTime(ticket.update_timestamp)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* User Popover Details */}
      <Popover
        open={Boolean(userPopoverAnchor) && popoverPosition !== null}
        anchorReference="anchorPosition"
        anchorPosition={
          popoverPosition
            ? { top: popoverPosition.top, left: popoverPosition.left }
            : undefined
        }
        onClose={handleUserPopoverClose}
        transformOrigin={{
          vertical: "top",
          horizontal: popoverAlign === "left" ? "left" : "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              p: 2.5,
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              backgroundImage: "none",
              color: "var(--text)",
            },
          },
        }}
      >
        {popoverUserLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: "var(--accent)" }} />
          </Box>
        ) : popoverUserDetail ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                {popoverUserDetail.username || popoverUserDetail.user_name}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: "var(--border)" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontSize: 13, color: "var(--text-muted)" }}>
                User Code: {popoverUserDetail.user_code || popoverUserDetail.userCode}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--text-muted)" }}>
                Role: {Number(popoverUserDetail.role_id) === 4 ? "Admin" : "Standard User"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--text-muted)" }}>
                Company: {popoverUserDetail.company_code}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--text-muted)" }}>
                Department: {popoverUserDetail.department}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: "var(--border)" }} />

            {/* Admin Notes */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>
                Admin Notes
              </Typography>
              {isEditingNotes ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    value={editNotesText}
                    onChange={(e) => setEditNotesText(e.target.value)}
                    placeholder="Enter admin notes..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: 13,
                        color: "var(--text)",
                        backgroundColor: "rgba(0,0,0,0.02)",
                      },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button size="small" onClick={() => setIsEditingNotes(false)} sx={{ textTransform: "none" }}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSaveNotes}
                      sx={{ textTransform: "none", backgroundColor: "var(--accent)", color: "#fff" }}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start" }}>
                  {popoverUserDetail.notes && (
                    <Typography sx={{ fontSize: 13.5, color: "var(--text-muted)", mb: 0.5 }}>
                      {popoverUserDetail.notes}
                    </Typography>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsEditingNotes(true);
                      setEditNotesText(popoverUserDetail.notes || "");
                    }}
                    sx={{
                      color: "#3b82f6",
                      border: "1.5px solid #3b82f6",
                      borderRadius: "6px",
                      p: 0.6,
                      "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.05)" },
                    }}
                    title="Edit Notes"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </IconButton>
                </Box>
              )}
            </Box>

            <Divider sx={{ borderColor: "var(--border)" }} />

            {/* Recent Ticket History */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)", mb: 0.5 }}>
                Recent ticket history
              </Typography>
              {tickets.filter((t) => t.raised_by_user_code === popoverUserCode).length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--text-sub)", fontStyle: "italic" }}>
                  No recent tickets found.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {tickets
                    .filter((t) => t.raised_by_user_code === popoverUserCode)
                    .slice(0, 5)
                    .map((t) => {
                      const getHistoryStatusStyles = (statusName?: string) => {
                        const norm = statusName?.toLowerCase() || "";
                        if (norm.includes("new")) {
                          return { bg: "rgba(211, 47, 47, 0.08)", color: "#d32f2f" };
                        }
                        if (norm.includes("closed")) {
                          return { bg: "rgba(148, 163, 184, 0.12)", color: "#475569" };
                        }
                        if (norm.includes("tech")) {
                          return { bg: "rgba(46, 125, 50, 0.08)", color: "#2e7d32" };
                        }
                        if (norm.includes("cust")) {
                          return { bg: "rgba(237, 108, 2, 0.08)", color: "#ed6c02" };
                        }
                        return { bg: "rgba(99, 91, 255, 0.08)", color: "#635bff" };
                      };
                      const statusStyles = getHistoryStatusStyles(t.status_name);
                      return (
                        <Box
                          key={t.ticket_id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1.5,
                            backgroundColor: "var(--bg-row-alt)",
                            borderRadius: "8px",
                            px: 1.5,
                            py: 1.1,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <Typography
                            noWrap
                            sx={{
                              fontSize: 13,
                              color: "var(--text)",
                              cursor: "pointer",
                              fontWeight: 500,
                              flex: 1,
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              "&:hover": { textDecoration: "underline", color: "#3b82f6" },
                            }}
                            onClick={() => {
                              handleUserPopoverClose();
                              navigate(`/my-tickets/${t.ticket_no}`);
                            }}
                          >
                            {t.subject}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                            <Chip
                              label={t.status_name || "New"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                borderRadius: "6px",
                                backgroundColor: statusStyles.bg,
                                color: statusStyles.color,
                                border: "none",
                              }}
                            />
                            <Typography sx={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {new Date(t.created_at || (t as any).date || Date.now()).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: "var(--text-sub)", fontStyle: "italic" }}>
            Failed to load user details.
          </Typography>
        )}
      </Popover>
    </Box>
  );
};

const headCellSx = {
  color: "var(--text-muted)",
  fontSize: 13,
  fontWeight: 600,
  py: 1.1,
  borderColor: "var(--border)",
  backgroundColor: "var(--bg-header)",
};

const bodyCellSx = {
  fontSize: "12px",
  color: "#71717a",
  lineHeight: "16px",
  verticalAlign: "top",
  py: 1.8,
  whiteSpace: "nowrap",
};

export default MyTicketsPage;