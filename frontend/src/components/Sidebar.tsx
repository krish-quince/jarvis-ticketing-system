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
              color: "#211b5a",
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
        icon={
          <ConfirmationNumber />
        }
        text="Tickets"
        collapsed={collapsed}
        onClick={() =>
          navigate("/tickets")
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

      

      <Box sx={{ flex: 1 }} />

      <MenuItem
        icon={<Logout />}
        text="Logout"
        collapsed={collapsed}
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        }}
      />

      <Box
        sx={{
          bgcolor: "#F4C63D",
          p: 1.5,
          textAlign: "center",
          borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        {collapsed ? (
          <Tooltip title={(() => {
            try {
              const u = JSON.parse(localStorage.getItem("user") || "{}");
              return `${u.first_name || "Guest"} (${u.role_id === 1 ? "Admin" : u.role_id === 2 ? "Manager" : u.role_id === 3 ? "Developer" : u.role_id === 4 ? "Customer" : "Viewer"})`;
            } catch {
              return "User";
            }
          })()} placement="right">
            <span style={{ fontSize: 20, cursor: "pointer" }}>👤</span>
          </Tooltip>
        ) : (
          (() => {
            let displayName = "Guest User";
            let displayRole = "Viewer";
            try {
              const userStr = localStorage.getItem("user");
              if (userStr) {
                const user = JSON.parse(userStr);
                displayName = `${user.first_name} ${user.last_name || ""}`.trim();
                const roleMap: Record<number, string> = {
                  1: "Admin",
                  2: "Manager",
                  3: "Developer",
                  4: "Customer",
                  5: "Viewer",
                };
                displayRole = roleMap[user.role_id] || "User";
              }
            } catch (e) {
              console.error("Error reading user from localStorage:", e);
            }
            return (
              <>
                <div style={{ fontWeight: 600, color: "#211B5A", fontSize: "14px" }}>
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "rgba(33, 27, 90, 0.75)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginTop: "2px"
                  }}
                >
                  {displayRole}
                </div>
              </>
            );
          })()
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

        color: "#211b5a",

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
