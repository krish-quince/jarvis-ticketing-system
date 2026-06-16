import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    company_code: z.string().min(1),

    role_id: z.number(),

    first_name: z.string().trim().min(1),

    last_name: z.string().trim().min(1),

    email: z.string().email(),

    password: z.string().min(6),

    department_id: z.number(),

    phone: z.string().optional(),
  }),
});