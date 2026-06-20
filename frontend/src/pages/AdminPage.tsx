import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlternateEmailOutlined,
  ErrorOutlineOutlined,
  FolderOutlined,
  GridViewOutlined,
  PeopleOutlineOutlined,
  SettingsOutlined,
} from "@mui/icons-material";

type LinkItem = {
  icon: ReactNode;
  title: string;
  description: string;
  path: string;
};

type Section = {
  id: string;
  title: string;
  items: LinkItem[];
};

const ICON_SX = { fontSize: 22 };

const sections: Section[] = [
  {
    id: "general",
    title: "General settings",
    items: [
      {
        icon: <SettingsOutlined sx={ICON_SX} />,
        title: "General settings",
        description: "General application settings: colors, options, and more.",
        path: "/admin/settings",
      },
      {
        icon: <AlternateEmailOutlined sx={ICON_SX} />,
        title: "Email settings",
        description: "Email integration settings: notifications, inbound email, and more.",
        path: "/admin/email-settings",
      },
      {
        icon: <PeopleOutlineOutlined sx={ICON_SX} />,
        title: "Users",
        description: "Users and their companies, roles and permissions.",
        path: "/admin/users",
      },
    ],
  },
  {
    id: "tickets",
    title: "Tickets",
    items: [
      {
        icon: <FolderOutlined sx={ICON_SX} />,
        title: "Ticket categories",
        description:
          "Add categories, manage their subcategories, and edit permissions for ticket routing.",
        path: "/admin/categories",
      },
      {
        icon: <GridViewOutlined sx={ICON_SX} />,
        title: "Custom statuses",
        description: 'Add custom statuses in addition to the default "New", "In progress", and "Closed" statuses.',
        path: "/admin/statuses",
      },
      {
        icon: <ErrorOutlineOutlined sx={ICON_SX} />,
        title: "Custom priorities",
        description: "Add custom priority levels along with the default Low, Normal, High, Critical.",
        path: "/admin/priorities",
      },
    ],
  },
];

const AdminPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

    if (Number(user.role_id) !== 1) {
      navigate("/tickets");
    }
  }, [navigate]);

  return (
    <div style={pageSx}>
      {sections.map((section) => (
        <section key={section.id} style={cardSx}>
          <h3 style={sectionTitleSx}>{section.title}</h3>

          <div style={gridSx}>
            {section.items.map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.path)}
                style={linkItemSx}
                type="button"
              >
                <span style={iconSx}>{item.icon}</span>
                <span>
                  <span style={itemTitleSx}>{item.title}</span>
                  <span style={descriptionSx}>{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const pageSx: CSSProperties = {
  color: "var(--text-h)",
  marginLeft: "230px",
  marginRight: "230px",
};

const cardSx: CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const sectionTitleSx: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 15,
  fontWeight: 500,
  color: "var(--text-sub)",
};

const gridSx: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  rowGap: 24,
  columnGap: 32,
};

const linkItemSx: CSSProperties = {
  appearance: "none",
  background: "transparent",
  border: 0,
  color: "inherit",
  cursor: "pointer",
  display: "flex",
  gap: 12,
  padding: 0,
  textAlign: "left",
};

const iconSx: CSSProperties = {
  color: "var(--text-sub)",
  display: "flex",
  flexShrink: 0,
  marginTop: 2,
};

const itemTitleSx: CSSProperties = {
  color: "var(--accent)",
  display: "block",
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 4,
};

const descriptionSx: CSSProperties = {
  color: "var(--text-sub)",
  display: "block",
  fontSize: 13,
  lineHeight: 1.5,
};

export default AdminPage;
