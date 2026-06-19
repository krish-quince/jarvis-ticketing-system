import { Box } from "@mui/material";

import AdminMasterManager from "./AdminMasterManager";
import {
  createPriority,
  deletePriority,
  getPriorities,
  updatePriority,
} from "../services/masterService";

const AdminPrioritiesPage = () => (
  <AdminMasterManager
    title="Custom Priorities"
    description="Add custom priority levels along with the default Low, Normal, High, Critical."
    idKey="priority_id"
    defaultItem={{
      priority_name: "",
      priority_value: 1,
      priority_color: "#687386",
    }}
    fields={[
      {
        key: "priority_name",
        label: "Priority name",
        required: true,
      },
      {
        key: "priority_value",
        label: "Sort value",
        type: "number",
        required: true,
      },
      {
        key: "priority_color",
        label: "Color",
        type: "color",
      },
    ]}
    fetchItems={getPriorities}
    createItem={createPriority}
    updateItem={updatePriority}
    deleteItem={deletePriority}
    renderPreview={(item) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: item.priority_color || "#687386",
          }}
        />
        {item.priority_name}
      </Box>
    )}
  />
);

export default AdminPrioritiesPage;
