import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Check,
  Close,
  DeleteOutlined,
  EditOutlined,
} from "@mui/icons-material";

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "color" | "checkbox" | "select";
  options?: { value: any; label: string }[];
  required?: boolean;
};

type AdminMasterManagerProps = {
  title: string;
  description: string;
  idKey: string;
  fields: FieldConfig[];
  defaultItem: Record<string, any>;
  fetchItems: () => Promise<any[]>;
  createItem: (payload: any) => Promise<any>;
  updateItem: (id: number, payload: any) => Promise<any>;
  deleteItem: (id: number) => Promise<any>;
  renderPreview?: (item: any) => React.ReactNode;
};

const AdminMasterManager = ({
  title,
  description,
  idKey,
  fields,
  defaultItem,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  renderPreview,
}: AdminMasterManagerProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [draft, setDraft] = useState(defaultItem);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(a[idKey]) - Number(b[idKey])),
    [items, idKey],
  );

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data || []);
    } catch (error: any) {
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || `Failed to load ${title}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

    if (Number(user.role_id ?? user.roleId) !== 1) {
      navigate("/tickets");
      return;
    }

    loadItems();
  }, [navigate]);

  const resetDraft = () => {
    setEditingId(null);
    setDraft(defaultItem);
  };

  const handleEdit = (item: any) => {
    setEditingId(Number(item[idKey]));
    setDraft(
      fields.reduce(
        (next, field) => ({
          ...next,
          [field.key]: item[field.key] ?? defaultItem[field.key] ?? "",
        }),
        {},
      ),
    );
  };

  const handleSave = async () => {
    const missing = fields.some(
      (field) => field.required && String(draft[field.key] ?? "").trim() === "",
    );

    if (missing) {
      setToast({
        open: true,
        severity: "error",
        message: "Fill the required fields before saving.",
      });
      return;
    }

    try {
      setSaving(true);
      if (editingId === null) {
        await createItem(draft);
      } else {
        await updateItem(editingId, draft);
      }

      setToast({
        open: true,
        severity: "success",
        message: editingId === null ? "Created" : "Updated",
      });
      resetDraft();
      await loadItems();
    } catch (error: any) {
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    try {
      await deleteItem(Number(item[idKey]));
      setToast({
        open: true,
        severity: "success",
        message: "Removed",
      });
      if (editingId === Number(item[idKey])) {
        resetDraft();
      }
      await loadItems();
    } catch (error: any) {
      setToast({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Remove failed",
      });
    }
  };

  const getDisplayValue = (field: FieldConfig, value: any) => {
    if (field.type === "checkbox") {
      return value ? "Yes" : "No";
    }

    if (field.type === "select") {
      return field.options?.find((option) => String(option.value) === String(value))?.label || "";
    }

    return String(value ?? "");
  };

  const renderField = (field: FieldConfig) => {
    if (field.type === "checkbox") {
      return (
        <Box
          key={field.key}
          sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40 }}
        >
          <Checkbox
            checked={Boolean(draft[field.key])}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                [field.key]: event.target.checked,
              }))
            }
            sx={{ p: 0.5, color: "var(--text-sub)" }}
          />
          <Typography sx={{ fontSize: 13, color: "var(--text)" }}>
            {field.label}
          </Typography>
        </Box>
      );
    }

    return (
      <TextField
        key={field.key}
        select={field.type === "select"}
        label={field.label}
        type={field.type === "number" ? "number" : field.type === "color" ? "color" : "text"}
        size="small"
        value={draft[field.key] ?? ""}
        required={field.required}
        onChange={(event) =>
          setDraft((prev) => ({
            ...prev,
            [field.key]:
              field.type === "number"
                ? Number(event.target.value)
                : event.target.value,
          }))
        }
        sx={field.type === "color" ? { width: 96 } : undefined}
      >
        {field.type === "select" && !field.required && (
          <MenuItem value="">
            None
          </MenuItem>
        )}
        {(field.options || []).map((option) => (
          <MenuItem key={String(option.value)} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  return (
    <Box sx={{ color: "var(--text-h)", mx: "230px" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/admin")}
            sx={{ color: "var(--text-sub)", textTransform: "none", px: 0, mb: 1 }}
          >
            Administration
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--text-h)" }}>
            {title}
          </Typography>
          <Typography sx={{ color: "var(--text-sub)", fontSize: 13, mt: 0.75 }}>
            {description}
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={panelSx}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1.5, alignItems: "center" }}>
          {fields.map(renderField)}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {editingId !== null && (
              <Button
                startIcon={<Close />}
                onClick={resetDraft}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={editingId === null ? <Add /> : <Check />}
              onClick={handleSave}
              disabled={saving}
              sx={{ textTransform: "none", backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {editingId === null ? "Add" : "Save"}
            </Button>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={panelSx}>
        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} sx={{ color: "var(--accent)" }} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {fields.map((field) => (
                  <TableCell key={field.key} sx={headCellSx}>
                    {field.label}
                  </TableCell>
                ))}
                {renderPreview && <TableCell sx={headCellSx}>Preview</TableCell>}
                <TableCell sx={headCellSx} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((item) => (
                <TableRow key={item[idKey]} hover>
                  {fields.map((field) => (
                    <TableCell key={field.key} sx={bodyCellSx}>
                      {getDisplayValue(field, item[field.key])}
                    </TableCell>
                  ))}
                  {renderPreview && (
                    <TableCell sx={bodyCellSx}>{renderPreview(item)}</TableCell>
                  )}
                  <TableCell sx={bodyCellSx} align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(item)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => handleDelete(item)}>
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const panelSx = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  backgroundImage: "none",
  p: 2,
  mb: 2,
};

const headCellSx = {
  color: "var(--text-sub)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  borderColor: "var(--border)",
};

const bodyCellSx = {
  color: "var(--text)",
  fontSize: 13,
  borderColor: "var(--border)",
};

export default AdminMasterManager;
