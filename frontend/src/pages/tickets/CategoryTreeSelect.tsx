import { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Box } from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import type { MasterCategory, SubCategory } from "./ticketTypes";

type CategoryTreeSelectProps = {
  categories: MasterCategory[];
  selectedCategoryId: string;
  selectedSubCategoryId: string;
  subCategories: SubCategory[];
  onCategorySelect: (catId: string) => Promise<void>;
  onSubCategorySelect: (subId: string) => void;
};

const CategoryTreeSelect = ({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  subCategories,
  onCategorySelect,
  onSubCategorySelect,
}: CategoryTreeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedCat = categories.find(
    (category) => String(category.category_id) === selectedCategoryId,
  );
  const selectedSub = subCategories.find(
    (subcategory) =>
      String(subcategory.subcategory_id) === selectedSubCategoryId,
  );

  const triggerLabel =
    selectedCat && selectedSub
      ? `${selectedCat.category_name} > ${selectedSub.subcategory_name}`
      : selectedCat
        ? selectedCat.category_name
        : "Select category";

  const topLevel = categories.filter((category) => !category.parent_category_id);
  const childrenOf = (parentId: number) =>
    categories.filter((category) => category.parent_category_id === parentId);

  const handleOpen = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      bottom: window.innerHeight - rect.top + 6,
      minWidth: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
  };

  return (
    <>
      <Box
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: "7px",
          minWidth: 220,
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.18)",
          backgroundColor: "#1c1b27",
          color: selectedCategoryId ? "#fff" : "rgba(255,255,255,0.45)",
          fontSize: 14,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {triggerLabel}
        </Box>
        <KeyboardArrowDown
          sx={{
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </Box>

      {open &&
        ReactDOM.createPortal(
          <>
            <Box
              onClick={() => setOpen(false)}
              sx={{ position: "fixed", inset: 0, zIndex: 9998 }}
            />

            <Box
              style={menuStyle}
              sx={{
                maxHeight: 340,
                overflowY: "auto",
                backgroundColor: "#1c1b27",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.55)",
                py: 0.5,
              }}
            >
              {topLevel.map((parent) => {
                const kids = childrenOf(parent.category_id);
                const isParentSelected =
                  String(parent.category_id) === selectedCategoryId;

                return (
                  <Box key={parent.category_id}>
                    <Box
                      onClick={async () => {
                        if (kids.length === 0) {
                          await onCategorySelect(String(parent.category_id));
                          if (subCategories.length === 0) setOpen(false);
                        }
                      }}
                      sx={{
                        px: 2,
                        py: "7px",
                        fontSize: 13.5,
                        fontWeight: 700,
                        color:
                          isParentSelected && kids.length === 0
                            ? "#fff"
                            : "rgba(255,255,255,0.9)",
                        cursor: kids.length > 0 ? "default" : "pointer",
                        backgroundColor:
                          isParentSelected && kids.length === 0
                            ? "rgba(99,91,255,0.35)"
                            : "transparent",
                        "&:hover":
                          kids.length === 0
                            ? { backgroundColor: "rgba(99,91,255,0.2)" }
                            : {},
                      }}
                    >
                      {parent.category_name}
                    </Box>

                    {kids.map((kid) => {
                      const isKidSelected =
                        String(kid.category_id) === selectedCategoryId;

                      return (
                        <Box key={kid.category_id}>
                          <Box
                            onClick={async () => {
                              await onCategorySelect(String(kid.category_id));
                            }}
                            sx={{
                              pl: 3.5,
                              pr: 2,
                              py: "6px",
                              fontSize: 13,
                              fontWeight: 400,
                              color: isKidSelected
                                ? "#fff"
                                : "rgba(255,255,255,0.65)",
                              cursor: "pointer",
                              backgroundColor: isKidSelected
                                ? "rgba(99,91,255,0.35)"
                                : "transparent",
                              "&:hover": {
                                backgroundColor: "rgba(99,91,255,0.2)",
                                color: "#fff",
                              },
                            }}
                          >
                            {kid.category_name}
                          </Box>

                          {isKidSelected && subCategories.length > 0 && (
                            <SubCategoryList
                              subCategories={subCategories}
                              selectedSubCategoryId={selectedSubCategoryId}
                              onSubCategorySelect={onSubCategorySelect}
                              onClose={() => setOpen(false)}
                              marginLeft={3.5}
                            />
                          )}
                        </Box>
                      );
                    })}

                    {isParentSelected &&
                      kids.length === 0 &&
                      subCategories.length > 0 && (
                        <SubCategoryList
                          subCategories={subCategories}
                          selectedSubCategoryId={selectedSubCategoryId}
                          onSubCategorySelect={onSubCategorySelect}
                          onClose={() => setOpen(false)}
                          marginLeft={2}
                        />
                      )}
                  </Box>
                );
              })}
            </Box>
          </>,
          document.body,
        )}
    </>
  );
};

type SubCategoryListProps = {
  subCategories: SubCategory[];
  selectedSubCategoryId: string;
  onSubCategorySelect: (subId: string) => void;
  onClose: () => void;
  marginLeft: number;
};

const SubCategoryList = ({
  subCategories,
  selectedSubCategoryId,
  onSubCategorySelect,
  onClose,
  marginLeft,
}: SubCategoryListProps) => (
  <Box
    sx={{
      borderLeft: "2px solid rgba(99,91,255,0.4)",
      ml: marginLeft,
    }}
  >
    {subCategories.map((subcategory) => {
      const isSelected =
        String(subcategory.subcategory_id) === selectedSubCategoryId;

      return (
        <Box
          key={subcategory.subcategory_id}
          onClick={() => {
            onSubCategorySelect(String(subcategory.subcategory_id));
            onClose();
          }}
          sx={{
            pl: 2,
            pr: 2,
            py: "5px",
            fontSize: 12.5,
            color: isSelected ? "#fff" : "rgba(255,255,255,0.55)",
            cursor: "pointer",
            backgroundColor: isSelected
              ? "rgba(99,91,255,0.3)"
              : "transparent",
            "&:hover": {
              backgroundColor: "rgba(99,91,255,0.18)",
              color: "#fff",
            },
          }}
        >
          {subcategory.subcategory_name}
        </Box>
      );
    })}
  </Box>
);

export default CategoryTreeSelect;
