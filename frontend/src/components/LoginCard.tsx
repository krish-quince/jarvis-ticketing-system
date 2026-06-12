import React from "react";

import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";

import jarvisLogo from "../assets/logos/q-Jarvis-logo.jpg";

type Props = {
  email: string;
  password: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogin: () => Promise<void>;
};

const LoginCard = ({
  email,
  password,
  setEmail,
  setPassword,
  handleLogin,
}: Props) => {
  return (
    <Paper
      elevation={5}
      sx={{
        width: 480,
        maxWidth: "100%",
        borderRadius: "32px",
        p: 4,
        backgroundColor: "#FFFFFF",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <img
          src={jarvisLogo}
          alt="Jarvis"
          style={{
            width: 180,
          }}
        />
      </Box>

      <TextField
        fullWidth
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{
          mt: 4,
          "& .MuiOutlinedInput-root": {
            borderRadius: "30px",
            backgroundColor: "#EAF1FF",
          },
        }}
      />

      <TextField
        fullWidth
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{
          mt: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: "30px",
            backgroundColor: "#EAF1FF",
          },
        }}
        {...({
          inputprops: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <VisibilityIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        } as any)}
      />

      <Typography
        align="right"
        sx={{
          mt: 1,
          color: "#808080",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        Forgot Password?
      </Typography>

      <Box
        sx={{
          mt: 4,
          display: "flex",
          gap: 2,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          sx={{
            backgroundColor: "#F4C63D",
            color: "#3A3482",
            borderRadius: "30px",
            fontWeight: 600,
            textTransform: "none",
            height: 50,
            "&:hover": {
              backgroundColor: "#F4C63D",
            },
          }}
        >
          Sign In
        </Button>

        <Button
          fullWidth
          variant="outlined"
          sx={{
            borderRadius: "30px",
            color: "#3A3482",
            borderColor: "#D9D9D9",
            textTransform: "none",
            height: 50,
          }}
        >
          Register as 2FA
        </Button>
      </Box>
    </Paper>
  );
};

export default LoginCard;