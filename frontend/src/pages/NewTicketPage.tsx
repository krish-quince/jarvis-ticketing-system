import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Collapse,
  FormControl,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
  Popover,
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";

import RichTextEditor from "../components/RichTextEditor";
import { createTicket } from "../services/ticketService";
import { getAssignableUsersForTicket } from "../services/masterService";
import api from "../services/api";

const menuItemSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  px: 2,
  py: "10px",
  cursor: "pointer",
  fontSize: 14,
  color: "var(--text)",
  borderRadius: "6px",
  mx: "4px",
  "&:hover": {
    background: "rgba(99,91,255,0.15)",
    color: "#635BFF",
  },
};

const selectedItemSx = {
  ...menuItemSx,
  background: "#635BFF",
  color: "#fff",
  "&:hover": {
    background: "#5449ff",
    color: "#fff",
  },
};

const panelSx = {
  width: 240,
  py: "6px",
  
};

interface Category {
  category_id: number | string;
  category_name: string;
}

interface SubCategory {
  subcategory_id: number | string;
  subcategory_name: string;
}

interface Priority {
  priority_id: number | string;
  priority_name: string;
}

interface AssignableUser {
  user_code: string;
  first_name: string;
  last_name: string;
}

const getTicketErrorMessage = (error: unknown) => {
  const responseError = error as {
    response?: { data?: { message?: string } };
  };

  return responseError.response?.data?.message || "Failed to create ticket";
};

const NewTicketPage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<Record<string, SubCategory[]>>({});
  const [priorities, setPriorities] = useState<Priority[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [priorityId, setPriorityId] = useState("");

  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [allocatedTo, setAllocatedTo] = useState<string[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"categories" | "subcategories">("categories");
  const [hoveredCat, setHoveredCat] = useState<Category | null>(null);
  const [categoryAnchorEl, setCategoryAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const [submitForAnotherUser, setSubmitForAnotherUser] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, priRes] = await Promise.all([
          api.get("/master/categories"),
          api.get("/master/priorities"),
        ]);
        setCategories(catRes.data.data || []);
        setPriorities(priRes.data.data || []);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    const fetchAllSubCategories = async () => {
      const entries = await Promise.all(
        categories.map(async (cat) => {
          try {
            const res = await api.get(`/master/subcategories/${cat.category_id}`);
            return [String(cat.category_id), res.data.data || []] as const;
          } catch {
            return [String(cat.category_id), []] as const;
          }
        })
      );
      setAllSubCategories(Object.fromEntries(entries));
    };

    fetchAllSubCategories();
  }, [categories]);

  const selectedCategory = categories.find(
    (c) => String(c.category_id) === categoryId
  );
  const selectedSubCategory = categoryId
    ? (allSubCategories[categoryId] || []).find(
        (s) => String(s.subcategory_id) === subcategoryId
      )
    : undefined;

  const categoryBtnLabel = selectedCategory
    ? selectedSubCategory
      ? `${selectedCategory.category_name} > ${selectedSubCategory.subcategory_name}`
      : `${selectedCategory.category_name} / General`
    : "(Select category)";

  const openPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryAnchorEl(event.currentTarget);
    setActivePanel("categories");
    setHoveredCat(null);
    setPopoverOpen(true);
  };

  const closePopover = () => {
    setPopoverOpen(false);
    setCategoryAnchorEl(null);
    setActivePanel("categories");
    setHoveredCat(null);
  };

  const loadAssignableUsers = async ({
    nextCategoryId,
    nextSubcategoryId,
  }: {
    nextCategoryId: string;
    nextSubcategoryId?: string;
  }) => {
    try {
      const users = await getAssignableUsersForTicket({
        categoryId: nextCategoryId,
        subcategoryId: nextSubcategoryId || null,
      });
      setAssignableUsers(users || []);
      setAssignTo([]);
    } catch (error) {
      console.error(error);
      setAssignableUsers([]);
      setAssignTo([]);
    }
  };

  const handleCategoryOnlyClick = async (cat: Category) => {
    const nextCategoryId = String(cat.category_id);
    setCategoryId(nextCategoryId);
    setSubcategoryId("");
    await loadAssignableUsers({ nextCategoryId });
    closePopover();
  };

  const handleCategoryClick = (cat: Category) => {
    const subs = allSubCategories[String(cat.category_id)] || [];
    if (subs.length > 0) {
      setHoveredCat(cat);
      setActivePanel("subcategories");
    } else {
      handleCategoryOnlyClick(cat);
    }
  };

  const handleSubcategoryClick = async (sub: SubCategory) => {
    if (!hoveredCat) return;

    const nextCategoryId = String(hoveredCat.category_id);
    const nextSubcategoryId = String(sub.subcategory_id);
    setCategoryId(nextCategoryId);
    setSubcategoryId(nextSubcategoryId);
    await loadAssignableUsers({
      nextCategoryId,
      nextSubcategoryId,
    });

    closePopover();
  };

  const handleBackToCategories = () => {
    setActivePanel("categories");
    setHoveredCat(null);
  };

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setCategoryId("");
    setSubcategoryId("");
    setPriorityId("");
    setAssignTo([]);
    setAllocatedTo([]);
    setAssignableUsers([]);
    setAttachments([]);
  };

  const handleSubmit = async () => {
    if (!categoryId) {
      setToast({ open: true, severity: "error", message: "Category is required" });
      return;
    }
    if (!priorityId) {
      setToast({ open: true, severity: "error", message: "Priority is required" });
      return;
    }
    if (!subject.trim()) {
      setToast({ open: true, severity: "error", message: "Subject is required" });
      return;
    }

    const plainText = description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

    if (!plainText) {
      setToast({ open: true, severity: "error", message: "Description is required" });
      return;
    }

    try {
      setLoading(true);
      await createTicket({
        subject,
        description,
        category_id: Number(categoryId),
        subcategory_id: subcategoryId ? Number(subcategoryId) : null,
        priority_id: Number(priorityId),
        assigned_to_user_code: assignTo.length > 0 ? assignTo[0] : null, // Limit assign_to to only 1 person
        allocated_to_user_code: allocatedTo.length > 0 ? allocatedTo.join("|") : null,
        due_date: dueDate || null,
        tags,
        is_recurring: recurring,
        submit_for_another_user: submitForAnotherUser,
      }, attachments);

      setToast({ open: true, severity: "success", message: "Ticket created successfully" });
      resetForm();
      setTimeout(() => navigate("/tickets"), 1000);
    } catch (error: unknown) {
      console.error(error);
      setToast({
        open: true,
        severity: "error",
        message: getTicketErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const subPanel = hoveredCat
    ? allSubCategories[String(hoveredCat.category_id)] || []
    : [];

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 820 }}>

        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Typography sx={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Tickets
          </Typography>
          <Typography sx={{ color: "var(--text-secondary)" }}>›</Typography>
          <Typography sx={{ fontSize: 14, color: "var(--text-h)" }}>
            New
          </Typography>
        </Box>

        <Card
          sx={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {/* Header */}
          <Box sx={{ px: 4, py: 3, borderBottom: "1px solid var(--border)" }}>
            <Typography component="h2" sx={{ fontSize: 24, fontWeight: 600, color: "var(--text-h)" }}>
              New ticket
            </Typography>
          </Box>

          {/* Card Body */}
          <Box sx={{ p: 3 }}>

            {/* Submit on behalf */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Switch
                checked={submitForAnotherUser}
                onChange={(e) => setSubmitForAnotherUser(e.target.checked)}
              />
              <Typography sx={{ color: "var(--text)", fontSize: 14 }}>
                Submit on behalf of another user
              </Typography>
            </Box>

            {/* Category + Priority row */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3, alignItems: "center" }}>

              <Button
                variant="outlined"
                size="small"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={openPopover}
                sx={{
                  height: 40,
                  minWidth: 260,
                  justifyContent: "space-between",
                  textTransform: "none",
                  color: categoryId ? "var(--text-h)" : "var(--text-secondary)",
                  borderColor: popoverOpen ? "#635BFF" : "var(--border)",
                  background: "var(--bg-app)",
                  fontWeight: 400,
                  fontSize: 14,
                  "&:hover": {
                    borderColor: "#635BFF",
                    background: "var(--bg-app)",
                  },
                }}
              >
                Category - {categoryBtnLabel}
              </Button>

              <Popover
  open={popoverOpen}
  anchorEl={categoryAnchorEl}
  onClose={closePopover}
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "left",
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "left",
  }}
  slotProps={{
    paper: {
      sx: {
        mt: 0.5,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        borderRadius: "10px",
        overflow: "hidden",
        width: 240,
        maxHeight: 360,
      },
    },
  }}
>
  <Box
    sx={{
      
      width: 240,
      
      overflow: "hidden",
    }}
  >
    {/* Categories Panel */}

    <Box
  sx={{
    width: 480,
    display: "flex",
    alignItems: "flex-start", // <-- ADD HERE
    transform:
      activePanel === "categories"
        ? "translateX(0)"
        : "translateX(-240px)",
    transition: "transform 250ms ease",
  }}
>
  {/* Categories Panel */}

  <Box
    sx={{
      ...panelSx,
      width: 240,
      flexShrink: 0,
    }}
  >
    <Box
      sx={
        !categoryId && !subcategoryId
          ? selectedItemSx
          : menuItemSx
      }
      onClick={() => {
        setCategoryId("");
        setSubcategoryId("");
        setAssignTo([]);
        setAssignableUsers([]);
        closePopover();
      }}
    >
      (Select category)
    </Box>

    <Box
      sx={{
        height: 1,
        background: "var(--border)",
        mx: 2,
        my: "4px",
      }}
    />

    {categories.map((cat) => {
      const subs =
        allSubCategories[
          String(cat.category_id)
        ] || [];

      const isSelected =
        String(cat.category_id) ===
        categoryId;

      return (
        <Box
          key={cat.category_id}
          sx={
            isSelected
              ? selectedItemSx
              : menuItemSx
          }
          onClick={() =>
            handleCategoryClick(cat)
          }
        >
          <span>{cat.category_name}</span>

          {subs.length > 0 && (
            <KeyboardArrowRightIcon
              sx={{
                fontSize: 16,
                opacity: 0.6,
              }}
            />
          )}
        </Box>
      );
    })}
  </Box>

  {/* Subcategory Panel */}

  <Box
    sx={{
      ...panelSx,
      width: 240,
      flexShrink: 0,
    }}
  >
    <Box
      sx={{
        ...menuItemSx,
        color: "var(--text-secondary)",
        fontSize: 13,
      }}
      onClick={handleBackToCategories}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <KeyboardArrowLeftIcon
          sx={{ fontSize: 16 }}
        />
        <span>
          {hoveredCat?.category_name}
        </span>
      </Box>
    </Box>

    <Box
      sx={{
        height: 1,
        background: "var(--border)",
        mx: 2,
        my: "4px",
      }}
    />

    {hoveredCat && (
      <Box
        sx={
          categoryId === String(hoveredCat.category_id) && !subcategoryId
            ? selectedItemSx
            : menuItemSx
        }
        onClick={() => handleCategoryOnlyClick(hoveredCat)}
      >
        General ticket
      </Box>
    )}

    {subPanel.length === 0 ? (
      <Box
        sx={{
          px: 2,
          py: 2,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        No subcategories
      </Box>
    ) : (
      subPanel.map((sub) => {
        const isSelected =
          String(
            hoveredCat?.category_id
          ) === categoryId &&
          String(
            sub.subcategory_id
          ) === subcategoryId;

        return (
          <Box
            key={sub.subcategory_id}
            sx={
              isSelected
                ? selectedItemSx
                : menuItemSx
            }
            onClick={() =>
              handleSubcategoryClick(sub)
            }
          >
            {sub.subcategory_name}
          </Box>
        );
      })
    )}
  </Box>
</Box>
  </Box>
</Popover>

              <FormControl sx={{ minWidth: 160 }}>
                <Select
                  value={priorityId}
                  displayEmpty
                  onChange={(e) => setPriorityId(e.target.value)}
                  size="small"
                  sx={{
                    background: "var(--bg-app)",
                    color: priorityId ? "var(--text-h)" : "var(--text-secondary)",
                  }}
                >
                  <MenuItem value="" disabled>
                    Priority
                  </MenuItem>
                  {priorities.map((pri) => (
                    <MenuItem key={pri.priority_id} value={String(pri.priority_id)}>
                      {pri.priority_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Subject */}
            <TextField
              fullWidth
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              size="small"
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": { background: "var(--bg-app)" },
              }}
            />

            <RichTextEditor
              value={description}
              onChange={setDescription}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />


            {/* Advanced Section */}
            <Collapse in={showAdvanced}>
              <Box
                sx={{
                  mt: 3,
                  pb: 5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <TextField
                  size="small"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{
                    width: 150,
                    "& .MuiOutlinedInput-root": { background: "var(--bg-app)" },
                  }}
                />

                <FormControl sx={{ minWidth: 200 }}>
                  <Select
                    value={assignTo[0] || ""}
                    displayEmpty
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignTo(val ? [val] : []);
                    }}
                    size="small"
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: "var(--text-secondary)" }}>(Assigned to)</span>;
                      }
                      const user = assignableUsers.find((u) => u.user_code === selected);
                      return user ? `${user.first_name} ${user.last_name}` : selected;
                    }}
                    sx={{
                      background: "var(--bg-app)",
                      color: assignTo.length > 0 ? "var(--text-h)" : "var(--text-secondary)",
                    }}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {assignableUsers.map((user) => (
                      <MenuItem key={user.user_code} value={user.user_code}>
                        {user.first_name} {user.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  placeholder="Tags..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  sx={{
                    width: 220,
                    "& .MuiOutlinedInput-root": { background: "var(--bg-app)" },
                  }}
                />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                  />
                  <Typography sx={{ color: "var(--text)", fontSize: 14 }}>
                    Recurring
                  </Typography>
                  <Typography sx={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    (you'll be able to set the schedule at the next step)
                  </Typography>
                </Box>
              </Box>
            </Collapse>

            {/* Footer */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="contained"
                disabled={loading}
                onClick={handleSubmit}
                sx={{
                  background: "#211b5a",
                  color: "#fff",
                  textTransform: "none",
                  minWidth: 100,
                  "&.Mui-disabled": { color: "#fff" },
                  "&:hover": { background: "#211b5a" },
                }}
              >
                {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Submit"}
              </Button>

              <Button
                variant="contained"
                onClick={() => setShowAdvanced(!showAdvanced)}
                sx={{
                  background: "var(--bg-header)",
                  color: "var(--text)",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { background: "var(--bg-row-hover)" },
                }}
              >
                Advanced...
              </Button>
            </Box>
          </Box>
        </Card>

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          <Alert severity={toast.severity} sx={{ width: "100%" }}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default NewTicketPage;
