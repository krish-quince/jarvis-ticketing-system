import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

import jarvisLogo from "../assets/logos/Q- Jarvis logo reverse.jpg";

type Props = {
  toggleSidebar: () => void;
};

const Topbar = ({
  toggleSidebar,
}: Props) => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#211B5A",
        height: 50,
      }}
    >
      <Toolbar
        sx={{
          minHeight: "50px !important",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <img
            src={jarvisLogo}
            alt="Jarvis"
            style={{
              height: 32,
            }}
          />

          <IconButton
            onClick={toggleSidebar}
            sx={{
              color: "#F4C63D",
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <OutlinedInput
          size="small"
          placeholder="Search tickets, users..."
          sx={{
            width: 520,

            "& .MuiOutlinedInput-notchedOutline":
              {
                borderColor:
                  "rgba(255,255,255,.1)",
              },

            "& input": {
              color: "#fff",
            },

            "& input::placeholder":
              {
                color: "#fff",
                opacity: 0.7,
              },

            bgcolor: "#312A70",
          }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon
                sx={{
                  color: "#F4C63D",
                }}
              />
            </InputAdornment>
          }
        />
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;