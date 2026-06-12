import { Box } from "@mui/material";
import { useEffect, useState } from "react";

import img1 from "../assets/illustrations/Graphic-09.jpg";
import img2 from "../assets/illustrations/Graphic-10.jpg";
import img3 from "../assets/illustrations/Graphic-11.jpg";

const images = [img1, img2, img3];

const Carousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // backgroundColor is the color the image will "merge" with.
  // If you need a different color, change `BG_COLOR`.
  const BG_COLOR = "#f5f5f5";

  return (
    <Box
      sx={{
        width: "100%",
        textAlign: "center",
        backgroundColor: BG_COLOR,
        overflow: "hidden",
        py: 2,
      }}
    >
      <img
        src={images[index]}
        alt="illustration"
        style={{
          width: "100%",
          maxWidth: 450,
          display: "block",
          margin: "0 auto",
          // blend the image with the parent's background color
          mixBlendMode: "multiply",
          opacity: 0.95,
        }}
      />

      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "center",
          gap: 1,
        }}
      >
        {images.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor:
                i === index
                  ? "#F4C63D"
                  : "#D9D9D9",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Carousel;