import {
  getCompanies,
  getDepartments,
  getRoles,
} from "../../services/masterService";
import type {
  ActionFetchEntry,
  CompanyOptionResponse,
  DepartmentOptionResponse,
  OptionItem,
  RoleOptionResponse,
  UserRecord,
} from "./userTypes";

export const getInitials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

export const getAvatarColor = (code: string) => {
  const colors = [
    "#7c3aed",
    "#0369a1",
    "#b45309",
    "#0f766e",
    "#be185d",
    "#1d4ed8",
  ];
  let hash = 0;

  for (let i = 0; i < code.length; i += 1) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export const buildBulkPayload = (
  action: string,
  value: string,
): Record<string, unknown> => {
  switch (action) {
    case "Role":
      return { role_id: Number(value) };
    case "Department":
      return { department_id: Number(value) };
    case "Company":
      return { company_code: value };
    case "Enable email notifications":
      return { email_notifications: value === "enable" };
    default:
      return {};
  }
};

export const buildUserUpdatePayload = (
  user: UserRecord,
  actionPayload: Record<string, unknown>,
): Record<string, unknown> => ({
  first_name: user.first_name,
  last_name: user.last_name,
  role_id: user.role_id,
  company_code: user.company_code,
  department_id: user.department_id,
  is_active: user.is_active ?? true,
  ...actionPayload,
});

const normaliseRoles = (data: unknown[]): OptionItem[] =>
  (data as RoleOptionResponse[]).map((role) => ({
    value: String(role.role_id),
    label: role.role_name,
  }));

const normaliseDepartments = (data: unknown[]): OptionItem[] =>
  (data as DepartmentOptionResponse[]).map((department) => ({
    value: String(department.department_id),
    label: department.department_name,
  }));

const normaliseCompanies = (data: unknown[]): OptionItem[] =>
  (data as CompanyOptionResponse[]).map((company) => ({
    value: company.company_code,
    label: company.company_name,
  }));

export const ACTION_FETCH_MAP: Record<string, ActionFetchEntry> = {
  Role: { fetch: getRoles, normalise: normaliseRoles },
  Department: { fetch: getDepartments, normalise: normaliseDepartments },
  Company: { fetch: getCompanies, normalise: normaliseCompanies },
  "Enable email notifications": {
    fetch: async () => [
      { value: "enable", label: "Enable" },
      { value: "disable", label: "Disable" },
    ],
    normalise: (data) => data as OptionItem[],
  },
};
