import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";
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
  ListSubheader,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Reply as ReplyIcon,
  Input as TakeoverIcon,
  CheckCircleOutlined as CloseIcon,
  MoreHoriz as MoreIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from "@mui/icons-material";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  updateTicketCategory,
  assignTicket,
  getComments,
  createComment,
} from "../services/ticketService";
import { getUsers } from "../services/userService";
import {
  getCategories,
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

const fallbackStatusOptions: TicketStatusOption[] = [
  { status_id: 1, status_name: "New", status_color: "#2196F3" },
  { status_id: 2, status_name: "In Progress", status_color: "#FD7E14" },
  { status_id: 3, status_name: "Closed", status_color: "#28A745" },
];

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ticketId = Number(id);

  // States
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [statusOptions, setStatusOptions] = useState<TicketStatusOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [selectedStatusValue, setSelectedStatusValue] = useState("");
  const [editingPriority, setEditingPriority] = useState(false);
  const [selectedPriorityValue, setSelectedPriorityValue] = useState("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [selectedCategoryValue, setSelectedCategoryValue] = useState("");
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [selectedAssigneeValue, setSelectedAssigneeValue] = useState("");
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyHtml, setReplyHtml] = useState("");
  // More actions menu anchor
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);

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
  const canManageTicketMetadata = (ticketToCheck = ticket) =>
    isAdminOrDev ||
    ticketToCheck?.assigned_to_user_code === loggedInUserCode ||
    ticketToCheck?.raised_by_user_code === loggedInUserCode;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ticketData = await getTicketById(ticketId);
      setTicket(ticketData);

      try {
        const commentsData = await getComments(ticketId);
        setComments(commentsData || []);
      } catch (commentsError) {
        console.warn("Unable to load ticket comments:", commentsError);
        setComments([]);
      }

      if (canManageTicketMetadata(ticketData)) {
        const usersData = await getUsers();
        setUsers(usersData);
        await loadCategoryGroups();
        await loadStatuses();
      }
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message:
          error.response?.data?.message || "Failed to load ticket details",
        severity: "error",
      });
      // Redirect back if unauthorized or not found
      if (error.response?.status === 403 || error.response?.status === 404) {
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

  const handlePostComment = async () => {
    const plainText = replyHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

    if (!plainText) return;

    try {
      setSubmittingComment(true);

      await createComment(ticketId, replyHtml);

      await fetchData();

      setReplyHtml("");
      setShowReplyEditor(false);

      setToast({
        open: true,
        message: "Reply added successfully",
        severity: "success",
      });
    } catch (error: any) {
      console.error(error);

      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to add reply",
        severity: "error",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplyAndResolve = async () => {
    const plainText = replyHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

    if (!plainText) return;

    try {
      setSubmittingComment(true);

      await createComment(ticketId, replyHtml);

      await updateTicketStatus(ticketId, 4);

      await fetchData();

      setReplyHtml("");
      setShowReplyEditor(false);

      setToast({
        open: true,
        message: "Reply added and ticket resolved",
        severity: "success",
      });
    } catch (error: any) {
      console.error(error);

      setToast({
        open: true,
        message: error.response?.data?.message || "Operation failed",
        severity: "error",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      setUpdatingMetadata(true);
      await updateTicketStatus(ticketId, 5); // 5 is 'Closed'
      setToast({
        open: true,
        message: "Ticket closed successfully",
        severity: "success",
      });
      // Refresh local ticket data
      const updated = await getTicketById(ticketId);
      setTicket(updated);
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

  const handleTakeover = async () => {
    try {
      setUpdatingMetadata(true);
      await assignTicket(ticketId, loggedInUser.user_code);
      setToast({
        open: true,
        message: "Ticket assigned to you",
        severity: "success",
      });
      // Refresh local data
      const updated = await getTicketById(ticketId);
      setTicket(updated);
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

  const handlePriorityChange = async (priorityId: number) => {
    try {
      setUpdatingMetadata(true);
      await updateTicketPriority(ticketId, priorityId);
      setToast({
        open: true,
        message: "Priority updated successfully",
        severity: "success",
      });
      const updated = await getTicketById(ticketId);
      setTicket(updated);
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
      ticket.category_id && ticket.subcategory_id
        ? `${ticket.category_id}:${ticket.subcategory_id}`
        : "",
    );
    setEditingCategory(true);
    await loadCategoryGroups();
  };

  const handleCategoryEditCancel = () => {
    setEditingCategory(false);
    setSelectedCategoryValue("");
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategoryValue(event.target.value);
  };

  const handleCategorySave = async () => {
    if (!selectedCategoryValue) return;

    const [categoryId, subCategoryId] = selectedCategoryValue
      .split(":")
      .map(Number);

    try {
      setUpdatingMetadata(true);
      await updateTicketCategory(ticketId, categoryId, subCategoryId);
      setToast({
        open: true,
        message: "Category updated successfully",
        severity: "success",
      });
      const updated = await getTicketById(ticketId);
      setTicket(updated);
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

  const handleStatusChange = async (statusId: number) => {
    try {
      setUpdatingMetadata(true);
      await updateTicketStatus(ticketId, statusId);
      setToast({
        open: true,
        message: "Status updated successfully",
        severity: "success",
      });
      const updated = await getTicketById(ticketId);
      setTicket(updated);
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
      const updated = await getTicketById(ticketId);
      setTicket(updated);
      setEditingAssignee(false);
      setSelectedAssigneeValue("");
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
    setSelectedAssigneeValue(ticket.assigned_to_user_code || "");
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
    setSelectedAssigneeValue("");
  };

  const handleAssigneeSelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedAssigneeValue(event.target.value);
  };

  const handleAssigneeSave = async () => {
    if (!selectedAssigneeValue) return;
    await handleAssigneeChange(selectedAssigneeValue);
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
  const categoryDisplay = ticket.subcategory_name
    ? `${ticket.category_name} / ${ticket.subcategory_name}`
    : ticket.category_name || "Uncategorized";
  const priorityOptions = [
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 1 }}>
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
                  onClick={() => {
                    setShowReplyEditor((prev) => !prev);
                  }}
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

                {isAdminOrDev &&
                  ticket.assigned_to_user_code !== loggedInUser.user_code && (
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
                    startIcon={<CloseIcon />}
                    onClick={handleCloseTicket}
                    disabled={updatingMetadata}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      color: "var(--text)",
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg-card)",
                      "&:hover": {
                        borderColor: "#DC3545",
                        backgroundColor: "rgba(220, 53, 69, 0.05)",
                      },
                    }}
                  >
                    Close ticket
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
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "var(--text-h)", fontSize: "28px" }}
            >
              {ticket.subject}
            </Typography>

            <Box
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
            <Divider sx={{ my: 1, borderColor: "var(--border)" }} />
            {showReplyEditor && (
              <Card
                sx={{
                  mt: 2,
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Reply to:{" "}
                    {ticket.raised_by_name ?? ticket.raised_by_user_code}
                  </Typography>

                  <RichTextEditor value={replyHtml} onChange={setReplyHtml} />

                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handlePostComment}
                      disabled={submittingComment}
                    >
                      Reply
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleReplyAndResolve}
                      disabled={submittingComment}
                    >
                      Reply & Resolve
                    </Button>

                    <Button
                      disabled={submittingComment}
                      onClick={() => {
                        setShowReplyEditor(false);
                        setReplyHtml("");
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Card>
            )}
            <Card
              sx={{
                p: 2,
                border: "1px solid var(--border)",
                borderRadius: 2,
                cursor: "pointer",
                backgroundColor: "var(--bg-card)",
              }}
              onClick={() => setShowReplyEditor(true)}
            >
              <Typography
                sx={{
                  color: "var(--text-secondary)",
                }}
              >
                Reply...
              </Typography>
            </Card>
          </Card>

          {/* Comment/Replies History list */}
          {comments.length > 0 && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "var(--text-h)" }}
              >
                Replies History
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", pl: 1 }}>
                {comments.map((comment: any, idx: number) => {
                  return (
                    <Box
                      key={comment.comment_id}
                      sx={{ display: "flex", gap: 2.5, position: "relative" }}
                    >
                      {/* Timeline connecting track */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: 24,
                          position: "relative",
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            border: "2px solid var(--text-secondary)",
                            backgroundColor: "var(--bg-card)",
                            zIndex: 1,
                            mt: 0.8,
                          }}
                        />
                        {idx !== comments.length - 1 && (
                          <Box
                            sx={{
                              width: "2px",
                              backgroundColor: "var(--border)",
                              position: "absolute",
                              top: 14,
                              bottom: -20,
                              left: "11px",
                            }}
                          />
                        )}
                      </Box>

                      {/* Timeline right side comment header & body */}
                      <Box sx={{ flex: 1, pb: 4.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--text-secondary)",
                                fontWeight: 500,
                              }}
                            >
                              {new Date(comment.created_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "numeric",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: "#211b5a" }}
                            >
                              {comment.commented_by_name ??
                                comment.commented_by_user_code}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{ color: "var(--text-secondary)", p: 0.5 }}
                          >
                            <InfoIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <Box
                          sx={{
                            color: "var(--text)",
                            lineHeight: 1.55,

                            "& img": {
                              maxWidth: "100%",
                              borderRadius: "8px",
                            },

                            "& p": {
                              margin: "6px 0",
                            },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: comment.comment_text,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
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
                    <Select
                      size="small"
                      value={selectedCategoryValue}
                      onChange={handleCategoryChange}
                      displayEmpty
                      disabled={loadingCategories || updatingMetadata}
                      sx={inlineEditControlSx}
                      MenuProps={inlineMenuProps}
                    >
                      <MenuItem value="" disabled>
                        {loadingCategories
                          ? "Loading categories..."
                          : "Select category"}
                      </MenuItem>
                      {categoryGroups.flatMap((category) => [
                        <ListSubheader key={`category-${category.category_id}`}>
                          {category.category_name}
                        </ListSubheader>,
                        ...category.subcategories.map((subcategory) => (
                          <MenuItem
                            key={`${category.category_id}:${subcategory.subcategory_id}`}
                            value={`${category.category_id}:${subcategory.subcategory_id}`}
                            sx={{ pl: 3 }}
                          >
                            {subcategory.subcategory_name}
                          </MenuItem>
                        )),
                      ])}
                    </Select>
                    <IconButton
                      size="small"
                      onClick={handleCategorySave}
                      disabled={!selectedCategoryValue || updatingMetadata}
                      sx={inlineSaveButtonSx}
                    >
                      <CheckIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCategoryEditCancel}
                      disabled={updatingMetadata}
                      sx={inlineCancelButtonSx}
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
                  Assigned to:
                </Typography>
                {editingAssignee ? (
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
                      value={selectedAssigneeValue}
                      onChange={handleAssigneeSelectChange}
                      displayEmpty
                      disabled={updatingMetadata}
                      sx={inlineEditControlSx}
                      MenuProps={inlineMenuProps}
                    >
                      <MenuItem value="" disabled>
                        Select assignee
                      </MenuItem>
                      {users.map((u) => (
                        <MenuItem key={u.user_code} value={u.user_code}>
                          {u.first_name} {u.last_name} ({u.user_code})
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton
                      size="small"
                      onClick={handleAssigneeSave}
                      disabled={!selectedAssigneeValue || updatingMetadata}
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
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      onClick={handleAssigneeEditStart}
                      sx={{
                        fontWeight: 600,
                        color: "var(--text-h)",
                        flex: 1,
                        cursor: canEditRightCard ? "pointer" : "default",
                      }}
                    >
                      {ticket.assigned_to_user_code || "Unassigned"}
                    </Typography>
                    {canEditRightCard && (
                      <IconButton
                        size="small"
                        onClick={handleAssigneeEditStart}
                        sx={{ color: "var(--text-secondary)", p: 0.5 }}
                      >
                        <MoreIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
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
                  {new Date(ticket.update_timestamp).toLocaleDateString()}
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
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}
                >
                  {ticket.due_date
                    ? new Date(ticket.due_date).toLocaleDateString()
                    : ""}
                </Typography>
              </Box>

              {/* Time spent */}
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
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#211b5a" }}
                  >
                    00:00:03
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{ p: 0, color: "var(--text-secondary)" }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 15 }} />
                  </IconButton>
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
                />
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
                />
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

              {/* Tags */}
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    flex: 1,
                  }}
                >
                  type a tag...
                </Typography>
              </Box>

              {/* Assets */}
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
                  Assets:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    flex: 1,
                  }}
                >
                  type an asset...
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

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
