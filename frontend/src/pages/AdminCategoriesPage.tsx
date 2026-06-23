import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  ContentCopyOutlined,
  DeleteOutlined,
  FolderOutlined,
  Home,
  KeyboardArrowRight,
  Save,
} from "@mui/icons-material";

import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  getSubCategories,
  updateCategory,
  updateSubCategory,
} from "../services/masterService";
import { getUsers } from "../services/userService";

type Category = {
  category_id: number | string;
  category_name: string;
  category_description?: string | null;
};

type Subcategory = {
  subcategory_id: number | string;
  category_id: number | string;
  subcategory_name: string;
  subcategory_description?: string | null;
  assigned_user_code?: string | null;
};

type UserOption = {
  user_code: string;
  first_name?: string;
  last_name?: string;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }

  return fallback;
};

const AdminCategoriesPage = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const selectedCategoryId = categoryId || null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<Record<string, Subcategory[]>>({});
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState({
    category_name: "",
    category_description: "",
  });
  const [subcategoryDraft, setSubcategoryDraft] = useState({
    subcategory_name: "",
    subcategory_description: "",
    assigned_user_code: "",
  });
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.category_id) === String(selectedCategoryId)),
    [categories, selectedCategoryId],
  );
  const hasCategoryDraft =
    categoryDraft.category_name !== "" || categoryDraft.category_description !== "";
  const categoryDescriptionDraft =
    hasCategoryDraft ? categoryDraft.category_description : selectedCategory?.category_description || "";

  const usersByCode = useMemo(
    () =>
      users.reduce<Record<string, string>>((next, user) => {
        next[user.user_code] =
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.user_code;
        return next;
      }, {}),
    [users],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoryData, userData] = await Promise.all([
        getCategories(),
        getUsers(),
      ]);
      const nextCategories: Category[] = categoryData || [];
      const subcategoryEntries = await Promise.all(
        nextCategories.map(async (category) => {
          const subcategories = await getSubCategories(Number(category.category_id));
          return [
            category.category_id,
            (subcategories || []).map((subcategory: Subcategory) => ({
              ...subcategory,
              category_id: category.category_id,
            })),
          ] as const;
        }),
      );

      setCategories(nextCategories);
      setUsers(userData || []);
      setSubcategoriesByCategory(Object.fromEntries(subcategoryEntries));
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(error, "Failed to load categories"),
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

    if (![1, 4].includes(Number(user.role_id ?? user.roleId))) {
      navigate("/tickets");
      return;
    }

    Promise.resolve().then(loadData);
  }, [navigate]);

  useEffect(() => {
    if (!loading && selectedCategoryId && !selectedCategory) {
      navigate("/admin/categories", { replace: true });
    }
  }, [loading, navigate, selectedCategory, selectedCategoryId]);

  const resetSubcategoryDraft = () => {
    setEditingSubcategoryId(null);
    setShowSubcategoryForm(false);
    setSubcategoryDraft({
      subcategory_name: "",
      subcategory_description: "",
      assigned_user_code: "",
    });
  };

  const openCategory = (category: Category) => {
    setCategoryDraft({
      category_name: category.category_name,
      category_description: category.category_description || "",
    });
    resetSubcategoryDraft();
    navigate(`/admin/categories/${category.category_id}`);
  };

  const handleCreateCategory = async () => {
    if (!categoryDraft.category_name.trim()) {
      setToast({ open: true, severity: "error", message: "Category name is required." });
      return;
    }

    try {
      setSaving(true);
      await createCategory({
        category_name: categoryDraft.category_name.trim(),
        category_description: categoryDraft.category_description.trim(),
      });
      setCategoryDraft({ category_name: "", category_description: "" });
      setShowCategoryForm(false);
      setToast({ open: true, severity: "success", message: "Category added" });
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(error, "Failed to add category"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategory(Number(category.category_id));
      setToast({ open: true, severity: "success", message: "Category removed" });
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(error, "Failed to remove category"),
      });
    }
  };

  const handleSaveCategoryDescription = async () => {
    if (!selectedCategory) return;

    try {
      setSaving(true);
      await updateCategory(Number(selectedCategory.category_id), {
        category_name: categoryDraft.category_name.trim() || selectedCategory.category_name,
        category_description: categoryDescriptionDraft,
      });
      setToast({ open: true, severity: "success", message: "Category updated" });
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(error, "Failed to update category"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubcategory = async () => {
    if (!selectedCategory) return;
    if (!subcategoryDraft.subcategory_name.trim()) {
      setToast({ open: true, severity: "error", message: "Subcategory name is required." });
      return;
    }

    const payload = {
      category_id: selectedCategory.category_id,
      subcategory_name: subcategoryDraft.subcategory_name.trim(),
      subcategory_description: subcategoryDraft.subcategory_description.trim(),
      assigned_user_code: subcategoryDraft.assigned_user_code || null,
    };

    try {
      setSaving(true);
      if (editingSubcategoryId) {
        await updateSubCategory(Number(editingSubcategoryId), payload);
      } else {
        await createSubCategory(payload);
      }
      setToast({
        open: true,
        severity: "success",
        message: editingSubcategoryId ? "Subcategory updated" : "Subcategory added",
      });
      resetSubcategoryDraft();
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(error, "Failed to save subcategory"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategoryId(subcategory.subcategory_id);
    setShowSubcategoryForm(true);
    setSubcategoryDraft({
      subcategory_name: subcategory.subcategory_name,
      subcategory_description: subcategory.subcategory_description || "",
      assigned_user_code: subcategory.assigned_user_code || "",
    });
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    try {
      await deleteSubCategory(Number(subcategory.subcategory_id));
      setToast({ open: true, severity: "success", message: "Subcategory removed" });
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(error, "Failed to remove subcategory"),
      });
    }
  };

  if (selectedCategory) {
    return (
      <PageShell>
        <Breadcrumb current={selectedCategory.category_name} />
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate("/admin/categories")}
              sx={{ color: "var(--text-sub)", textTransform: "none", px: 0, mb: 1 }}
            >
              Ticket categories
            </Button>
            <Typography variant="h5" sx={{ color: "var(--text-h)", fontWeight: 700 }}>
              {selectedCategory.category_name}
            </Typography>
            <Typography sx={{ color: "var(--text-sub)", fontSize: 13, mt: 0.75 }}>
              Add subcategories for this category and choose an optional routing assignee.
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ ...panelSx, px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px 1fr" }, gap: 3, alignItems: "start" }}>
            <Typography sx={detailLabelSx}>Category name:</Typography>
            <TextField
              size="small"
              value={categoryDraft.category_name || selectedCategory.category_name}
              onChange={(event) =>
                setCategoryDraft((prev) => ({ ...prev, category_name: event.target.value }))
              }
              sx={{ maxWidth: 320 }}
            />

            <Typography sx={detailLabelSx}>Description:</Typography>
            <TextField
              multiline
              minRows={3}
              placeholder="Optional description, shown on the new-ticket page and KB."
              value={categoryDescriptionDraft}
              onChange={(event) =>
                setCategoryDraft((prev) => ({
                  ...prev,
                  category_name: prev.category_name || selectedCategory.category_name,
                  category_description: event.target.value,
                }))
              }
            />

            <Box />
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "space-between", flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveCategoryDescription}
                disabled={saving}
                sx={{ backgroundColor: "var(--accent)", color: "#fff", textTransform: "none", fontWeight: 700 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleDeleteCategory(selectedCategory)}
                sx={{ textTransform: "none", borderColor: "var(--border)", color: "var(--text)" }}
              >
                Disable
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 4, mb: 1.5 }}>
          <Typography variant="h5" sx={{ color: "var(--text-sub)", fontWeight: 600 }}>
            Subcategories
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSubcategoryDraft({
                subcategory_name: "",
                subcategory_description: "",
                assigned_user_code: "",
              });
              setShowSubcategoryForm(true);
              setEditingSubcategoryId(null);
            }}
            sx={{ backgroundColor: "var(--accent)", color: "#fff", textTransform: "none", fontWeight: 700 }}
          >
            Add subcategory
          </Button>
        </Box>

        {showSubcategoryForm && (
          <Paper elevation={0} sx={panelSx}>
            <Typography sx={{ color: "var(--text-h)", fontWeight: 700, mb: 1.5 }}>
              {editingSubcategoryId ? "Edit subcategory" : "Add subcategory"}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 220px auto" }, gap: 1.5 }}>
              <TextField
                size="small"
                label="Subcategory name"
                value={subcategoryDraft.subcategory_name}
                onChange={(event) =>
                  setSubcategoryDraft((prev) => ({ ...prev, subcategory_name: event.target.value }))
                }
              />
              <TextField
                size="small"
                label="Description"
                value={subcategoryDraft.subcategory_description}
                onChange={(event) =>
                  setSubcategoryDraft((prev) => ({ ...prev, subcategory_description: event.target.value }))
                }
              />
              <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                <InputLabel id="routing-assignee-label">Routing assignee</InputLabel>
                <Select
                  labelId="routing-assignee-label"
                  multiple
                  label="Routing assignee"
                  value={subcategoryDraft.assigned_user_code ? subcategoryDraft.assigned_user_code.split("|").filter(Boolean) : []}
                  onChange={(event) => {
                    const val = event.target.value;
                    const joinedVal = Array.isArray(val) ? val.join("|") : val;
                    setSubcategoryDraft((prev) => ({ ...prev, assigned_user_code: joinedVal }));
                  }}
                  renderValue={(selected) =>
                    selected.map((code) => usersByCode[code] || code).join(", ")
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user.user_code} value={user.user_code}>
                      {usersByCode[user.user_code]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveSubcategory}
                  disabled={saving}
                  sx={{ backgroundColor: "var(--accent)", color: "#fff", textTransform: "none" }}
                >
                  Save
                </Button>
                <Button onClick={resetSubcategoryDraft} sx={{ textTransform: "none" }}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        <Paper elevation={0} sx={{ ...panelSx, p: 0, overflow: "hidden" }}>
          <HeaderRow left="Subcategory" right="Routing assignee" />
          {(subcategoriesByCategory[selectedCategory.category_id] || []).map((subcategory) => (
            <Box key={subcategory.subcategory_id} sx={subcategoryRowSx}>
              <Button
                onClick={() => handleEditSubcategory(subcategory)}
                sx={{ justifyContent: "flex-start", color: "var(--accent)", textTransform: "none", fontSize: 16 }}
              >
                {subcategory.subcategory_name}
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Chip
                  size="small"
                  label={subcategory.assigned_user_code ? subcategory.assigned_user_code.split("|").map(code => usersByCode[code] || code).join(", ") : "Everyone"}
                  sx={{ color: "#476282", backgroundColor: "rgba(71, 98, 130, 0.09)", fontWeight: 600 }}
                />
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={() => handleDeleteSubcategory(subcategory)}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
          {(subcategoriesByCategory[selectedCategory.category_id] || []).length === 0 && (
            <EmptyState text="No subcategories yet." />
          )}
        </Paper>

        <Toast toast={toast} setToast={setToast} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Breadcrumb current="Ticket categories and permissions" />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCategoryForm((value) => !value)}
          sx={{ backgroundColor: "var(--accent)", color: "#fff", textTransform: "none", fontWeight: 700, px: 2.5, py: 1.1 }}
        >
          Add new category
        </Button>
      </Box>

      {showCategoryForm && (
        <Paper elevation={0} sx={panelSx}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1.5 }}>
            <TextField
              size="small"
              label="Category name"
              value={categoryDraft.category_name}
              onChange={(event) =>
                setCategoryDraft((prev) => ({ ...prev, category_name: event.target.value }))
              }
            />
            <TextField
              size="small"
              label="Description"
              value={categoryDraft.category_description}
              onChange={(event) =>
                setCategoryDraft((prev) => ({ ...prev, category_description: event.target.value }))
              }
            />
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleCreateCategory}
              disabled={saving}
              sx={{ backgroundColor: "var(--accent)", color: "#fff", textTransform: "none" }}
            >
              Save
            </Button>
          </Box>
        </Paper>
      )}

      <Paper elevation={0} sx={{ ...panelSx, p: 0, overflow: "hidden" }}>
        <HeaderRow left="Category" right="Access type" />
        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} sx={{ color: "var(--accent)" }} />
          </Box>
        ) : categories.length === 0 ? (
          <EmptyState text="No categories yet." />
        ) : (
          categories.map((category) => {
            const subcategories = subcategoriesByCategory[category.category_id] || [];

            return (
              <Box key={category.category_id}>
                <Box sx={categoryRowSx}>
                  <Button
                    onClick={() => openCategory(category)}
                    sx={{ justifyContent: "flex-start", color: "var(--text)", textTransform: "none", fontSize: 15, gap: 1.5 }}
                  >
                    <FolderOutlined sx={{ fontSize: 19, color: "var(--text-sub)" }} />
                    {category.category_name}
                  </Button>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <IconButton size="small" onClick={() => openCategory(category)}>
                      <KeyboardArrowRight fontSize="small" />
                    </IconButton>
                    <Tooltip title="Remove category">
                      <IconButton size="small" onClick={() => handleDeleteCategory(category)}>
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {subcategories.map((subcategory) => (
                  <Box key={subcategory.subcategory_id} sx={subcategoryRowSx}>
                    <Button
                      onClick={() => openCategory(category)}
                      sx={{ pl: 5, justifyContent: "flex-start", color: "var(--accent)", textTransform: "none", fontSize: 16 }}
                    >
                      {subcategory.subcategory_name}
                    </Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Chip
                        size="small"
                        label={subcategory.assigned_user_code ? subcategory.assigned_user_code.split("|").map(code => usersByCode[code] || code).join(", ") : "Everyone"}
                        sx={{ color: "#476282", backgroundColor: "rgba(71, 98, 130, 0.09)", fontWeight: 600 }}
                      />
                      <ContentCopyOutlined sx={{ fontSize: 18, color: "var(--text-sub)" }} />
                      <Tooltip title="Remove subcategory">
                        <IconButton size="small" onClick={() => handleDeleteSubcategory(subcategory)}>
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          })
        )}
      </Paper>

      <Typography sx={{ color: "var(--text-sub)", fontSize: 13, mt: 1.5 }}>
        Click a category to add or edit its subcategories.
      </Typography>

      <Toast toast={toast} setToast={setToast} />
    </PageShell>
  );
};

const PageShell = ({ children }: { children: ReactNode }) => (
  <Box sx={{ color: "var(--text-h)", mx: "230px" }}>
    {children}
  </Box>
);

const Breadcrumb = ({ current }: { current: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, color: "var(--text-sub)" }}>
    <Home sx={{ fontSize: 18 }} />
    <Typography sx={{ fontSize: 18 }}>›</Typography>
    <Typography sx={{ fontSize: 14 }}>Administration</Typography>
    <Typography sx={{ fontSize: 18 }}>›</Typography>
    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{current}</Typography>
  </Box>
);

const HeaderRow = ({ left, right }: { left: string; right: string }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 190px", px: 2, py: 1.5, borderBottom: "1px solid var(--border)" }}>
    <Typography sx={{ color: "var(--text-sub)", fontSize: 13 }}>{left}</Typography>
    <Typography sx={{ color: "var(--text-sub)", fontSize: 13 }}>{right}</Typography>
  </Box>
);

const EmptyState = ({ text }: { text: string }) => (
  <Box sx={{ py: 6, textAlign: "center", color: "var(--text-sub)", fontSize: 14 }}>
    {text}
  </Box>
);

const Toast = ({
  toast,
  setToast,
}: {
  toast: ToastState;
  setToast: Dispatch<SetStateAction<ToastState>>;
}) => (
  <Snackbar
    open={toast.open}
    autoHideDuration={3500}
    onClose={() => setToast((prev) => ({ ...prev, open: false }))}
  >
    <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
      {toast.message}
    </Alert>
  </Snackbar>
);

const panelSx = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  backgroundImage: "none",
  p: 2,
  mb: 2,
};

const detailLabelSx = {
  color: "var(--text)",
  fontSize: 16,
  pt: 1,
};

const categoryRowSx = {
  display: "grid",
  gridTemplateColumns: "1fr 190px",
  alignItems: "center",
  minHeight: 54,
  px: 2,
  borderBottom: "1px solid var(--border)",
  backgroundColor: "rgba(15, 23, 42, 0.015)",
};

const subcategoryRowSx = {
  display: "grid",
  gridTemplateColumns: "1fr 190px",
  alignItems: "center",
  minHeight: 88,
  px: 2,
  borderBottom: "1px solid var(--border)",
};

export default AdminCategoriesPage;
