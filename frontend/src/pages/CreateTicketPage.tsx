import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import CodeIcon from "@mui/icons-material/Code";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LinkIcon from "@mui/icons-material/Link";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../services/ticketService";
import { getCategories } from "../services/categoryService";
import { getPriorities } from "../services/priorityService";
import { getUsers } from "../services/userService";

const CreateTicketPage = () => {
  const navigate = useNavigate();
  const descriptionEditorRef =
    useRef<HTMLDivElement | null>(null);
  const [
    cannedAnchorEl,
    setCannedAnchorEl,
  ] = useState<null | HTMLElement>(null);

  const storedUser = useMemo(() => {
    const rawUser = localStorage.getItem("user");

    return rawUser ? JSON.parse(rawUser) : null;
  }, []);

  const isAdmin =
    ["admin", "manager"].includes(
      String(storedUser?.roleName || "")
        .toLowerCase()
    );

  const [formData, setFormData] =
    useState({
      category_id: "",
      priority_id: "",
      subject: "",
      description: "",
      assigned_to: "",
      due_date: "",
      recurring: false,
    });
  const [categories, setCategories] =
    useState<any[]>([]);
  const [priorities, setPriorities] =
    useState<any[]>([]);
  const [users, setUsers] =
    useState<any[]>([]);

  const cannedResponses = [
    "Thank you for raising this ticket. We are reviewing the details and will update you shortly.",
    "Can you please share the steps to reproduce this issue and any screenshots if available?",
    "This ticket has been assigned to the relevant team for further action.",
  ];

  const descriptionTools = [
    {
      label: "Bold",
      icon: <FormatBoldIcon />,
    },
    {
      label: "Italic",
      icon: <FormatItalicIcon />,
    },
    {
      label: "Underline",
      icon: <FormatUnderlinedIcon />,
    },
    {
      label: "Align",
      icon: <FormatAlignLeftIcon />,
    },
    {
      label: "Heading",
      text: "H1",
    },
    {
      label: "Bullets",
      icon: <FormatListBulletedIcon />,
    },
    {
      label: "Link",
      icon: <LinkIcon />,
    },
    {
      label: "Image",
      icon: <ImageIcon />,
    },
    {
      label: "Checklist",
      icon: <CheckCircleIcon />,
    },
    {
      label: "Emoji",
      icon: <SentimentSatisfiedAltIcon />,
    },
    {
      label: "Attachment",
      icon: <AttachFileIcon />,
    },
    {
      label: "File",
      icon: <InsertDriveFileOutlinedIcon />,
    },
    {
      label: "Clear",
      icon: <CloseIcon />,
    },
    {
      label: "Code",
      icon: <CodeIcon />,
    },
  ];

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [
          categoryRows,
          priorityRows,
          userRows,
        ] = await Promise.all([
          getCategories(),
          getPriorities(),
          getUsers(),
        ]);

        setCategories(categoryRows);
        setPriorities(priorityRows);
        setUsers(userRows);
      } catch (error) {
        console.error(error);
        alert(
          "Failed to load ticket form data"
        );
      }
    };

    loadLookups();
  }, []);

  const handleChange = (
    e: any
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const setDescriptionHtml = (
    html: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      description: html,
    }));
  };

  const syncDescriptionFromEditor = () => {
    setDescriptionHtml(
      descriptionEditorRef.current
        ?.innerHTML || ""
    );
  };

  const runEditorCommand = (
    command: string,
    value?: string
  ) => {
    const editor =
      descriptionEditorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(
      command,
      false,
      value
    );
    syncDescriptionFromEditor();
  };

  const insertHtml = (html: string) => {
    runEditorCommand(
      "insertHTML",
      html
    );
  };

  const handleDescriptionTool = (
    label: string
  ) => {
    switch (label) {
      case "Bold":
        runEditorCommand("bold");
        break;
      case "Italic":
        runEditorCommand("italic");
        break;
      case "Underline":
        runEditorCommand("underline");
        break;
      case "Align":
        runEditorCommand("justifyLeft");
        break;
      case "Heading":
        runEditorCommand(
          "formatBlock",
          "h1"
        );
        break;
      case "Bullets":
        runEditorCommand(
          "insertUnorderedList"
        );
        break;
      case "Link": {
        const url =
          window.prompt(
            "Enter link URL"
          ) || "";

        if (url) {
          runEditorCommand(
            "createLink",
            url
          );
        }
        break;
      }
      case "Image": {
        const url =
          window.prompt(
            "Enter image URL"
          ) || "";

        if (url) {
          runEditorCommand(
            "insertImage",
            url
          );
        }
        break;
      }
      case "Checklist":
        insertHtml(
          '<label><input type="checkbox" /> Task</label><br />'
        );
        break;
      case "Emoji":
        runEditorCommand(
          "insertText",
          ":)"
        );
        break;
      case "Attachment":
        insertHtml(
          "<span>[Attachment: file-name]</span>"
        );
        break;
      case "File":
        insertHtml(
          "<span>[File: file-name]</span>"
        );
        break;
      case "Clear":
        if (
          descriptionEditorRef.current
        ) {
          descriptionEditorRef.current.innerHTML =
            "";
        }
        setDescriptionHtml("");
        break;
      case "Code":
        runEditorCommand(
          "formatBlock",
          "pre"
        );
        break;
      default:
        break;
    }
  };

  const handleCannedResponse = (
    response: string
  ) => {
    insertHtml(`<p>${response}</p>`);
    setCannedAnchorEl(null);
  };

  const handleSubmit = async () => {
    try {
      const ticketData = {
        subject: formData.subject,
        description:
          formData.description,
        category_id: Number(
          formData.category_id
        ),
        priority_id: Number(
          formData.priority_id
        ),
        assigned_to_user_code:
          isAdmin && formData.assigned_to
            ? formData.assigned_to
            : null,
        due_date:
          formData.due_date || null,
        is_recurring:
          formData.recurring,
      };

      const response =
        await createTicket(ticketData);

      console.log(response);

      alert(
        "Ticket Created Successfully"
      );

      navigate("/tickets");
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create ticket"
      );
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 1000,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: "#3A3482",
            fontWeight: 600,
          }}
        >
          New Ticket
        </Typography>

        <Grid
          container
          spacing={3}
        >
          <Grid size={6}>
            <TextField
              select
              fullWidth
              label="Category"
              name="category_id"
              value={
                formData.category_id
              }
              onChange={
                handleChange
              }
            >
              {categories.map(
                (category) => (
                  <MenuItem
                    key={
                      category.category_id
                    }
                    value={
                      category.category_id
                    }
                  >
                    {
                      category.category_name
                    }
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>

          <Grid size={6}>
            <TextField
              select
              fullWidth
              label="Priority"
              name="priority_id"
              value={
                formData.priority_id
              }
              onChange={
                handleChange
              }
            >
              {priorities.map(
                (priority) => (
                  <MenuItem
                    key={
                      priority.priority_id
                    }
                    value={
                      priority.priority_id
                    }
                  >
                    {
                      priority.priority_name
                    }
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                border:
                  "1px solid #d8dce3",
                borderBottom: 0,
                borderRadius:
                  "8px 8px 0 0",
                bgcolor: "#f8f9fb",
                minHeight: 48,
                px: 1.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexWrap: "wrap",
                }}
              >
                {descriptionTools.map(
                  (tool, index) => (
                    <Fragment key={tool.label}>
                      <IconButton
                        size="small"
                        title={tool.label}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() =>
                          handleDescriptionTool(
                            tool.label
                          )
                        }
                        sx={{
                          width: 30,
                          height: 30,
                          color: "#3f4652",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {tool.text ||
                          tool.icon}
                      </IconButton>
                      {index === 2 ||
                      index === 5 ||
                      index === 11 ? (
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{
                            ml: 1,
                            height: 18,
                          }}
                        />
                      ) : null}
                    </Fragment>
                  )
                )}
              </Box>

              <Button
                size="small"
                variant="text"
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={(event) =>
                  setCannedAnchorEl(
                    event.currentTarget
                  )
                }
                sx={{
                  color: "#2f3746",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Canned responses
                <KeyboardArrowDownIcon
                  sx={{
                    ml: 0.5,
                    fontSize: 18,
                  }}
                />
              </Button>
              <Menu
                anchorEl={cannedAnchorEl}
                open={Boolean(
                  cannedAnchorEl
                )}
                onClose={() =>
                  setCannedAnchorEl(null)
                }
              >
                {cannedResponses.map(
                  (response) => (
                    <MenuItem
                      key={response}
                      onClick={() =>
                        handleCannedResponse(
                          response
                        )
                      }
                      sx={{
                        maxWidth: 420,
                        whiteSpace:
                          "normal",
                      }}
                    >
                      {response}
                    </MenuItem>
                  )
                )}
              </Menu>
            </Box>

            <Box
              ref={descriptionEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={
                syncDescriptionFromEditor
              }
              sx={{
                minHeight: 220,
                p: 2,
                border:
                  "1px solid #d8dce3",
                borderRadius:
                  "0 0 8px 8px",
                bgcolor: "#fff",
                color: "#1f2937",
                outline: "none",
                textAlign: "left",
                "&:focus": {
                  borderColor: "#3A3482",
                  boxShadow:
                    "0 0 0 1px #3A3482",
                },
                "&:empty:before": {
                  content: '"Description"',
                  color: "#9ca3af",
                },
                "& h1": {
                  fontSize: 26,
                  margin: "8px 0",
                },
                "& pre": {
                  bgcolor: "#f3f4f6",
                  borderRadius: 1,
                  p: 1,
                  whiteSpace: "pre-wrap",
                },
              }}
            />
          </Grid>

          <Grid size={4}>
            <TextField
              select
              fullWidth
              label="Assigned To"
              name="assigned_to"
              value={
                formData.assigned_to
              }
              onChange={handleChange}
              disabled={!isAdmin}
            >
              <MenuItem value="">
                Unassigned
              </MenuItem>
              {users.map((user) => (
                <MenuItem
                  key={user.user_code}
                  value={user.user_code}
                >
                  {user.first_name}{" "}
                  {user.last_name} (
                  {user.role_name})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={4}>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              name="due_date"
              value={formData.due_date}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={
                    formData.recurring
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      recurring:
                        event.target.checked,
                    })
                  }
                />
              }
              label="Recurring Ticket"
            />
          </Grid>

          <Grid size={12}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                bgcolor: "#3A3482",
                color: "#FFFFFF",
                px: 5,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#2D2866",
                },
              }}
            >
              Submit Ticket
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CreateTicketPage;
