import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Avatar,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Search,
  People,
  AdminPanelSettings,
  Engineering,
  Person,
  Business,
  KeyboardArrowDown,
  Close,
} from "@mui/icons-material";

import { getUsersWithAllData, updateUser } from "../services/userService";
import {
  ACTION_FETCH_MAP,
  buildBulkPayload,
  buildUserUpdatePayload,
  getAvatarColor,
  getInitials,
} from "./users/userHelpers";
import { ROLE_CONFIG } from "./users/roleConfig";
import type { OptionItem, UserRecord } from "./users/userTypes";

const BarDivider = () => (
  <Box sx={{
    width: "1px", height: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center", mx: 0.5, flexShrink: 0,
  }} />
);

const UsersPage = () => {
  const navigate = useNavigate();

  const [users, setUsers]               = useState<UserRecord[]>([]);
  const [searchText, setSearchText]     = useState("");
  const [activeTab, setActiveTab]       = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionValue, setActionValue]   = useState("");
  const [bulkSaving, setBulkSaving]     = useState(false);
  const [optionsCache, setOptionsCache] = useState<Record<string, OptionItem[]>>({});
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);
  const isSuperAdmin = Number(currentUser.role_id) === 4;


  const fetchUsers = async () => {
    try {
      const data = await getUsersWithAllData();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const prefetchAllOptions = async () => {
    await Promise.allSettled(
      Object.entries(ACTION_FETCH_MAP).map(async ([label, entry]) => {
        try {
          const raw = await entry.fetch();
          const normalised = entry.normalise(raw ?? []);
          setOptionsCache((prev) => ({ ...prev, [label]: normalised }));
        } catch (err) {
          console.error(`Prefetch failed for "${label}":`, err);
        }
      })
    );
  };

  useEffect(() => {
    if (![1, 4].includes(Number(currentUser.role_id))) { navigate("/tickets"); return; }
    Promise.all([fetchUsers(), prefetchAllOptions()]);
  }, [currentUser, navigate]);


  const handleActionClick = (label: string) => {
    setActiveAction(label);
    setActionValue("");
  };

  const handleBulkSave = async () => {
    if (!activeAction || !actionValue) return;
    const payload = buildBulkPayload(activeAction, actionValue);
    if (Object.keys(payload).length === 0) return;

    setBulkSaving(true);
    try {
      await Promise.all(
        selectedUsers.map((userCode) => {
          const user = users.find((item) => item.user_code === userCode);

          if (!user) {
            return Promise.resolve();
          }

          return updateUser(
            userCode,
            buildUserUpdatePayload(user, payload),
          );
        })
      );
      await fetchUsers();
    } catch (err) {
      console.error("Bulk update failed:", err);
    } finally {
      setBulkSaving(false);
      setSelectedUsers([]);
      setActiveAction(null);
      setActionValue("");
    }
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    setActionValue("");
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
    setActiveAction(null);
    setActionValue("");
  };


  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (searchText.trim()) {
      const t = searchText.toLowerCase();
      list = list.filter((u) =>
        u.user_code?.toLowerCase().includes(t)  ||
        u.email?.toLowerCase().includes(t)      ||
        u.first_name?.toLowerCase().includes(t) ||
        u.last_name?.toLowerCase().includes(t),
      );
    }
    if (activeTab === "admins")      list = list.filter((u) => Number(u.role_id) === 1);
    if (activeTab === "technicians") list = list.filter((u) => Number(u.role_id) === 2);
    if (activeTab === "regular")     list = list.filter((u) => Number(u.role_id) > 2);
    return list;
  }, [users, searchText, activeTab]);

  const countByRole = useMemo(() => ({
    all:         users.length,
    regular:     users.filter((u) => Number(u.role_id) > 2).length,
    technicians: users.filter((u) => Number(u.role_id) === 2).length,
    admins:      users.filter((u) => [1, 4].includes(Number(u.role_id))).length,
  }), [users]);

  const tabs = [
    { key: "all",         label: "All Users",   icon: <People sx={{ fontSize: 15 }} />,            count: countByRole.all },
    { key: "regular",     label: "Regular",     icon: <Person sx={{ fontSize: 15 }} />,             count: countByRole.regular },
    { key: "technicians", label: "Technicians", icon: <Engineering sx={{ fontSize: 15 }} />,        count: countByRole.technicians },
    { key: "admins",      label: "Admins",      icon: <AdminPanelSettings sx={{ fontSize: 15 }} />, count: countByRole.admins },
  ];

  const filteredUserCodes = useMemo(
    () => filteredUsers.map((user) => user.user_code),
    [filteredUsers],
  );
  const visibleSelectedCount = filteredUserCodes.filter((userCode) =>
    selectedUsers.includes(userCode),
  ).length;
  const allSelected  = filteredUserCodes.length > 0 && visibleSelectedCount === filteredUserCodes.length;
  const someSelected = visibleSelectedCount > 0 && !allSelected;
  const currentOptions: OptionItem[] = activeAction ? (optionsCache[activeAction] ?? []) : [];


  const actionBtnSx = {
    color: "#fff",
    textTransform: "none" as const,
    fontSize: 13,
    fontWeight: 500,
    px: 1.5,
    py: 1.25,
    borderRadius: 0,
    "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "var(--bg)", p: 3 }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography
              onClick={() => navigate("/admin")}
              sx={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 500, cursor: "pointer", "&:hover": { color: "var(--accent)" } }}
            >
              Administration
            </Typography>
            <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>›</Typography>
            <Typography sx={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>Users</Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--text-h)", letterSpacing: "-0.3px" }}>
            Users & Permissions
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/admin/users/new")}
          sx={{
            backgroundColor: "var(--accent)",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            color: "#fff",
            px: 2.5,
            py: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            "&:hover": { backgroundColor: "var(--accent-dark, var(--accent))", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
          }}
        >
          Add User
        </Button>
      </Box>

      {/* Layout */}
      <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 3, alignItems: "start" }}>

        {/* Sidebar */}
        <Box>
          <TextField
            fullWidth size="small" placeholder="Search users…"
            value={searchText} onChange={(e) => setSearchText(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 16, color: "var(--text-sub)" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--bg-card)", borderRadius: "10px", fontSize: 13,
                "& fieldset": { borderColor: "var(--border)" },
                "&:hover fieldset": { borderColor: "var(--accent)" },
              },
            }}
          />

          <Paper elevation={0} sx={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", mb: 2 }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid var(--border)" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Filter by Role
              </Typography>
            </Box>
            {tabs.map((tab, i) => (
              <Box
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  px: 2, py: 1.25, cursor: "pointer",
                  borderBottom: i < tabs.length - 1 ? "1px solid var(--border)" : "none",
                  backgroundColor: activeTab === tab.key ? "rgba(99,102,241,0.07)" : "transparent",
                  transition: "background 0.15s",
                  "&:hover": { backgroundColor: activeTab === tab.key ? "rgba(99,102,241,0.07)" : "var(--bg-row-hover)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ color: activeTab === tab.key ? "var(--accent)" : "var(--text-sub)" }}>{tab.icon}</Box>
                  <Typography sx={{ fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? "var(--accent)" : "var(--text)" }}>
                    {tab.label}
                  </Typography>
                </Box>
                <Typography sx={{
                  fontSize: 11, fontWeight: 600,
                  color: activeTab === tab.key ? "var(--accent)" : "var(--text-sub)",
                  backgroundColor: activeTab === tab.key ? "rgba(99,102,241,0.1)" : "var(--bg)",
                  px: 1, py: 0.25, borderRadius: "6px", minWidth: 22, textAlign: "center",
                }}>
                  {tab.count}
                </Typography>
              </Box>
            ))}
          </Paper>

          <Paper elevation={0} sx={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid var(--border)" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Manage
              </Typography>
            </Box>
            {[
              { icon: <Business sx={{ fontSize: 15 }} />, label: "Companies" },
              { icon: <People sx={{ fontSize: 15 }} />,   label: "Departments" },
            ].map((item, i, arr) => (
              <Box
                key={item.label}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  px: 2, py: 1.25, cursor: "pointer",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  color: "var(--text-sub)",
                  "&:hover": { backgroundColor: "var(--bg-row-hover)", color: "var(--text)" },
                  transition: "all 0.15s",
                }}
              >
                {item.icon}
                <Typography sx={{ fontSize: 13 }}>{item.label}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>

        {/* Table area */}
        <Box>

          {/* Bulk action bar */}
          {selectedUsers.length > 0 && (
            <Box sx={{
              display: "flex",
              alignItems: "center",
              mb: 1.5,
              backgroundColor: "var(--accent)",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              minHeight: 44,
            }}>
              {activeAction ? (
                // Inline dropdown mode
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, width: "100%" }}>
                  <Select
                    size="small"
                    displayEmpty
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    IconComponent={KeyboardArrowDown}
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      fontSize: 13,
                      minWidth: 180,
                      height: 34,
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                      "& .MuiSelect-icon": { color: "var(--accent)" },
                      "& .MuiSelect-select": { color: actionValue ? "inherit" : "rgba(0,0,0,0.4)" },
                    }}
                  >
                    <MenuItem value="" disabled sx={{ fontSize: 13 }}>
                      Select {activeAction}…
                    </MenuItem>
                    {currentOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>

                  <Button
                    size="small"
                    variant="contained"
                    disabled={!actionValue || bulkSaving}
                    onClick={handleBulkSave}
                    sx={{
                      backgroundColor: "#fff",
                      color: "var(--accent)",
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: "none",
                      borderRadius: "8px",
                      px: 2.5,
                      height: 34,
                      minWidth: 80,
                      boxShadow: "none",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.9)", boxShadow: "none" },
                      "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.55)" },
                    }}
                  >
                    {bulkSaving
                      ? <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={12} sx={{ color: "var(--accent)" }} />
                          Saving…
                        </Box>
                      : "Save"
                    }
                  </Button>

                  <Button
                    size="small"
                    onClick={handleCancelAction}
                    disabled={bulkSaving}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.18)",
                      color: "#fff",
                      fontWeight: 500,
                      fontSize: 13,
                      textTransform: "none",
                      borderRadius: "8px",
                      px: 2.5,
                      height: 34,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.28)" },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                // Default buttons mode
                <Box sx={{ display: "flex", alignItems: "stretch", width: "100%" }}>
                  {[
                    ...(isSuperAdmin ? ["Company"] : []),
                    "Department",
                    "Role",
                  ].map((label) => (
                    <Button
                      key={label}
                      size="small"
                      endIcon={<KeyboardArrowDown sx={{ fontSize: "14px !important", opacity: 0.75 }} />}
                      onClick={() => handleActionClick(label)}
                      sx={actionBtnSx}
                    >
                      {label}
                    </Button>
                  ))}

                  <BarDivider />

                  <Button
                    size="small"
                    endIcon={<KeyboardArrowDown sx={{ fontSize: "14px !important", opacity: 0.75 }} />}
                    onClick={() => handleActionClick("Enable email notifications")}
                    sx={actionBtnSx}
                  >
                    Enable email notifications
                  </Button>

                  <BarDivider />

                  <Button size="small" sx={actionBtnSx}>Disable</Button>
                  <Button size="small" sx={{ ...actionBtnSx, color: "rgba(255,215,215,1)" }}>Delete</Button>

                  <Box sx={{ flexGrow: 1 }} />

                  <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 1.5 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500 }}>
                      {selectedUsers.length} selected
                    </Typography>
                    <Close
                      onClick={handleClearSelection}
                      sx={{ fontSize: 15, color: "rgba(255,255,255,0.55)", cursor: "pointer", "&:hover": { color: "#fff" } }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "var(--bg-header, var(--bg))" }}>
                  <TableCell padding="checkbox" sx={{ pl: 2, borderBottom: "1px solid var(--border)" }}>
                    <input
                      type="checkbox"
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      checked={allSelected}
                      onChange={(e) =>
                        setSelectedUsers((prev) => (
                          e.target.checked
                            ? Array.from(new Set([...prev, ...filteredUserCodes]))
                            : prev.filter((userCode) => !filteredUserCodes.includes(userCode))
                        ))
                      }
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  </TableCell>
                  {["User", "Name", "Email", "Role", "Company", "Department"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.05em", color: "var(--text-sub)",
                        borderBottom: "1px solid var(--border)", py: 1.5, whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <People sx={{ fontSize: 36, color: "var(--border)" }} />
                        <Typography sx={{ color: "var(--text-sub)", fontSize: 14 }}>No users found</Typography>
                        {searchText && (
                          <Typography sx={{ color: "var(--text-sub)", fontSize: 12 }}>Try adjusting your search</Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const roleId     = Number(user.role_id);
                    const role       = ROLE_CONFIG[roleId] ?? ROLE_CONFIG[3];
                    const isSelected = selectedUsers.includes(user.user_code);

                    return (
                      <TableRow
                        key={user.user_code}
                        hover
                        sx={{
                          cursor: "pointer",
                          backgroundColor: isSelected ? "rgba(99,102,241,0.04)" : "transparent",
                          "& td": { borderBottom: "1px solid var(--border)" },
                          "&:last-child td": { borderBottom: "none" },
                          "&:hover": { backgroundColor: "var(--bg-row-hover)" },
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              setSelectedUsers((prev) =>
                                e.target.checked
                                  ? [...prev, user.user_code]
                                  : prev.filter((id) => id !== user.user_code),
                              )
                            }
                            style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 1.25 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, backgroundColor: getAvatarColor(user.user_code || ""), flexShrink: 0 }}>
                              {getInitials(user.first_name, user.last_name)}
                            </Avatar>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", fontFamily: "monospace" }}>
                              {user.user_code}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap" }}>
                            {user.first_name} {user.last_name}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>{user.email}</Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.25 }}>
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: "6px", backgroundColor: role.bg, color: role.color }}>
                            {role.icon}
                            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{role.label}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 12, color: "var(--text)" }}>
                            {user.company_name || user.company_code || <span style={{ color: "var(--text-sub)" }}>—</span>}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 12, color: "var(--text)" }}>
                            {user.department_name || <span style={{ color: "var(--text-sub)" }}>—</span>}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>
              Showing {filteredUsers.length} of {users.length} users
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default UsersPage;
