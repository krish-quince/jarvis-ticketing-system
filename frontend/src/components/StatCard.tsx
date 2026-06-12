import {
  Card,
  Typography,
} from "@mui/material";

type Props = {
  title: string;
  value: number;
};

const StatCard = ({
  title,
  value,
}: Props) => {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 4,
      }}
    >
      <Typography
        color="text.secondary"
      >
        {title}
      </Typography>

      <Typography
        variant="h4"
        sx={{ fontWeight: 700 }}
      >
        {value}
      </Typography>
    </Card>
  );
  
};

export default StatCard;