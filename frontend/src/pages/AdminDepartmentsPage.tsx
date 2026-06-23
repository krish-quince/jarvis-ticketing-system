import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ArrowBack, Business, NavigateNext } from "@mui/icons-material";
import AdminMasterManager from "./AdminMasterManager";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  getCompanies,
} from "../services/masterService";

type CompanyRecord = {
  company_code: string;
  company_name: string;
  logo_url?: string;
};

const AdminDepartmentsPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    setCurrentUser(user);

    const isSuperAdmin = Number(user.role_id ?? user.roleId) === 4;
    if (isSuperAdmin) {
      getCompanies()
        .then((data) => setCompanies(data || []))
        .catch(console.error)
        .finally(() => setLoadingCompanies(false));
    } else {
      setLoadingCompanies(false);
    }
  }, []);

  if (loadingCompanies) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isSuperAdmin = Number(currentUser?.role_id ?? currentUser?.roleId) === 4;

  if (isSuperAdmin && !selectedCompany) {
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: "var(--text-h)" }}>
          Departments by Company
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: "var(--text-sub)" }}>
          Select a company to manage its departments.
        </Typography>

        <TableContainer component={Paper} sx={{ border: "1px solid var(--border)", bgcolor: "var(--bg-card)", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: "2px solid var(--border)" }}>
                <TableCell sx={{ fontWeight: 600, color: "var(--text-sub)", py: 2 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Business fontSize="small"/> Company Name</Box></TableCell>
                <TableCell sx={{ fontWeight: 600, color: "var(--text-sub)", py: 2 }}>Company Code</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "var(--text-sub)", py: 2, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow 
                  key={company.company_code} 
                  hover
                  onClick={() => setSelectedCompany(company)}
                  sx={{ 
                    cursor: "pointer", 
                    borderBottom: "1px solid var(--border)",
                    "&:hover": { bgcolor: "var(--bg-hover) !important" }
                  }}
                >
                  <TableCell sx={{ py: 2, color: "var(--text)", fontWeight: 500 }}>
                    {company.company_name}
                  </TableCell>
                  <TableCell sx={{ py: 2, color: "var(--text-sub)" }}>
                    {company.company_code}
                  </TableCell>
                  <TableCell sx={{ py: 2, textAlign: "right" }}>
                    <Button 
                      size="small" 
                      endIcon={<NavigateNext />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompany(company);
                      }}
                      sx={{ color: "var(--accent)", fontWeight: 600 }}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 4, textAlign: "center", color: "var(--text-sub)" }}>
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // Active Company Code (either selected from super admin view, or standard admin's company)
  const targetCompanyCode = selectedCompany ? selectedCompany.company_code : currentUser?.company_code;
  const companyLabel = selectedCompany ? ` (${selectedCompany.company_name})` : "";

  return (
    <Box>
      {isSuperAdmin && (
        <Box sx={{ px: 4, pt: 4, maxWidth: 900, mx: "auto", mb: -2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setSelectedCompany(null)}
            sx={{ color: "var(--text-sub)", textTransform: "none", fontWeight: 500, "&:hover": { color: "var(--text)" } }}
          >
            Back to Companies
          </Button>
        </Box>
      )}
      <AdminMasterManager
        title={`Departments${companyLabel}`}
        description="Manage departments in your organization."
        idKey="department_id"
        defaultItem={{
          department_name: "",
        }}
        fields={[
          {
            key: "department_name",
            label: "Department name",
            required: true,
          },
        ]}
        fetchItems={() => getDepartments(targetCompanyCode)}
        createItem={(payload) => createDepartment({ ...payload, company_code: targetCompanyCode })}
        updateItem={(id, payload) => updateDepartment(id, payload, targetCompanyCode)}
        deleteItem={(id) => deleteDepartment(id, targetCompanyCode)}
        renderPreview={(item) => item.department_name}
      />
    </Box>
  );
};

export default AdminDepartmentsPage;
