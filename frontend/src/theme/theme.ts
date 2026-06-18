import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#F4C63D",
    },
    secondary: {
      main: "#211b5a",
    },
    background: {
      default: "#EFF6FF",
    },
  },

  typography: {
    fontFamily: "Poppins, sans-serif",
  },
});

export default theme;