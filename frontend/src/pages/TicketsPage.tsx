import React, { Fragment, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  getTickets,
  updateTicketStatus,
  takeoverTicket,
  assignTicket,
  updateTicketPriority,
  updateTicketCategory,
  updateTicketDueDate,
} from "../services/ticketService";
import { getUsers } from "../services/userService";
import {
  getPriorities,
  getCategories,
  getSubCategories,
} from "../services/masterService";

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
  assigned_to_user_code?: string | null;
  due_date?: string | null;
  created_at?: string | null;
  update_timestamp?: string | null;
};

type CategoryTreeItem = {
  label: string;
  indent: number;
  isParent: boolean;
};

type MasterCategory = {
  category_id: number;
  category_name: string;
  parent_category_id?: number | null;
};

type MasterPriority = {
  priority_id: number;
  priority_name: string;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

type BulkAction = "assign" | "priority" | "category" | "due" | null;

const TicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(["Technical"]),
  );
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const searchText = searchParams.get("search") || "";
  const activePill = searchParams.get("filter") || "all";
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [activeBulkAction, setActiveBulkAction] = useState<BulkAction>(null);

  // Assign panel
  const [users, setUsers] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  // Priority panel
  const [priorities, setPriorities] = useState<MasterPriority[]>([]);
  const [selectedPriority, setSelectedPriority] = useState("");

  // Category panel — renamed to selectedCategoryId, "selectedCategory" above
  // is already taken by the sidebar filter. Reusing it would have silently
  // broken the sidebar.
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  // Due date panel — value lives in <input type="datetime-local"> format
  const [selectedDueDate, setSelectedDueDate] = useState("");

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isAdmin = currentUser.role_id === 1;

  // Matches the same userCode/user_code dance used elsewhere in this file
  // (see filterPill's "assigned" case) so the comparison stays consistent.
  const isCurrentUser = (code?: string | null) =>
    !!code &&
    (code === currentUser.userCode || code === currentUser.user_code);

  // Permission rule:
  // - Admins can always bulk-assign.
  // - Non-admins can only bulk-assign when EVERY selected ticket is already
  //   assigned to them. Mixed selections (some theirs, some not, or some
  //   unassigned) do not get the option — that's an all-or-nothing bulk op,
  //   and partial permission on a bulk action is just a confusing UI to ship.
  // NOTE: this only controls what renders. The server-side assignTicket()
  // call must enforce this same rule independently — never trust the client.
  const canBulkAssign =
    isAdmin ||
    (selectedTickets.length > 0 &&
      selectedTickets.every((id) => {
        const t = tickets.find((tk) => tk.ticket_id === id);
        return t ? isCurrentUser(t.assigned_to_user_code) : false;
      }));

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadPriorities = async () => {
    try {
      const data = await getPriorities();
      setPriorities(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSubCategories = async (categoryId: number) => {
    try {
      const data = await getSubCategories(categoryId);
      setSubCategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const CLOSED_STATUS_ID = 3;

  const fetchData = async () => {
    try {
      setLoading(true);
      const ticketsData = await getTickets(searchText);
      setTickets(ticketsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load for everyone now — admins need it, and so does a non-admin who is
    // currently assigned to ticket(s) and is allowed to reassign them.
    // Visibility of the Assign action itself is still controlled by
    // canBulkAssign; this just makes sure the dropdown isn't empty when it
    // IS shown. Backend must still gate the actual update.
    loadUsers();
    fetchData();
    loadPriorities();
    loadCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchText]);

  // If the selection changes (or tickets reload) while the Assign panel is
  // open and the user no longer qualifies, close it instead of leaving a
  // stale panel the user technically shouldn't be looking at.
  useEffect(() => {
    if (activeBulkAction === "assign" && !canBulkAssign) {
      closeBulkPanel();
    }
  }, [canBulkAssign]);

  const buildCategoryTree = (): CategoryTreeItem[] => {
    const tree: CategoryTreeItem[] = [
      { label: "All categories", indent: 0, isParent: false },
    ];
    const parentToChildren: Record<string, Set<string>> = {};
    const topLevelOnly = new Set<string>();

    tickets.forEach((ticket) => {
      const parent = ticket.parent_category_name || null;
      const child = ticket.category_name || null;
      if (parent && child) {
        if (!parentToChildren[parent]) parentToChildren[parent] = new Set();
        parentToChildren[parent].add(child);
      } else if (child) {
        topLevelOnly.add(child);
      }
    });

    Object.keys(parentToChildren).forEach((parentName) => {
      tree.push({ label: parentName, indent: 0, isParent: true });
      if (expandedParents.has(parentName)) {
        parentToChildren[parentName].forEach((child) => {
          tree.push({ label: child, indent: 1, isParent: false });
        });
      }
    });

    topLevelOnly.forEach((catName) => {
      if (!parentToChildren[catName]) {
        tree.push({ label: catName, indent: 0, isParent: false });
      }
    });

    return tree;
  };

  const categoryTree = buildCategoryTree();

  const toggleParent = (label: string) => {
    setExpandedParents((prev) => {
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

  const filterPill = (ticket: Ticket) => {
    switch (activePill) {
      case "unclosed":
        return ticket.status_name?.toLowerCase() !== "closed";
      case "unassigned":
        return !ticket.assigned_to_user_code;
      case "assigned":
        return (
          ticket.assigned_to_user_code === currentUser.userCode ||
          ticket.assigned_to_user_code === currentUser.user_code
        );
      case "unanswered":
        return ticket.status_name?.toLowerCase() === "open";
      default:
        return true;
    }
  };

  const filterCategory = (ticket: Ticket) => {
    if (selectedCategory === "All categories") return true;
    return (
      ticket.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
      ticket.parent_category_name?.toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  };

  const filteredTickets = tickets.filter(
    (t) => filterPill(t) && filterCategory(t),
  );

  const lastSelectedTicketId = selectedTickets[selectedTickets.length - 1];

  const getCategoryCount = (catName: string) => {
    if (catName === "All categories") return tickets.length;
    return tickets.filter(
      (t) =>
        t.category_name?.toLowerCase() === catName.toLowerCase() ||
        t.parent_category_name?.toLowerCase() === catName.toLowerCase(),
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

  const toDateTimeLocalValue = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  };

  // Handlers

  const closeBulkPanel = () => {
    setActiveBulkAction(null);
    setSelectedAssignee("");
    setSelectedPriority("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setSubCategories([]);
    setSelectedDueDate("");
  };

  const openBulkPanel = (action: Exclude<BulkAction, null>) => {
    if (activeBulkAction === action) {
      closeBulkPanel();
      return;
    }

    setActiveBulkAction(action);

    const singleTicket =
      selectedTickets.length === 1
        ? tickets.find((t) => t.ticket_id === selectedTickets[0]) || null
        : null;

    if (action === "assign") {
      setSelectedAssignee("");
    }

    if (action === "priority") {
      const match = singleTicket
        ? priorities.find(
            (p) =>
              p.priority_name?.toLowerCase() ===
              singleTicket.priority_name?.toLowerCase(),
          )
        : null;
      setSelectedPriority(match ? String(match.priority_id) : "");
    }

    if (action === "category") {
      const match = singleTicket
        ? categories.find(
            (c) =>
              c.category_name?.toLowerCase() ===
              singleTicket.category_name?.toLowerCase(),
          )
        : null;
      setSelectedCategoryId(match ? String(match.category_id) : "");
      setSelectedSubCategoryId("");
      setSubCategories([]);
    }

    if (action === "due") {
      setSelectedDueDate(
        singleTicket?.due_date
          ? toDateTimeLocalValue(singleTicket.due_date)
          : "",
      );
    }
  };

  const handleAssignTickets = async () => {
    if (!selectedAssignee) return;

    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          assignTicket(ticketId, selectedAssignee),
        ),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) assigned`,
      });

      closeBulkPanel();
      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to assign tickets",
      });
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedPriority) return;

    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          updateTicketPriority(ticketId, Number(selectedPriority)),
        ),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) priority updated`,
      });

      closeBulkPanel();
      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to update priority",
      });
    }
  };

  const handleCategoryUpdate = async () => {
    if (!selectedCategoryId || !selectedSubCategoryId) {
      return;
    }

    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          updateTicketCategory(
            ticketId,
            Number(selectedCategoryId),
            Number(selectedSubCategoryId),
          ),
        ),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) category updated`,
      });

      closeBulkPanel();
      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to update category",
      });
    }
  };

  const handleDueDateUpdate = async () => {
    if (!selectedDueDate) return;

    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          updateTicketDueDate(ticketId, selectedDueDate),
        ),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) due date updated`,
      });

      closeBulkPanel();
      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to update due date",
      });
    }
  };

  const handleSelectTicket = (ticketId: number) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId],
    );
  };

  const handleCloseTickets = async () => {
    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          updateTicketStatus(ticketId, CLOSED_STATUS_ID),
        ),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) closed`,
      });

      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to close tickets",
      });
    }
  };

  const handleTakeoverTickets = async () => {
    try {
      await Promise.all(
        selectedTickets.map((ticketId) => takeoverTicket(ticketId)),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) taken over`,
      });

      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to takeover tickets",
      });
    }
  };

  const wasUpdatedByTech = (ticket: Ticket) => {
    if (!ticket.assigned_to_user_code) return false;
    if (!ticket.update_timestamp || !ticket.created_at) return false;
    return new Date(ticket.update_timestamp) > new Date(ticket.created_at);
  };

  const dropdownActions: { label: string; onClick: () => void }[] = [
    { label: "Close", onClick: handleCloseTickets },
    ...(canBulkAssign
      ? [{ label: "Assign", onClick: () => openBulkPanel("assign") }]
      : []),
    { label: "Priority", onClick: () => openBulkPanel("priority") },
    { label: "Category", onClick: () => openBulkPanel("category") },
    { label: "Due", onClick: () => openBulkPanel("due") },
    { label: "Tag", onClick: () => {} },
  ];

  const plainActions: { label: string; onClick: () => void }[] = [
    { label: "Takeover", onClick: handleTakeoverTickets },
    { label: "Delete", onClick: () => {} },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          backgroundColor: "var(--bg-app)",
        }}
      >
        <CircularProgress size={44} sx={{ color: "var(--accent)" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "var(--bg-app)",
        color: "var(--text)",
        minHeight: "calc(100vh - 255px)",
      }}
    >
      {searchText && (
        <Typography
          sx={{
            mb: 2,
            color: "#999",
          }}
        >
          Search Results For: "{searchText}"
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
          gap: { xs: 2, lg: 3 },
          alignItems: "start",
        }}
      >
        {/* ── Category sidebar ── */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            color: "var(--text)",
            p: "8px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {categoryTree.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            const isExpanded = expandedParents.has(cat.label);

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
                  pl: cat.indent ? 1.5 : 0,
                  py: 1.1,
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
                      fontWeight:
                        cat.label === "All categories" || cat.isParent
                          ? 700
                          : 400,
                      fontSize: 15,
                      lineHeight: 1.4,
                      color: "inherit",
                    }}
                  >
                    {cat.label}
                  </Typography>
                  {cat.isParent &&
                    (isExpanded ? (
                      <KeyboardArrowUp
                        sx={{ fontSize: 17, color: "var(--text-sub)" }}
                      />
                    ) : (
                      <KeyboardArrowDown
                        sx={{ fontSize: 17, color: "var(--text-sub)" }}
                      />
                    ))}
                </Box>
                <Chip
                  label={getCategoryCount(cat.label)}
                  size="small"
                  sx={{
                    height: 24,
                    minWidth: 32,
                    borderRadius: "999px",
                    fontSize: 13,
                    fontWeight: 700,
                    backgroundColor: "var(--accent-light)",
                    color: "var(--accent-chip-text)",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </Box>
            );
          })}
        </Card>

        {/* ── Tickets table ── */}
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "var(--bg-header)" }}>
                <TableCell
                  padding="checkbox"
                  sx={{
                    ...headCellSx,
                    pl: 2,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={
                      filteredTickets.length > 0 &&
                      selectedTickets.length === filteredTickets.length
                    }
                    indeterminate={
                      selectedTickets.length > 0 &&
                      selectedTickets.length < filteredTickets.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTickets(
                          filteredTickets.map((t) => t.ticket_id),
                        );
                      } else {
                        setSelectedTickets([]);
                      }
                    }}
                    sx={checkboxSx}
                  />
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: "45%" }}>
                  Subject
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: 140 }}>Status</TableCell>
                <TableCell sx={{ ...headCellSx, width: 100 }}>
                  Priority
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: 160 }}>Date</TableCell>
                <TableCell sx={{ ...headCellSx, width: 90 }}>Due</TableCell>
                <TableCell sx={{ ...headCellSx, width: 110 }}>Tech</TableCell>
                <TableCell sx={{ ...headCellSx, width: 130 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Updated{" "}
                    <KeyboardArrowDown
                      sx={{ fontSize: 15, color: "var(--text-sub)" }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                filteredTickets.map((ticket, index) => {
                  const statusInfo = getStatusInfo(ticket.status_name);
                  const priorityInfo = getPriorityInfo(ticket.priority_name);
                  const updByTech = wasUpdatedByTech(ticket);
                  const creationDate = new Date(
                    ticket.due_date
                      ? new Date(ticket.due_date).getTime() -
                          5 * 24 * 60 * 60 * 1000
                      : Date.now(),
                  );

                  return (
                    <Fragment key={ticket.ticket_id}>
                      <TableRow
                        sx={{
                          cursor: "pointer",
                          backgroundColor: selectedTickets.includes(
                            ticket.ticket_id,
                          )
                            ? "var(--bg-row-hover)"
                            : index % 2 === 0
                              ? "var(--bg-card)"
                              : "var(--bg-row-alt)",
                          "&:hover": {
                            backgroundColor: "var(--bg-row-hover) !important",
                          },
                          "& td": { borderColor: "var(--border)" },
                        }}
                        onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                      >
                        <TableCell
                          padding="checkbox"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            pl: 2,
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={selectedTickets.includes(ticket.ticket_id)}
                            onChange={() =>
                              handleSelectTicket(ticket.ticket_id)
                            }
                            sx={checkboxSx}
                          />
                        </TableCell>

                        {/* Subject */}
                        <TableCell sx={{ py: 1.8, backgroundColor: "inherit" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "var(--text-h)",
                              fontSize: 15,
                              lineHeight: 1.3,
                              mb: 0.5,
                            }}
                          >
                            {ticket.subject}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              fontSize: 13,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ color: "var(--accent)", fontSize: 13 }}
                            >
                              {ticket.raised_by_user_code}
                            </Box>
                            <Box
                              component="span"
                              sx={{ color: "var(--accent)", fontSize: 13 }}
                            >
                              {ticket.department || "Quincecapital"}
                            </Box>
                            <Box
                              component="span"
                              sx={{ color: "var(--text-muted)", fontSize: 13 }}
                            >
                              {ticket.category_name}
                            </Box>
                            <Box
                              component="span"
                              sx={{ color: "var(--text-sub)", fontSize: 13 }}
                            >
                              #{ticket.ticket_no}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell
                          sx={{
                            py: 1.8,
                            verticalAlign: "top",
                            backgroundColor: "inherit",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.8,
                            }}
                          >
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
                                color:
                                  statusInfo.label === "New"
                                    ? "#ff727e"
                                    : "var(--text-muted)",
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

                        {/* Priority */}
                        <TableCell
                          sx={{
                            py: 1.8,
                            verticalAlign: "top",
                            backgroundColor: "inherit",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.8,
                            }}
                          >
                            <Box
                              sx={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                backgroundColor: priorityInfo.color,
                                boxShadow: `0 0 0 3px ${priorityInfo.color}33`,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: "var(--text-muted)", fontSize: 13 }}
                            >
                              {priorityInfo.label}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell
                          sx={{ ...bodyCellSx, backgroundColor: "inherit" }}
                        >
                          {formatDateTime(creationDate)}
                        </TableCell>
                        <TableCell
                          sx={{ ...bodyCellSx, backgroundColor: "inherit" }}
                        >
                          {ticket.due_date
                            ? new Date(ticket.due_date).toLocaleDateString(
                                "en-US",
                              )
                            : ""}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...bodyCellSx,
                            color: "var(--accent)",
                            backgroundColor: "inherit",
                          }}
                        >
                          {ticket.assigned_to_user_code || (
                            <Box
                              component="span"
                              sx={{
                                color: "var(--text-sub)",
                                fontStyle: "italic",
                              }}
                            >
                              Unassigned
                            </Box>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ ...bodyCellSx, backgroundColor: "inherit" }}
                        >
                          {formatDateTime(ticket.update_timestamp)}
                        </TableCell>
                      </TableRow>

                      {/* ── Floating bulk action bar ── */}
                      {ticket.ticket_id === lastSelectedTicketId &&
                        selectedTickets.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              sx={{
                                border: 0,
                                py: 0,
                                position: "relative",
                                height: 0,
                                overflow: "visible",
                              }}
                            >
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -6,
                                  left: 56,
                                  right: 8,
                                  zIndex: 5,
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  boxShadow: "0 8px 24px rgba(99,91,255,.35)",
                                }}
                              >
                                {/* Row 1 — purple action bar */}
                                <Box
                                  sx={{
                                    background:
                                      "linear-gradient(90deg,#635BFF 0%,#6D5EF8 100%)",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2.5,
                                    px: 2,
                                    py: 1.3,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    sx={{ fontWeight: 600, fontSize: 14.5 }}
                                  >
                                    {selectedTickets.length} Ticket
                                    {selectedTickets.length > 1 ? "s" : ""}
                                  </Typography>

                                  {dropdownActions.map((action) => (
                                    <Box
                                      key={action.label}
                                      onClick={action.onClick}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.3,
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: 14.5,
                                        userSelect: "none",
                                        "&:hover": { opacity: 0.85 },
                                      }}
                                    >
                                      {action.label}
                                      <KeyboardArrowDown
                                        sx={{ fontSize: 18 }}
                                      />
                                    </Box>
                                  ))}

                                  <Box
                                    sx={{
                                      width: "1px",
                                      height: 18,
                                      backgroundColor: "rgba(255,255,255,0.3)",
                                    }}
                                  />

                                  {plainActions.map((action) => (
                                    <Typography
                                      key={action.label}
                                      onClick={action.onClick}
                                      sx={{
                                        cursor: "pointer",
                                        fontSize: 14.5,
                                        fontWeight: 400,
                                        userSelect: "none",
                                        "&:hover": { opacity: 0.85 },
                                      }}
                                    >
                                      {action.label}
                                    </Typography>
                                  ))}
                                </Box>

                                {/* Row 2 — Assign panel */}
                                {activeBulkAction === "assign" && (
                                  <Box sx={panelRowSx}>
                                    <FormControl
                                      size="small"
                                      sx={{ flex: 1, maxWidth: 360 }}
                                    >
                                      <Select
                                        value={selectedAssignee}
                                        displayEmpty
                                        renderValue={(value) => {
                                          if (!value) return "Unassign";
                                          const u = users.find(
                                            (usr) => usr.user_code === value,
                                          );
                                          return u
                                            ? `${u.first_name} ${u.last_name}`
                                            : value;
                                        }}
                                        onChange={(e) =>
                                          setSelectedAssignee(e.target.value)
                                        }
                                        sx={darkSelectSx}
                                        MenuProps={darkMenuProps}
                                      >
                                        <MenuItem value="" sx={menuItemSx}>
                                          Unassign
                                        </MenuItem>

                                        <Divider
                                          sx={{
                                            borderColor:
                                              "rgba(255,255,255,0.15)",
                                          }}
                                        />

                                        {users.map((user) => (
                                          <MenuItem
                                            key={user.user_code}
                                            value={user.user_code}
                                            sx={menuItemSx}
                                          >
                                            {user.first_name} {user.last_name}
                                            {user.email
                                              ? ` (${user.email})`
                                              : ""}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>

                                    <Button
                                      variant="contained"
                                      onClick={handleAssignTickets}
                                      disabled={!selectedAssignee}
                                      sx={primaryBtnSx}
                                    >
                                      Assign
                                    </Button>

                                    <Button
                                      onClick={closeBulkPanel}
                                      sx={cancelBtnSx}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                )}

                                {/* Row 2 — Priority panel */}
                                {activeBulkAction === "priority" && (
                                  <Box sx={panelRowSx}>
                                    <FormControl
                                      size="small"
                                      sx={{ flex: 1, maxWidth: 360 }}
                                    >
                                      <Select
                                        value={selectedPriority}
                                        displayEmpty
                                        renderValue={(value) => {
                                          if (!value) return "Select priority";
                                          const p = priorities.find(
                                            (pr) =>
                                              String(pr.priority_id) === value,
                                          );
                                          return p ? p.priority_name : value;
                                        }}
                                        onChange={(e) =>
                                          setSelectedPriority(e.target.value)
                                        }
                                        sx={darkSelectSx}
                                        MenuProps={darkMenuProps}
                                      >
                                        {priorities.map((p) => (
                                          <MenuItem
                                            key={p.priority_id}
                                            value={String(p.priority_id)}
                                            sx={menuItemSx}
                                          >
                                            {p.priority_name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>

                                    <Button
                                      variant="contained"
                                      onClick={handlePriorityUpdate}
                                      disabled={!selectedPriority}
                                      sx={primaryBtnSx}
                                    >
                                      Change priority
                                    </Button>

                                    <Button
                                      onClick={closeBulkPanel}
                                      sx={cancelBtnSx}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                )}

                                {/* Row 2 — Category panel */}
                                {activeBulkAction === "category" && (
                                  <Box sx={panelRowSx}>
                                    {/* Tree-style category + subcategory picker */}
                                    <CategoryTreeSelect
                                      categories={categories}
                                      selectedCategoryId={selectedCategoryId}
                                      selectedSubCategoryId={
                                        selectedSubCategoryId
                                      }
                                      subCategories={subCategories}
                                      onCategorySelect={async (catId) => {
                                        setSelectedCategoryId(catId);
                                        setSelectedSubCategoryId("");
                                        await loadSubCategories(Number(catId));
                                      }}
                                      onSubCategorySelect={(subId) =>
                                        setSelectedSubCategoryId(subId)
                                      }
                                    />

                                    <Button
                                      variant="contained"
                                      onClick={handleCategoryUpdate}
                                      disabled={
                                        !selectedCategoryId ||
                                        !selectedSubCategoryId
                                      }
                                      sx={primaryBtnSx}
                                    >
                                      Change category
                                    </Button>

                                    <Button
                                      onClick={closeBulkPanel}
                                      sx={cancelBtnSx}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                )}

                                {/* Row 2 — Due date panel */}
                                {activeBulkAction === "due" && (
                                  <Box sx={panelRowSx}>
                                    <TextField
                                      type="datetime-local"
                                      size="small"
                                      value={selectedDueDate}
                                      onChange={(e) =>
                                        setSelectedDueDate(e.target.value)
                                      }
                                      sx={{
                                        flex: 1,
                                        maxWidth: 280,
                                        ...darkTextFieldSx,
                                      }}
                                      InputLabelProps={{ shrink: true }}
                                    />

                                    <Button
                                      variant="contained"
                                      onClick={handleDueDateUpdate}
                                      disabled={!selectedDueDate}
                                      sx={primaryBtnSx}
                                    >
                                      Save
                                    </Button>

                                    <Button
                                      onClick={closeBulkPanel}
                                      sx={cancelBtnSx}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

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
  fontSize: 13,
  color: "var(--text-muted)",
  lineHeight: 1.35,
  verticalAlign: "top",
  pt: 1.8,
};

const checkboxSx = {
  color: "var(--text-sub)",
  p: 0,
  "& .MuiSvgIcon-root": { fontSize: 20 },
  "&.Mui-checked": { color: "var(--accent)" },
};

const panelRowSx = {
  backgroundColor: "#16151f",
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 2,
  py: 1.5,
};

const darkSelectSx = {
  color: "#fff",
  backgroundColor: "#1c1b27",
  borderRadius: "6px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.15)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.3)",
  },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" },
};

const darkMenuProps = {
  PaperProps: {
    sx: { backgroundColor: "#1c1b27", color: "#fff", mt: 0.5 },
  },
};

const menuItemSx = {
  "&:hover": { backgroundColor: "rgba(124,108,255,0.25)" },
  "&.Mui-selected": { backgroundColor: "rgba(124,108,255,0.35) !important" },
};

const darkTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "#1c1b27",
    borderRadius: "6px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
  },
  "& input::-webkit-calendar-picker-indicator": { filter: "invert(1)" },
};

const primaryBtnSx = {
  backgroundColor: "#7c6cff",
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "6px",
  px: 2.5,
  "&:hover": { backgroundColor: "#6a5af0" },
  "&.Mui-disabled": {
    backgroundColor: "rgba(124,108,255,0.35)",
    color: "rgba(255,255,255,0.5)",
  },
};

const cancelBtnSx = {
  backgroundColor: "rgba(124,108,255,0.25)",
  color: "#cfc8ff",
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "6px",
  px: 2.5,
  "&:hover": { backgroundColor: "rgba(124,108,255,0.35)" },
};

type CategoryTreeSelectProps = {
  categories: MasterCategory[];
  selectedCategoryId: string;
  selectedSubCategoryId: string;
  subCategories: any[];
  onCategorySelect: (catId: string) => Promise<void>;
  onSubCategorySelect: (subId: string) => void;
};

const CategoryTreeSelect = ({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  subCategories,
  onCategorySelect,
  onSubCategorySelect,
}: CategoryTreeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedCat = categories.find(
    (c) => String(c.category_id) === selectedCategoryId,
  );
  const selectedSub = subCategories.find(
    (s) => String(s.subcategory_id) === selectedSubCategoryId,
  );

  const triggerLabel =
    selectedCat && selectedSub
      ? `${selectedCat.category_name} › ${selectedSub.subcategory_name}`
      : selectedCat
        ? selectedCat.category_name
        : "Select category";

  const topLevel = categories.filter((c) => !c.parent_category_id);
  const childrenOf = (parentId: number) =>
    categories.filter((c) => c.parent_category_id === parentId);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      bottom: window.innerHeight - rect.top + 6,
      minWidth: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
  };

  return (
    <>
      <Box
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: "7px",
          minWidth: 220,
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.18)",
          backgroundColor: "#1c1b27",
          color: selectedCategoryId ? "#fff" : "rgba(255,255,255,0.45)",
          fontSize: 14,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {triggerLabel}
        </Box>
        <KeyboardArrowDown
          sx={{
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </Box>

      {open &&
        ReactDOM.createPortal(
          <>
            <Box
              onClick={() => setOpen(false)}
              sx={{ position: "fixed", inset: 0, zIndex: 9998 }}
            />

            <Box
              style={menuStyle}
              sx={{
                maxHeight: 340,
                overflowY: "auto",
                backgroundColor: "#1c1b27",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.55)",
                py: 0.5,
              }}
            >
              {topLevel.map((parent) => {
                const kids = childrenOf(parent.category_id);
                const isParentSelected =
                  String(parent.category_id) === selectedCategoryId;

                return (
                  <Box key={parent.category_id}>
                    <Box
                      onClick={async () => {
                        if (kids.length === 0) {
                          await onCategorySelect(String(parent.category_id));
                          if (subCategories.length === 0) setOpen(false);
                        }
                      }}
                      sx={{
                        px: 2,
                        py: "7px",
                        fontSize: 13.5,
                        fontWeight: 700,
                        color:
                          isParentSelected && kids.length === 0
                            ? "#fff"
                            : "rgba(255,255,255,0.9)",
                        cursor: kids.length > 0 ? "default" : "pointer",
                        backgroundColor:
                          isParentSelected && kids.length === 0
                            ? "rgba(99,91,255,0.35)"
                            : "transparent",
                        "&:hover":
                          kids.length === 0
                            ? { backgroundColor: "rgba(99,91,255,0.2)" }
                            : {},
                      }}
                    >
                      {parent.category_name}
                    </Box>

                    {kids.map((kid) => {
                      const isKidSelected =
                        String(kid.category_id) === selectedCategoryId;
                      return (
                        <Box key={kid.category_id}>
                          <Box
                            onClick={async () => {
                              await onCategorySelect(String(kid.category_id));
                            }}
                            sx={{
                              pl: 3.5,
                              pr: 2,
                              py: "6px",
                              fontSize: 13,
                              fontWeight: 400,
                              color: isKidSelected
                                ? "#fff"
                                : "rgba(255,255,255,0.65)",
                              cursor: "pointer",
                              backgroundColor: isKidSelected
                                ? "rgba(99,91,255,0.35)"
                                : "transparent",
                              "&:hover": {
                                backgroundColor: "rgba(99,91,255,0.2)",
                                color: "#fff",
                              },
                            }}
                          >
                            {kid.category_name}
                          </Box>

                          {isKidSelected && subCategories.length > 0 && (
                            <Box
                              sx={{
                                borderLeft: "2px solid rgba(99,91,255,0.4)",
                                ml: 3.5,
                              }}
                            >
                              {subCategories.map((sub) => {
                                const isSubSel =
                                  String(sub.subcategory_id) ===
                                  selectedSubCategoryId;
                                return (
                                  <Box
                                    key={sub.subcategory_id}
                                    onClick={() => {
                                      onSubCategorySelect(
                                        String(sub.subcategory_id),
                                      );
                                      setOpen(false);
                                    }}
                                    sx={{
                                      pl: 2,
                                      pr: 2,
                                      py: "5px",
                                      fontSize: 12.5,
                                      color: isSubSel
                                        ? "#fff"
                                        : "rgba(255,255,255,0.55)",
                                      cursor: "pointer",
                                      backgroundColor: isSubSel
                                        ? "rgba(99,91,255,0.3)"
                                        : "transparent",
                                      "&:hover": {
                                        backgroundColor: "rgba(99,91,255,0.18)",
                                        color: "#fff",
                                      },
                                    }}
                                  >
                                    {sub.subcategory_name}
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      );
                    })}

                    {isParentSelected &&
                      kids.length === 0 &&
                      subCategories.length > 0 && (
                        <Box
                          sx={{
                            borderLeft: "2px solid rgba(99,91,255,0.4)",
                            ml: 2,
                          }}
                        >
                          {subCategories.map((sub) => {
                            const isSubSel =
                              String(sub.subcategory_id) ===
                              selectedSubCategoryId;
                            return (
                              <Box
                                key={sub.subcategory_id}
                                onClick={() => {
                                  onSubCategorySelect(
                                    String(sub.subcategory_id),
                                  );
                                  setOpen(false);
                                }}
                                sx={{
                                  pl: 2,
                                  pr: 2,
                                  py: "5px",
                                  fontSize: 12.5,
                                  color: isSubSel
                                    ? "#fff"
                                    : "rgba(255,255,255,0.55)",
                                  cursor: "pointer",
                                  backgroundColor: isSubSel
                                    ? "rgba(99,91,255,0.3)"
                                    : "transparent",
                                  "&:hover": {
                                    backgroundColor: "rgba(99,91,255,0.18)",
                                    color: "#fff",
                                  },
                                }}
                              >
                                {sub.subcategory_name}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                  </Box>
                );
              })}
            </Box>
          </>,
          document.body,
        )}
    </>
  );
};

export default TicketsPage;