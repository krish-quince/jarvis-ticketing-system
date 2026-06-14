import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});