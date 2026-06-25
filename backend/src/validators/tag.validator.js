import { z } from "zod";

export const updateTicketTagsSchema = z.object({
  body: z.object({
    tags: z
      .array(z.string().trim().min(1).max(100))
      .max(25, "A ticket cannot have more than 25 tags."),
  }),
});
