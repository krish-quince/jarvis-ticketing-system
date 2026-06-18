import { Card, Typography, Box } from "@mui/material";
import {
  ConfirmationNumber,
  ErrorOutlined,
  Cached,
  CheckCircleOutlined,
} from "@mui/icons-material";

type Props = {
  title: string;
  value: number;
};

const StatCard = ({ title, value }: Props) => {
  const getCardDetails = (titleStr: string) => {
    const t = titleStr.toLowerCase();
    if (t.includes("total")) {
      return {
        color: "#201a4a",
        icon: <ConfirmationNumber sx={{ fontSize: 28, color: "#201a4a" }} />,
      };
    } else if (t.includes("open")) {
      return {
        color: "#0D6EFD",
        icon: <ErrorOutlined sx={{ fontSize: 28, color: "#0D6EFD" }} />,
      };
    } else if (t.includes("progress")) {
      return {
        color: "#FD7E14",
        icon: <Cached sx={{ fontSize: 28, color: "#FD7E14" }} />,
      };
    } else if (t.includes("closed")) {
      return {
        color: "#198754",
        icon: <CheckCircleOutlined sx={{ fontSize: 28, color: "#198754" }} />,
      };
    }
    return {
      color: "#6C757D",
      icon: <ConfirmationNumber sx={{ fontSize: 28, color: "#6C757D" }} />,
    };
  };

  const { color, icon } = getCardDetails(title);

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
        borderLeft: `4px solid ${color}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5, fontSize: 12 }}
        >
          {title}
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#201a4a" }}
        >
          {value}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: `${color}15`, // adds transparency
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
    </Card>
  );
};

export default StatCard;
