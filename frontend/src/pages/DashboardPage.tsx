import {
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

import Checkbox from "@mui/material/Checkbox";

import AddIcon from "@mui/icons-material/Add";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import StatCard from "../components/StatCard";

import {
  getDashboardSummary,
} from "../services/dashboardService";

import {
  getTickets,
} from "../services/ticketService";

const DashboardPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] =
    useState<any>(null);

  const [tickets, setTickets] =
    useState<any[]>([]);

  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData =
    async () => {
      try {
        const summary =
          await getDashboardSummary();

        const ticketData =
          await getTickets();

        setStats(summary);

        setTickets(ticketData);
      } catch (error) {
        console.log(error);
      }
    };

  if (!stats)
    return <div>Loading...</div>;

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#3A3482",
            }}
          >
            Ticket Dashboard
          </Typography>

          <Typography
            color="text.secondary"
          >
            Manage all tickets
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            navigate(
              "/tickets/create"
            )
          }
          sx={{
            bgcolor: "#3A3482",
            color: "#FFFFFF",
            textTransform:
              "none",
            borderRadius: 2,
            px: 3,
          }}
        >
          New Ticket
        </Button>
      </Box>

      <Grid
        container
        spacing={3}
      >
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Tickets"
            value={
              stats.totalTickets
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Open Tickets"
            value={
              stats.openTickets
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="In Progress"
            value={
              stats.inProgressTickets
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Closed Tickets"
            value={
              stats.closedTickets
            }
          />
        </Grid>
      </Grid>

      {
  selectedTickets.length > 0 && (
    <Paper
      elevation={4}
      sx={{
        mt: 3,
        mb: 2,
        p: 1.5,

        bgcolor: "#6E63D9",
        color: "#fff",

        display: "flex",
        alignItems: "center",
        gap: 2,

        borderRadius: 2,
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
        }}
      >
        {selectedTickets.length} Ticket(s)
      </Typography>

      <Button
        color="inherit"
        size="small"
      >
        Close
      </Button>

      <Button
        color="inherit"
        size="small"
      >
        Assign
      </Button>

      <Button
        color="inherit"
        size="small"
      >
        Priority
      </Button>

      <Button
        color="inherit"
        size="small"
      >
        Category
      </Button>

      <Button
        color="inherit"
        size="small"
      >
        Due
      </Button>

      <Button
        color="inherit"
        size="small"
      >
        Delete
      </Button>
    </Paper>
  )
}

      <Paper
        sx={{
          mt: 4,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
  <TableRow>

    <TableCell padding="checkbox">
      <Checkbox />
    </TableCell>

    <TableCell>
      Ticket No
    </TableCell>

    <TableCell>
      Subject
    </TableCell>

    <TableCell>
      Status
    </TableCell>

    <TableCell>
      Priority
    </TableCell>

    <TableCell>
      Assigned To
    </TableCell>

  </TableRow>
</TableHead>

          <TableBody>
  {tickets.map((ticket: any) => (
    <TableRow
  key={ticket.ticket_id}
  hover
  sx={{
    cursor: "pointer",
  }}
  onClick={() => {
    console.log(
      "Open Ticket",
      ticket.ticket_id
    );
  }}
>

      <TableCell padding="checkbox">
        <Checkbox
          checked={selectedTickets.includes(
            ticket.ticket_id
          )}
          onChange={(e) => {
            if (e.target.checked) {

              setSelectedTickets([
                ...selectedTickets,
                ticket.ticket_id,
              ]);

            } else {

              setSelectedTickets(
                selectedTickets.filter(
                  (id) =>
                    id !==
                    ticket.ticket_id
                )
              );

            }
          }}
        />
      </TableCell>
                  <TableCell>
                    {
                      ticket.ticket_no
                    }
                  </TableCell>

                  <TableCell>
                    {
                      ticket.subject
                    }
                  </TableCell>

                  <TableCell>
                    {
                      ticket.status_name
                    }
                  </TableCell>

                  <TableCell>
                    {
                      ticket.priority_name
                    }
                  </TableCell>

                  <TableCell>
                    {
                      ticket.assigned_to_user_code
                    }
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default DashboardPage;