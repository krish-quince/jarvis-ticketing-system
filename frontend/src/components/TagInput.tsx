import { useState, useEffect, useMemo } from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";
import { getTags, type Tag } from "../services/tagService";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

const DEFAULT_COLOR = "#635BFF";

const TagInput = ({ value, onChange, disabled = false, placeholder = "Type a tag..." }: Props) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    let isMounted = true;

    getTags()
      .then((tags) => {
        if (isMounted) setAvailableTags(tags || []);
      })
      .catch((error) => {
        console.error("Failed to load tags", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const colorByName = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((tag) => {
      map.set(tag.tag_name.toLowerCase(), tag.tag_color || DEFAULT_COLOR);
    });
    return map;
  }, [availableTags]);

  const suggestionNames = useMemo(
    () => availableTags.map((tag) => tag.tag_name),
    [availableTags],
  );

  const addTag = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    const alreadyExists = value.some(
      (existing) => existing.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyExists) {
      setInputValue("");
      return;
    }

    if (value.length >= 25) return;

    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (nameToRemove: string) => {
    onChange(value.filter((tag) => tag !== nameToRemove));
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      disabled={disabled}
      options={suggestionNames}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue, reason) => {
        if (reason === "input") setInputValue(newInputValue);
      }}
      onChange={(_event, newValue, reason) => {
        if (reason === "removeOption" || reason === "clear") {
          onChange(newValue as string[]);
          return;
        }
        // For createOption / selectOption, route through addTag so
        // de-dupe and the 25-tag cap stay consistent.
        const lastItem = (newValue as string[])[(newValue as string[]).length - 1];
        if (lastItem !== undefined) {
          addTag(lastItem);
        }
      }}
      filterSelectedOptions
      renderValue={(selectedValues, getItemProps) =>
        (selectedValues as string[]).map((option, index) => {
          const color = colorByName.get(option.toLowerCase()) || DEFAULT_COLOR;
          const { key, onDelete, ...itemProps } = getItemProps({ index });
          return (
            <Chip
              key={key}
              label={option}
              size="small"
              onDelete={disabled ? undefined : () => removeTag(option)}
              {...itemProps}
              sx={{
                backgroundColor: `${color}1A`,
                color,
                fontWeight: 600,
                border: `1px solid ${color}40`,
              }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length === 0 ? placeholder : ""}
          size="small"
          onKeyDown={(event) => {
            if (event.key === "Enter" && inputValue.trim()) {
              event.preventDefault();
              addTag(inputValue);
            }
          }}
        />
      )}
    />
  );
};

export default TagInput;
