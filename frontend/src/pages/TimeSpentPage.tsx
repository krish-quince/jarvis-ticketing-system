import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import { getTimeEntries } from "../services/timeTrackingService";
import { getTicketById } from "../services/ticketService";

// Status color mapping
const statusColors: Record<string, { bg: string; text: string }> = {
  New: { bg: "#e3f2fd", text: "#1565c0" },
  "In progress": { bg: "#fff3e0", text: "#e65100" },
  "In Progress": { bg: "#fff3e0", text: "#e65100" },
  Closed: { bg: "#e8f5e9", text: "#2e7d32" },
  Resolved: { bg: "#e8f5e9", text: "#2e7d32" },
  "On Hold": { bg: "#fce4ec", text: "#c62828" },
  Pending: { bg: "#f3e5f5", text: "#7b1fa2" },
};

const getStatusColor = (status: string) =>
  statusColors[status] || { bg: "#f5f5f5", text: "#616161" };

/**
 * Format seconds into a human-readable string like "2h 21m 26s"
 */
const formatTimeDelta = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
};

/**
 * Format a date string for display
 */
const formatDate = (dateStr: string): string => {
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
  });
};

type TimeEntry = {
  entry_id: number;
  ticket_id: number;
  user_code: string;
  status_name: string;
  time_spent_seconds: number;
  started_at: string;
  ended_at: string | null;
  email: string;
  first_name: string;
  last_name: string;
};

const TimeSpentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error" as "success" | "error",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ticketData, entriesData] = await Promise.all([
          getTicketById(ticketId),
          getTimeEntries(ticketId),
        ]);
        setTicket(ticketData);
        setEntries(entriesData || []);
      } catch (error: any) {
        console.error("Failed to load time entries:", error);
        setToast({
          open: true,
          message:
            error.response?.data?.message || "Failed to load time entries",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticketId]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link
          underline="hover"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => navigate("/tickets")}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate(`/tickets/${ticket?.ticket_no || ticketId}`)}
        >
          Ticket {ticket?.ticket_no ? `#${ticket.ticket_no}` : ""}
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          Time spent
        </Typography>
      </Breadcrumbs>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: "1px solid var(--border, #e0e0e0)",
            backgroundColor: "var(--bg-card, #fff)",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "var(--bg-surface, #fafafa)",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "var(--text-secondary, #666)",
                      fontSize: 13,
                      py: 1.5,
                      borderBottom: "2px solid var(--border, #e0e0e0)",
                    }}
                  >
                    User
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "var(--text-secondary, #666)",
                      fontSize: 13,
                      py: 1.5,
                      borderBottom: "2px solid var(--border, #e0e0e0)",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "var(--text-secondary, #666)",
                      fontSize: 13,
                      py: 1.5,
                      borderBottom: "2px solid var(--border, #e0e0e0)",
                    }}
                  >
                    Time spent (delta)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "var(--text-secondary, #666)",
                      fontSize: 13,
                      py: 1.5,
                      borderBottom: "2px solid var(--border, #e0e0e0)",
                    }}
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 6, color: "var(--text-secondary, #888)" }}
                    >
                      <Typography variant="body2">
                        No time entries recorded yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const statusStyle = getStatusColor(
                      entry.status_name || "New"
                    );
                    return (
                      <TableRow
                        key={entry.entry_id}
                        sx={{
                          "&:hover": {
                            backgroundColor:
                              "var(--bg-hover, rgba(0,0,0,0.02))",
                          },
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        {/* User */}
                        <TableCell
                          sx={{
                            py: 2,
                            borderBottom:
                              "1px solid var(--border, #eee)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#1a73e8",
                              fontWeight: 500,
                            }}
                          >
                            {entry.email || `${entry.first_name || ""} ${entry.last_name || ""}`.trim() || entry.user_code}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell
                          sx={{
                            py: 2,
                            borderBottom:
                              "1px solid var(--border, #eee)",
                          }}
                        >
                          <Chip
                            label={entry.status_name || "Unknown"}
                            size="small"
                            sx={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text,
                              fontWeight: 600,
                              fontSize: 12,
                              height: 24,
                              borderRadius: 1,
                            }}
                          />
                        </TableCell>

                        {/* Time spent (delta) */}
                        <TableCell
                          sx={{
                            py: 2,
                            borderBottom:
                              "1px solid var(--border, #eee)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#1a73e8",
                              fontWeight: 500,
                            }}
                          >
                            {formatTimeDelta(entry.time_spent_seconds)}
                          </Typography>
                        </TableCell>

                        {/* Date */}
                        <TableCell
                          sx={{
                            py: 2,
                            borderBottom:
                              "1px solid var(--border, #eee)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: "var(--text, #333)" }}
                          >
                            {formatDate(entry.started_at)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer note */}
          {entries.length > 0 && (
            <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid var(--border, #eee)" }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#e65100",
                  fontStyle: "italic",
                  fontSize: 11,
                }}
              >
                Negative values mean someone edited the time manually
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Toast */}
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

export default TimeSpentPage;
