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

    subcategory_id: z.coerce
      .number()
      .int()
      .positive(),

    priority_id: z.coerce
      .number()
      .int()
      .positive(),
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
  }),
});

export const ticketIdParamSchema = z.object({
  params: z.object({
    ticketId: z.coerce.number().int().positive(),
  }),
});