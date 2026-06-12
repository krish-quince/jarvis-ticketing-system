import { Box } from "@mui/material";

import quinceLogo from "../assets/logos/Quince logo 210x70 pixels.jpg";

const Header = () => {
  return (
    <Box
      sx={{
        height: 70,
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 5,
      }}
    >
      <img
        src={quinceLogo}
        alt="Quince"
        style={{
          height: 50,
        }}
      />

      

      
    </Box>
  );
};

export default Header;