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
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  HelpOutlineOutlined,
  Home,
  ChevronRight,
} from "@mui/icons-material";
import { getCompanySettings, updateCompanySettings } from "../services/masterService";

const getLogoUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url}`;
};

const GeneralSettingsPage = () => {
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");



  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string>("");

  const [helpdeskTitle, setHelpdeskTitle] = useState("");
  const [titleLink, setTitleLink] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const settings = await getCompanySettings();
      if (settings?.logo_url) {
        setLogoPreview(getLogoUrl(settings.logo_url));
      }
      if (settings?.favicon_url) {
        setFaviconPreview(getLogoUrl(settings.favicon_url));
      }
      setHelpdeskTitle(settings?.helpdesk_title || "");
      setTitleLink(settings?.title_link || "");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load company settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError("");
      const formData = new FormData();
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      if (faviconFile) {
        formData.append("favicon", faviconFile);
      }

      formData.append("helpdesk_title", helpdeskTitle);
      formData.append("title_link", titleLink);

      await updateCompanySettings(formData);
      setSuccessMsg("Changes saved successfully.");
      
      // Reload settings to refresh urls
      await loadSettings();
      
      // Force trigger topbar to update (e.g. by dispatching a custom event)
      window.dispatchEvent(new Event("company-settings-updated"));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          General settings
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
              General settings
            </Typography>
          </Box>
        </Box>

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
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Design Section Card */}
      <Paper 
        elevation={0} 
        sx={{ 
          border: "1px solid var(--border)", 
          borderRadius: "8px", 
          overflow: "hidden", 
          backgroundColor: "#fff",
          mb: 3
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
            Design
          </Typography>
          <IconButton size="small" sx={{ color: "#2E24AA" }}>
            <HelpOutlineOutlined sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Logo and Favicon input layout */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
            
            {/* Logo field */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                Logo image:
              </Typography>
              <Typography sx={{ fontSize: 12, color: "var(--text-sub)", mb: 1 }}>
                (displayed at top left, before the title)
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {logoPreview && (
                  <Box 
                    component="img" 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    sx={{ width: 80, height: "auto", maxHeight: 60, objectFit: "contain", border: "1px solid var(--border)", borderRadius: "4px", p: 0.5 }}
                  />
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                />
                
                <Button
                  onClick={() => logoInputRef.current?.click()}
                  sx={{ 
                    color: "#2E24AA", 
                    textTransform: "none", 
                    fontWeight: 500, 
                    fontSize: 14,
                    p: 0,
                    minWidth: 0,
                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" } 
                  }}
                >
                  attach a file...
                </Button>
              </Box>
              {logoFile && (
                <Typography sx={{ fontSize: 12, color: "green", mt: 0.5 }}>
                  Selected: {logoFile.name}
                </Typography>
              )}
            </Box>

            {/* Favicon field */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)" }}>
                Favicon image:
              </Typography>
              <Typography sx={{ fontSize: 12, color: "transparent", mb: 1, userSelect: "none" }}>
                placeholder
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {faviconPreview && (
                  <Box 
                    component="img" 
                    src={faviconPreview} 
                    alt="Favicon Preview" 
                    sx={{ width: 32, height: 32, objectFit: "contain", border: "1px solid var(--border)", borderRadius: "4px", p: 0.5 }}
                  />
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  ref={faviconInputRef}
                  onChange={handleFaviconChange}
                  style={{ display: "none" }}
                />
                
                <Button
                  onClick={() => faviconInputRef.current?.click()}
                  sx={{ 
                    color: "#2E24AA", 
                    textTransform: "none", 
                    fontWeight: 500, 
                    fontSize: 14,
                    p: 0,
                    minWidth: 0,
                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" } 
                  }}
                >
                  attach a file...
                </Button>
              </Box>
              {faviconFile && (
                <Typography sx={{ fontSize: 12, color: "green", mt: 0.5 }}>
                  Selected: {faviconFile.name}
                </Typography>
              )}
            </Box>

            {/* Divider */}
            <Box sx={{ gridColumn: "span 2" }}>
              <Divider sx={{ my: 1 }} />
            </Box>

            {/* Helpdesk title and Title link row */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4, gridColumn: "span 2" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)", mb: 0.5 }}>
                  Helpdesk title (displayed on top):
                </Typography>
                <input
                  type="text"
                  value={helpdeskTitle}
                  onChange={(e) => setHelpdeskTitle(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    color: "var(--text-h)",
                    backgroundColor: "#fff",
                    outline: "none"
                  }}
                  placeholder="Quincecapital Helpdesk"
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14, color: "var(--text-h)", mb: 0.5 }}>
                  Title link (optional):
                </Typography>
                <input
                  type="text"
                  value={titleLink}
                  onChange={(e) => setTitleLink(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    color: "var(--text-h)",
                    backgroundColor: "#fff",
                    outline: "none"
                  }}
                  placeholder="http://my-company.com"
                />
              </Box>
            </Box>

            {/* Save changes button inside card */}
            <Box sx={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", mt: 2 }}>
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
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </Box>

          </Box>
        </Box>
      </Paper>

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

export default GeneralSettingsPage;
