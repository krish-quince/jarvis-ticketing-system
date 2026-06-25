import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack,
  HelpOutlineOutlined,
  Home,
  ChevronRight,
  InfoOutlined,
  Delete,
  CheckCircle,
} from "@mui/icons-material";
import {
  getEmailConfigs,
  createEmailConfig,
  updateEmailConfig,
  activateEmailConfig,
  deleteEmailConfig,
} from "../services/emailConfigService";

interface EmailConfig {
  id: number;
  config_name: string;
  smtp_host: string;
  smtp_port: number | null;
  smtp_user: string;
  smtp_pass: string;
  email_from_name: string;
  welcome_subject: string;
  welcome_template: string;
  send_welcome_email: boolean;
  send_ticket_assignment_email: boolean;
  send_chat_reply_email: boolean;
  send_ticket_update_email: boolean;
  send_reply_email: boolean;
  is_active: boolean;
}

const EmailSettingsPage = () => {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | "new">("new");

  // Form Fields
  const [configName, setConfigName] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [welcomeSubject, setWelcomeSubject] = useState("");
  const [welcomeTemplate, setWelcomeTemplate] = useState("");

  // Notification Toggles
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [sendTicketAssignmentEmail, setSendTicketAssignmentEmail] = useState(true);
  const [sendChatReplyEmail, setSendChatReplyEmail] = useState(true);
  const [sendTicketUpdateEmail, setSendTicketUpdateEmail] = useState(true);
  const [sendReplyEmail, setSendReplyEmail] = useState(true);

  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  const MASKED_PASSWORD = "••••••••";

  const placeholders = [
    { tag: "{{first_name}}", desc: "First name of the user" },
    { tag: "{{last_name}}", desc: "Last name of the user" },
    { tag: "{{user_code}}", desc: "Username / code for logging in" },
    { tag: "{{password}}", desc: "Temporary password generated" },
    { tag: "{{email}}", desc: "Email address of the user" },
    { tag: "{{role}}", desc: "Assigned role name (e.g. Agent, Admin)" },
    { tag: "{{company_name}}", desc: "Name of the company" },
    { tag: "{{department}}", desc: "Department name of the user" },
  ];

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async (selectIdAfterLoad?: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await getEmailConfigs();
      setConfigs(data);

      if (data.length > 0) {
        // If a specific ID is requested, select it. Otherwise select the active config.
        const active = data.find((c: EmailConfig) => c.is_active);
        const targetId = selectIdAfterLoad || active?.id || data[0].id;
        setSelectedConfigId(targetId);
        populateForm(data.find((c: EmailConfig) => c.id === targetId));
      } else {
        setSelectedConfigId("new");
        clearForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load email configurations.");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (config?: EmailConfig) => {
    if (!config) return;
    setConfigName(config.config_name || "");
    setSmtpHost(config.smtp_host || "");
    setSmtpPort(config.smtp_port ? String(config.smtp_port) : "");
    setSmtpUser(config.smtp_user || "");
    setEmailFromName(config.email_from_name || "");
    setWelcomeSubject(config.welcome_subject || "");
    setWelcomeTemplate(config.welcome_template || "");

    // Notification Toggles
    setSendWelcomeEmail(config.send_welcome_email !== false);
    setSendTicketAssignmentEmail(config.send_ticket_assignment_email !== false);
    setSendChatReplyEmail(config.send_chat_reply_email !== false);
    setSendTicketUpdateEmail(config.send_ticket_update_email !== false);
    setSendReplyEmail(config.send_reply_email !== false);

    if (config.smtp_pass) {
      setSmtpPass(MASKED_PASSWORD);
      setHasExistingPassword(true);
    } else {
      setSmtpPass("");
      setHasExistingPassword(false);
    }
  };

  const clearForm = () => {
    setConfigName("");
    setSmtpHost("");
    setSmtpPort("");
    setSmtpUser("");
    setSmtpPass("");
    setEmailFromName("");
    setWelcomeSubject("");
    setWelcomeTemplate("");
    setSendWelcomeEmail(true);
    setSendTicketAssignmentEmail(true);
    setSendChatReplyEmail(true);
    setSendTicketUpdateEmail(true);
    setSendReplyEmail(true);
    setHasExistingPassword(false);
  };

  const handleConfigChange = (id: number | "new") => {
    setSelectedConfigId(id);
    if (id === "new") {
      clearForm();
    } else {
      populateForm(configs.find((c) => c.id === id));
    }
  };

  const handleInsertPlaceholder = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = welcomeTemplate;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setWelcomeTemplate(before + tag + after);
    
    // Focus back and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const handleSaveChanges = async () => {
    if (!configName.trim()) {
      setError("Configuration name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: any = {
        config_name: configName,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        email_from_name: emailFromName,
        welcome_subject: welcomeSubject,
        welcome_template: welcomeTemplate,
        send_welcome_email: sendWelcomeEmail,
        send_ticket_assignment_email: sendTicketAssignmentEmail,
        send_chat_reply_email: sendChatReplyEmail,
        send_ticket_update_email: sendTicketUpdateEmail,
        send_reply_email: sendReplyEmail,
      };

      if (smtpPass !== MASKED_PASSWORD) {
        payload.smtp_pass = smtpPass;
      }

      if (selectedConfigId === "new") {
        const created = await createEmailConfig(payload);
        setSuccessMsg("Configuration created successfully.");
        await loadAllConfigs(created.id);
      } else {
        await updateEmailConfig(Number(selectedConfigId), payload);
        setSuccessMsg("Configuration saved successfully.");
        await loadAllConfigs(Number(selectedConfigId));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivateConfig = async () => {
    if (selectedConfigId === "new") return;
    try {
      setSaving(true);
      setError("");
      await activateEmailConfig(Number(selectedConfigId));
      setSuccessMsg("Configuration set as Active successfully.");
      await loadAllConfigs(Number(selectedConfigId));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to activate configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (selectedConfigId === "new") return;
    const config = configs.find((c) => c.id === selectedConfigId);
    if (config?.is_active) {
      setError("Cannot delete the active email configuration.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await deleteEmailConfig(Number(selectedConfigId));
      setSuccessMsg("Configuration deleted successfully.");
      await loadAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete configuration.");
    } finally {
      setSaving(false);
    }
  };

  const selectedConfigObj = selectedConfigId === "new" ? null : configs.find((c) => c.id === selectedConfigId);

  if (loading && configs.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "var(--bg)", p: { xs: 2, md: 4 } }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1, color: "var(--text-sub)", fontSize: 13 }}>
        <IconButton size="small" onClick={() => navigate("/tickets")} sx={{ p: 0, color: "var(--text-sub)" }}>
          <Home sx={{ fontSize: 18 }} />
        </IconButton>
        <ChevronRight sx={{ fontSize: 16 }} />
        <Typography 
          onClick={() => navigate("/admin")} 
          sx={{ cursor: "pointer", fontSize: 13, "&:hover": { textDecoration: "underline" } }}
        >
          Administration
        </Typography>
        <ChevronRight sx={{ fontSize: 16 }} />
        <Typography sx={{ fontSize: 13, color: "var(--text-sub)", fontWeight: 500 }}>
          Email settings
        </Typography>
      </Box>

      {/* Header and Save changes button */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <IconButton size="small" onClick={() => navigate("/admin")}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--text-h)" }}>
              Email settings
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          {selectedConfigObj && !selectedConfigObj.is_active && (
            <Button
              variant="outlined"
              onClick={handleActivateConfig}
              disabled={saving}
              sx={{ 
                borderColor: "#2E24AA", 
                color: "#2E24AA",
                "&:hover": { borderColor: "#1e1582", backgroundColor: "rgba(46, 36, 170, 0.04)" }, 
                textTransform: "none", 
                fontWeight: 500, 
                borderRadius: "4px",
                px: 2
              }}
            >
              Set Active
            </Button>
          )}

          {selectedConfigObj && !selectedConfigObj.is_active && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteConfig}
              disabled={saving}
              startIcon={<Delete />}
              sx={{ 
                textTransform: "none", 
                fontWeight: 500, 
                borderRadius: "4px",
                px: 2
              }}
            >
              Delete
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleSaveChanges}
            disabled={saving}
            sx={{ 
              backgroundColor: "#2E24AA", 
              "&:hover": { backgroundColor: "#1e1582" }, 
              textTransform: "none", 
              fontWeight: 500, 
              color: "#fff",
              borderRadius: "4px",
              px: 3
            }}
          >
            {saving ? "Saving..." : selectedConfigId === "new" ? "Create config" : "Save changes"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Select Config Selector Bar */}
      <Paper 
        elevation={0} 
        sx={{ 
          border: "1px solid var(--border)", 
          borderRadius: "8px", 
          p: 2, 
          mb: 3, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          backgroundColor: "#fff"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1, maxWidth: { md: 500 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="email-config-select-label">Email Configuration</InputLabel>
            <Select
              labelId="email-config-select-label"
              value={selectedConfigId}
              label="Email Configuration"
              onChange={(e) => handleConfigChange(e.target.value as number | "new")}
            >
              {configs.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.config_name} {c.is_active ? " (Active)" : ""}
                </MenuItem>
              ))}
              <MenuItem value="new" sx={{ fontWeight: 600, color: "#2E24AA" }}>
                + Add new configuration
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {selectedConfigObj?.is_active && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "green", fontSize: 14, fontWeight: 600 }}>
            <CheckCircle fontSize="small" />
            Active Configuration
          </Box>
        )}
      </Paper>

      {/* Main Grid Content */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        
        {/* Basic Config Info */}
        <Paper 
          elevation={0} 
          sx={{ 
            border: "1px solid var(--border)", 
            borderRadius: "8px", 
            overflow: "hidden", 
            backgroundColor: "#fff"
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid var(--border)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--text-h)" }}>
              Configuration Name
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: { md: "50%" } }}>
              <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                Config display name:
              </Typography>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Primary Server, Staging SMTP"
              />
            </Box>
          </Box>
        </Paper>

        {/* SMTP Configuration Section Card */}
        <Paper 
          elevation={0} 
          sx={{ 
            border: "1px solid var(--border)", 
            borderRadius: "8px", 
            overflow: "hidden", 
            backgroundColor: "#fff"
          }}
        >
          <Box 
            sx={{ 
              px: 3, 
              py: 2, 
              borderBottom: "1px solid var(--border)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between" 
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--text-h)" }}>
              Outgoing SMTP server (optional)
            </Typography>
            <IconButton size="small" sx={{ color: "#2E24AA" }}>
              <HelpOutlineOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3, mb: 3 }}>
              {/* Host */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                  SMTP server:
                </Typography>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  style={inputStyle}
                  placeholder="smtp.example.com"
                />
              </Box>

              {/* Port */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                  Port:
                </Typography>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  style={inputStyle}
                  placeholder="587"
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
              {/* Username */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                  Username / login:
                </Typography>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  style={inputStyle}
                  placeholder="user@example.com"
                />
              </Box>

              {/* Password */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                  Password:
                </Typography>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  style={inputStyle}
                  placeholder={hasExistingPassword ? "••••••••" : "Enter password"}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr" }, gap: 3 }}>
              {/* From Name */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: { md: "50%" } }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                  From Name:
                </Typography>
                <input
                  type="text"
                  value={emailFromName}
                  onChange={(e) => setEmailFromName(e.target.value)}
                  style={inputStyle}
                  placeholder="Support Team"
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Toggles Card */}
        <Paper 
          elevation={0} 
          sx={{ 
            border: "1px solid var(--border)", 
            borderRadius: "8px", 
            overflow: "hidden", 
            backgroundColor: "#fff"
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid var(--border)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--text-h)" }}>
              Email Notification Triggers
            </Typography>
          </Box>
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Send user welcome email</Typography>
                  <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>Dispatches email to new users containing username and temporary login password.</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sendTicketAssignmentEmail}
                  onChange={(e) => setSendTicketAssignmentEmail(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Send assigned to ticket email</Typography>
                  <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>Notifies support agents when a ticket is assigned to them.</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sendChatReplyEmail}
                  onChange={(e) => setSendChatReplyEmail(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Send email for reply in chat</Typography>
                  <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>Sends an update when a requester/agent posts a reply in ticket chat room.</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sendTicketUpdateEmail}
                  onChange={(e) => setSendTicketUpdateEmail(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Send mail for ticket update</Typography>
                  <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>Notifies participants of status, priority or category field updates on the ticket.</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sendReplyEmail}
                  onChange={(e) => setSendReplyEmail(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Send email for response/reply</Typography>
                  <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>Standard reply template dispatch settings.</Typography>
                </Box>
              }
            />
          </Box>
        </Paper>

        {/* Welcome Email Template Section Card */}
        <Paper 
          elevation={0} 
          sx={{ 
            border: "1px solid var(--border)", 
            borderRadius: "8px", 
            overflow: "hidden", 
            backgroundColor: "#fff"
          }}
        >
          <Box 
            sx={{ 
              px: 3, 
              py: 2, 
              borderBottom: "1px solid var(--border)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between" 
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--text-h)" }}>
              Welcome email configuration (sent to newly created users)
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Warning / Info Banner */}
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: 1.5, 
                backgroundColor: "#fffbeb", 
                border: "1px solid #fef3c7", 
                borderLeft: "4px solid #f59e0b",
                borderRadius: "4px", 
                p: 2, 
                mb: 3 
              }}
            >
              <InfoOutlined sx={{ color: "#d97706", mt: 0.25 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#92400e", mb: 0.5 }}>
                  Template Personalization
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#b45309" }}>
                  You can use dynamic placeholder variables to personalize your welcome email. Use the placeholders sidebar/list to easily copy or insert variables into your subject or HTML template body.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 1fr" }, gap: 3 }}>
              {/* Template Editor */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Subject */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                    Email Subject:
                  </Typography>
                  <input
                    type="text"
                    value={welcomeSubject}
                    onChange={(e) => setWelcomeSubject(e.target.value)}
                    style={inputStyle}
                    placeholder="Welcome to Jarvis Ticketing!"
                  />
                </Box>

                {/* HTML Template */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                    HTML Template Body:
                  </Typography>
                  <textarea
                    ref={textareaRef}
                    value={welcomeTemplate}
                    onChange={(e) => setWelcomeTemplate(e.target.value)}
                    rows={15}
                    style={textareaStyle}
                    placeholder="Enter your custom welcome email HTML template here..."
                  />
                  <Typography sx={{ fontSize: 12, color: "var(--text-sub)" }}>
                    If left blank, the system defaults to the beautifully styled native welcome email template.
                  </Typography>
                </Box>
              </Box>

              {/* Sidebar Placeholders */}
              <Box sx={{ border: "1px solid var(--border)", borderRadius: "6px", p: 2, backgroundColor: "#fafafa" }}>
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: "var(--text-h)", mb: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Dynamic Variables
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {placeholders.map((ph) => (
                    <Box 
                      key={ph.tag}
                      onClick={() => handleInsertPlaceholder(ph.tag)}
                      sx={{ 
                        cursor: "pointer", 
                        p: 1, 
                        border: "1px dashed var(--border)", 
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        "&:hover": {
                          borderColor: "#2E24AA",
                          backgroundColor: "#f5f3ff"
                        }
                      }}
                    >
                      <Typography sx={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#2E24AA" }}>
                        {ph.tag}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "var(--text-sub)", mt: 0.5 }}>
                        {ph.desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Action Button at bottom */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleSaveChanges}
            disabled={saving}
            sx={{ 
              backgroundColor: "#2E24AA", 
              "&:hover": { backgroundColor: "#1e1582" }, 
              textTransform: "none", 
              fontWeight: 500, 
              color: "#fff",
              borderRadius: "4px",
              px: 4,
              py: 1
            }}
          >
            {saving ? "Saving..." : selectedConfigId === "new" ? "Create config" : "Save changes"}
          </Button>
        </Box>

      </Box>

      {/* Success message snackbar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg("")}
        message={successMsg}
      />
    </Box>
  );
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "4px",
  border: "1px solid var(--border)",
  fontSize: 14,
  color: "var(--text-h)",
  backgroundColor: "#fff",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  padding: "12px 14px",
  borderRadius: "4px",
  border: "1px solid var(--border)",
  fontSize: 13,
  fontFamily: "Courier New, Courier, monospace",
  color: "var(--text-h)",
  backgroundColor: "#fff",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  resize: "vertical" as const,
};

export default EmailSettingsPage;
