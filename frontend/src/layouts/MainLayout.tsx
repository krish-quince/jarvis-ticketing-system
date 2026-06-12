import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const MainLayout = () => {
  const [collapsed, setCollapsed] =
    useState(false);

  return (
    <Box
      sx={{
        backgroundColor: "#F5F5F5",
        minHeight: "100vh",
      }}
    >
      <Topbar
        toggleSidebar={() =>
          setCollapsed(!collapsed)
        }
      />

      <Box
        sx={{
          display: "flex",
        }}
      >
        <Sidebar
          collapsed={collapsed}
        />

        <Box
          sx={{
            flex: 1,
            p: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;