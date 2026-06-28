import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
} from "@mui/material";
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import {
  getTicketById,
  createTicket,
  getTicketRecurrence,
  createTicketRecurrence,
  updateTicketRecurrence,
  deleteTicketRecurrence,
} from "../services/ticketService";

// Helper to format Date to YYYY-MM-DDTHH:mm (local time for datetime-local input)
const toLocalISOString = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

const RecurringTicketPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewTicketFlow = id === "new";
  const ticketId = isNewTicketFlow ? null : Number(id);
  const newTicketState = location.state as { ticketData: any; attachments: File[] } | null;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // Form Fields
  const [dropdownValue, setDropdownValue] = useState("ONCE");
  const [startDate, setStartDate] = useState(toLocalISOString(new Date(Date.now() + 10 * 60 * 1000))); // Default to 10 mins in future
  const [endDate, setEndDate] = useState("");
  const [reopenOriginal, setReopenOriginal] = useState(false);
  const [copyAssignee, setCopyAssignee] = useState(false);

  // Custom Recurrence Sub-fields
  const [customValue, setCustomValue] = useState(1);
  const [customUnit, setCustomUnit] = useState("WEEKLY"); // DAILY, WEEKLY, MONTHLY, YEARLY

  // Form original state (for change tracking)
  const [originalConfig, setOriginalConfig] = useState<any>(null);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (isNewTicketFlow && (!newTicketState || !newTicketState.ticketData)) {
      navigate("/tickets/new");
    }
  }, [isNewTicketFlow, newTicketState, navigate]);

  const fetchTicketAndRecurrence = async () => {
    if (isNewTicketFlow) {
      setTicket({
        subject: newTicketState?.ticketData?.subject || "New Ticket",
        ticket_no: "New",
      });
      setIsRecurring(false);
      // Default clean state
      setDropdownValue("ONCE");
      setStartDate(toLocalISOString(new Date(Date.now() + 10 * 60 * 1000)));
      setEndDate("");
      setReopenOriginal(false);
      setCopyAssignee(false);
      setCustomValue(1);
      setCustomUnit("WEEKLY");

      const config = {
        dropdownValue: "ONCE",
        startDate: toLocalISOString(new Date(Date.now() + 10 * 60 * 1000)),
        endDate: "",
        reopenOriginal: false,
        copyAssignee: false,
        customValue: 1,
        customUnit: "WEEKLY",
      };
      setOriginalConfig(config);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ticketData = await getTicketById(ticketId!);
      setTicket(ticketData);

      const recurrenceData = await getTicketRecurrence(ticketId!);
      if (recurrenceData && recurrenceData.is_active) {
        setIsRecurring(true);
        setStartDate(toLocalISOString(recurrenceData.start_date));
        setEndDate(recurrenceData.end_date ? toLocalISOString(recurrenceData.end_date) : "");
        setReopenOriginal(recurrenceData.reopen_original);
        setCopyAssignee(recurrenceData.copy_assignee);

        // Map backend recurrence settings to dropdown
        const type = recurrenceData.recurrence_type;
        const interval = recurrenceData.interval_value;

        let mappedVal = "CUSTOM";
        if (type === "ONCE") mappedVal = "ONCE";
        else if (type === "DAILY" && interval === 1) mappedVal = "DAILY";
        else if (type === "DAILY_WORKDAYS") mappedVal = "DAILY_WORKDAYS";
        else if (type === "WEEKLY" && interval === 1) mappedVal = "WEEKLY";
        else if (type === "WEEKLY" && interval === 2) mappedVal = "BI_WEEKLY";
        else if (type === "MONTHLY" && interval === 1) mappedVal = "MONTHLY";
        else if (type === "MONTHLY_ON_DAY_X") mappedVal = "MONTHLY_ON_DAY_X";
        else if (type === "MONTHLY" && interval === 2) mappedVal = "BI_MONTHLY";
        else if (type === "MONTHLY" && interval === 3) mappedVal = "QUARTERLY";
        else if (type === "MONTHLY" && interval === 6) mappedVal = "HALF_YEAR";
        else if (type === "YEARLY" && interval === 1) mappedVal = "YEARLY";

        setDropdownValue(mappedVal);
        if (mappedVal === "CUSTOM") {
          setCustomValue(interval);
          setCustomUnit(type);
        }

        const config = {
          dropdownValue: mappedVal,
          startDate: toLocalISOString(recurrenceData.start_date),
          endDate: recurrenceData.end_date ? toLocalISOString(recurrenceData.end_date) : "",
          reopenOriginal: recurrenceData.reopen_original,
          copyAssignee: recurrenceData.copy_assignee,
          customValue: interval,
          customUnit: type,
        };
        setOriginalConfig(config);
      } else {
        setIsRecurring(false);
        // Default clean state
        setDropdownValue("ONCE");
        setStartDate(toLocalISOString(new Date(Date.now() + 10 * 60 * 1000)));
        setEndDate("");
        setReopenOriginal(false);
        setCopyAssignee(false);
        setCustomValue(1);
        setCustomUnit("WEEKLY");

        const config = {
          dropdownValue: "ONCE",
          startDate: toLocalISOString(new Date(Date.now() + 10 * 60 * 1000)),
          endDate: "",
          reopenOriginal: false,
          copyAssignee: false,
          customValue: 1,
          customUnit: "WEEKLY",
        };
        setOriginalConfig(config);
      }
    } catch (error: any) {
      console.error("Failed to load recurrence configuration:", error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to load recurrence configuration",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketAndRecurrence();
  }, [ticketId, isNewTicketFlow]);

  // Compute if form has changed from original values
  const hasChanges = () => {
    if (isNewTicketFlow) return true;
    if (!originalConfig) return false;
    const currentConfig = {
      dropdownValue,
      startDate,
      endDate,
      reopenOriginal,
      copyAssignee,
      customValue,
      customUnit,
    };
    return JSON.stringify(currentConfig) !== JSON.stringify(originalConfig);
  };

  const handleSave = async () => {
    // Validate dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      setToast({ open: true, message: "Please specify a valid start date", severity: "error" });
      return;
    }
    if (start.getTime() < Date.now() - 5 * 60 * 1000) {
      setToast({ open: true, message: "Start repeating date cannot be in the past.", severity: "error" });
      return;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        setToast({ open: true, message: "Please specify a valid end date", severity: "error" });
        return;
      }
      if (end.getTime() <= start.getTime()) {
        setToast({ open: true, message: "End Date must be after Start Date.", severity: "error" });
        return;
      }
    }

    setSaving(true);

    // Map dropdown to database type and interval
    let type = "ONCE";
    let interval = 1;

    switch (dropdownValue) {
      case "ONCE":
        type = "ONCE";
        interval = 1;
        break;
      case "DAILY":
        type = "DAILY";
        interval = 1;
        break;
      case "DAILY_WORKDAYS":
        type = "DAILY_WORKDAYS";
        interval = 1;
        break;
      case "WEEKLY":
        type = "WEEKLY";
        interval = 1;
        break;
      case "BI_WEEKLY":
        type = "WEEKLY";
        interval = 2;
        break;
      case "MONTHLY":
        type = "MONTHLY";
        interval = 1;
        break;
      case "MONTHLY_ON_DAY_X":
        type = "MONTHLY_ON_DAY_X";
        interval = 1;
        break;
      case "BI_MONTHLY":
        type = "MONTHLY";
        interval = 2;
        break;
      case "QUARTERLY":
        type = "MONTHLY";
        interval = 3;
        break;
      case "HALF_YEAR":
        type = "MONTHLY";
        interval = 6;
        break;
      case "YEARLY":
        type = "YEARLY";
        interval = 1;
        break;
      case "CUSTOM":
        type = customUnit;
        interval = customValue;
        break;
    }

    const payload = {
      recurrence_type: type,
      interval_value: interval,
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      reopen_original: reopenOriginal,
      copy_assignee: copyAssignee,
    };

    try {
      if (isNewTicketFlow) {
        if (!newTicketState || !newTicketState.ticketData) {
          throw new Error("No ticket data to submit.");
        }
        // 1. Create the ticket in the backend
        const createdTicket = await createTicket(newTicketState.ticketData, newTicketState.attachments || []);
        
        // 2. Create the recurrence settings for the newly created ticket
        await createTicketRecurrence(createdTicket.ticket_id, payload);

        setToast({ open: true, message: "Ticket and Recurrence created successfully.", severity: "success" });
        setTimeout(() => navigate("/tickets"), 1000);
      } else {
        if (isRecurring) {
          await updateTicketRecurrence(ticketId!, payload);
          setToast({ open: true, message: "Recurrence settings updated successfully.", severity: "success" });
        } else {
          await createTicketRecurrence(ticketId!, payload);
          setToast({ open: true, message: "Recurrence configured successfully.", severity: "success" });
        }
        await fetchTicketAndRecurrence();
      }
    } catch (error: any) {
      console.error("Failed to save recurrence configuration:", error);
      setToast({
        open: true,
        message: error.response?.data?.message || error.message || "Failed to save configuration",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisableRecurrence = async () => {
    if (!window.confirm("Are you sure you want to disable recurrence for this ticket?")) {
      return;
    }
    setSaving(true);
    try {
      await deleteTicketRecurrence(ticketId!);
      setToast({ open: true, message: "Recurrence settings disabled.", severity: "success" });
      await fetchTicketAndRecurrence();
    } catch (error: any) {
      console.error("Failed to disable recurrence:", error);
      setToast({
        open: true,
        message: error.response?.data?.message || "Failed to disable recurrence",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 850, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link
          underline="hover"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => navigate("/tickets")}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
        </Link>
        {isNewTicketFlow ? (
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/tickets/new")}
          >
            New Ticket
          </Link>
        ) : (
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(`/tickets/${ticket?.ticket_id || ticketId!}`)}
          >
            Ticket {ticket?.ticket_no ? `#${ticket.ticket_no}` : ""}
          </Link>
        )}
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          Recurring
        </Typography>
      </Breadcrumbs>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: "1px solid var(--border, #e0e0e0)",
            backgroundColor: "var(--bg-card, #fff)",
            p: 3,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header Status */}
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 4, color: "var(--text-h, #333)" }}
            >
              {isRecurring ? "This ticket is recurring" : "This ticket is not recurring"}
            </Typography>

            <Grid container spacing={3.5}>
              {/* Recurrence Dropdown */}
              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, color: "var(--text, #555)" }}>
                  Recurring:
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={dropdownValue}
                    onChange={(e) => setDropdownValue(e.target.value)}
                    sx={{ borderRadius: "6px" }}
                  >
                    <MenuItem value="ONCE">Repeat once</MenuItem>
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="DAILY_WORKDAYS">Daily on workdays</MenuItem>
                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                    <MenuItem value="BI_WEEKLY">Bi-Weekly</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="MONTHLY_ON_DAY_X">Monthly on day X...</MenuItem>
                    <MenuItem value="BI_MONTHLY">Bi-Monthly</MenuItem>
                    <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="HALF_YEAR">Half-year</MenuItem>
                    <MenuItem value="YEARLY">Yearly</MenuItem>
                    <MenuItem value="CUSTOM">Custom...</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Custom Recurrence Options */}
              {dropdownValue === "CUSTOM" && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                    <Typography sx={{ fontWeight: 600, color: "var(--text, #555)", pl: 2 }}>
                      Every:
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <TextField
                        type="number"
                        size="small"
                        value={customValue}
                        onChange={(e) => setCustomValue(Math.max(1, Number(e.target.value)))}
                        sx={{ width: 100, "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                      />
                      <FormControl size="small" sx={{ width: 150 }}>
                        <Select
                           value={customUnit}
                           onChange={(e) => setCustomUnit(e.target.value)}
                           sx={{ borderRadius: "6px" }}
                        >
                          <MenuItem value="DAILY">Days</MenuItem>
                          <MenuItem value="WEEKLY">Weeks</MenuItem>
                          <MenuItem value="MONTHLY">Months</MenuItem>
                          <MenuItem value="YEARLY">Years</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                </>
              )}

              {/* Start Date Picker */}
              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, color: "var(--text, #555)" }}>
                  Start repeating date:
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  type="datetime-local"
                  size="small"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Grid>

              {/* End Date Picker */}
              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, color: "var(--text, #555)" }}>
                  End repeating date (Optional):
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  type="datetime-local"
                  size="small"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Grid>

              {/* Toggle 1: Reopen original instead of creating new */}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={reopenOriginal}
                      onChange={(e) => setReopenOriginal(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500, color: "var(--text, #555)", fontSize: "15px" }}>
                      Reopen the original ticket instead of creating a new one
                    </Typography>
                  }
                />
              </Grid>

              {/* Toggle 2: Copy assignee and subscribers */}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={copyAssignee}
                      onChange={(e) => setCopyAssignee(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500, color: "var(--text, #555)", fontSize: "15px" }}>
                      Copy assignee and subscribers from the original ticket
                    </Typography>
                  }
                />
              </Grid>

              {/* Action Buttons */}
              <Grid size={{ xs: 12 }} sx={{ mt: 2, display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving || !hasChanges()}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    px: 3.5,
                    py: 1,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  Save
                </Button>
                
                {isRecurring && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisableRecurrence}
                    disabled={saving}
                    sx={{
                      textTransform: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      px: 3.5,
                      py: 1,
                    }}
                  >
                    Disable Recurrence
                  </Button>
                )}

                <Button
                  variant="outlined"
                  onClick={() => {
                    if (isNewTicketFlow) {
                      navigate("/tickets");
                    } else {
                      navigate(`/tickets/${ticket?.ticket_id || ticketId!}`);
                    }
                  }}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    borderColor: "var(--border, #ccc)",
                    color: "var(--text, #555)",
                    px: 3.5,
                    py: 1,
                    "&:hover": {
                      borderColor: "var(--border-hover, #999)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>

            {/* Bottom Link */}
            <Box sx={{ mt: 4, borderTop: "1px solid var(--border, #e0e0e0)", pt: 2 }}>
              <Link
                underline="hover"
                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, fontSize: "14px", fontWeight: 500 }}
                onClick={() => navigate("/tickets")}
              >
                all scheduled tickets...
              </Link>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecurringTicketPage;
