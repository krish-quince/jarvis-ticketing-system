import { Fragment, useEffect, useState } from "react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import {
  Alert,
  Avatar,
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
  Popover,
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
  IconButton,
  useTheme,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp, MailOutlined, ContentCopy, PushPin } from "@mui/icons-material";
import {
  getTickets,
  updateTicketStatus,
  takeoverTicket,
  assignTicket,
  updateTicketPriority,
  updateTicketCategory,
  updateTicketDueDate,
  toggleTicketPin,
  deleteTicket,
} from "../services/ticketService";
import { getUsers, getUserByCode, updateUser } from "../services/userService";
import {
  getPriorities,
  getCategories,
  getSubCategories,
} from "../services/masterService";
import { addFreeformTag, getFreeformTicketTags } from "../services/tagService";
import TagInput from "../components/TagInput";
import type { MasterCategory } from "./tickets/ticketTypes";

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

type MasterPriority = {
  priority_id: number;
  priority_name: string;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

type BulkAction = "assign" | "priority" | "category" | "due" | "tag" | null;

const TicketsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Theme-aware styles for bulk actions bar
  const panelRowSx = {
    backgroundColor: isDark ? "#16151f" : "var(--bg-header)",
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2,
    py: 1.5,
    borderTop: isDark ? "none" : "1px solid var(--border)",
  };

  const darkSelectSx = {
    color: "var(--text)",
    backgroundColor: isDark ? "#1c1b27" : "#ffffff",
    borderRadius: "6px",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--border)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
    },
    "& .MuiSvgIcon-root": { color: "var(--text-sub)" },
  };

  const darkMenuProps = {
    slotProps: {
      paper: {
        sx: {
          backgroundColor: isDark ? "#1c1b27" : "#ffffff",
          color: "var(--text)",
          mt: 0.5,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        },
      },
    },
  };

  const menuItemSx = {
    color: "var(--text)",
    "&:hover": { backgroundColor: isDark ? "rgba(124,108,255,0.25)" : "rgba(99,91,255,0.08)" },
    "&.Mui-selected": {
      backgroundColor: isDark ? "rgba(124,108,255,0.35) !important" : "rgba(99,91,255,0.15) !important",
      color: isDark ? "#fff" : "var(--accent)",
    },
  };

  const darkTextFieldSx = {
    "& .MuiOutlinedInput-root": {
      color: "var(--text)",
      backgroundColor: isDark ? "#1c1b27" : "#ffffff",
      borderRadius: "6px",
      "& fieldset": { borderColor: "var(--border)" },
      "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" },
    },
    "& input::-webkit-calendar-picker-indicator": { filter: isDark ? "invert(1)" : "none" },
  };

  const primaryBtnSx = {
    backgroundColor: "var(--accent, #7c6cff)",
    color: "#fff",
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "6px",
    px: 2.5,
    "&:hover": { backgroundColor: isDark ? "#6a5af0" : "#5446e5" },
    "&.Mui-disabled": {
      backgroundColor: isDark ? "rgba(124,108,255,0.35)" : "rgba(99,91,255,0.25)",
      color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)",
    },
  };

  const cancelBtnSx = {
    backgroundColor: isDark ? "rgba(124,108,255,0.25)" : "rgba(99,91,255,0.08)",
    color: isDark ? "#cfc8ff" : "var(--accent)",
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "6px",
    px: 2.5,
    "&:hover": { backgroundColor: isDark ? "rgba(124,108,255,0.35)" : "rgba(99,91,255,0.15)" },
  };

  const { columnVisibility, sortBy, sortOrder, handleSortSelect, filters } = useOutletContext<any>();
  const getColSpanCount = () => {
    let count = 2; // Checkbox + Subject
    if (columnVisibility.status) count++;
    if (columnVisibility.priority) count++;
    if (columnVisibility.created_at) count++;
    if (columnVisibility.due_date) count++;
    if (columnVisibility.assigned_to) count++;
    if (columnVisibility.updated_at) count++;
    return count;
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const searchText = searchParams.get("search") || "";
  const [searchVal, setSearchVal] = useState(searchText);

  useEffect(() => {
    setSearchVal(searchText);
  }, [searchText]);

  const activePill = searchParams.get("filter") || "all";
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [activeBulkAction, setActiveBulkAction] = useState<BulkAction>(null);

  // User popover states
  const [userPopoverAnchor, setUserPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverAlign, setPopoverAlign] = useState<"left" | "right">("left");
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [popoverUserCode, setPopoverUserCode] = useState<string | null>(null);
  const [popoverUserDetail, setPopoverUserDetail] = useState<any | null>(null);
  const [popoverUserLoading, setPopoverUserLoading] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotesText, setEditNotesText] = useState("");

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
      setPopoverUserDetail((prev: any) => prev ? { ...prev, notes: editNotesText } : null);
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
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  // Due date panel — value lives in <input type="datetime-local"> format
  const [selectedDueDate, setSelectedDueDate] = useState("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<any[]>([]);
  const [bulkCategoryAnchorEl, setBulkCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);



  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isAdmin = [1, 4].includes(Number(currentUser.role_id));

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

  const loadCategoryGroups = async () => {
    if (categoryGroups.length > 0 || loadingCategories) return;
    try {
      setLoadingCategories(true);
      const cats = await getCategories();
      const groups = await Promise.all(
        cats.map(async (category: any) => {
          try {
            const subs = await getSubCategories(category.category_id);
            return {
              category_id: category.category_id,
              category_name: category.category_name,
              subcategories: subs || [],
            };
          } catch {
            return {
              category_id: category.category_id,
              category_name: category.category_name,
              subcategories: [],
            };
          }
        })
      );
      setCategoryGroups(groups);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const getSelectedBulkCategoryLabel = () => {
    if (!selectedCategoryId) return "Select category";
    const cat = categoryGroups.find((g) => String(g.category_id) === String(selectedCategoryId));
    if (!cat) return "Select category";
    if (selectedSubCategoryId) {
      const sub = cat.subcategories.find((s: any) => String(s.subcategory_id) === String(selectedSubCategoryId));
      return sub ? sub.subcategory_name : cat.category_name;
    }
    return cat.category_name;
  };



  const CLOSED_STATUS_ID = 3;

  const fetchData = async () => {
    try {
      setLoading(true);
      const ticketsData = await getTickets(searchText, sortBy, sortOrder);
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
    loadPriorities();
    loadCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchText, sortBy, sortOrder]);

  const buildCategoryTree = (): CategoryTreeItem[] => {
    const tree: CategoryTreeItem[] = [
      { label: "All categories", indent: 0, isParent: false },
    ];
    // Map: Category Name -> Set of Subcategory Names
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

    // 6. From filter (Email or username of the creator)
    if (filters.from) {
      const match =
        ticket.raised_by_user_code?.toLowerCase().includes(filters.from.toLowerCase()) ||
        false;
      if (!match) return false;
    }

    // 7. Company filter
    if (filters.company) {
      const match =
        ticket.company_code?.toLowerCase().includes(filters.company.toLowerCase()) ||
        false;
      if (!match) return false;
    }

    // 8. Department filter
    if (filters.department) {
      if (ticket.department?.toLowerCase() !== filters.department.toLowerCase()) return false;
    }

    // 9. Tech filter (Assigned technician)
    if (filters.tech) {
      const match =
        ticket.assigned_to_user_code?.toLowerCase() === filters.tech.toLowerCase();
      if (!match) return false;
    }

    // 10. Subscribed Only filter
    if (filters.subscribedOnly) {
      const userCode = currentUser.userCode || currentUser.user_code;
      const isCreator = ticket.raised_by_user_code === userCode;
      const isAssignee = ticket.assigned_to_user_code === userCode;
      const isAllocated = ticket.allocated_to_user_code?.split("|").includes(userCode) || false;
      if (!isCreator && !isAssignee && !isAllocated) return false;
    }

    return true;
  };



  const filteredTickets = tickets.filter(
    (t) => filterPill(t) && filterCategory(t) && filterCustom(t),
  );

  const getSortValue = (ticket: Ticket, opt: string) => {
    switch (opt) {
      case "Ticket number": {
        // extract numeric part of ticket_no if possible (e.g., TKT-1002 -> 1002) for proper numeric sorting
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
      case "Tech":
        return (ticket.assigned_to_name || "").toLowerCase();
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

  const lastSelectedTicketId = selectedTickets[selectedTickets.length - 1];

  const getCategoryCount = (name: string) => {
    if (name === "All categories") return tickets.length;
    return tickets.filter(
      (t) =>
        t.category_name?.toLowerCase() === name.toLowerCase() ||
        t.subcategory_name?.toLowerCase() === name.toLowerCase(),
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
    setSelectedDueDate("");
    setSelectedTags([]);
  };

  // If the selection changes while the Assign panel is open and the user no
  // longer qualifies, close it instead of leaving a stale panel visible.
  useEffect(() => {
    if (activeBulkAction === "assign" && !canBulkAssign) {
      closeBulkPanel();
    }
  }, [activeBulkAction, canBulkAssign]);

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
      loadCategoryGroups();
    }

    if (action === "due") {
      setSelectedDueDate(
        singleTicket?.due_date
          ? toDateTimeLocalValue(singleTicket.due_date)
          : "",
      );
    }



    if (action === "tag") {
      setSelectedTags([]);
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
    if (!selectedCategoryId) {
      return;
    }

    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          updateTicketCategory(
            ticketId,
            Number(selectedCategoryId),
            selectedSubCategoryId ? Number(selectedSubCategoryId) : null,
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

  const handleBulkTagUpdate = async () => {
    if (selectedTags.length === 0) return;

    try {
      await Promise.all(
        selectedTickets.map(async (ticketId) => {
          const existingTags = await getFreeformTicketTags(ticketId).catch(() => []);
          const existingMessages = existingTags.map((t) => t.tag_message.toLowerCase());

          for (const tag of selectedTags) {
            if (!existingMessages.includes(tag.toLowerCase())) {
              await addFreeformTag(ticketId, tag);
            }
          }
        }),
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) tagged`,
      });

      closeBulkPanel();
      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to tag tickets",
      });
    }
  };

  const handleBulkPinTickets = async (isPinned: boolean) => {
    try {
      await Promise.all(
        selectedTickets.map((ticketId) =>
          toggleTicketPin(ticketId, isPinned)
        )
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) ${isPinned ? "pinned" : "unpinned"}`,
      });

      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || `Failed to ${isPinned ? "pin" : "unpin"} tickets`,
      });
    }
  };

  const handleDeleteTickets = async () => {
    try {
      await Promise.all(
        selectedTickets.map((ticketId) => deleteTicket(ticketId))
      );

      setToast({
        open: true,
        severity: "success",
        message: `${selectedTickets.length} ticket(s) deleted successfully`,
      });

      setSelectedTickets([]);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to delete tickets",
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
    { label: "Tag", onClick: () => openBulkPanel("tag") },
  ];

  const allSelectedPinned =
    selectedTickets.length > 0 &&
    selectedTickets.every(
      (id) => tickets.find((t) => t.ticket_id === id)?.is_pinned,
    );

  const plainActions: { label: string; onClick: () => void }[] = [
    { label: "Takeover", onClick: handleTakeoverTickets },
    {
      label: allSelectedPinned ? "Unpin" : "Pin",
      onClick: () => handleBulkPinTickets(!allSelectedPinned),
    },
    { label: "Delete", onClick: handleDeleteTickets },
  ];

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

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        color: "var(--text)",
        minHeight: "calc(100vh - 255px)",
      }}
    >
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
                navigate(`/tickets?search=${encodeURIComponent(searchVal)}`);
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
            onClick={() => navigate(`/tickets?search=${encodeURIComponent(searchVal)}`)}
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
            p: 0.5, // 4px padding
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
                  pl: cat.indent ? 2.5 : 1.5, // pl-5 (20px) for subcategory, px-3 (12px) for main category
                  pr: 1.5, // pr-3 (12px)
                  py: 1, // py-2 (8px)
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
                          ? 600
                          : 400,
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
                      <KeyboardArrowUp
                        sx={{ fontSize: 17, color: "var(--text-sub)" }}
                      />
                    ) : (
                      <KeyboardArrowDown
                        sx={{ fontSize: 17, color: "var(--text-sub)" }}
                      />
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
                      sortedTickets.length > 0 &&
                      selectedTickets.length === sortedTickets.length
                    }
                    indeterminate={
                      selectedTickets.length > 0 &&
                      selectedTickets.length < sortedTickets.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTickets(
                          sortedTickets.map((t) => t.ticket_id),
                        );
                      } else {
                        setSelectedTickets([]);
                      }
                    }}
                    sx={checkboxSx}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    ...headCellSx,
                    width: "45%",
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
                    sx={{ ...headCellSx, width: 140, cursor: "pointer", userSelect: "none" }}
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
                    sx={{ ...headCellSx, width: 180, cursor: "pointer", userSelect: "none" }}
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
                    sx={{ ...headCellSx, width: 90, cursor: "pointer", userSelect: "none" }}
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
                {columnVisibility.assigned_to && (
                  <TableCell
                    sx={{ ...headCellSx, width: 110, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortSelect("Tech")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Tech
                      {sortBy === "Tech" && (
                        sortOrder === "asc" ? <KeyboardArrowUp sx={{ fontSize: 15, color: "var(--accent)" }} /> : <KeyboardArrowDown sx={{ fontSize: 15, color: "var(--accent)" }} />
                      )}
                    </Box>
                  </TableCell>
                )}
                {columnVisibility.updated_at && (
                  <TableCell
                    sx={{ ...headCellSx, width: 130, cursor: "pointer", userSelect: "none" }}
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
                  colSpan={1 + Object.values(columnVisibility).filter(Boolean).length}
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
                        onClick={() => navigate(`/tickets/${ticket.ticket_no}`)}
                      >
                        <TableCell
                          padding="checkbox"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            pl: 2,
                            verticalAlign: "top",
                            pt: 2.0,
                            pb: 1.8,
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

                        {/* Tech (Assignee) */}
                        {columnVisibility.assigned_to && (
                          <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>
                            {ticket.assigned_to_name ? (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                                {ticket.assigned_to_name.split(", ").map((name, i) => (
                                  <Box
                                    key={i}
                                    component="span"
                                    title="Click here for preview"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (ticket.assigned_to_user_code) {
                                        handleUserClick(e, ticket.assigned_to_user_code, "right");
                                      }
                                    }}
                                    sx={{
                                      display: "inline-block",
                                      whiteSpace: "nowrap",
                                      color: "#211b5a",
                                      cursor: "pointer",
                                      "&:hover": { textDecoration: "underline" },
                                    }}
                                  >
                                    {name}
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Box component="span" sx={{ color: "var(--text-sub)", fontStyle: "italic" }}>
                                Unassigned
                              </Box>
                            )}
                          </TableCell>
                        )}

                        {/* Updated Date */}
                        {columnVisibility.updated_at && (
                          <TableCell sx={{ ...bodyCellSx, backgroundColor: "inherit" }}>
                            {formatDateTime(ticket.update_timestamp)}
                          </TableCell>
                        )}
                      </TableRow>

                      {/* ── Floating bulk action bar ── */}
                      {ticket.ticket_id === lastSelectedTicketId &&
                        selectedTickets.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={getColSpanCount()}
                              sx={{
                                border: 0,
                                p: 0,
                                height: 0,
                              }}
                            >
                              <Box sx={{ position: "relative", width: "100%", height: 0 }}>
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: -6,
                                    left: 56,
                                    zIndex: 5,
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    boxShadow: "0 8px 24px rgba(99,91,255,.35)",
                                    border: "1px solid var(--border)",
                                    width: "max-content",
                                    maxWidth: "calc(100% - 64px)",
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
                                     <Box
                                       onClick={(e) => {
                                         if (!loadingCategories) {
                                           setBulkCategoryAnchorEl(e.currentTarget);
                                         }
                                       }}
                                       sx={{
                                         width: 226,
                                         height: 34,
                                         fontSize: 14,
                                         backgroundColor: "#ffffff",
                                         border: "1px solid #d1d5db",
                                         borderRadius: "4px",
                                         display: "flex",
                                         alignItems: "center",
                                         justifyContent: "space-between",
                                         px: 1.5,
                                         cursor: "pointer",
                                         color: selectedCategoryId ? "#111827" : "#6b7280",
                                       }}
                                     >
                                       <Typography
                                         variant="body2"
                                         noWrap
                                         sx={{
                                           textOverflow: "ellipsis",
                                           overflow: "hidden",
                                           fontSize: 14,
                                         }}
                                       >
                                         {loadingCategories
                                           ? "Loading categories..."
                                           : getSelectedBulkCategoryLabel()}
                                       </Typography>
                                       <KeyboardArrowDown sx={{ fontSize: 18, color: "#4b5563" }} />
                                     </Box>

                                     <Popover
                                       open={Boolean(bulkCategoryAnchorEl)}
                                       anchorEl={bulkCategoryAnchorEl}
                                       onClose={() => setBulkCategoryAnchorEl(null)}
                                       anchorOrigin={{
                                         vertical: "bottom",
                                         horizontal: "left",
                                       }}
                                       transformOrigin={{
                                         vertical: "top",
                                         horizontal: "left",
                                       }}
                                       slotProps={{
                                         paper: {
                                           sx: {
                                             width: 226,
                                             maxHeight: 280,
                                             overflowY: "auto",
                                             mt: 0.5,
                                             border: "1px solid #d1d5db",
                                             boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                                             backgroundColor: "#ffffff",
                                             backgroundImage: "none",
                                             display: "flex",
                                             flexDirection: "column",
                                             borderRadius: "8px",
                                             "&::-webkit-scrollbar": {
                                               width: "14px",
                                             },
                                             "&::-webkit-scrollbar-track": {
                                               backgroundColor: "#f4f4f5",
                                               borderLeft: "1px solid #e4e4e7",
                                             },
                                             "&::-webkit-scrollbar-thumb": {
                                               backgroundColor: "#d4d4d8",
                                               borderRadius: "0px",
                                               border: "3px solid #f4f4f5",
                                               "&:hover": {
                                                 backgroundColor: "#a1a1aa",
                                               },
                                             },
                                           },
                                         },
                                       }}
                                     >
                                       <Box sx={{ py: 0.5 }}>
                                         {categoryGroups.map((category) => {
                                           const hasSub = category.subcategories && category.subcategories.length > 0;
                                           const isCatSelected =
                                             String(selectedCategoryId) === String(category.category_id) &&
                                             !selectedSubCategoryId;
                                           return (
                                             <Box key={category.category_id}>
                                               <Box
                                                 onClick={() => {
                                                   if (!hasSub) {
                                                     setSelectedCategoryId(String(category.category_id));
                                                     setSelectedSubCategoryId("");
                                                     setBulkCategoryAnchorEl(null);
                                                   }
                                                 }}
                                                 sx={{
                                                   px: 2,
                                                   py: 0.85,
                                                   fontWeight: 600,
                                                   fontSize: 13.5,
                                                   color: hasSub ? "#4b5563" : isCatSelected ? "#635BFF" : "#1f2937",
                                                   cursor: hasSub ? "default" : "pointer",
                                                   userSelect: "none",
                                                   backgroundColor: isCatSelected ? "rgba(99, 91, 255, 0.08)" : "transparent",
                                                   display: "flex",
                                                   alignItems: "center",
                                                   "&:hover": {
                                                     backgroundColor: hasSub ? "transparent" : "#f3f4f6",
                                                   },
                                                 }}
                                               >
                                                 {category.category_name}
                                               </Box>

                                               {category.subcategories &&
                                                 category.subcategories.map((sub: any) => {
                                                   const isSelected =
                                                     String(selectedCategoryId) === String(category.category_id) &&
                                                     String(selectedSubCategoryId) === String(sub.subcategory_id);
                                                   return (
                                                     <Box
                                                       key={sub.subcategory_id}
                                                       onClick={() => {
                                                         setSelectedCategoryId(String(category.category_id));
                                                         setSelectedSubCategoryId(String(sub.subcategory_id));
                                                         setBulkCategoryAnchorEl(null);
                                                       }}
                                                       sx={{
                                                         pl: 3.5,
                                                         pr: 2,
                                                         py: 0.75,
                                                         fontSize: 13.5,
                                                         color: isSelected ? "#635BFF" : "#374151",
                                                         fontWeight: isSelected ? 600 : 500,
                                                         cursor: "pointer",
                                                         userSelect: "none",
                                                         backgroundColor: isSelected ? "rgba(99, 91, 255, 0.08)" : "transparent",
                                                         "&:hover": {
                                                           backgroundColor: "#f3f4f6",
                                                         },
                                                       }}
                                                     >
                                                       {sub.subcategory_name}
                                                     </Box>
                                                   );
                                                 })}
                                             </Box>
                                           );
                                         })}
                                       </Box>
                                     </Popover>

                                     <Button
                                       variant="contained"
                                       onClick={handleCategoryUpdate}
                                       disabled={!selectedCategoryId}
                                       sx={{
                                         backgroundColor: "#3127b2",
                                         color: "#fff",
                                         textTransform: "none",
                                         fontWeight: 600,
                                         borderRadius: "6px",
                                         px: 2.5,
                                         "&:hover": { backgroundColor: "#251c96" },
                                         "&.Mui-disabled": {
                                           backgroundColor: "rgba(49, 39, 178, 0.45)",
                                           color: "rgba(255, 255, 255, 0.65)",
                                         },
                                       }}
                                     >
                                       Change category
                                     </Button>

                                     <Button
                                       onClick={closeBulkPanel}
                                       sx={{
                                         backgroundColor: "#b2adfa",
                                         color: "#2823b5",
                                         textTransform: "none",
                                         fontWeight: 600,
                                         borderRadius: "6px",
                                         px: 2.5,
                                         "&:hover": { backgroundColor: "#9c96f8" },
                                       }}
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
                                      slotProps={{
                                        inputLabel: { shrink: true },
                                      }}
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

                                {/* Row 2 — Tag panel */}
                                {activeBulkAction === "tag" && (
                                  <Box sx={panelRowSx}>
                                    <Box sx={{ flex: 1, maxWidth: 360, ...darkTextFieldSx }}>
                                      <TagInput
                                        value={selectedTags}
                                        onChange={(tags) => setSelectedTags(tags)}
                                        placeholder="Add tags..."
                                      />
                                    </Box>

                                    <Button
                                      variant="contained"
                                      onClick={handleBulkTagUpdate}
                                      disabled={selectedTags.length === 0}
                                      sx={primaryBtnSx}
                                    >
                                      Tag tickets
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

      <Popover
        key={popoverAlign}
        open={Boolean(userPopoverAnchor && popoverPosition)}
        anchorReference="anchorPosition"
        anchorPosition={popoverPosition || undefined}
        onClose={handleUserPopoverClose}
        transformOrigin={{
          vertical: "top",
          horizontal: popoverAlign,
        }}
        slotProps={{
          paper: {
            sx: {
              width: "24rem",
              maxHeight: "min(480px, 85vh)",
              overflowY: "auto",
              borderRadius: "8px",
              p: 2,
              boxShadow: "1px 1px 5px -1px rgba(0, 0, 0, 0.06)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-popover-glass) !important",
              backdropFilter: "blur(12px)",
              color: "var(--text)",
              mt: 1,
            },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {popoverUserLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: "var(--accent)" }} />
          </Box>
        ) : popoverUserDetail ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Header Section */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontSize: 18,
                  fontWeight: 600,
                  backgroundColor: "rgba(107, 122, 114, 0.12)",
                  color: "#4f5e55",
                }}
              >
                {(((popoverUserDetail.first_name || "")[0] || "") + ((popoverUserDetail.last_name || "")[0] || "")).toUpperCase() || (popoverUserDetail.user_code || "U")[0].toUpperCase()}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#4f46e5", lineHeight: 1.2 }}>
                  {popoverUserDetail.first_name || ""} {popoverUserDetail.last_name || ""}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <MailOutlined sx={{ fontSize: 16, color: "var(--text-muted)" }} />
                  <Typography sx={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                    {popoverUserDetail.email}
                  </Typography>
                  {popoverUserDetail.email && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(popoverUserDetail.email);
                        setToast({
                          open: true,
                          severity: "success",
                          message: "Email address copied!",
                        });
                      }}
                      sx={{
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        p: 0.4,
                        color: "var(--text-sub)",
                        backgroundColor: "rgba(0,0,0,0.02)",
                        "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" },
                      }}
                      title="Copy email address"
                    >
                      <ContentCopy sx={{ fontSize: 11 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Metadata row */}
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--text-muted)", fontSize: 13 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#71717a" }}>
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                  <line x1="9" y1="22" x2="9" y2="16"></line>
                  <line x1="15" y1="22" x2="15" y2="16"></line>
                  <line x1="9" y1="16" x2="15" y2="16"></line>
                  <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"></path>
                </svg>
                {popoverUserDetail.company_name || popoverUserDetail.company_code || "Quincecapital"}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--text-muted)", fontSize: 13 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#71717a" }}>
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"></line>
                </svg>
                {popoverUserDetail.ip_address || "183.87.220.66"}
              </Box>
            </Box>

            <Divider sx={{ borderColor: "var(--border)" }} />

            {/* Other Notes */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>
                Other notes (from admin)
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
                      }
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button size="small" onClick={() => setIsEditingNotes(false)} sx={{ textTransform: "none" }}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSaveNotes} sx={{ textTransform: "none", backgroundColor: "var(--accent)", color: "#fff" }}>
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
                      "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.05)" }
                    }}
                    title="Edit Notes"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              {tickets.filter(t => t.raised_by_user_code === popoverUserCode).length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--text-sub)", fontStyle: "italic" }}>
                  No recent tickets found.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {tickets
                    .filter(t => t.raised_by_user_code === popoverUserCode)
                    .slice(0, 5)
                    .map(t => {
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
                              "&:hover": { textDecoration: "underline", color: "#3b82f6" }
                            }}
                            onClick={() => {
                              handleUserPopoverClose();
                              navigate(`/tickets/${t.ticket_no}`);
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
                              {new Date(t.created_at || (t as any).date || Date.now()).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
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

const checkboxSx = {
  color: "var(--text-sub)",
  p: 0,
  "& .MuiSvgIcon-root": { fontSize: 20 },
  "&.Mui-checked": { color: "var(--accent)" },
};

export default TicketsPage;
