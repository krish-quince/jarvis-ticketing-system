import dotenv from "dotenv";
import app from "./app.js"
import { initializeDatabase } from "./config/dbInit.js";
import { initScheduler } from "./utils/scheduler.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
console.log("Credentials Matched");
initializeDatabase()
  .then(() => {
    initScheduler();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
