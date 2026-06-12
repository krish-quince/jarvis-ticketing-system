import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  assignTicket,
  closeTicket,
  getTickets,
  takeoverTicket,
  updateTicket,
} from "../services/ticketService";
import { getStatuses } from "../services/statusService";
import { getUsers } from "../services/userService";

const TicketsPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingTicketId, setLoadingTicketId] =
    useState<number | null>(null);

  const currentUser = useMemo(() => {
    const rawUser = localStorage.getItem("user");

    return rawUser ? JSON.parse(rawUser) : null;
  }, []);

  const isAdmin =
    ["admin", "manager"].includes(
      String(currentUser?.roleName || "")
        .toLowerCase()
    );

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const [
        ticketRows,
        statusRows,
        userRows,
      ] = await Promise.all([
        getTickets(),
        getStatuses(),
        getUsers(),
      ]);

      setTickets(ticketRows);
      setStatuses(statusRows);
      setUsers(userRows);
    } catch (error) {
      console.error(error);
      alert("Failed to load tickets");
    }
  };

  const refreshTickets = async () => {
    const ticketRows = await getTickets();
    setTickets(ticketRows);
  };

  const handleAssign = async (
    ticketId: number,
    userCode: string
  ) => {
    try {
      setLoadingTicketId(ticketId);
      await assignTicket(
        ticketId,
        userCode
      );
      await refreshTickets();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to assign ticket"
      );
    } finally {
      setLoadingTicketId(null);
    }
  };

  const handleStatusChange = async (
    ticket: any,
    statusId: number
  ) => {
    try {
      setLoadingTicketId(ticket.ticket_id);
      await updateTicket(ticket.ticket_id, {
        subject: ticket.subject,
        description: ticket.description,
        priority_id: ticket.priority_id,
        status_id: statusId,
        assigned_to_user_code:
          ticket.assigned_to_user_code,
      });
      await refreshTickets();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to update status"
      );
    } finally {
      setLoadingTicketId(null);
    }
  };

  const handleTakeover = async (
    ticketId: number
  ) => {
    try {
      setLoadingTicketId(ticketId);
      await takeoverTicket(ticketId);
      await refreshTickets();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to take over ticket"
      );
    } finally {
      setLoadingTicketId(null);
    }
  };

  const handleClose = async (
    ticketId: number
  ) => {
    try {
      setLoadingTicketId(ticketId);
      await closeTicket(ticketId);
      await refreshTickets();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to close ticket"
      );
    } finally {
      setLoadingTicketId(null);
    }
  };

  return (
    <Box sx={{ p: 3, textAlign: "left" }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#201a43",
            }}
          >
            Tickets
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {isAdmin
              ? "Admin queue"
              : "Your tickets"}
          </Typography>
        </Box>

        {isAdmin && (
          <Chip
            icon={<VerifiedUserIcon />}
            label="Admin access"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <TableContainer
        component={Paper}
        elevation={1}
        sx={{ borderRadius: 2 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ticket No</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Raised By</TableCell>
              <TableCell>Assigned To</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {tickets.map((ticket: any) => {
              const isLoading =
                loadingTicketId ===
                ticket.ticket_id;

              return (
                <TableRow
                  key={ticket.ticket_id}
                  hover
                >
                  <TableCell>
                    {ticket.ticket_no}
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: 220,
                      fontWeight: 600,
                    }}
                  >
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    {ticket.category_name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        ticket.priority_name
                      }
                      sx={{
                        bgcolor:
                          ticket.priority_color ||
                          "#eceff1",
                        color: "#111827",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        size="small"
                        value={
                          ticket.status_id
                        }
                        disabled={isLoading}
                        onChange={(event) =>
                          handleStatusChange(
                            ticket,
                            Number(
                              event.target.value
                            )
                          )
                        }
                        sx={{ minWidth: 150 }}
                      >
                        {statuses.map(
                          (status) => (
                            <MenuItem
                              key={
                                status.status_id
                              }
                              value={
                                status.status_id
                              }
                            >
                              {
                                status.status_name
                              }
                            </MenuItem>
                          )
                        )}
                      </Select>
                    ) : (
                      ticket.status_name
                    )}
                  </TableCell>
                  <TableCell>
                    {
                      ticket.raised_by_user_code
                    }
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        size="small"
                        value={
                          ticket.assigned_to_user_code ||
                          ""
                        }
                        disabled={isLoading}
                        onChange={(event) =>
                          handleAssign(
                            ticket.ticket_id,
                            String(
                              event.target.value
                            )
                          )
                        }
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">
                          Unassigned
                        </MenuItem>
                        {users.map((user) => (
                          <MenuItem
                            key={user.user_code}
                            value={user.user_code}
                          >
                            {user.first_name}{" "}
                            {user.last_name} (
                            {user.role_name})
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      ticket.assigned_to_user_code ||
                      "Unassigned"
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            <AssignmentIndIcon />
                          }
                          disabled={isLoading}
                          onClick={() =>
                            handleTakeover(
                              ticket.ticket_id
                            )
                          }
                        >
                          Take Over
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={
                            <CheckCircleIcon />
                          }
                          disabled={
                            isLoading ||
                            ticket.is_closed_status
                          }
                          onClick={() =>
                            handleClose(
                              ticket.ticket_id
                            )
                          }
                        >
                          Close
                        </Button>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TicketsPage;
