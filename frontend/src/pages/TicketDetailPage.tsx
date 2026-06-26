import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Avatar,
  Chip,
  Switch,
  Dialog,
  Tooltip,
  TextField,
  InputAdornment,
  Popover,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Reply as ReplyIcon,
  Input as TakeoverIcon,
  Close as CloseIcon,
  MoreHoriz as MoreIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  Close as CancelIcon,
  LockOutlined as LockIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DownloadOutlined as DownloadIcon,
  InsertDriveFileOutlined as FileIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CloudDownloadOutlined as CloudDownloadIcon,
  ImportExport as SortIcon,
  DeleteOutlined as DeleteIcon,
  SearchOutlined as SearchIcon,
  Visibility as VisibilityIcon,
  PushPin,
  KeyboardArrowDown,
} from "@mui/icons-material";
import RichTextEditor from "../components/RichTextEditor";
import {
  getFreeformTicketTags,
  addFreeformTag,
  deleteFreeformTag,
  type FreeformTag,
} from "../services/tagService";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  updateTicketCategory,
  assignTicket,
  takeoverTicket,
  getComments,
  getTicketHistory,
  createComment,
  deleteAttachment,
  reopenTicket,
  updateTicketDueDate,
  toggleTicketPin,
} from "../services/ticketService";
import { getUsers } from "../services/userService";
import {
  startTimeTracking,
  stopTimeTracking,
  getTotalTime,
} from "../services/timeTrackingService";
import {
  getCategories,
  getPriorities,
  getStatuses,
  getSubCategories,
} from "../services/masterService";

type CategoryGroup = {
  category_id: number;
  category_name: string;
  subcategories: Array<{
    subcategory_id: number;
    subcategory_name: string;
  }>;
};

type TicketStatusOption = {
  status_id: number;
  status_name: string;
  status_color?: string;
};

type TicketPriorityOption = {
  priority_id: number;
  priority_name: string;
  priority_color?: string;
};

const fallbackStatusOptions: TicketStatusOption[] = [
  { status_id: 1, status_name: "New", status_color: "#2196F3" },
  { status_id: 2, status_name: "In Progress", status_color: "#FD7E14" },
  { status_id: 3, status_name: "Closed", status_color: "#28A745" },
];

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resolvedTicketId, setResolvedTicketId] = useState<number | null>(null);
  const ticketId = resolvedTicketId || (isNaN(Number(id)) ? 0 : Number(id));

  // States
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [statusOptions, setStatusOptions] = useState<TicketStatusOption[]>([]);
  const [priorityMasterOptions, setPriorityMasterOptions] = useState<
    TicketPriorityOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [freeformTags, setFreeformTags] = useState<FreeformTag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [selectedStatusValue, setSelectedStatusValue] = useState("");
  const [editingPriority, setEditingPriority] = useState(false);
  const [selectedPriorityValue, setSelectedPriorityValue] = useState("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [selectedCategoryValue, setSelectedCategoryValue] = useState("");
  const [categoryAnchorEl, setCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [editingDue, setEditingDue] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [selectedAssigneeValue, setSelectedAssigneeValue] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const [replyHtml, setReplyHtml] = useState("");
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [techniciansOnly, setTechniciansOnly] = useState(false);
  const [previewAttachments, setPreviewAttachments] = useState<any[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  // More actions menu anchor
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [togglingTimer, setTogglingTimer] = useState(false);
  const [fileSortOrder, setFileSortOrder] = useState<"asc" | "desc">("desc");
  const timerSecondsRef = useRef(0);
  const currentEntryIdRef = useRef<number | null>(null);
  const timerStoppedRef = useRef(false);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const lastUpdateTimestampRef = useRef<string>("");

  useEffect(() => {
    if (!conversationEndRef.current) return;
    
    let latestTimeStr = ticket?.updated_at || "";
    if (comments && comments.length > 0) {
      comments.forEach((c: any) => {
        if (c.created_at && (!latestTimeStr || new Date(c.created_at) > new Date(latestTimeStr))) {
          latestTimeStr = c.created_at;
        }
      });
    }
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        if (h.changed_at && (!latestTimeStr || new Date(h.changed_at) > new Date(latestTimeStr))) {
          latestTimeStr = h.changed_at;
        }
      });
    }

    if (latestTimeStr && latestTimeStr !== lastUpdateTimestampRef.current) {
      lastUpdateTimestampRef.current = latestTimeStr;
      conversationEndRef.current.scrollTop = conversationEndRef.current.scrollHeight;
    }
  }, [comments, history, ticket?.updated_at]);

  // Toast feedback state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Current logged in user
  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const loggedInRoleId = Number(loggedInUser.role_id ?? loggedInUser.roleId);
  const loggedInUserCode = loggedInUser.user_code ?? loggedInUser.userCode;
  const isAdminOrDev = loggedInRoleId === 1 || loggedInRoleId === 3;
  const canManageTicketMetadata = (ticketToCheck = ticket) => {
    if (!ticketToCheck) return false;
    const allocatedList = ticketToCheck.allocated_to_user_code
      ? ticketToCheck.allocated_to_user_code.split("|").map((c: string) => c.trim()).filter(Boolean)
      : [];
    const isAllocated = allocatedList.includes(loggedInUserCode);

    return (
      isAdminOrDev ||
      ticketToCheck.assigned_to_user_code === loggedInUserCode ||
      ticketToCheck.raised_by_user_code === loggedInUserCode ||
      isAllocated
    );
  };

  // Check if logged in user is in allocated list
  const isAllocatedUser = () => {
    if (!ticket || !ticket.allocated_to_user_code) return false;
    const allocatedList = ticket.allocated_to_user_code
      .split("|")
      .map((c: string) => c.trim())
      .filter(Boolean);
    return allocatedList.includes(loggedInUserCode);
  };

  const isTakeoverAllowed = () => {
    if (isClosed) return false;
    if (ticket.assigned_to_user_code === loggedInUserCode) return false;
    return isAdminOrDev || isAllocatedUser();
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ── Timer: auto-start on mount, auto-stop on unmount ──
  const stopCurrentTimer = useCallback(async () => {
    const entryId = currentEntryIdRef.current;
    const seconds = timerSecondsRef.current;
    if (entryId && !timerStoppedRef.current) {
      timerStoppedRef.current = true;
      try {
        await stopTimeTracking(ticketId, entryId, seconds);
      } catch (err) {
        console.warn("Failed to stop timer:", err);
      }
    }
  }, [ticketId]);

  // Start timer after ticket data is loaded
  useEffect(() => {
    if (!ticket) return;

    let cancelled = false;

    const initTimer = async () => {
      try {
        // Get total time already spent
        const totalSecs = await getTotalTime(ticketId);
        if (!cancelled) setTotalTimeSeconds(totalSecs);

        // Start a new session
        const entry = await startTimeTracking(ticketId, ticket.status_name);
        if (!cancelled && entry) {
          currentEntryIdRef.current = entry.entry_id;
          timerStoppedRef.current = false;
          setTimerSeconds(0);
          timerSecondsRef.current = 0;
          setTimerRunning(true);
        }
      } catch (err) {
        console.warn("Failed to start timer:", err);
      }
    };

    initTimer();

    return () => {
      cancelled = true;
    };
  }, [ticket?.ticket_id]);

  // Tick the timer every second
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 1;
        timerSecondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Stop timer on unmount / navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      const entryId = currentEntryIdRef.current;
      const seconds = timerSecondsRef.current;
      if (entryId && !timerStoppedRef.current) {
        timerStoppedRef.current = true;
        // Use sendBeacon for reliability on tab close
        const token = localStorage.getItem("token");
        const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/tickets/${ticketId}/time-tracking/${entryId}/stop`;
        const body = JSON.stringify({ time_spent_seconds: seconds });

        // Try sendBeacon first, fall back to sync XHR
        if (typeof navigator.sendBeacon === "function") {
          // sendBeacon doesn't support custom headers, use fetch keepalive instead
          fetch(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body,
            keepalive: true,
          }).catch(() => { });
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopCurrentTimer();
    };
  }, [ticketId, stopCurrentTimer]);

  // Helper: format seconds to HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return [
      h.toString().padStart(2, "0"),
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0"),
    ].join(":");
  };

  const handleToggleTimer = async () => {
    if (togglingTimer || !ticket) return;
    setTogglingTimer(true);
    try {
      if (timerRunning) {
        // Pause tracking
        const entryId = currentEntryIdRef.current;
        const seconds = timerSecondsRef.current;
        if (entryId && !timerStoppedRef.current) {
          timerStoppedRef.current = true;
          await stopTimeTracking(ticketId, entryId, seconds);
          setTotalTimeSeconds((prev) => prev + seconds);
          setTimerSeconds(0);
          timerSecondsRef.current = 0;
          currentEntryIdRef.current = null;
          setTimerRunning(false);
        }
      } else {
        // Start tracking
        const entry = await startTimeTracking(ticketId, ticket.status_name);
        if (entry) {
          currentEntryIdRef.current = entry.entry_id;
          timerStoppedRef.current = false;
          setTimerSeconds(0);
          timerSecondsRef.current = 0;
          setTimerRunning(true);
        }
      }
    } catch (err) {
      console.warn("Failed to toggle timer:", err);
    } finally {
      setTogglingTimer(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const ticketData = await getTicketById(id!);
      setTicket(ticketData);
      setResolvedTicketId(ticketData.ticket_id);

      const realTicketId = ticketData.ticket_id;

      // Track recently viewed tickets in localStorage
      try {
        const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
        const filtered = recentlyViewed.filter((t: any) => t.ticket_id !== ticketData.ticket_id);
        const newItem = {
          ticket_id: ticketData.ticket_id,
          ticket_no: ticketData.ticket_no,
          subject: ticketData.subject,
          category_name: ticketData.category_name || "General",
        };
        const updated = [newItem, ...filtered].slice(0, 5);
        localStorage.setItem("recentlyViewed", JSON.stringify(updated));
        window.dispatchEvent(new Event("recently-viewed-updated"));
      } catch (err) {
        console.warn("Failed to update recently viewed tickets:", err);
      }

      try {
        const [commentsData, historyData, tagsData] = await Promise.all([
          getComments(realTicketId),
          getTicketHistory(realTicketId).catch((historyError) => {
            console.warn("Unable to load ticket history:", historyError);
            return [];
          }),
          getFreeformTicketTags(realTicketId).catch(() => []),
        ]);
        setComments(commentsData || []);
        setHistory(historyData || []);
        setFreeformTags(tagsData || []);
      } catch (commentsError) {
        console.warn("Unable to load ticket comments:", commentsError);
        setComments([]);
        setHistory([]);
        setFreeformTags([]);
      }

      await Promise.all([
        getUsers()
          .then((usersData) => setUsers(usersData || []))
          .catch((usersError) => {
            console.warn("Unable to load users for history labels:", usersError);
            setUsers([]);
          }),
        loadCategoryGroups(),
        loadStatuses(),
        loadPriorities(),
      ]);
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message:
          error.response?.data?.message || "Failed to load ticket details",
        severity: "error",
      });
      // Redirect back if not found, forbidden, or any access-denied 500
      const status = error.response?.status;
      const serverMsg: string = error.response?.data?.message || "";
      const isAccessDenied =
        status === 403 ||
        status === 404 ||
        (status === 500 && serverMsg.toLowerCase().includes("access denied"));
      if (isAccessDenied) {
        navigate("/tickets");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryGroups = async () => {
    if (categoryGroups.length > 0 || loadingCategories) return;

    try {
      setLoadingCategories(true);
      const categories = await getCategories();
      const groups = await Promise.all(
        categories.map(async (category: any) => {
          try {
            const subcategories = await getSubCategories(category.category_id);
            return {
              category_id: category.category_id,
              category_name: category.category_name,
              subcategories: subcategories || [],
            };
          } catch {
            return {
              category_id: category.category_id,
              category_name: category.category_name,
              subcategories: [],
            };
          }
        }),
      );

      setCategoryGroups(groups);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setToast({
        open: true,
        message: "Failed to load categories",
        severity: "error",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadStatuses = async () => {
    if (statusOptions.length > 0) return statusOptions;

    try {
      setLoadingStatuses(true);
      const statuses = await getStatuses();
      const nextStatuses =
        Array.isArray(statuses) && statuses.length > 0
          ? statuses
          : fallbackStatusOptions;
      setStatusOptions(nextStatuses);
      return nextStatuses;
    } catch (error) {
      console.warn("Using fallback statuses because status options failed to load:", error);
      setStatusOptions(fallbackStatusOptions);
      return fallbackStatusOptions;
    } finally {
      setLoadingStatuses(false);
    }
  };

  const loadPriorities = async () => {
    if (priorityMasterOptions.length > 0) return priorityMasterOptions;

    try {
      const priorities = await getPriorities();
      const nextPriorities = Array.isArray(priorities) ? priorities : [];
      setPriorityMasterOptions(nextPriorities);
      return nextPriorities;
    } catch (error) {
      console.warn("Unable to load priorities for history labels:", error);
      setPriorityMasterOptions([]);
      return [];
    }
  };

  const getReplyPlainText = () =>
    replyHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

  const resetReplyComposer = () => {
    setReplyHtml("");
    setReplyAttachments([]);
    setTechniciansOnly(false);
    setReplyComposerOpen(false);
  };

  const handleOpenReplyComposer = () => {
    setReplyComposerOpen(true);
  };

  const getClosedStatusId = () => {
    const options = statusOptions.length > 0 ? statusOptions : fallbackStatusOptions;
    const closedStatus = options.find(
      (s: any) => s.is_closed_status === true || s.status_name?.toLowerCase() === "closed"
    );
    return closedStatus ? closedStatus.status_id : 3;
  };

  const handlePostComment = async ({
    resolveTicket = false,
  }: { resolveTicket?: boolean } = {}) => {
    const plainText = getReplyPlainText();
    const hasImage = replyHtml.includes("<img");

    if (!plainText && !hasImage && replyAttachments.length === 0) return;

    try {
      setSubmittingComment(true);

      await createComment(
        ticketId,
        replyHtml,
        replyAttachments,
      );
      if (resolveTicket) {
        const closedId = getClosedStatusId();
        await updateTicketStatus(ticketId, closedId);
      }

      await fetchData();

      resetReplyComposer();

      setToast({
        open: true,
        message: resolveTicket
          ? "Reply added and ticket resolved"
          : "Reply added successfully",
        severity: "success",
      });
    } catch (error: any) {
      console.error(error);

      const validationMessage = error.response?.data?.errors?.[0]?.message;

      setToast({
        open: true,
        message:
          validationMessage ||
          error.response?.data?.message ||
          "Failed to add reply",
        severity: "error",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      setUpdatingMetadata(true);
      const closedId = getClosedStatusId();
      await updateTicketStatus(ticketId, closedId);
      setToast({
        open: true,
        message: "Ticket closed successfully",
        severity: "success",
      });
      // Refresh local ticket data
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to close ticket",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleReopenTicket = async () => {
    try {
      setUpdatingMetadata(true);
      await reopenTicket(ticketId);
      setToast({
        open: true,
        message: "Ticket reopened successfully",
        severity: "success",
      });
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to reopen ticket",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleTakeover = async () => {
    try {
      setUpdatingMetadata(true);
      await takeoverTicket(ticketId);
      setToast({
        open: true,
        message: "Ticket assigned to you",
        severity: "success",
      });
      // Refresh local data
      await fetchData();
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to assign ticket",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleAddFreeformTag = async () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    try {
      await addFreeformTag(ticketId, trimmedTag);
      setTagInput("");
      await fetchData();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: "Failed to add tag", severity: "error" });
    }
  };

  const handleDeleteFreeformTag = async (tagId: number) => {
    try {
      await deleteFreeformTag(ticketId, tagId);
      await fetchData();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: "Failed to delete tag", severity: "error" });
    }
  };

  const handlePriorityChange = async (priorityId: number) => {
    try {
      setUpdatingMetadata(true);
      await updateTicketPriority(ticketId, priorityId);
      setToast({
        open: true,
        message: "Priority updated successfully",
        severity: "success",
      });
      await fetchData();
      setEditingPriority(false);
      setSelectedPriorityValue("");
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update priority",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handlePriorityEditStart = () => {
    if (!canManageTicketMetadata()) return;
    setSelectedPriorityValue(String(ticket.priority_id || ""));
    setEditingPriority(true);
  };

  const handlePriorityEditCancel = () => {
    setEditingPriority(false);
    setSelectedPriorityValue("");
  };

  const handlePrioritySelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedPriorityValue(event.target.value);
  };

  const handlePrioritySave = async () => {
    if (!selectedPriorityValue) return;
    await handlePriorityChange(Number(selectedPriorityValue));
  };

  const handleCategoryEditStart = async () => {
    if (!canManageTicketMetadata()) return;

    setSelectedCategoryValue(
      ticket.category_id
        ? ticket.subcategory_id
          ? `${ticket.category_id}:${ticket.subcategory_id}`
          : `${ticket.category_id}:`
        : "",
    );
    setEditingCategory(true);
    await loadCategoryGroups();
  };

  const handleCategoryEditCancel = () => {
    setEditingCategory(false);
    setSelectedCategoryValue("");
  };



  const handleCategorySave = async () => {
    if (!selectedCategoryValue) return;

    const parts = selectedCategoryValue.split(":");
    const categoryId = Number(parts[0]);
    const subCategoryId = parts[1] ? Number(parts[1]) : null;

    try {
      setUpdatingMetadata(true);
      await updateTicketCategory(ticketId, categoryId, subCategoryId);
      setToast({
        open: true,
        message: "Category updated successfully",
        severity: "success",
      });
      await fetchData();
      setEditingCategory(false);
      setSelectedCategoryValue("");
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update category",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleDueEditStart = () => {
    if (!canManageTicketMetadata()) return;
    if (ticket.due_date) {
      const d = new Date(ticket.due_date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      setSelectedDueDate(localISOTime);
    } else {
      setSelectedDueDate("");
    }
    setEditingDue(true);
  };

  const handleDueEditCancel = () => {
    setEditingDue(false);
    setSelectedDueDate("");
  };

  const handleDueSave = async () => {
    try {
      setUpdatingMetadata(true);
      const formattedDate = selectedDueDate ? new Date(selectedDueDate).toISOString() : null;
      await updateTicketDueDate(ticketId, formattedDate);
      setToast({
        open: true,
        message: "Due date updated successfully",
        severity: "success",
      });
      await fetchData();
      setEditingDue(false);
      setSelectedDueDate("");
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update due date",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleStatusChange = async (statusId: number) => {
    try {
      setUpdatingMetadata(true);
      await updateTicketStatus(ticketId, statusId);
      setToast({
        open: true,
        message: "Status updated successfully",
        severity: "success",
      });
      await fetchData();
      setEditingStatus(false);
      setSelectedStatusValue("");
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update status",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const getStatusValue = (options = statusOptions) => {
    if (ticket.status_id) return String(ticket.status_id);

    const matchingStatus = options.find(
      (status) =>
        status.status_name?.toLowerCase() === ticket.status_name?.toLowerCase(),
    );

    return matchingStatus ? String(matchingStatus.status_id) : "";
  };

  const handleStatusEditStart = async () => {
    if (!canManageTicketMetadata()) return;
    const currentStatusValue = getStatusValue();
    setSelectedStatusValue(currentStatusValue);
    setEditingStatus(true);

    const statuses = await loadStatuses();
    if (!currentStatusValue) {
      setSelectedStatusValue(getStatusValue(statuses));
    }
  };

  const handleStatusEditCancel = () => {
    setEditingStatus(false);
    setSelectedStatusValue("");
  };

  const handleStatusSelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatusValue(event.target.value);
  };

  const handleStatusSave = async () => {
    if (!selectedStatusValue) return;
    await handleStatusChange(Number(selectedStatusValue));
  };

  const handleAssigneeChange = async (userCode: string) => {
    try {
      setUpdatingMetadata(true);
      await assignTicket(ticketId, userCode);
      setToast({
        open: true,
        message: "Assignee updated successfully",
        severity: "success",
      });
      await fetchData();
      setEditingAssignee(false);
      setSelectedAssigneeValue([]);
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update assignee",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleAssigneeEditStart = async () => {
    if (!canManageTicketMetadata()) return;
    setSelectedAssigneeValue(ticket.assigned_to_user_code ? ticket.assigned_to_user_code.split("|") : []);
    setEditingAssignee(true);
    if (users.length === 0) {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to load users:", error);
        setToast({
          open: true,
          message: "Failed to load users",
          severity: "error",
        });
      }
    }
  };

  const handleAssigneeEditCancel = () => {
    setEditingAssignee(false);
    setSelectedAssigneeValue([]);
    setAssigneeSearch("");
  };



  const handleAssigneeSave = async () => {
    if (selectedAssigneeValue.length === 0) return;
    await handleAssigneeChange(selectedAssigneeValue[0]);
  };



  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress size={50} sx={{ color: "#211b5a" }} />
      </Box>
    );
  }

  if (!ticket) return null;

  // Status mapping
  const statusColors: Record<string, string> = {
    New: "#2196F3",
    Open: "#DC3545", // red dot like "New" in screenshot
    "In Progress": "#FFC107", // yellow dot
    Testing: "#6F42C1", // purple
    Resolved: "#28A745", // green
    Closed: "#6C757D", // grey
  };

  const priorityColors: Record<string, string> = {
    Critical: "#DC3545",
    High: "#FD7E14",
    Medium: "#FFC107",
    Low: "#28A745",
  };

  const isClosed = ticket.status_name === "Closed";
  const canEditRightCard = canManageTicketMetadata(ticket);
  const availableStatusOptions =
    statusOptions.length > 0 ? statusOptions : fallbackStatusOptions;
  const replyAuthorName =
    [loggedInUser.first_name, loggedInUser.last_name].filter(Boolean).join(" ") ||
    loggedInUser.name ||
    loggedInUser.user_code ||
    "You";
  const replyInitials = String(replyAuthorName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const subscriberNames = Array.from(
    new Set(
      [
        ticket.raised_by_name ?? ticket.raised_by_user_code,
        ticket.assigned_to_name ?? ticket.assigned_to_user_code,
      ].filter(Boolean),
    ),
  );
  const formatFeedTime = (value?: string) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSeconds < 60) return `${diffSeconds} sec ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayLabel =
      date.toDateString() === yesterday.toDateString()
        ? "Yest"
        : date.toLocaleDateString(undefined, {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        });

    return `${isToday ? "Today" : dayLabel}, ${date.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      },
    )}`;
  };
  const getFeedAuthor = (item: any) =>
    item.commented_by_name ??
    item.commented_by_user_code ??
    item.changed_by_name ??
    item.changed_by_user_code ??
    "System";
  const getInitials = (name?: string) =>
    String(name || "U")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  const normalizeHistoryField = (field?: string) =>
    String(field || "")
      .replace(/[_\s-]/g, "")
      .toLowerCase();
  const getUserDisplayName = (userCode?: string) => {
    if (!userCode) return "";

    // Handle pipe-separated codes for Allocations lists
    if (userCode.includes("|")) {
      return userCode
        .split("|")
        .map(code => {
          const u = users.find((user) => String(user.user_code) === String(code));
          if (!u) return code;
          const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
          return name ? `${name} (${u.user_code})` : u.user_code;
        })
        .join(", ");
    }

    const matchingUser = users.find(
      (user) => String(user.user_code) === String(userCode),
    );

    if (!matchingUser) return String(userCode);

    const fullName = [matchingUser.first_name, matchingUser.last_name]
      .filter(Boolean)
      .join(" ");

    return fullName ? `${fullName} (${matchingUser.user_code})` : matchingUser.user_code;
  };
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "";

    const category = categoryGroups.find(
      (group) => String(group.category_id) === String(categoryId),
    );

    return category?.category_name || String(categoryId);
  };
  const getSubCategoryName = (subCategoryId?: string) => {
    if (!subCategoryId) return "";

    const subcategory = categoryGroups
      .flatMap((group) => group.subcategories)
      .find(
        (subCategory: any) =>
          String(subCategory.subcategory_id) === String(subCategoryId),
      );

    return subcategory?.subcategory_name || String(subCategoryId);
  };
  const getSelectedCategoryLabel = () => {
    if (!selectedCategoryValue) return "Select category";
    const parts = selectedCategoryValue.split(":");
    const catId = Number(parts[0]);
    const subId = parts[1] ? Number(parts[1]) : null;

    const cat = categoryGroups.find((g) => g.category_id === catId);
    if (!cat) return "Select category";
    if (subId) {
      const sub = cat.subcategories.find((s) => s.subcategory_id === subId);
      return sub ? sub.subcategory_name : cat.category_name;
    }
    return cat.category_name;
  };
  const getStatusName = (statusId?: string) => {
    if (!statusId) return "";

    const status = availableStatusOptions.find(
      (option) => String(option.status_id) === String(statusId),
    );

    return status?.status_name || String(statusId);
  };
  const getPriorityName = (priorityId?: string) => {
    if (!priorityId) return "";

    const priority = priorityMasterOptions.find(
      (option) => String(option.priority_id) === String(priorityId),
    );

    if (priority?.priority_name) return priority.priority_name;

    const fallbackPriority = [
      { id: 1, label: "Low" },
      { id: 2, label: "Medium" },
      { id: 3, label: "High" },
      { id: 4, label: "Critical" },
    ].find((option) => String(option.id) === String(priorityId));

    return fallbackPriority?.label || String(priorityId);
  };
  const getHistoryValueLabel = (field: string, value?: string) => {
    if (!value) return "";

    switch (normalizeHistoryField(field)) {
      case "status":
      case "statusid":
        return getStatusName(value);
      case "priority":
      case "priorityid":
        return getPriorityName(value);
      case "category":
      case "categoryid":
        return getCategoryName(value);
      case "subcategory":
      case "subcategoryid":
        return getSubCategoryName(value);
      case "assignedto":
      case "assignedtousercode":
      case "assignee":
      case "takeover":
      case "allocations":
      case "allocatedto":
      case "allocatedtousercode":
        return getUserDisplayName(value);
      default:
        return String(value);
    }
  };
  const getHistoryMessage = (item: any) => {
    const field = item.field_changed || "Ticket";
    const fieldKey = normalizeHistoryField(field);
    const fieldNameMap: Record<string, string> = {
      status: "status",
      statusid: "status",
      priority: "priority",
      priorityid: "priority",
      category: "category",
      categoryid: "category",
      subcategory: "subcategory",
      subcategoryid: "subcategory",
      assignedto: "assignee",
      assignedtousercode: "assignee",
      assignee: "assignee",
      takeover: "assignee",
      allocations: "allocated users",
      allocatedto: "allocated users",
      allocatedtousercode: "allocated users",
    };
    const fieldName =
      fieldNameMap[fieldKey] || String(field).replace(/_/g, " ").toLowerCase();
    const oldValue = getHistoryValueLabel(field, item.old_value);
    const newValue = getHistoryValueLabel(field, item.new_value);

    if (oldValue && newValue) {
      return `The ${fieldName} has been changed: ${oldValue} -> ${newValue}`;
    }

    if (newValue) {
      return `The ${fieldName} has been changed: ${newValue}`;
    }

    return `The ${fieldName} has been updated`;
  };
  const feedItems = [
    ...comments.map((comment) => ({
      ...comment,
      feedType: "comment",
      feedDate: comment.created_at,
      feedKey: `comment-${comment.comment_id}`,
    })),
    ...history.map((item) => ({
      ...item,
      feedType: "history",
      feedDate: item.changed_at,
      feedKey: `history-${item.history_id}`,
    })),
  ].sort(
    (a, b) =>
      new Date(a.feedDate || 0).getTime() - new Date(b.feedDate || 0).getTime(),
  );

  const apiOrigin = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");
  const getAttachmentUrl = (attachment: any) =>
    attachment.url?.startsWith("http")
      ? attachment.url
      : `${apiOrigin}${attachment.url}`;
  const isImageAttachment = (attachment: any) => {
    if (String(attachment.mime_type || "").startsWith("image/")) return true;
    return /\.(avif|bmp|gif|jpe?g|png|webp)$/i.test(attachment.file_name || "");
  };
  const ticketImageAttachments = [
    ...(Array.isArray(ticket.attachments)
      ? ticket.attachments.filter(isImageAttachment).map((attachment: any) => ({
        ...attachment,
        gallery_key: `ticket-${attachment.attachment_id}`,
      }))
      : []),
    ...comments.flatMap((comment) =>
      Array.isArray(comment.attachments)
        ? comment.attachments.filter(isImageAttachment).map((attachment: any) => ({
          ...attachment,
          gallery_key: `comment-${attachment.attachment_id}`,
        }))
        : [],
    ),
  ];
  const openAttachmentPreview = (galleryKey: string) => {
    const images = ticketImageAttachments;
    setPreviewAttachments(images);
    setPreviewIndex(
      Math.max(
        0,
        images.findIndex((image) => image.gallery_key === galleryKey),
      ),
    );
  };

  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  };

  const renderFileIcon = (file: any) => {
    if (isImageAttachment(file)) {
      return (
        <Box
          component="img"
          src={getAttachmentUrl(file)}
          alt={file.file_name}
          onClick={() => openAttachmentPreview(file.gallery_key || `ticket-${file.attachment_id}`)}
          sx={{
            width: 64,
            height: 40,
            objectFit: "cover",
            borderRadius: "4px",
            cursor: "pointer",
            border: "1px solid #eef2f6",
          }}
        />
      );
    }

    const ext = getFileExtension(file.file_name || "");
    let bgColor = "#f5f5f5";
    let textColor = "#757575";
    let letter = "F";

    if (["xlsx", "xls", "csv"].includes(ext)) {
      bgColor = "#E2F0D9";
      textColor = "#385723";
      letter = "X";
    } else if (["pptx", "ppt"].includes(ext)) {
      bgColor = "#FCE4D6";
      textColor = "#C65911";
      letter = "P";
    } else if (["docx", "doc"].includes(ext)) {
      bgColor = "#D9E1F2";
      textColor = "#1F4E79";
      letter = "W";
    } else if (["pdf"].includes(ext)) {
      bgColor = "#FCE4D6";
      textColor = "#C00000";
      letter = "PDF";
    } else if (["txt"].includes(ext)) {
      bgColor = "#EDEDED";
      textColor = "#595959";
      letter = "T";
    }

    return (
      <Box
        sx={{
          width: 64,
          height: 40,
          backgroundColor: bgColor,
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: letter.length > 1 ? 10 : 14,
          color: textColor,
          border: "1px solid #eef2f6",
        }}
      >
        {letter}
      </Box>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatUploadDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).replace(",", "");
  };

const allFiles = [
  ...(ticket?.attachments || []).map((att: any) => ({
    ...att,
    type: "ticket",
    sourceId: ticket.ticket_id,
    uploadedBy:
      ticket.raised_by_name ||
      ticket.raised_by_user_code ||
      "Unknown",
    gallery_key: `ticket-${att.attachment_id}`,
  })),

  ...comments.flatMap((comment: any) =>
    (comment.attachments || []).map((att: any) => ({
      ...att,
      type: "comment",
      sourceId: comment.comment_id,
      uploadedBy:
        comment.commented_by_name ||
        comment.commented_by_user_code ||
        "Unknown",
      gallery_key: `comment-${att.attachment_id}`,
    }))
  ),
].sort((a, b) => {
  const timeA = new Date(a.uploaded_at || 0).getTime();
  const timeB = new Date(b.uploaded_at || 0).getTime();
  return fileSortOrder === "asc" ? timeA - timeB : timeB - timeA;
});
  const handleDownloadAllFiles = () => {
    allFiles.forEach((file) => {
      const link = document.createElement("a");
      link.href = getAttachmentUrl(file);
      link.setAttribute("download", file.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDeleteAttachment = async (type: string, id: number) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await deleteAttachment(type, id);
      setToast({
        open: true,
        message: "Attachment deleted successfully",
        severity: "success",
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        message: "Failed to delete attachment",
        severity: "error",
      });
    }
  };
  
const scrollToAttachment = (file: any) => {
  if (file.type === "ticket") {
    // ticket-description is outside the scrollable conversation box — use scrollIntoView on page
    const target = document.getElementById("ticket-description");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      target.animate(
        [{ backgroundColor: "#fff59d" }, { backgroundColor: "transparent" }],
        { duration: 2000 }
      );
    }, 400);
  } else {
    // comments live inside the scrollable conversation box
    const target = document.getElementById(`comment-${file.sourceId}`);
    const scrollBox = document.getElementById("conversation-scroll-box");
    if (!target || !scrollBox) return;

    // getBoundingClientRect gives position relative to viewport;
    // we compute offset relative to the scroll container
    const boxRect = scrollBox.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - boxRect.top + scrollBox.scrollTop - 16;

    scrollBox.scrollTo({ top: offset, behavior: "smooth" });
    setTimeout(() => {
      target.animate(
        [{ backgroundColor: "#fff59d" }, { backgroundColor: "transparent" }],
        { duration: 2000 }
      );
    }, 400);
  }
};
  const categoryDisplay = ticket.subcategory_name
    ? `${ticket.category_name} / ${ticket.subcategory_name}`
    : ticket.category_name || "Uncategorized";
  const priorityOptions =
    priorityMasterOptions.length > 0
      ? priorityMasterOptions.map((priority) => ({
        id: priority.priority_id,
        label: priority.priority_name,
      }))
      : [
        { id: 1, label: "Low" },
        { id: 2, label: "Medium" },
        { id: 3, label: "High" },
        { id: 4, label: "Critical" },
      ];
  const inlineEditControlSx = {
    flex: 1,
    minWidth: 0,
    height: 34,
    fontSize: 14,
    backgroundColor: "#fff",
    "& .MuiSelect-select": {
      py: 0.75,
      pr: "28px !important",
    },
  };
  const inlineSaveButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "6px",
    color: "#fff",
    backgroundColor: "#4f46d8",
    "&:hover": { backgroundColor: "#4338ca" },
    "&.Mui-disabled": {
      color: "rgba(255,255,255,0.65)",
      backgroundColor: "rgba(79,70,216,0.45)",
    },
  };
  const inlineCancelButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "6px",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
  };
  const inlineMenuProps = {
    slotProps: {
      paper: {
        sx: {
          maxHeight: 360,
          minWidth: 230,
        },
      },
    },
  };
  const canSubmitReply =
    (getReplyPlainText().length > 0 || replyHtml.includes("<img") || replyAttachments.length > 0) &&
    !submittingComment;

  return (
    <Box id="conversation-container" sx={{ display: "flex", flexDirection: "column", gap: 3, p: 1 }}>
      <Grid container spacing={3}>
        {/* Left main content column */}
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {/* Action Row */}

          {/* Ticket Body Card */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "var(--shadow)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text)",
              p: 3.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<ReplyIcon />}
                  onClick={handleOpenReplyComposer}
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                >
                  Reply
                </Button>

                {isTakeoverAllowed() && (
                  <Button
                    variant="outlined"
                    startIcon={<TakeoverIcon />}
                    onClick={handleTakeover}
                    disabled={updatingMetadata}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      color: "var(--text)",
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg-card)",
                      "&:hover": {
                        borderColor: "#211b5a",
                        backgroundColor: "rgba(30, 58, 138, 0.05)",
                      },
                    }}
                  >
                    Takeover
                  </Button>
                )}

                {!isClosed && (
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon sx={{ color: "var(--text)" }} />}
                    onClick={handleCloseTicket}
                    disabled={updatingMetadata}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      color: "var(--text)",
                      borderColor: "var(--border)",
                      padding: "5px 16px",
                      "& .MuiButton-startIcon": {
                        marginRight: "4px",
                      },
                      "&:hover": {
                        borderRadius: "6px",
                        borderColor: "var(--border)",
                        opacity: 0.85,
                      },
                    }}
                  >
                    Close ticket
                  </Button>
                )}

                {isClosed && (ticket.raised_by_user_code === loggedInUserCode || ticket.assigned_to_user_code === loggedInUserCode || isAdminOrDev) && (
                  <Button
                    variant="outlined"
                    onClick={handleReopenTicket}
                    disabled={updatingMetadata}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      color: "var(--text)",
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg-card)",
                      "&:hover": {
                        borderColor: "#28A745",
                        backgroundColor: "rgba(40, 167, 69, 0.05)",
                      },
                    }}
                  >
                    Reopen ticket
                  </Button>
                )}
              </Box>

              {/* More menu on right side of actions row */}
              <Box>
                <Button
                  variant="outlined"
                  onClick={(e) => setMoreAnchor(e.currentTarget)}
                  startIcon={<MoreIcon />}
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-card)",
                    "&:hover": {
                      borderColor: "#211b5a",
                      backgroundColor: "rgba(30, 58, 138, 0.05)",
                    },
                  }}
                >
                  More
                </Button>
                <Menu
                  anchorEl={moreAnchor}
                  open={Boolean(moreAnchor)}
                  onClose={() => setMoreAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      setMoreAnchor(null);
                      setToast({
                        open: true,
                        message: "Ticket marked as unread",
                        severity: "success",
                      });
                    }}
                  >
                    Mark unread
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMoreAnchor(null);
                      setToast({
                        open: true,
                        message: "Subscribers list updated",
                        severity: "success",
                      });
                    }}
                  >
                    Manage Subscribers
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setMoreAnchor(null);
                      try {
                        await toggleTicketPin(ticket.ticket_id, !ticket.is_pinned);
                        setToast({
                          open: true,
                          message: ticket.is_pinned ? "Ticket unpinned" : "Ticket pinned",
                          severity: "success",
                        });
                        await fetchData();
                      } catch (err) {
                        console.error(err);
                        setToast({
                          open: true,
                          message: "Failed to toggle ticket pin",
                          severity: "error",
                        });
                      }
                    }}
                  >
                    {ticket.is_pinned ? "Unpin Ticket" : "Pin Ticket"}
                  </MenuItem>
                  {isAdminOrDev && (
                    <MenuItem
                      onClick={() => {
                        setMoreAnchor(null);
                        setToast({
                          open: true,
                          message: "Ticket deleted",
                          severity: "success",
                        });
                        navigate("/tickets");
                      }}
                      sx={{ color: "#DC3545" }}
                    >
                      Delete Ticket
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {ticket.is_pinned && (
                <PushPin sx={{ fontSize: 24, color: "#635BFF", transform: "rotate(45deg)" }} />
              )}
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "var(--text-h)", fontSize: "28px" }}
              >
                {ticket.subject}
              </Typography>
            </Box>

            <Box
  id="ticket-description"
  sx={{
    color: "var(--text)",
                lineHeight: 1.6,
                fontSize: "15px",
                mb: 2,

                "& img": {
                  maxWidth: "100%",
                  borderRadius: "8px",
                },

                "& p": {
                  margin: "8px 0",
                },

                "& ul": {
                  paddingLeft: "20px",
                },

                "& ol": {
                  paddingLeft: "20px",
                },

                "& pre": {
                  overflowX: "auto",
                },
              }}
              dangerouslySetInnerHTML={{
                __html: ticket.description || "No description provided.",
              }}
            />

            {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mb: 2 }}>
                {ticket.attachments.map((attachment: any) =>
                  isImageAttachment(attachment) ? (
                    <Box
                      component="button"
                      type="button"
                      key={attachment.attachment_id}
                      onClick={() =>
                        openAttachmentPreview(`ticket-${attachment.attachment_id}`)
                      }
                      sx={{
                        width: 132,
                        p: 0,
                        border: 0,
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <Box
                        component="img"
                        src={getAttachmentUrl(attachment)}
                        alt={attachment.file_name}
                        sx={{
                          display: "block",
                          width: 132,
                          height: 92,
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid #d9dde5",
                          backgroundColor: "#f5f6f8",
                        }}
                      />
                      <Typography
                        title={attachment.file_name}
                        sx={{
                          mt: 0.5,
                          fontSize: 12.5,
                          color: "#646b7b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {attachment.file_name}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      component="a"
                      key={attachment.attachment_id}
                      href={getAttachmentUrl(attachment)}
                      download={attachment.file_name}
                      sx={{
                        width: 220,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        color: "inherit",
                        textDecoration: "none",
                        border: "1px solid #d9dde5",
                        borderRadius: "6px",
                      }}
                    >
                      <FileIcon sx={{ color: "#596174" }} />
                      <Typography noWrap sx={{ minWidth: 0, flex: 1, fontSize: 12.5 }}>
                        {attachment.file_name}
                      </Typography>
                      <DownloadIcon sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                )}
              </Box>
            )}

            {/* Only allow reply if the user is the assignee, creator, or admin */}
            {canManageTicketMetadata() && !isClosed && (
              !replyComposerOpen ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mt: 2.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      bgcolor: "#e5e7eb",
                      color: "#211b5a",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {replyInitials || "U"}
                  </Avatar>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={handleOpenReplyComposer}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenReplyComposer();
                      }
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flex: 1,
                      minHeight: 56,
                      border: "1px solid var(--border)",
                      borderRadius: "7px",
                      backgroundColor: "#fff",
                      px: 1.5,
                      cursor: "text",
                      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                      "&:hover, &:focus": {
                        borderColor: "#8da2d6",
                        boxShadow: "0 0 0 3px rgba(33, 27, 90, 0.08)",
                      },
                    }}
                  >
                    <Typography sx={{ color: "#9aa0ad", fontSize: 15 }}>
                      Reply...
                    </Typography>
                    {subscriberNames.length > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#9aa0ad",
                          whiteSpace: "nowrap",
                          ml: 1.5,
                          display: { xs: "none", lg: "block" },
                        }}
                      >
                        subscribers: {subscriberNames.join(", ")}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2.5,
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 5px rgba(15, 23, 42, 0.08)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid var(--border)",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography sx={{ color: "var(--text-secondary)", fontSize: 14 }}>
                      To:
                    </Typography>
                    {subscriberNames.length > 0 ? (
                      subscriberNames.map((name) => (
                        <Chip
                          key={name}
                          size="small"
                          icon={<CheckIcon sx={{ fontSize: "15px !important" }} />}
                          label={name}
                          sx={{
                            borderRadius: "6px",
                            backgroundColor: "#eef2ff",
                            color: "#5f6475",
                            "& .MuiChip-icon": {
                              color: "#15803d",
                            },
                          }}
                        />
                      ))
                    ) : (
                      <Chip
                        size="small"
                        icon={<CheckIcon sx={{ fontSize: "15px !important" }} />}
                        label={ticket.raised_by_name ?? ticket.raised_by_user_code ?? "Requester"}
                        sx={{
                          borderRadius: "6px",
                          backgroundColor: "#eef2ff",
                          color: "#5f6475",
                          "& .MuiChip-icon": {
                            color: "#15803d",
                          },
                        }}
                      />
                    )}
                    <Button
                      variant="text"
                      size="small"
                      sx={{
                        textTransform: "none",
                        minWidth: "auto",
                        px: 0.5,
                        color: "#3524c7",
                      }}
                    >
                      add...
                    </Button>
                    <IconButton
                      size="small"
                      onClick={resetReplyComposer}
                      sx={{
                        ml: "auto",
                        color: "#a3a7b2",
                        "&:hover": {
                          color: "#5f6475",
                          backgroundColor: "transparent",
                        },
                      }}
                    >
                      <CancelIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>

                  <RichTextEditor
                    value={replyHtml}
                    onChange={setReplyHtml}
                    attachments={replyAttachments}
                    onAttachmentsChange={setReplyAttachments}
                    autoFocus
                    minHeight={145}
                    sx={{
                      mb: 0,
                      "& > .MuiBox-root:first-of-type": {
                        borderRadius: 0,
                        borderLeft: "none",
                        borderRight: "none",
                        backgroundColor: "#f7f8fb",
                      },
                      "& > .MuiBox-root:nth-of-type(2)": {
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: "1px solid var(--border)",
                        borderRadius: 0,
                      },
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={() => handlePostComment()}
                        disabled={!canSubmitReply}
                        sx={{
                          minWidth: 110,
                          borderRadius: "6px",
                          textTransform: "none",
                          fontWeight: 700,
                          color: "#fff",
                          backgroundColor: "#211b5a",
                          "&:hover": { backgroundColor: "#211b5a", color: "#fff" },
                        }}
                      >
                        {submittingComment ? (
                          <CircularProgress size={18} sx={{ color: "#fff" }} />
                        ) : (
                          "Reply"
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handlePostComment({ resolveTicket: true })}
                        disabled={!canSubmitReply || updatingMetadata}
                        sx={{
                          borderRadius: "6px",
                          textTransform: "none",
                          fontWeight: 700,
                          color: "#5f6475",
                          borderColor: "var(--border)",
                        }}
                      >
                        Reply & resolve
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Switch
                        checked={techniciansOnly}
                        onChange={(event) => setTechniciansOnly(event.target.checked)}
                      />
                      <Typography sx={{ color: "#3f4453", fontSize: 15 }}>
                        For technicians only
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
          </Card>

          {/* Comment and update feed */}
          {feedItems.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "var(--shadow)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: 2.25,
                  py: 1.6,
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "var(--bg-header)",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: "var(--text-h)", fontWeight: 700 }}
                >
                  Conversation
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--text-secondary)", fontSize: 12.5 }}
                >
                  {feedItems.length} updates
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  height: { xs: 420, md: 520 },
                  overflowY: "auto",
                  px: { xs: 1.5, sm: 2 },
                  py: 2,
                  backgroundColor: "rgba(239, 246, 255, 0.72)",
                  scrollBehavior: "smooth",
                  "&::-webkit-scrollbar": {
                    width: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "rgba(226, 232, 240, 0.7)",
                    borderRadius: 999,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(33, 27, 90, 0.28)",
                    borderRadius: 999,
                  },
                }}
                id="conversation-scroll-box"
                ref={(node: HTMLDivElement | null) => {
                  conversationEndRef.current = node;
                }}
              >
                <Box
                  sx={{
                    alignSelf: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    maxWidth: 680,
                    px: 2,
                    py: 1.2,
                    borderRadius: "7px",
                    border: "1px solid rgba(245, 158, 11, 0.22)",
                    backgroundColor: "#fff2cf",
                    color: "#6b5a3c",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
                    textAlign: "center",
                  }}
                >
                  <LockIcon sx={{ fontSize: 17, color: "#6b5a3c", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 14, lineHeight: 1.45 }}>
                    Messages and ticket updates are visible only to people in this
                    ticket.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    alignSelf: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    maxWidth: 560,
                    px: 1.8,
                    py: 0.9,
                    borderRadius: "7px",
                    backgroundColor: "rgba(33, 27, 90, 0.08)",
                    color: "var(--text-secondary)",
                    textAlign: "center",
                  }}
                >
                  <AccessTimeIcon
                    sx={{
                      fontSize: 16,
                      color: "var(--text-secondary)",
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: 13.5, lineHeight: 1.4 }}>
                    Older updates may be archived according to ticket retention
                    settings.
                  </Typography>
                </Box>
                {feedItems.map((item: any) => {
                  const author = getFeedAuthor(item);
                  const isOwnComment =
                    item.feedType === "comment" &&
                    item.commented_by_user_code &&
                    item.commented_by_user_code === loggedInUser.user_code;

                  if (item.feedType === "history") {
                    return (
                      <Box
  id={`comment-${item.comment_id}`}
  key={item.feedKey}
  sx={{
                          alignSelf: "center",
                          maxWidth: 640,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.65,
                          px: 2,
                          py: 1.15,
                          borderRadius: "7px",
                          backgroundColor: "rgba(255, 255, 255, 0.76)",
                          border: "1px solid var(--border)",
                          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                          textAlign: "center",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            gap: 0.85,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: "#8b90a2", fontSize: 13 }}
                          >
                            {formatFeedTime(item.feedDate)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "#3524c7", fontWeight: 700, fontSize: 13.5 }}
                          >
                            {author}
                          </Typography>
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.2,
                              borderRadius: 999,
                              backgroundColor: "#e8edff",
                              color: "#0b45d9",
                              fontSize: 12.5,
                              fontWeight: 700,
                              lineHeight: 1.3,
                            }}
                          >
                            For technicians only
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ color: "#5f6475", fontSize: 14.5, lineHeight: 1.45 }}
                        >
                          {getHistoryMessage(item)}
                        </Typography>
                      </Box>
                    );
                  }

                  return (
  <Box
    id={`comment-${item.comment_id}`}
    key={item.feedKey}
    sx={{
      display: "flex",
      justifyContent: isOwnComment ? "flex-end" : "flex-start",
                        alignItems: "flex-end",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      {!isOwnComment && (
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#d7efe2",
                            color: "#184236",
                            fontSize: 13,
                            fontWeight: 700,
                            flexShrink: 0,
                            mb: 0.4,
                          }}
                        >
                          {getInitials(author)}
                        </Avatar>
                      )}
                      <Box
                        sx={{
                          position: "relative",
                          maxWidth: { xs: "82%", sm: "72%" },
                          minWidth: 190,
                          p: 1.45,
                          borderRadius: isOwnComment
                            ? "7px 7px 2px 7px"
                            : "7px 7px 7px 2px",
                          border: isOwnComment
                            ? "1px solid rgba(33, 27, 90, 0.16)"
                            : "1px solid #cfe8d8",
                          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
                          backgroundColor: isOwnComment ? "#e8edff" : "#fff",
                          color: "var(--text)",
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 1.2,
                              mb: 0.7,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  color: isOwnComment ? "#211b5a" : "#00843d",
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >
                                {isOwnComment ? "You" : author}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#686f80", fontSize: 12.5 }}
                              >
                                {formatFeedTime(item.feedDate)}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "6px",
                                color: "#1f2540",
                                backgroundColor: isOwnComment
                                  ? "rgba(255,255,255,0.45)"
                                  : "#f5f5f6",
                                "&:hover": { backgroundColor: "#eceef2" },
                              }}
                            >
                              <MoreIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                          <Box
                            sx={{
                              color: "var(--text)",
                              fontSize: 15.5,
                              lineHeight: 1.55,
                              overflowWrap: "anywhere",
                              "& img": {
                                maxWidth: "100%",
                                borderRadius: "8px",
                              },
                              "& p": {
                                margin: "4px 0",
                              },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: item.comment_text,
                            }}
                          />
                          {Array.isArray(item.attachments) &&
                            item.attachments.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1.25,
                                  mt: 1.25,
                                }}
                              >
                                {item.attachments.map((attachment: any) =>
                                  isImageAttachment(attachment) ? (
                                    <Box
                                      component="button"
                                      type="button"
                                      key={attachment.attachment_id}
                                      onClick={() =>
                                        openAttachmentPreview(
                                          `comment-${attachment.attachment_id}`,
                                        )
                                      }
                                      sx={{
                                        width: 132,
                                        p: 0,
                                        border: 0,
                                        background: "transparent",
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={getAttachmentUrl(attachment)}
                                        alt={attachment.file_name}
                                        sx={{
                                          display: "block",
                                          width: 132,
                                          height: 92,
                                          objectFit: "cover",
                                          borderRadius: "6px",
                                          border: "1px solid #d9dde5",
                                          backgroundColor: "#f5f6f8",
                                        }}
                                      />
                                      <Typography
                                        title={attachment.file_name}
                                        sx={{
                                          mt: 0.5,
                                          fontSize: 12.5,
                                          color: "#646b7b",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {attachment.file_name}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box
                                      component="a"
                                      key={attachment.attachment_id}
                                      href={getAttachmentUrl(attachment)}
                                      download={attachment.file_name}
                                      sx={{
                                        width: 220,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        p: 1,
                                        color: "inherit",
                                        textDecoration: "none",
                                        border: "1px solid #d9dde5",
                                        borderRadius: "6px",
                                        backgroundColor: "#fff",
                                      }}
                                    >
                                      <FileIcon sx={{ color: "#596174" }} />
                                      <Typography
                                        title={attachment.file_name}
                                        sx={{
                                          minWidth: 0,
                                          flex: 1,
                                          fontSize: 12.5,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {attachment.file_name}
                                      </Typography>
                                      <DownloadIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                  ),
                                )}
                              </Box>
                            )}
                        </Box>
                      </Box>
                      {isOwnComment && (
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#dce5ff",
                            color: "#211b5a",
                            fontSize: 13,
                            fontWeight: 700,
                            flexShrink: 0,
                            mb: 0.4,
                          }}
                        >
                          {getInitials(author)}
                        </Avatar>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Card>
          )}
        </Grid>

        {/* Right sidebar column */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {/* Metadata Card */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "var(--shadow)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text)",
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Header info */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "var(--text-h)" }}
              >
                #{ticket.ticket_no}
              </Typography>
              {editingStatus ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    flex: 1,
                    maxWidth: 330,
                    ml: 2,
                    minWidth: 0,
                  }}
                >
                  <Select
                    size="small"
                    value={selectedStatusValue}
                    onChange={handleStatusSelectChange}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) return ticket.status_name || "Select status";

                      return (
                        availableStatusOptions.find(
                          (status) => String(status.status_id) === value,
                        )?.status_name ||
                        ticket.status_name ||
                        "Select status"
                      );
                    }}
                    disabled={updatingMetadata}
                    sx={inlineEditControlSx}
                    MenuProps={inlineMenuProps}
                  >
                    <MenuItem value="" disabled>
                      Select status
                    </MenuItem>
                    {loadingStatuses && statusOptions.length === 0 && (
                      <MenuItem value="" disabled>
                        Loading statuses...
                      </MenuItem>
                    )}
                    {availableStatusOptions.map((status) => (
                      <MenuItem
                        key={status.status_id}
                        value={String(status.status_id)}
                      >
                        {status.status_name}
                      </MenuItem>
                    ))}
                  </Select>
                  <IconButton
                    size="small"
                    onClick={handleStatusSave}
                    disabled={!selectedStatusValue || updatingMetadata}
                    sx={inlineSaveButtonSx}
                  >
                    <CheckIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleStatusEditCancel}
                    disabled={updatingMetadata}
                    sx={inlineCancelButtonSx}
                  >
                    <CancelIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: canEditRightCard ? "pointer" : "default",
                  }}
                  onClick={handleStatusEditStart}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        statusColors[ticket.status_name] || "#ccc",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "var(--text-h)" }}
                  >
                    {ticket.status_name}
                  </Typography>
                  {canEditRightCard && (
                    <MoreIcon
                      sx={{
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        ml: 0.5,
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>

            <Divider sx={{ borderColor: "var(--border)" }} />

            {/* Sidebar properties fields in table layout structure */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>

              {/* Priority */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Priority:
                </Typography>
                {editingPriority ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Select
                      size="small"
                      value={selectedPriorityValue}
                      onChange={handlePrioritySelectChange}
                      displayEmpty
                      disabled={updatingMetadata}
                      sx={inlineEditControlSx}
                      MenuProps={inlineMenuProps}
                    >
                      <MenuItem value="" disabled>
                        Select priority
                      </MenuItem>
                      {priorityOptions.map((priority) => (
                        <MenuItem key={priority.id} value={String(priority.id)}>
                          {priority.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton
                      size="small"
                      onClick={handlePrioritySave}
                      disabled={!selectedPriorityValue || updatingMetadata}
                      sx={inlineSaveButtonSx}
                    >
                      <CheckIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handlePriorityEditCancel}
                      disabled={updatingMetadata}
                      sx={inlineCancelButtonSx}
                    >
                      <CancelIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: 1,
                        cursor: canEditRightCard ? "pointer" : "default",
                      }}
                      onClick={handlePriorityEditStart}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor:
                            priorityColors[ticket.priority_name] || "#ccc",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "var(--text-h)" }}
                      >
                        {ticket.priority_name}
                      </Typography>
                    </Box>
                    {canEditRightCard && (
                      <IconButton
                        size="small"
                        onClick={handlePriorityEditStart}
                        sx={{ color: "var(--text-secondary)", p: 0.5 }}
                      >
                        <MoreIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>

              {/* Category */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Category:
                </Typography>
                {editingCategory ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      onClick={(e) => {
                        if (!loadingCategories && !updatingMetadata) {
                          setCategoryAnchorEl(e.currentTarget);
                        }
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        height: 34,
                        fontSize: 14,
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1.5,
                        cursor: "pointer",
                        color: selectedCategoryValue ? "var(--text)" : "var(--text-sub)",
                        "&:hover": {
                          borderColor: "var(--accent)",
                        },
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
                          : getSelectedCategoryLabel()}
                      </Typography>
                      <KeyboardArrowDown sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
                    </Box>

                    <Popover
                      open={Boolean(categoryAnchorEl)}
                      anchorEl={categoryAnchorEl}
                      onClose={() => setCategoryAnchorEl(null)}
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
                            width: categoryAnchorEl ? categoryAnchorEl.clientWidth : 250,
                            maxHeight: 280,
                            overflowY: "auto",
                            mt: 0.5,
                            border: "1px solid var(--border)",
                            boxShadow: "var(--shadow)",
                            backgroundColor: "var(--bg-card)",
                            backgroundImage: "none",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "8px",
                            "&::-webkit-scrollbar": {
                              width: "14px",
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor: "var(--bg-row-alt)",
                              borderLeft: "1px solid var(--border)",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "var(--border)",
                              borderRadius: "0px",
                              border: "3px solid var(--bg-row-alt)",
                              "&:hover": {
                                backgroundColor: "var(--text-secondary)",
                              },
                            },
                          },
                        },
                      }}
                    >
                      <Box sx={{ py: 0.5 }}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            color: "var(--text-secondary)",
                            fontSize: 13,
                            borderBottom: "1px solid var(--border)",
                            mb: 0.5,
                            userSelect: "none",
                          }}
                        >
                          Select category
                        </Box>
                        {categoryGroups.map((category) => {
                          const hasSub = category.subcategories && category.subcategories.length > 0;
                          return (
                            <Box key={category.category_id}>
                              <Box
                                onClick={() => {
                                  if (!hasSub) {
                                    setSelectedCategoryValue(`${category.category_id}:`);
                                    setCategoryAnchorEl(null);
                                  }
                                }}
                                sx={{
                                  px: 2,
                                  py: 0.85,
                                  fontWeight: 600,
                                  fontSize: 13.5,
                                  color: hasSub ? "var(--text-secondary)" : "var(--text-h)",
                                  cursor: hasSub ? "default" : "pointer",
                                  userSelect: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  "&:hover": {
                                    backgroundColor: hasSub ? "transparent" : "var(--bg-row-hover)",
                                  },
                                }}
                              >
                                {category.category_name}
                              </Box>

                              {category.subcategories &&
                                category.subcategories.map((sub) => {
                                  const isSelected =
                                    selectedCategoryValue === `${category.category_id}:${sub.subcategory_id}`;
                                  return (
                                    <Box
                                      key={sub.subcategory_id}
                                      onClick={() => {
                                        setSelectedCategoryValue(`${category.category_id}:${sub.subcategory_id}`);
                                        setCategoryAnchorEl(null);
                                      }}
                                      sx={{
                                        pl: 3.5,
                                        pr: 2,
                                        py: 0.75,
                                        fontSize: 13.5,
                                        color: isSelected ? "#635BFF" : "var(--text)",
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: "pointer",
                                        userSelect: "none",
                                        backgroundColor: isSelected ? "rgba(99, 91, 255, 0.08)" : "transparent",
                                        "&:hover": {
                                          backgroundColor: "var(--bg-row-hover)",
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

                    <IconButton
                      size="small"
                      onClick={handleCategorySave}
                      disabled={!selectedCategoryValue || updatingMetadata}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "6px",
                        color: "#fff",
                        backgroundColor: "#9a8ffa",
                        "&:hover": { backgroundColor: "#8275f5" },
                        "&.Mui-disabled": {
                          color: "rgba(255,255,255,0.65)",
                          backgroundColor: "rgba(154,143,250,0.45)",
                        },
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCategoryEditCancel}
                      disabled={updatingMetadata}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#fff",
                        color: "#4b5563",
                        "&:hover": { backgroundColor: "#f9fafb" },
                      }}
                    >
                      <CancelIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      onClick={handleCategoryEditStart}
                      sx={{
                        fontWeight: 600,
                        color: "var(--text-h)",
                        flex: 1,
                        cursor: canEditRightCard ? "pointer" : "default",
                      }}
                    >
                      {categoryDisplay}
                    </Typography>
                    {canEditRightCard && (
                      <IconButton
                        size="small"
                        onClick={handleCategoryEditStart}
                        sx={{ color: "var(--text-secondary)", p: 0.5 }}
                      >
                        <MoreIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>

              {/* Raised By */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  From:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#211b5a", flex: 1 }}
                >
                  {ticket.raised_by_name ?? ticket.raised_by_user_code}
                </Typography>
              </Box>

              {/* Via */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Via:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}
                >
                  WebApp
                </Typography>
              </Box>

              {/* Assigned to */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: editingAssignee ? "flex-start" : "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Assigned to:
                </Typography>
                {editingAssignee ? (
                  <Box sx={{ flex: 1, minWidth: 0, position: "relative" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <TextField
                        size="small"
                        autoFocus
                        placeholder="Search users..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        disabled={updatingMetadata}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 16, color: "var(--text-secondary)" }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                        sx={{
                          flex: 1,
                          "& .MuiInputBase-root": { height: 34, fontSize: 13 },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleAssigneeSave}
                        disabled={updatingMetadata || selectedAssigneeValue.length === 0}
                        sx={inlineSaveButtonSx}
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleAssigneeEditCancel}
                        disabled={updatingMetadata}
                        sx={inlineCancelButtonSx}
                      >
                        <CancelIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    {/* Selected user chip */}
                    {selectedAssigneeValue[0] && (() => {
                      const sel = users.find(u => u.user_code === selectedAssigneeValue[0]);
                      const selName = sel ? `${sel.first_name} ${sel.last_name}`.trim() : selectedAssigneeValue[0];
                      return (
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            avatar={<Avatar sx={{ bgcolor: "#4f46d8", color: "#fff", fontSize: 11 }}>{(selName[0] || "U").toUpperCase()}</Avatar>}
                            label={selName}
                            onDelete={() => setSelectedAssigneeValue([])}
                            sx={{ fontSize: 12, height: 26 }}
                          />
                        </Box>
                      );
                    })()}
                    {/* User list dropdown */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 40,
                        mt: 0.5,
                        backgroundColor: "#fff",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        maxHeight: 220,
                        overflowY: "auto",
                        zIndex: 1300,
                      }}
                    >
                      {/* Unassigned option */}
                      <Box
                        onClick={() => { setSelectedAssigneeValue([]); }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          cursor: "pointer",
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          fontStyle: "italic",
                          "&:hover": { backgroundColor: "#f5f5ff" },
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        Unassigned
                      </Box>
                      {(() => {
                        // Only show users who are in the saved allocated list
                        const allocatedCodes = (ticket.allocated_to_user_code || "")
                          .split("|").map((c: string) => c.trim()).filter(Boolean);
                        const eligibleUsers = users.filter(u => allocatedCodes.includes(u.user_code));
                        const filteredUsers = eligibleUsers.filter(u => {
                          if (!assigneeSearch.trim()) return true;
                          const q = assigneeSearch.toLowerCase();
                          return (
                            (u.first_name || "").toLowerCase().includes(q) ||
                            (u.last_name || "").toLowerCase().includes(q) ||
                            (u.user_code || "").toLowerCase().includes(q)
                          );
                        });
                        if (filteredUsers.length === 0) {
                          return (
                            <Box sx={{ px: 1.5, py: 1.5, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
                              {assigneeSearch.trim() ? "No matching users" : "No allocated users — allocate users first"}
                            </Box>
                          );
                        }
                        return filteredUsers.map((u) => {
                          const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.user_code;
                          const initials = name.split(/\s+/).slice(0, 2).map((p: string) => p[0]?.toUpperCase() || "").join("");
                          const isSelected = selectedAssigneeValue[0] === u.user_code;
                          return (
                            <Box
                              key={u.user_code}
                              onClick={() => setSelectedAssigneeValue(isSelected ? [] : [u.user_code])}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                cursor: "pointer",
                                backgroundColor: isSelected ? "#f0f0ff" : "transparent",
                                "&:hover": { backgroundColor: isSelected ? "#e8e8ff" : "#f8f8f8" },
                                borderBottom: "1px solid #f5f5f5",
                              }}
                            >
                              <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: isSelected ? "#4f46d8" : "#e2e8f0", color: isSelected ? "#fff" : "#555" }}>
                                {initials}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "var(--text-h)", lineHeight: 1.2 }}>{name}</Typography>
                                <Typography sx={{ fontSize: 11, color: "var(--text-secondary)" }}>{u.user_code}</Typography>
                              </Box>
                              {isSelected && <CheckIcon sx={{ fontSize: 14, color: "#4f46d8", ml: "auto" }} />}
                            </Box>
                          );
                        });
                      })()}
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      onClick={() => {
                        const allocatedCodes = (ticket.allocated_to_user_code || "")
                          .split("|").map((c: string) => c.trim()).filter(Boolean);
                        if (!canEditRightCard || allocatedCodes.length === 0) return;
                        handleAssigneeEditStart();
                      }}
                      sx={{
                        fontWeight: 600,
                        color: "var(--text-h)",
                        flex: 1,
                        cursor: canEditRightCard && (ticket.allocated_to_user_code || "").trim() ? "pointer" : "default",
                      }}
                    >
                      {ticket.assigned_to_name || "Unassigned"}
                    </Typography>
                    {canEditRightCard && (() => {
                      const allocatedCodes = (ticket.allocated_to_user_code || "")
                        .split("|").map((c: string) => c.trim()).filter(Boolean);
                      const hasAllocated = allocatedCodes.length > 0;
                      return (
                        <Tooltip title={hasAllocated ? "" : "Allocate users first before assigning"} arrow>
                          <span>
                            <IconButton
                              size="small"
                              onClick={handleAssigneeEditStart}
                              disabled={!hasAllocated}
                              sx={{
                                color: "var(--text-secondary)",
                                p: 0.5,
                                "&.Mui-disabled": { opacity: 0.35 },
                              }}
                            >
                              <MoreIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </>
                )}
              </Box>

              {/* Date */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Date:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}
                >
                  {ticket.update_timestamp
                    ? new Date(ticket.update_timestamp).toLocaleString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                    : ""}
                </Typography>
              </Box>

              {/* Due Date */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Due:
                </Typography>
                {editingDue ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <TextField
                      type="datetime-local"
                      size="small"
                      value={selectedDueDate}
                      onChange={(e) => setSelectedDueDate(e.target.value)}
                      disabled={updatingMetadata}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        "& .MuiInputBase-root": {
                          height: 34,
                          fontSize: 14,
                          backgroundColor: "var(--bg-card)",
                        },
                      }}
                      slotProps={{
                        inputLabel: { shrink: true },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleDueSave}
                      disabled={updatingMetadata}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "6px",
                        color: "#fff",
                        backgroundColor: "#9a8ffa",
                        "&:hover": { backgroundColor: "#8275f5" },
                        "&.Mui-disabled": {
                          color: "rgba(255,255,255,0.65)",
                          backgroundColor: "rgba(154,143,250,0.45)",
                        },
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleDueEditCancel}
                      disabled={updatingMetadata}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#fff",
                        color: "#4b5563",
                        "&:hover": { backgroundColor: "#f9fafb" },
                      }}
                    >
                      <CancelIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      onClick={handleDueEditStart}
                      sx={{
                        fontWeight: 600,
                        color: "var(--text-h)",
                        flex: 1,
                        cursor: canEditRightCard ? "pointer" : "default",
                      }}
                    >
                      {ticket.due_date
                        ? new Date(ticket.due_date).toLocaleString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}
                    </Typography>
                    {canEditRightCard && (
                      <IconButton
                        size="small"
                        onClick={handleDueEditStart}
                        sx={{ color: "var(--text-secondary)", p: 0.5 }}
                      >
                        <MoreIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>

              {/* Time spent — live timer */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Time spent:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flex: 1,
                  }}
                >
                  {timerRunning && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4caf50",
                        animation: "pulse 1.5s ease-in-out infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 1 },
                          "50%": { opacity: 0.4 },
                        },
                      }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    onClick={() => navigate(`/tickets/${ticketId}/time-spent`)}
                    sx={{
                      fontWeight: 600,
                      color: timerRunning ? "#211b5a" : "var(--text-secondary)",
                      fontSize: 13,
                      cursor: "pointer",
                      "&:hover": {

                        color: "#211b5a",
                      },
                    }}
                  >
                    {formatTime(totalTimeSeconds + timerSeconds)}
                  </Typography>
                  <Tooltip title={timerRunning ? "Pause tracking" : "Start tracking"}>
                    <IconButton
                      size="small"
                      disabled={togglingTimer}
                      onClick={handleToggleTimer}
                      sx={{
                        p: 0,
                        color: timerRunning ? "#f44336" : "#4caf50",
                        ml: 0.5,
                        "&:hover": {
                          color: timerRunning ? "#d32f2f" : "#388e3c",
                        },
                      }}
                    >
                      {timerRunning ? (
                        <PauseIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <PlayIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </Tooltip>

                </Box>
              </Box>

              {/* Start Date */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Start date:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}
                >
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                    : ""}
                </Typography>
              </Box>

              {/* Close Date */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Close Date:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}
                >
                  {ticket.resolution_date
                    ? new Date(ticket.resolution_date).toLocaleString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                    : ""}
                </Typography>
              </Box>

              {/* Recurring */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Recurring:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}
                >
                  This ticket is not recurring
                </Typography>
              </Box>

              {/* Freeform Tags - Styled Inline */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  minHeight: 40,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    width: 110,
                    flexShrink: 0,
                  }}
                >
                  Tags:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 0.75,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {freeformTags.map((tag) => (
                    <Box
                      key={tag.id}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1.2,
                        py: 0.25,
                        borderRadius: "16px",
                        border: "1px solid rgba(99,91,255,0.25)",
                        backgroundColor: "rgba(99,91,255,0.06)",
                        color: "#635bff",
                        fontSize: "13px",
                        fontWeight: 500,
                        userSelect: "none",
                      }}
                    >
                      {tag.tag_message}
                      {!isClosed && (
                        <Box
                          component="span"
                          onClick={() => handleDeleteFreeformTag(tag.id)}
                          sx={{
                            cursor: "pointer",
                            ml: 0.3,
                            opacity: 0.6,
                            lineHeight: 1,
                            fontSize: 14,
                            "&:hover": { opacity: 1 },
                          }}
                        >
                          ×
                        </Box>
                      )}
                    </Box>
                  ))}
                  {!isClosed && (
                    <Box
                      component="input"
                      placeholder="type a tag..."
                      value={tagInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFreeformTag();
                        }
                      }}
                      sx={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 13,
                        color: "var(--text)",
                        py: 0.5,
                        flex: 1,
                        minWidth: 100,
                        "&::placeholder": { color: "var(--text-secondary)", opacity: 0.7 },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Card>

          {/* FILES Card */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "var(--shadow)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text)",
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-sub)",
                }}
              >
                FILES
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Download all files">
                  <IconButton
                    size="small"
                    onClick={handleDownloadAllFiles}
                    disabled={allFiles.length === 0}
                    sx={{ color: "var(--text-secondary)" }}
                  >
                    <CloudDownloadIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Sort by upload date: ${fileSortOrder === "asc" ? "Ascending" : "Descending"}`}>
                  <IconButton
                    size="small"
                    onClick={() => setFileSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                    sx={{ color: "var(--text-secondary)" }}
                  >
                    <SortIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* List */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 1,
              }}
            >
              {allFiles.length === 0 ? (
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                  No files uploaded.
                </Typography>
              ) : (
                allFiles.map((file) => {
                  const fileSizeStr = file.file_size
                    ? ` ${formatFileSize(Number(file.file_size))}`
                    : "";
                  return (
                    <Box
                      key={file.gallery_key}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 1,
                        "&:not(:last-child)": {
                          borderBottom: "1px solid var(--border)",
                          pb: 2,
                        },
                      }}
                    >
                      {/* Left thumbnail/icon */}
                      {renderFileIcon(file)}

                      {/* File Details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          component="span"
                          onClick={() => scrollToAttachment(file)}
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "var(--primary-link, #211b5a)",
                            cursor: "pointer",
                            textDecoration: "none",
                            wordBreak: "break-all",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {file.file_name}
                        </Typography>
                        <Typography
    variant="body2"
    sx={{
      fontWeight: 600,
      color: "#211b5a",
      fontSize: 13,
      mb: 0.25,
    }}
  >
    Uploaded by {file.uploadedBy}
  </Typography>

  <Typography
    variant="caption"
    sx={{
      color: "var(--text-secondary)",
      display: "block",
    }}
  >
    {`${formatUploadDate(file.uploaded_at)}${fileSizeStr}`}
  </Typography>
                      </Box>
                      <Tooltip title="View in conversation">
                        <IconButton
                          size="small"
                          onClick={() => scrollToAttachment(file)}
                          sx={{
                            color: "var(--text-secondary)",
                            "&:hover": {
                              color: "#211b5a",
                            },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      {/* Download icon */}
                      <Tooltip title="Download file">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = getAttachmentUrl(file);
                            link.setAttribute("download", file.file_name);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          sx={{
                            color: "var(--text-secondary)",
                            "&:hover": {
                              color: "var(--primary-link, #211b5a)",
                            },
                          }}
                        >
                          <DownloadIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>                     
                    </Box>
                  );
                })
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        fullScreen
        open={previewAttachments.length > 0}
        onClose={() => setPreviewAttachments([])}
        onKeyDown={(event) => {
          if (previewAttachments.length < 2) return;
          if (event.key === "ArrowLeft") {
            setPreviewIndex(
              (previewIndex - 1 + previewAttachments.length) %
              previewAttachments.length,
            );
          }
          if (event.key === "ArrowRight") {
            setPreviewIndex((previewIndex + 1) % previewAttachments.length);
          }
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "rgba(20, 23, 30, 0.9)",
              backgroundImage: "none",
            },
          },
        }}
      >
        {previewAttachments[previewIndex] && (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 2, sm: 6 },
            }}
          >
            <Tooltip title="Close preview">
              <IconButton
                onClick={() => setPreviewAttachments([])}
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  zIndex: 3,
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.28)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
                }}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
            <>
              <IconButton
                aria-label="Previous attachment"
                disabled={previewAttachments.length < 2}
                onClick={() =>
                  setPreviewIndex((currentIndex) =>
                    (currentIndex - 1 + previewAttachments.length) %
                    previewAttachments.length,
                  )
                }
                sx={{
                  position: "fixed",
                  top: "50%",
                  left: { xs: 8, sm: 24 },
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.28)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.3)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                  },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 38 }} />
              </IconButton>
              <IconButton
                aria-label="Next attachment"
                disabled={previewAttachments.length < 2}
                onClick={() =>
                  setPreviewIndex((currentIndex) =>
                    (currentIndex + 1) % previewAttachments.length,
                  )
                }
                sx={{
                  position: "fixed",
                  top: "50%",
                  right: { xs: 8, sm: 24 },
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.28)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.3)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                  },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 38 }} />
              </IconButton>
            </>
            <Box
              component="img"
              src={getAttachmentUrl(previewAttachments[previewIndex])}
              alt={previewAttachments[previewIndex].file_name}
              sx={{
                maxWidth: "calc(100vw - 110px)",
                maxHeight: "calc(100vh - 110px)",
                objectFit: "contain",
                boxShadow: "0 12px 42px rgba(0,0,0,0.4)",
              }}
            />
            <Typography
              sx={{
                position: "absolute",
                bottom: 18,
                left: 20,
                right: 20,
                color: "#fff",
                textAlign: "center",
                fontSize: 14,
              }}
            >
              {previewAttachments[previewIndex].file_name}
            </Typography>
          </Box>
        )}
      </Dialog>

      {/* Toast Feedback */}
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

export default TicketDetailPage;