import { Box } from "@mui/material";

import AdminMasterManager from "./AdminMasterManager";
import {
  createStatus,
  deleteStatus,
  getStatuses,
  updateStatus,
} from "../services/masterService";

const AdminStatusesPage = () => (
  <AdminMasterManager
    title="Custom Statuses"
    description='Add custom statuses in addition to the default "New", "In progress", and "Closed" statuses.'
    idKey="status_id"
    defaultItem={{
      status_name: "",
      status_color: "#687386",
      is_default: false,
      is_closed_status: false,
    }}
    fields={[
      {
        key: "status_name",
        label: "Status name",
        required: true,
      },
      {
        key: "status_color",
        label: "Color",
        type: "color",
      },
      {
        key: "is_default",
        label: "Default",
        type: "checkbox",
      },
      {
        key: "is_closed_status",
        label: "Closed state",
        type: "checkbox",
      },
    ]}
    fetchItems={getStatuses}
    createItem={createStatus}
    updateItem={updateStatus}
    deleteItem={deleteStatus}
    renderPreview={(item) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: item.status_color || "#687386",
          }}
        />
        {item.status_name}
      </Box>
    )}
  />
);

export default AdminStatusesPage;
