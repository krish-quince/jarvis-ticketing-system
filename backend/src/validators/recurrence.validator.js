import { z } from "zod";

export const recurrenceSchema = z.object({
  body: z.object({
    recurrence_type: z.enum([
      "ONCE",
      "DAILY",
      "DAILY_WORKDAYS",
      "WEEKLY",
      "MONTHLY",
      "MONTHLY_ON_DAY_X",
      "YEARLY"
    ]),
    interval_value: z.coerce.number().int().min(1).default(1),
    start_date: z.coerce.date().refine((val) => {
      // Allow 5 minutes grace period
      return val.getTime() >= Date.now() - 5 * 60 * 1000;
    }, {
      message: "Start Date cannot be in the past."
    }),
    end_date: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : val),
      z.coerce.date().nullable().optional()
    ),
    reopen_original: z.boolean().default(false),
    copy_assignee: z.boolean().default(false),
  }).refine((data) => {
    if (data.end_date) {
      return data.end_date.getTime() > data.start_date.getTime();
    }
    return true;
  }, {
    message: "End Date must be after Start Date.",
    path: ["end_date"]
  })
});
