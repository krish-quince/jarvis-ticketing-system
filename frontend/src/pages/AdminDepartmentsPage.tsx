import { Box } from "@mui/material";
import AdminMasterManager from "./AdminMasterManager";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../services/masterService";

const AdminDepartmentsPage = () => {
  return (
    <AdminMasterManager
      title="Departments"
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
      fetchItems={getDepartments}
      createItem={createDepartment}
      updateItem={updateDepartment}
      deleteItem={deleteDepartment}
      renderPreview={(item) => item.department_name}
    />
  );
};

export default AdminDepartmentsPage;
