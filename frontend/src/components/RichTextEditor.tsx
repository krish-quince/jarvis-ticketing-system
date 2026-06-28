import { useEffect, useState, useRef, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { SxProps, Theme } from "@mui/material/styles";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";

import RichTextToolbar from "./RichTextToolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import UploadIcon from "@mui/icons-material/Upload";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface Props {
  value: string;
  onChange: (html: string) => void;
  attachments?: File[];
  onAttachmentsChange?: (attachments: File[]) => void;
  autoFocus?: boolean;
  minHeight?: number | string;
  sx?: SxProps<Theme>;
}

const RichTextEditor = ({
  value,
  onChange,
  attachments = [],
  onAttachmentsChange,
  autoFocus = false,
  minHeight = 300,
  sx,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleCaptureScreen = async () => {
    if (!onAttachmentsChange) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      
      video.onloadedmetadata = () => {
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
                const reader = new FileReader();
                reader.onloadend = () => {
                  setScreenshotPreview(reader.result as string);
                  setCapturedFile(file);
                };
                reader.readAsDataURL(file);
              }
            }, "image/png");
          }
          stream.getTracks().forEach((track) => track.stop());
        }, 500);
      };
    } catch (err) {
      console.warn("Screen capture cancelled or failed:", err);
    }
  };

  const extensions = useMemo(() => [
    StarterKit,
    Image.configure({
      allowBase64: true,
      resize: {
        enabled: true,
        directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
        alwaysPreserveAspectRatio: true,
      },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    TextStyle,
    Color,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
  ], []);

  const editor = useEditor({
    extensions,

    content: value,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return;

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !autoFocus) return;

    window.requestAnimationFrame(() => {
      editor.commands.focus("end");
    });
  }, [autoFocus, editor]);

  if (!editor) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !onAttachmentsChange) return;

    onAttachmentsChange([...attachments, ...Array.from(files)]);
    event.target.value = "";
  };

  const removeAttachment = (indexToRemove: number) => {
    if (!onAttachmentsChange) return;

    onAttachmentsChange(
      attachments.filter((_, index) => index !== indexToRemove)
    );
  };

  return (
    <Box sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <RichTextToolbar editor={editor} />

      <Box
        sx={{
          border: "1px solid #d8dce3",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          minHeight,
          position: "relative",

          "& .ProseMirror": {
            minHeight,
            padding: "16px",
            paddingBottom: onAttachmentsChange ? "48px" : "16px",
            outline: "none",
            backgroundColor: "#fff",
          },

          "& .ProseMirror em, & .ProseMirror i": {
            fontStyle: "italic",
          },

          "& .ProseMirror p": {
            margin: "0 0 12px 0",
          },

          "& .ProseMirror h1": {
            fontSize: "2rem",
            marginBottom: "12px",
          },

          "& .ProseMirror h2": {
            fontSize: "1.5rem",
            marginBottom: "10px",
          },

          "& .ProseMirror h3": {
            fontSize: "1.25rem",
            marginBottom: "8px",
          },

          "& .ProseMirror img": {
            maxWidth: "100%",
            height: "auto",
            borderRadius: "6px",
            display: "block",
            margin: "10px 0",
          },
        }}
      >
        <EditorContent editor={editor} />

        {onAttachmentsChange && (
          <>
            <Button
              onClick={handleOpenMenu}
              sx={{
                position: "absolute",
                bottom: 12,
                right: 12,
                zIndex: 10,
                minWidth: "auto",
                padding: "4px 8px",
                color: "var(--text-secondary)",
                backgroundColor: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <AttachFileIcon sx={{ fontSize: 20 }} />
              {attachments.length > 0 && (
                <Box
                  sx={{
                    backgroundColor: "#e2e8f0",
                    color: "#475569",
                    borderRadius: "10px",
                    px: 1,
                    py: 0.2,
                    fontSize: 11,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 16,
                    height: 16,
                  }}
                >
                  {attachments.length}
                </Box>
              )}
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 200,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    p: 0,
                    mt: -1.5,
                  },
                },
              }}
            >
              {attachments.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid #f1f5f9",
                    gap: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 150,
                    }}
                    title={file.name}
                  >
                    {file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(index);
                    }}
                    sx={{
                      color: "#ff4d4f",
                      padding: 0.2,
                      "&:hover": {
                        backgroundColor: "rgba(255, 77, 79, 0.08)",
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}

              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  fileInputRef.current?.click();
                }}
                sx={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AttachFileIcon sx={{ fontSize: 16, color: "var(--text-secondary)" }} />
                attach a file...
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  handleCloseMenu();
                  await handleCaptureScreen();
                }}
                sx={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <VideocamOutlinedIcon sx={{ fontSize: 16, color: "var(--text-secondary)" }} />
                Capture screen
              </MenuItem>
            </Menu>

            <input
              hidden
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <Dialog
              open={Boolean(screenshotPreview)}
              onClose={() => {
                setScreenshotPreview(null);
                setCapturedFile(null);
              }}
              maxWidth="md"
              fullWidth
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: "12px",
                    p: 2,
                    position: "relative",
                    overflow: "hidden",
                  },
                },
              }}
            >
              <IconButton
                onClick={() => {
                  setScreenshotPreview(null);
                  setCapturedFile(null);
                }}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: "var(--text-secondary)",
                  "&:hover": {
                    color: "var(--text)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>

              <DialogContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                  mt: 2,
                }}
              >
                {screenshotPreview && (
                  <Box
                    component="img"
                    src={screenshotPreview}
                    alt="Screenshot Preview"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "60vh",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      objectFit: "contain",
                    }}
                  />
                )}
              </DialogContent>

              <DialogActions
                sx={{
                  justifyContent: "center",
                  gap: 2,
                  pb: 2,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    if (capturedFile && onAttachmentsChange) {
                      onAttachmentsChange([...attachments, capturedFile]);
                    }
                    setScreenshotPreview(null);
                    setCapturedFile(null);
                  }}
                  sx={{
                    backgroundColor: "#211b5a",
                    color: "#fff",
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "#16123f",
                    },
                  }}
                >
                  Save
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setScreenshotPreview(null);
                    setCapturedFile(null);
                    setTimeout(() => {
                      handleCaptureScreen();
                    }, 100);
                  }}
                  sx={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "var(--text-secondary)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  Retake
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<DeleteOutlinedIcon />}
                  onClick={() => {
                    setScreenshotPreview(null);
                    setCapturedFile(null);
                  }}
                  sx={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "var(--text-secondary)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  Discard
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>
    </Box>
  );
};

export default RichTextEditor;
