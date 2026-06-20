import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from "@mui/material";
import { useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  FormatListBulleted,
  FormatListNumbered,
} from "@mui/icons-material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  FormatClear,
  CheckBox,
  Title,
  EmojiEmotions,
  FormatColorText,
} from "@mui/icons-material";

import EmojiPicker from "emoji-picker-react";

interface RichTextToolbarProps {
  editor: Editor | null;
}

const RichTextToolbar = ({ editor }: RichTextToolbarProps) => {
  const [headingAnchor, setHeadingAnchor] =
    useState<null | HTMLElement>(null);

  const [alignAnchor, setAlignAnchor] =
    useState<null | HTMLElement>(null);

  const [emojiAnchor, setEmojiAnchor] =
    useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const insertLink = () => {
    const url = prompt("Enter URL");

    if (!url) return;

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({
          src: reader.result as string,
          alt: file.name,
        })
        .run();
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0.5,
        p: 1,
        borderBottom: "1px solid #ddd",
        backgroundColor: "#f8f9fb",
      }}
    >
      {/* Bold */}

      <Tooltip title="Bold">
  <IconButton
    size="small"
    onClick={() =>
      editor
        .chain()
        .focus()
        .toggleBold()
        .run()
    }
  >
    <FormatBold />
  </IconButton>
</Tooltip>

      {/* Italic */}

      <Tooltip title="Italic">
        <IconButton
          size="small"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          <FormatItalic />
        </IconButton>
      </Tooltip>

      {/* Underline */}

      <Tooltip title="Underline">
        <IconButton
          size="small"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
        >
          <FormatUnderlined />
        </IconButton>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
      />

      {/* Heading */}

      <Tooltip title="Heading">
        <IconButton
          size="small"
          onClick={(e) =>
            setHeadingAnchor(
              e.currentTarget
            )
          }
        >
          <Title />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={headingAnchor}
        open={Boolean(
          headingAnchor
        )}
        onClose={() =>
          setHeadingAnchor(null)
        }
      >
        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .setParagraph()
              .run();
            setHeadingAnchor(null);
          }}
        >
          Paragraph
        </MenuItem>

        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 1,
              })
              .run();

            setHeadingAnchor(null);
          }}
        >
          H1
        </MenuItem>

        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run();

            setHeadingAnchor(null);
          }}
        >
          H2
        </MenuItem>

        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run();

            setHeadingAnchor(null);
          }}
        >
          H3
        </MenuItem>
      </Menu>

      {/* Align */}

      <Tooltip title="Alignment">
        <IconButton
          size="small"
          onClick={(e) =>
            setAlignAnchor(
              e.currentTarget
            )
          }
        >
          <FormatAlignLeft />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={alignAnchor}
        open={Boolean(
          alignAnchor
        )}
        onClose={() =>
          setAlignAnchor(null)
        }
      >
        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .setTextAlign("left")
              .run();

            setAlignAnchor(null);
          }}
        >
          <FormatAlignLeft />
        </MenuItem>

        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .setTextAlign("center")
              .run();

            setAlignAnchor(null);
          }}
        >
          <FormatAlignCenter />
        </MenuItem>

        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .setTextAlign("right")
              .run();

            setAlignAnchor(null);
          }}
        >
          <FormatAlignRight />
        </MenuItem>
      </Menu>

      <Divider
        orientation="vertical"
        flexItem
      />
     {/* Bullet List */}

<IconButton
  size="small"
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleBulletList()
      .run()
  }
>
  <FormatListBulleted />
</IconButton>

{/* Numbered List */}

<IconButton
  size="small"
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleOrderedList()
      .run()
  }
>
  <FormatListNumbered />
</IconButton>
      {/* Link */}

      <IconButton
        size="small"
        onClick={insertLink}
      >
        <LinkIcon />
      </IconButton>

      {/* Image */}

<IconButton
  size="small"
  onClick={() =>
    fileInputRef.current?.click()
  }
>
  <ImageIcon />
</IconButton>

<input
  type="file"
  accept="image/*"
  hidden
  ref={fileInputRef}
  onChange={handleImageUpload}
/>

      {/* Checkbox */}

      <IconButton
        size="small"
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleTaskList()
            .run()
        }
      >
        <CheckBox />
      </IconButton>

      {/* Color */}

      <label>
        <IconButton
          size="small"
          component="span"
        >
          <FormatColorText />
        </IconButton>

        <input
          type="color"
          hidden
          onChange={(e) =>
            editor
              .chain()
              .focus()
              .setColor(
                e.target.value
              )
              .run()
          }
        />
      </label>

      {/* Emoji */}

      <IconButton
        size="small"
        onClick={(e) =>
          setEmojiAnchor(
            e.currentTarget
          )
        }
      >
        <EmojiEmotions />
      </IconButton>

      <Menu
        anchorEl={emojiAnchor}
        open={Boolean(
          emojiAnchor
        )}
        onClose={() =>
          setEmojiAnchor(null)
        }
      >
        <EmojiPicker
          onEmojiClick={(emoji) => {
            editor
              .chain()
              .focus()
              .insertContent(
                emoji.emoji
              )
              .run();

            setEmojiAnchor(null);
          }}
        />
      </Menu>

      {/* Clear Formatting */}

      <IconButton
        size="small"
        onClick={() =>
          editor
            .chain()
            .focus()
            .unsetAllMarks()
            .clearNodes()
            .run()
        }
      >
        <FormatClear />
      </IconButton>
    </Box>
  );
};

export default RichTextToolbar;
