import { z } from "zod";

export const createTicketSchema = z.object({
  body: z.object({
    subject: z
      .string()
      .trim()
      .min(5)
      .max(255),

    description: z
      .string()
      .trim()
      .min(5),

    category_id: z.coerce
      .number()
      .int()
      .positive(),

    subcategory_id: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),

    priority_id: z.coerce
      .number()
      .int()
      .positive(),

    tags: z.preprocess(
      (value) => {
        if (value === undefined || value === null) return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return [];
          if (trimmed.startsWith("[")) {
            try {
              const parsed = JSON.parse(trimmed);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return trimmed.split(",");
            }
          }
          return trimmed.split(",");
        }
        return value;
      },
      z
        .array(z.string().trim().min(1).max(100))
        .max(25, "A ticket cannot have more than 25 tags.")
        .optional(),
    ),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status_id: z.coerce.number().int().positive(),
  }),
});

export const assignTicketSchema = z.object({
  body: z.object({
    assigned_to_user_code: z.string().trim().min(1),
  }),
});

export const updatePrioritySchema = z.object({
  body: z.object({
    priority_id: z.coerce.number().int().positive(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    category_id: z.coerce.number().int().positive(),
    subcategory_id: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
  }),
});

export const ticketIdParamSchema = z.object({
  params: z.object({
    ticketId: z.coerce.number().int().positive(),
  }),
});
