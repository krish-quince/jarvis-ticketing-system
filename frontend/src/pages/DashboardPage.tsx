import {
  Box,
  Grid,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import StatCard
from "../components/StatCard";

import {
  getDashboardSummary,
} from "../services/dashboardService";

const DashboardPage = () => {

  const [stats, setStats] =
    useState<any>(null);

  useEffect(() => {

    fetchData();

  }, []);

  const fetchData =
  async () => {

    try {

      const data =
        await getDashboardSummary();

      setStats(data);

    } catch (error) {

      console.log(error);

    }
  };

  if (!stats)
    return <div>Loading...</div>;

  return (
    <Box sx={{ p: 4 }}>

      <Grid
        container
        spacing={3}
      >

        <Grid size={3}>
          <StatCard
            title="Total Tickets"
            value={
              stats.totalTickets
            }
          />
        </Grid>

        <Grid size={3}>
          <StatCard
            title="Open Tickets"
            value={
              stats.openTickets
            }
          />
        </Grid>

        <Grid size={3}>
          <StatCard
            title="In Progress"
            value={
              stats.inProgressTickets
            }
          />
        </Grid>

        <Grid size={3}>
          <StatCard
            title="Closed Tickets"
            value={
              stats.closedTickets
            }
          />
        </Grid>

      </Grid>

    </Box>
  );
};

export default DashboardPage;