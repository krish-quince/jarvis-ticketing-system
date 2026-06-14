import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Avatar,
  TextField,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Reply as ReplyIcon,
  Input as TakeoverIcon,
  CheckCircleOutlined as CloseIcon,
  Send as SendIcon,
  MoreHoriz as MoreIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  getComments,
  createComment,
} from "../services/ticketService";
import { getUsers } from "../services/userService";

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ticketId = Number(id);

  // States
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);

  // Dropdown Menu Anchors
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<null | HTMLElement>(null);
  const [assigneeAnchor, setAssigneeAnchor] = useState<null | HTMLElement>(null);
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

  const userInitials = `${loggedInUser.first_name?.[0] || ""}${loggedInUser.last_name?.[0] || ""}`.toUpperCase() || "KB";
  const isAdminOrDev = loggedInUser.role_id === 1 || loggedInUser.role_id === 3;

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

      if (isAdminOrDev) {
        const usersData = await getUsers();
        setUsers(usersData);
      }
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to load ticket details",
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

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const comment = await createComment(ticketId, newComment);
      
      // Update list
      setComments((prev) => [...prev, comment]);
      setNewComment("");
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
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update priority",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
      setPriorityAnchor(null);
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
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update status",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
      setStatusAnchor(null);
    }
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
    } catch (error: any) {
      console.error(error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to update assignee",
        severity: "error",
      });
    } finally {
      setUpdatingMetadata(false);
      setAssigneeAnchor(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress size={50} sx={{ color: "#3A3482" }} />
      </Box>
    );
  }

  if (!ticket) return null;

  // Status mapping
  const statusColors: Record<string, string> = {
    Open: "#DC3545",       // red dot like "New" in screenshot
    "In Progress": "#FFC107", // yellow dot
    Testing: "#6F42C1",       // purple
    Resolved: "#28A745",      // green
    Closed: "#6C757D",        // grey
  };

  const priorityColors: Record<string, string> = {
    Critical: "#DC3545",
    High: "#FD7E14",
    Medium: "#FFC107",
    Low: "#28A745",
  };

  const isClosed = ticket.status_name === "Closed";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 1 }}>
      <Grid container spacing={3}>
        {/* Left main content column */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Action Row */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<ReplyIcon />}
                onClick={() => {
                  document.getElementById("reply-textarea")?.focus();
                }}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "var(--text)",
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-card)",
                  "&:hover": { borderColor: "#3A3482", backgroundColor: "rgba(58, 52, 130, 0.05)" },
                }}
              >
                Reply
              </Button>

              {isAdminOrDev && ticket.assigned_to_user_code !== loggedInUser.user_code && (
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
                    "&:hover": { borderColor: "#3A3482", backgroundColor: "rgba(58, 52, 130, 0.05)" },
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
                    "&:hover": { borderColor: "#DC3545", backgroundColor: "rgba(220, 53, 69, 0.05)" },
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
                  "&:hover": { borderColor: "#3A3482", backgroundColor: "rgba(58, 52, 130, 0.05)" },
                }}
              >
                More
              </Button>
              <Menu
                anchorEl={moreAnchor}
                open={Boolean(moreAnchor)}
                onClose={() => setMoreAnchor(null)}
              >
                <MenuItem onClick={() => { setMoreAnchor(null); setToast({ open: true, message: "Ticket marked as unread", severity: "success" }); }}>Mark unread</MenuItem>
                <MenuItem onClick={() => { setMoreAnchor(null); setToast({ open: true, message: "Subscribers list updated", severity: "success" }); }}>Manage Subscribers</MenuItem>
                {isAdminOrDev && (
                  <MenuItem onClick={() => { setMoreAnchor(null); setToast({ open: true, message: "Ticket deleted", severity: "success" }); navigate("/tickets"); }} sx={{ color: "#DC3545" }}>Delete Ticket</MenuItem>
                )}
              </Menu>
            </Box>
          </Box>

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
            <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--text-h)", fontSize: "28px" }}>
              {ticket.subject}
            </Typography>

            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "var(--text)", lineHeight: 1.6, fontSize: "15px", mb: 2 }}>
              {ticket.description || "No description provided."}
            </Typography>

            <Divider sx={{ my: 1, borderColor: "var(--border)" }} />

            {/* Quick Reply Box with inner footer */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mt: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: "14px",
                  fontWeight: 700,
                  backgroundColor: "#F4C63D",
                  color: "#211B5A",
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.01)" }}>
                <TextField
                  id="reply-textarea"
                  placeholder="Reply..."
                  multiline
                  rows={3}
                  fullWidth
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      padding: "12px",
                      color: "var(--text)",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1, borderTop: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                  <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                    (subscribers: {ticket.raised_by_user_code})
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {newComment.trim() && (
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                        Press Submit to send
                      </Typography>
                    )}
                    <IconButton
                      onClick={handlePostComment}
                      disabled={submittingComment || !newComment.trim()}
                      sx={{
                        color: "#3A3482",
                        "&:hover": { color: "#2D2675" },
                        p: 0.5,
                        "&.Mui-disabled": { color: "var(--text-secondary)", opacity: 0.5 }
                      }}
                    >
                      <SendIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>


          {/* Comment/Replies History list */}
          {comments.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-h)" }}>
                Replies History
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", pl: 1 }}>
                {comments.map((comment: any, idx: number) => {
                  return (
                    <Box key={comment.comment_id} sx={{ display: "flex", gap: 2.5, position: "relative" }}>
                      {/* Timeline connecting track */}
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, position: "relative" }}>
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
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                              {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#3A3482" }}>
                              {comment.commented_by_user_code}
                            </Typography>
                          </Box>
                          <IconButton size="small" sx={{ color: "var(--text-secondary)", p: 0.5 }}>
                            <InfoIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "var(--text)", lineHeight: 1.55 }}>
                          {comment.comment_text}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Grid>

        {/* Right sidebar column */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-h)" }}>
                #{ticket.ticket_no}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, cursor: isAdminOrDev ? "pointer" : "default" }}
                onClick={(e) => isAdminOrDev && setStatusAnchor(e.currentTarget)}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: statusColors[ticket.status_name] || "#ccc",
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-h)" }}>
                  {ticket.status_name}
                </Typography>
                {isAdminOrDev && <MoreIcon sx={{ fontSize: 14, color: "var(--text-secondary)", ml: 0.5 }} />}
              </Box>
            </Box>

            <Divider sx={{ borderColor: "var(--border)" }} />

            {/* Sidebar properties fields in table layout structure */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              
              {/* Priority */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Priority:
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, cursor: isAdminOrDev ? "pointer" : "default" }}
                  onClick={(e) => isAdminOrDev && setPriorityAnchor(e.currentTarget)}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: priorityColors[ticket.priority_name] || "#ccc" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)" }}>
                    {ticket.priority_name}
                  </Typography>
                </Box>
                {isAdminOrDev && (
                  <IconButton size="small" onClick={(e) => setPriorityAnchor(e.currentTarget)} sx={{ color: "var(--text-secondary)", p: 0.5 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Category */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Category:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}>
                  {ticket.category_name}
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Raised By */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  From:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#3A3482", flex: 1 }}>
                  {ticket.raised_by_user_code}
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Via */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Via:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}>
                  WebApp
                </Typography>
              </Box>

              {/* Assigned to */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Assigned to:
                </Typography>
                <Typography
                  variant="body2"
                  onClick={(e) => isAdminOrDev && setAssigneeAnchor(e.currentTarget)}
                  sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1, cursor: isAdminOrDev ? "pointer" : "default" }}
                >
                  {ticket.assigned_to_user_code || "Unassigned"}
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" onClick={(e) => setAssigneeAnchor(e.currentTarget)} sx={{ color: "var(--text-secondary)", p: 0.5 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Date */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Date:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}>
                  {new Date(ticket.update_timestamp).toLocaleDateString()}
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Due Date */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Due:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}>
                  {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : ""}
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Time spent */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Time spent:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#3A3482" }}>
                    00:00:03
                  </Typography>
                  <IconButton size="small" sx={{ p: 0, color: "var(--text-secondary)" }}>
                    <AccessTimeIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Start Date */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Start date:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }} />
              </Box>

              {/* Close Date */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Close Date:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }} />
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Recurring */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Recurring:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-h)", flex: 1 }}>
                  This ticket is not recurring
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Tags */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Tags:
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: "italic", flex: 1 }}>
                  type a tag...
                </Typography>
              </Box>

              {/* Assets */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, minHeight: 40 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>
                  Assets:
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: "italic", flex: 1 }}>
                  type an asset...
                </Typography>
                {isAdminOrDev && (
                  <IconButton size="small" disabled sx={{ color: "var(--text-secondary)", p: 0.5, opacity: 0.3 }}>
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Card>

        </Grid>
      </Grid>

      {/* Interactive Dropdown Menus */}
      {/* Status Menu */}
      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
      >
        <MenuItem onClick={() => handleStatusChange(1)}>Open</MenuItem>
        <MenuItem onClick={() => handleStatusChange(2)}>In Progress</MenuItem>
        <MenuItem onClick={() => handleStatusChange(3)}>Testing</MenuItem>
        <MenuItem onClick={() => handleStatusChange(4)}>Resolved</MenuItem>
        <MenuItem onClick={() => handleStatusChange(5)}>Closed</MenuItem>
      </Menu>

      {/* Priority Menu */}
      <Menu
        anchorEl={priorityAnchor}
        open={Boolean(priorityAnchor)}
        onClose={() => setPriorityAnchor(null)}
      >
        <MenuItem onClick={() => handlePriorityChange(1)}>Low</MenuItem>
        <MenuItem onClick={() => handlePriorityChange(2)}>Medium</MenuItem>
        <MenuItem onClick={() => handlePriorityChange(3)}>High</MenuItem>
        <MenuItem onClick={() => handlePriorityChange(4)}>Critical</MenuItem>
      </Menu>

      {/* Assignee Menu */}
      <Menu
        anchorEl={assigneeAnchor}
        open={Boolean(assigneeAnchor)}
        onClose={() => setAssigneeAnchor(null)}
      >
        <MenuItem onClick={() => handleAssigneeChange("")}>
          <em>Unassigned</em>
        </MenuItem>
        {users.map((u) => (
          <MenuItem key={u.user_code} onClick={() => handleAssigneeChange(u.user_code)}>
            {u.first_name} {u.last_name} ({u.user_code})
          </MenuItem>
        ))}
      </Menu>

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
          sx={{ width: "100%", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketDetailPage;
