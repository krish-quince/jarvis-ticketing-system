import {
  Box,
  Grid,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";
import StatCard from "../components/StatCard";
import { getDashboardSummary } from "../services/dashboardService";
import { getTickets } from "../services/ticketService";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, ticketsData] = await Promise.all([
        getDashboardSummary(),
        getTickets()
      ]);
      setStats(statsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "high":
        return { bg: "#FFEDD5", text: "#9A3412" };
      case "medium":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "low":
      default:
        return { bg: "#E0F2FE", text: "#0369A1" };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      case "in progress":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "testing":
        return { bg: "#F3E8FF", text: "#6B21A8" };
      case "resolved":
        return { bg: "#D1FAE5", text: "#065F46" };
      case "closed":
      default:
        return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  if (loading || !stats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress size={50} sx={{ color: "#211b5a" }} />
      </Box>
    );
  }

  // Get user info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const userName = user.first_name || "User";

  // Take the 5 most recent tickets
  const recentTickets = tickets.slice(0, 5);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Welcoming Banner */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2,
          background: "linear-gradient(135deg, #211B5A 0%, #211b5a 78%, #F4C63D 180%)",
          color: "#fff",
          boxShadow: "0px 8px 32px rgba(33, 27, 90, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0 }}>
          Welcome back, {userName}! 👋
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: "600px" }}>
          Your Q-Jarvis Helpdesk is active and running. You currently have{" "}
          <strong style={{ textDecoration: "underline" }}>{stats.openTickets} open tickets</strong> that need attention.
        </Typography>
      </Card>

      {/* Stats Cards Grid */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Tickets" value={stats.totalTickets} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Open Tickets" value={stats.openTickets} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="In Progress" value={stats.inProgressTickets} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Closed Tickets" value={stats.closedTickets} />
        </Grid>
      </Grid>

      {/* Recent Activity / Tickets Table */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#211B5A" }}>
            Recent Activity
          </Typography>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={() => navigate("/tickets")}
            sx={{
              color: "#211b5a",
              borderColor: "#211b5a",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: 14,
              textTransform: "none",
              "&:hover": {
                borderColor: "#211B5A",
                backgroundColor: "rgba(58, 52, 130, 0.04)",
              },
            }}
          >
            View All Tickets
          </Button>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#F8F9FA" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#211b5a" }}>Ticket No</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#211b5a" }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#211b5a" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#211b5a" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#211b5a" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#211b5a" }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No recent tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                recentTickets.map((ticket: any) => {
                  const priStyle = getPriorityStyle(ticket.priority_name);
                  const statStyle = getStatusStyle(ticket.status_name);
                  return (
                    <TableRow
                      key={ticket.ticket_id}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "#F9FAFB !important",
                        },
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600, color: "#211b5a" }}>
                        {ticket.ticket_no}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#2D3748" }}>
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.category_name || "General"}
                          size="small"
                          sx={{
                            backgroundColor: "#E2E8F0",
                            color: "#211b5a",
                            fontWeight: 600,
                            borderRadius: "6px",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.priority_name || "Low"}
                          size="small"
                          sx={{
                            backgroundColor: priStyle.bg,
                            color: priStyle.text,
                            fontWeight: 700,
                            borderRadius: "6px",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status_name || "Open"}
                          size="small"
                          sx={{
                            backgroundColor: statStyle.bg,
                            color: statStyle.text,
                            fontWeight: 700,
                            borderRadius: "6px",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          sx={{
                            color: "#211b5a",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": {
                              backgroundColor: "rgba(58, 52, 130, 0.08)",
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tickets/${ticket.ticket_id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default DashboardPage;
