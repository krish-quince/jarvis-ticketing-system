import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#F4C63D",
    },
    secondary: {
      main: "#3A3482",
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