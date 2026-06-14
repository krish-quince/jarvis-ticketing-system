import { z } from "zod";

export const createCommentSchema =
    z.object({
        body: z.object({
            comment_text: z
                .string()
                .trim()
                .min(1)
                .max(5000)
        })
    });