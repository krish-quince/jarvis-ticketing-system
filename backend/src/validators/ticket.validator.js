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

        category_name: z
            .string()
            .min(1),

        priority_name: z
            .string()
            .min(1)
    })
});

export const updateStatusSchema = z.object({
    body: z.object({
        status_name: z
            .string()
            .min(1)
    })
});

export const assignTicketSchema = z.object({
    body: z.object({
        assigned_to_user_code:
            z.string().min(1)
    })
});

export const updatePrioritySchema = z.object({
    body: z.object({
        priority_name: z
            .string()
            .min(1)
    })
});

export const updateCategorySchema = z.object({
    body: z.object({
        category_name: z
            .string()
            .min(1)
    })
});