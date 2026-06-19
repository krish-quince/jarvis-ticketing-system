import type { ReactNode } from "react";
import {
  AdminPanelSettings,
  Engineering,
  Person,
} from "@mui/icons-material";

export const ROLE_CONFIG: Record<
  number,
  { label: string; color: string; bg: string; icon: ReactNode }
> = {
  1: {
    label: "Admin",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: <AdminPanelSettings sx={{ fontSize: 12 }} />,
  },
  2: {
    label: "Technician",
    color: "#0369a1",
    bg: "#e0f2fe",
    icon: <Engineering sx={{ fontSize: 12 }} />,
  },
  3: {
    label: "User",
    color: "#15803d",
    bg: "#dcfce7",
    icon: <Person sx={{ fontSize: 12 }} />,
  },
};
