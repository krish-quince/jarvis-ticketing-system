import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { createTicket } from "../services/ticketService";

const NewTicketPage = () => {
  const navigate = useNavigate();

  const [submitForAnotherUser, setSubmitForAnotherUser] =
    useState(false);

  const [category, setCategory] =
    useState("General Issues");

  const [priority, setPriority] =
    useState("Medium");

  const [subject, setSubject] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [toast, setToast] = useState({
    open: false,
    severity: "success" as
      | "success"
      | "error",
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

    if (!description.trim()) {
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
      });

      setToast({
        open: true,
        severity: "success",
        message:
          "Ticket created successfully",
      });

      setTimeout(() => {
        navigate("/tickets");
      }, 1000);
    } catch (error: any) {
      console.error(error);

      setToast({
        open: true,
        severity: "error",
        message:
          error?.response?.data
            ?.message ||
          "Failed to create ticket",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Breadcrumb */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        <Typography
          sx={{
            color:
              "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          Tickets
        </Typography>

        <Typography>/</Typography>

        <Typography
          sx={{
            color: "var(--text-h)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          New
        </Typography>
      </Box>

      {/* Main Card */}

      <Card
        sx={{
          borderRadius: "10px",
          border:
            "1px solid var(--border)",
          backgroundColor:
            "var(--bg-card)",
          boxShadow: "none",
          p: 4,
          maxWidth: 1050,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: "var(--text-h)",
            fontWeight: 500,
          }}
        >
          New Ticket
        </Typography>

        {/* Submit for another user */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Switch
            checked={
              submitForAnotherUser
            }
            onChange={(e) =>
              setSubmitForAnotherUser(
                e.target.checked
              )
            }
          />

          <Typography
            sx={{
              color: "var(--text)",
            }}
          >
            Submit on behalf of another
            user
          </Typography>
        </Box>

        {/* Category + Priority */}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <FormControl
            sx={{
              minWidth: 280,
            }}
          >
            <InputLabel>
              Category
            </InputLabel>

            <Select
              value={category}
              label="Category"
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
            >
              <MenuItem value="General Issues">
                General Issues
              </MenuItem>

              <MenuItem value="Technical">
                Technical
              </MenuItem>

              <MenuItem value="Bug reports">
                Bug reports
              </MenuItem>

              <MenuItem value="Network">
                Network
              </MenuItem>

              <MenuItem value="Software">
                Software
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl
            sx={{
              minWidth: 220,
            }}
          >
            <InputLabel>
              Priority
            </InputLabel>

            <Select
              value={priority}
              label="Priority"
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
            >
              <MenuItem value="Low">
                Low
              </MenuItem>

              <MenuItem value="Medium">
                Medium
              </MenuItem>

              <MenuItem value="High">
                High
              </MenuItem>

              <MenuItem value="Critical">
                Critical
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Subject */}

        <TextField
          fullWidth
          placeholder="Subject"
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          sx={{
            mb: 3,
          }}
        />

        {/* Editor */}

        <Card
          sx={{
            border:
              "1px solid var(--border)",
            boxShadow: "none",
            overflow: "hidden",
            mb: 3,
          }}
        >
          {/* Fake toolbar */}

          <Box
            sx={{
              height: 48,
              borderBottom:
                "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              px: 2,
              gap: 2,
              color:
                "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            B
            <Divider
              orientation="vertical"
              flexItem
            />
            I
            <Divider
              orientation="vertical"
              flexItem
            />
            U
            <Divider
              orientation="vertical"
              flexItem
            />
            Link
            <Divider
              orientation="vertical"
              flexItem
            />
            Image
          </Box>

          <TextField
            fullWidth
            multiline
            rows={12}
            placeholder="Details"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            variant="outlined"
            sx={{
              "& fieldset": {
                border: "none",
              },
            }}
          />
        </Card>

        {/* Attachment */}

        <Box
          sx={{
            mb: 3,
          }}
        >
          <Button
            variant="outlined"
            component="label"
          >
            Attach File

            <input
              hidden
              type="file"
            />
          </Button>
        </Box>

        {/* Actions */}

        <Box
          sx={{
            display: "flex",
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleSubmit}
            sx={{
              backgroundColor:
                "#5B4CF0",
              color: "#fff",
              minWidth: 120,
              textTransform: "none",

              "&:hover": {
                backgroundColor:
                  "#4737E5",
              },
            }}
          >
            {loading ? (
              <CircularProgress
                size={20}
                sx={{
                  color: "#fff",
                }}
              />
            ) : (
              "Submit"
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate("/tickets")
            }
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="outlined"
            sx={{
              textTransform: "none",
            }}
          >
            Advanced...
          </Button>
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
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewTicketPage;
