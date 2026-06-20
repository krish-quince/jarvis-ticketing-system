import { useEffect } from "react";
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
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
    ],

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
          <IconButton
            component="label"
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              zIndex: 10,
              backgroundColor: "#fff",
              border: "1px solid var(--border)",

              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <AttachFileIcon />
            <input hidden type="file" multiple onChange={handleFileUpload} />
          </IconButton>
        )}
      </Box>

      {attachments.length > 0 && (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--bg-app)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {attachments.map((file, index) => (
            <Box
              key={`${file.name}-${index}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 0.5,
                borderRadius: "6px",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Attachment: {file.name}
              </Typography>

              <IconButton
                size="small"
                onClick={() => removeAttachment(index)}
                sx={{
                  color: "var(--text-secondary)",
                  "&:hover": {
                    color: "#ff4d4f",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RichTextEditor;
