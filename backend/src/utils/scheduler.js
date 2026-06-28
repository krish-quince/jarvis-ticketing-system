import cron from "node-cron";
import { runRecurringTicketsJob } from "../services/recurrence.service.js";

export const initScheduler = () => {
  console.log("Initializing scheduler...");
  
  // Run every hour: '0 * * * *'
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly recurring tickets check...");
    try {
      await runRecurringTicketsJob();
    } catch (err) {
      console.error("Error executing recurring tickets job:", err);
    }
  });

  console.log("Scheduler initialized successfully.");
};
