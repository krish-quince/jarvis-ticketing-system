import { Fragment, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { getTickets } from "../services/ticketService";

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

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const TicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set(["Technical"]));
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const activePill = searchParams.get("filter") || "all";
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ticketsData = await getTickets();
      setTickets(ticketsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (): CategoryTreeItem[] => {
    const tree: CategoryTreeItem[] = [{ label: "All categories", indent: 0, isParent: false }];
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
      case "critical": return { color: "#ff727e", label: "Critical" };
      case "high":     return { color: "#ff9b45", label: "High" };
      case "medium":   return { color: "#149447", label: "Normal" };
      case "low":
      default:         return { color: "#687386", label: "Low" };
    }
  };

  const getStatusInfo = (name?: string) => { switch (name?.toLowerCase()) { case "new": return { color: "#ff727e", label: "New", }; case "in progress": return { color: "#149447", label: "In Progress", }; case "closed": return { color: "#687386", label: "Closed", }; default: return { color: "#687386", label: name || "Unknown", }; } };

  const filterPill = (ticket: Ticket) => {
    switch (activePill) {
      case "unclosed":   return ticket.status_name?.toLowerCase() !== "closed";
      case "unassigned": return !ticket.assigned_to_user_code;
      case "assigned":
        return (
          ticket.assigned_to_user_code === currentUser.userCode ||
          ticket.assigned_to_user_code === currentUser.user_code
        );
      case "unanswered": return ticket.status_name?.toLowerCase() === "open";
      default:           return true;
    }
  };

  const filterCategory = (ticket: Ticket) => {
    if (selectedCategory === "All categories") return true;
    return (
      ticket.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
      ticket.parent_category_name?.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  const filteredTickets = tickets.filter((t) => filterPill(t) && filterCategory(t));
  const lastSelectedTicketId =
  selectedTickets[selectedTickets.length - 1];

  const getCategoryCount = (catName: string) => {
    if (catName === "All categories") return tickets.length;
    return tickets.filter(
      (t) =>
        t.category_name?.toLowerCase() === catName.toLowerCase() ||
        t.parent_category_name?.toLowerCase() === catName.toLowerCase()
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
  const handleSelectTicket = (ticketId: number) => {
  setSelectedTickets((prev) =>
    prev.includes(ticketId)
      ? prev.filter((id) => id !== ticketId)
      : [...prev, ticketId]
  );
};
  const wasUpdatedByTech = (ticket: Ticket) => {
    if (!ticket.assigned_to_user_code) return false;
    if (!ticket.update_timestamp || !ticket.created_at) return false;
    return new Date(ticket.update_timestamp) > new Date(ticket.created_at);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", backgroundColor: "var(--bg-app)" }}>
        <CircularProgress size={44} sx={{ color: "var(--accent)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "var(--bg-app)", color: "var(--text)", minHeight: "calc(100vh - 255px)" }}>
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
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",        /* kills MUI's dark-mode gradient */
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
                      fontWeight: cat.label === "All categories" || cat.isParent ? 700 : 400,
                      fontSize: 15,
                      lineHeight: 1.4,
                      color: "inherit",
                    }}
                  >
                    {cat.label}
                  </Typography>
                  {cat.isParent && (
                    isExpanded
                      ? <KeyboardArrowUp sx={{ fontSize: 17, color: "var(--text-sub)" }} />
                      : <KeyboardArrowDown sx={{ fontSize: 17, color: "var(--text-sub)" }} />
                  )}
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
    borderRadius: "8px",
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
                <TableCell padding="checkbox" sx={headCellSx}>
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
        filteredTickets.map((t) => t.ticket_id)
      );
    } else {
      setSelectedTickets([]);
    }
  }}
  sx={checkboxSx}
/>
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: "45%" }}>Subject</TableCell>
                <TableCell sx={{ ...headCellSx, width: 140 }}>Status</TableCell>
                <TableCell sx={{ ...headCellSx, width: 100 }}>Priority</TableCell>
                <TableCell sx={{ ...headCellSx, width: 160 }}>Date</TableCell>
                <TableCell sx={{ ...headCellSx, width: 90 }}>Due</TableCell>
                <TableCell sx={{ ...headCellSx, width: 110 }}>Tech</TableCell>
                <TableCell sx={{ ...headCellSx, width: 130 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Updated <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--text-sub)" }} />
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
                    sx={{ py: 5, color: "var(--text-sub)", borderColor: "var(--border)", fontSize: 14, backgroundColor: "var(--bg-card)" }}
                  >
                    No tickets found matching your selection.
                  </TableCell>
                </TableRow>
              ) : 
              
  (
                
                filteredTickets.map((ticket, index) => {
                  const statusInfo = getStatusInfo(ticket.status_name);
                  const priorityInfo = getPriorityInfo(ticket.priority_name);
                  const updByTech = wasUpdatedByTech(ticket);
                  const creationDate = new Date(
                    ticket.due_date
                      ? new Date(ticket.due_date).getTime() - 5 * 24 * 60 * 60 * 1000
                      : Date.now()
                  );

                  return (
                    <Fragment key={ticket.ticket_id}>
                      <TableRow
                        sx={{
                        cursor: "pointer",
                        backgroundColor: selectedTickets.includes(ticket.ticket_id)
  ? "var(--bg-row-hover)"
            : index % 2 === 0
            ? "var(--bg-card)"
            : "var(--bg-row-alt)",
                        "&:hover": { backgroundColor: "var(--bg-row-hover) !important" },
                        "& td": { borderColor: "var(--border)" },
                      }}
                      onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
  size="small"
  checked={selectedTickets.includes(ticket.ticket_id)}
  onChange={() => handleSelectTicket(ticket.ticket_id)}
  sx={checkboxSx}
/>
                      </TableCell>

                      {/* Subject */}
                      <TableCell sx={{ py: 1.8, backgroundColor: "inherit" }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "var(--text-h)", fontSize: 15, lineHeight: 1.3, mb: 0.5 }}
                        >
                          {ticket.subject}
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: 13 }}>
                          <Box component="span" sx={{ color: "var(--accent)", fontSize: 13 }}>{ticket.raised_by_user_code}</Box>
                          <Box component="span" sx={{ color: "var(--accent)", fontSize: 13 }}>{ticket.department || "Quincecapital"}</Box>
                          <Box component="span" sx={{ color: "var(--text-muted)", fontSize: 13 }}>{ticket.category_name}</Box>
                          <Box component="span" sx={{ color: "var(--text-sub)", fontSize: 13 }}>#{ticket.ticket_no}</Box>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.8, verticalAlign: "top", backgroundColor: "inherit" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusInfo.color, flex: "0 0 auto" }} />
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
                          <Typography variant="caption" sx={{ color: "var(--accent)", fontSize: 11, display: "block", mt: 0.3 }}>
                            Upd by tech
                          </Typography>
                        )}
                      </TableCell>

                      {/* Priority */}
                      <TableCell sx={{ py: 1.8, verticalAlign: "top", backgroundColor: "inherit" }}>
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

                      <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>{formatDateTime(creationDate)}</TableCell>
                      <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>
                        {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString("en-US") : ""}
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, color: "var(--accent)", backgroundColor: "inherit" }}>
                        {ticket.assigned_to_user_code || (
                          <Box component="span" sx={{ color: "var(--text-sub)", fontStyle: "italic" }}>Unassigned</Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>{formatDateTime(ticket.update_timestamp)}</TableCell>
                      </TableRow>
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
    zIndex: 5,

    px: 2,
    py: 1.2,
    borderRadius: "8px",

    background:
      "linear-gradient(90deg,#635BFF 0%,#6D5EF8 100%)",

    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 2,

    boxShadow:
      "0 8px 24px rgba(99,91,255,.25)",
  }}
>
              <Typography sx={{ fontWeight: 600 }}>
                {selectedTickets.length} Ticket
                {selectedTickets.length > 1 ? "s" : ""}
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Close
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Assign
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Priority
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Category
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Due
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Tag
              </Typography>

              <Typography sx={{ cursor: "pointer" }}>
                Delete
              </Typography>
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
          sx={{ width: "100%", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
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

export default TicketsPage;
