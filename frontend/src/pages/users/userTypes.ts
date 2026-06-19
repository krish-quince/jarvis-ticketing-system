export interface OptionItem {
  value: string;
  label: string;
}

export type RoleOptionResponse = {
  role_id: number | string;
  role_name: string;
};

export type DepartmentOptionResponse = {
  department_id: number | string;
  department_name: string;
};

export type CompanyOptionResponse = {
  company_code: string;
  company_name: string;
};

export interface UserRecord {
  user_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  role_id?: number | string;
  company_code?: string;
  company_name?: string;
  department?: string;
  department_id?: number | string;
  department_name?: string;
  is_active?: boolean;
}

export type ActionFetchEntry = {
  fetch: () => Promise<unknown[]>;
  normalise: (data: unknown[]) => OptionItem[];
};
