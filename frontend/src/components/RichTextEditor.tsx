import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import {Color} from "@tiptap/extension-color";
import {TaskList} from "@tiptap/extension-task-list";
import {TaskItem} from "@tiptap/extension-task-item";

import RichTextToolbar from "./RichTextToolbar";
import Box from "@mui/material/Box";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({
  value,
  onChange,
}: Props) => {

  const editor = useEditor({
    extensions: [
      StarterKit,

      

      Image,

      TextStyle,

      Color,

      TaskList,

      TaskItem.configure({
        nested: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    content: value,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <>
      <RichTextToolbar editor={editor} />

      <Box
  sx={{
    border: "1px solid #d8dce3",
    borderTop: "none",
    borderRadius: "0 0 8px 8px",
    minHeight: "300px",

    "& .ProseMirror": {
      minHeight: "300px",
      padding: "16px",
      outline: "none",
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
</Box>
    </>
  );
};

export default RichTextEditor;