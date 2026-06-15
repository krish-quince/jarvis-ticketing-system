import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import AttachFileIcon from "@mui/icons-material/AttachFile";

import { createTicket } from "../services/ticketService";
import "trix";
import "trix/dist/trix.css";
import { useEffect, useRef } from "react";

const NewTicketPage = () => {
  const navigate = useNavigate();

  const [submitForAnotherUser, setSubmitForAnotherUser] = useState(false);

  const [category, setCategory] = useState("General Issues");

  const [priority, setPriority] = useState("Medium");

  const [subject, setSubject] = useState("");

  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [tags, setTags] = useState("");
  const [asset, setAsset] = useState("");
  const [recurring, setRecurring] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    severity: "success" as "success" | "error",
    message: "",
  });

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setToast({
        open: true,
        severity: "error",
        message: "Subject is required",
      });
      return;
    }

    const plainText = description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

    if (!plainText) {
      setToast({
        open: true,
        severity: "error",
        message: "Description is required",
      });

      return;
    }

    try {
      setLoading(true);

      await createTicket({
        subject,
        description,

        category,
        priority,

        category_name: category,
        priority_name: priority,

        due_date: dueDate || null,

        assigned_to_user_code: assignedTo || null,

        tags,

        asset,

        is_recurring: recurring,

        submit_for_another_user: submitForAnotherUser,
      });

      setToast({
        open: true,
        severity: "success",
        message: "Ticket created successfully",
      });

      setTimeout(() => {
        navigate("/tickets");
      }, 1000);
    } catch (error: any) {
      console.error(error);

      setToast({
        open: true,
        severity: "error",
        message: error?.response?.data?.message || "Failed to create ticket",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const editor = document.querySelector("trix-editor") as HTMLElement | null;

    if (!editor) return;

    const handleChange = (event: any) => {
      setDescription(event.target.value);
    };

    editor.addEventListener("trix-change", handleChange);

    return () => {
      editor.removeEventListener("trix-change", handleChange);
    };
  }, []);

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) return;

    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 820,
        }}
      >
        {/* Breadcrumb */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            Tickets
          </Typography>

          <Typography>›</Typography>

          <Typography
            sx={{
              fontSize: 14,
              color: "var(--text-h)",
            }}
          >
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

          <Box
            sx={{
              px: 4,
              py: 3,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-h)",
              }}
            >
              New ticket
            </Typography>
          </Box>

          {/* Body */}

          <Box
            sx={{
              p: 3,
            }}
          >
            {/* Submit on behalf */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Switch
                checked={submitForAnotherUser}
                onChange={(e) => setSubmitForAnotherUser(e.target.checked)}
              />

              <Typography
                sx={{
                  color: "var(--text)",
                  fontSize: 14,
                }}
              >
                Submit on behalf of another user
              </Typography>
            </Box>

            {/* Category + Priority */}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                mb: 3,
              }}
            >
              <FormControl
                sx={{
                  width: 300,
                }}
              >
                <Select
                  value={category}
                  displayEmpty
                  onChange={(e) => setCategory(e.target.value)}
                  size="small"
                >
                  <MenuItem value="General Issues">General Issues</MenuItem>

                  <MenuItem value="Technical - Bug Reports">
                    Technical - Bug Reports
                  </MenuItem>

                  <MenuItem value="Technical - Feature Requests">
                    Technical - Feature Requests
                  </MenuItem>

                  <MenuItem value="Technical - Jarvis Bugs">
                    Technical - Jarvis Bugs
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl
                sx={{
                  width: 180,
                }}
              >
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  size="small"
                >
                  <MenuItem value="Low">Low</MenuItem>

                  <MenuItem value="Medium">Normal</MenuItem>

                  <MenuItem value="High">High</MenuItem>

                  <MenuItem value="Critical">Critical</MenuItem>
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

                "& .MuiOutlinedInput-root": {
                  background: "var(--bg-app)",
                },
              }}
            />

            {/* Editor */}

            <Box
              sx={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                overflow: "hidden",
                mb: 2,

                "& .trix-toolbar": {
                  background: "var(--bg-header)",
                  borderBottom: "1px solid var(--border)",
                  padding: "8px",
                },

                "& .trix-button-group": {
                  border: "none",
                },

                "& trix-editor": {
                  minHeight: "280px",
                  border: "none",
                  outline: "none",
                  padding: "16px",
                  background: "var(--bg-card)",
                  color: "var(--text)",
                },

                "& .trix-content": {
                  color: "var(--text)",
                },

                "& .trix-button": {
                  background: "transparent",
                  border: "none",
                },
              }}
            >
              <input id="ticket-description" type="hidden" name="description" />

              <trix-editor input="ticket-description" placeholder="Details" />
            </Box>

            {/* Attachment */}

            {attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {attachments.map((file, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    📎 {file.name}
                  </Typography>
                ))}
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
              }}
            >
              <IconButton
                component="label"
                sx={{
                  color: "var(--text-secondary)",
                }}
              >
                <AttachFileIcon />

                <input
                  hidden
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                />
              </IconButton>
            </Box>

            {/* Advanced */}

            <Collapse in={showAdvanced} className="">
              <Box
                sx={{
                  mt: 3,
                  paddingBottom: 5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <TextField
                  size="small"
                  placeholder="Due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    width: 150,
                    "& .MuiOutlinedInput-root": {
                      background: "var(--bg-app)",
                    },
                  }}
                />

                <FormControl
                  size="small"
                  sx={{
                    width: 170,
                  }}
                >
                  <Select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <MenuItem value="">(Assigned to)</MenuItem>

                    <MenuItem value="admin">Admin</MenuItem>

                    <MenuItem value="tech1">Tech 1</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  placeholder="Tags..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  sx={{
                    width: 220,
                    "& .MuiOutlinedInput-root": {
                      background: "var(--bg-app)",
                    },
                  }}
                />

                <TextField
                  size="small"
                  placeholder="type an asset..."
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  sx={{
                    width: 220,
                    "& .MuiOutlinedInput-root": {
                      background: "var(--bg-app)",
                    },
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Switch
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                  />

                  <Typography
                    sx={{
                      color: "var(--text)",
                      fontSize: 14,
                    }}
                  >
                    Recurring
                  </Typography>

                  <Typography
                    sx={{
                      color: "var(--text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    (you'll be able to set the schedule at the next step)
                  </Typography>
                </Box>
              </Box>
            </Collapse>

            {/* Footer */}

            <Box
              sx={{
                display: "flex",
                gap: 1.5,
              }}
            >
              <Button
                variant="contained"
                disabled={loading}
                onClick={handleSubmit}
                sx={{
                  background: "#635BFF",

                  textTransform: "none",

                  minWidth: 100,

                  "&:hover": {
                    background: "#5449ff",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={18}
                    sx={{
                      color: "#fff",
                    }}
                  />
                ) : (
                  "Submit"
                )}
              </Button>

              <Button
                variant="contained"
                onClick={() => setShowAdvanced(!showAdvanced)}
                sx={{
                  background: "var(--bg-header)",
                  color: "var(--text)",

                  textTransform: "none",

                  boxShadow: "none",

                  "&:hover": {
                    background: "var(--bg-row-hover)",
                  },
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
          onClose={() =>
            setToast((prev) => ({
              ...prev,
              open: false,
            }))
          }
        >
          <Alert
            severity={toast.severity}
            sx={{
              width: "100%",
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default NewTicketPage;
