import {
  Box,
  Tooltip,
} from "@mui/material";

import {
  Home,
  ConfirmationNumber,
  People,
  Logout,
  Search,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

type Props = {
  collapsed: boolean;
};

const Sidebar = ({
  collapsed,
}: Props) => {
  const navigate = useNavigate();

  const width = collapsed
    ? 72
    : 280;

  return (
    <Box
      sx={{
        width,
        transition:
          "all .3s ease",

        backgroundColor:
          "#fff",

        minHeight:
          "calc(100vh - 50px)",

        borderRight:
          "1px solid #ddd",

        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search */}

      <Box
        sx={{
          p: 1.5,
          borderBottom:
            "1px solid #eee",
        }}
      >
        {collapsed ? (
          <Search
            sx={{
              color: "#3A3482",
            }}
          />
        ) : (
          <input
            placeholder="Search Menu..."
            style={{
              width: "100%",
              padding: "12px",
              border:
                "1px solid #ddd",
            }}
          />
        )}
      </Box>

      <MenuItem
        icon={<Home />}
        text="Dashboard"
        collapsed={collapsed}
        onClick={() =>
          navigate("/dashboard")
        }
      />

      

      <MenuItem
        icon={<People />}
        text="Users"
        collapsed={collapsed}
        onClick={() =>
          navigate("/users")
        }
      />

      <MenuItem
        icon={<ConfirmationNumber />}
        text="Tickets"
        collapsed={collapsed}
        onClick={() =>
          navigate("/tickets")
        }
      />

      <Box sx={{ flex: 1 }} />

      <MenuItem
        icon={<Logout />}
        text="Logout"
        collapsed={collapsed}
      />

      <Box
        sx={{
          bgcolor: "#F4C63D",
          p: 1.5,
          textAlign: "center",
        }}
      >
        {collapsed ? (
          "👤"
        ) : (
          <>
            <div>
              Nandu Gatla
            </div>
            <div
              style={{
                fontSize: 12,
              }}
            >
              Admin
            </div>
          </>
        )}
      </Box>
    </Box>
  );
};

const MenuItem = ({
  icon,
  text,
  collapsed,
  onClick,
}: any) => (
  <Tooltip
    title={
      collapsed
        ? text
        : ""
    }
    placement="right"
  >
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",

        gap: 2,

        px: 2,
        py: 2,

        cursor: "pointer",

        color: "#3A3482",

        "&:hover": {
          backgroundColor:
            "rgba(244,198,61,.15)",
        },
      }}
    >
      {icon}

      {!collapsed && text}
    </Box>
  </Tooltip>
);

export default Sidebar;
