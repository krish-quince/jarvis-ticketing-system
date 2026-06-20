import { z } from "zod";

export const createCommentSchema = z
    .object({
        body: z.object({
            comment_text: z.string().max(5000).optional().default("")
        }),
        files: z.array(z.unknown()).optional().default([])
    })
    .refine(
        ({ body, files }) => body.comment_text.trim().length > 0 || files.length > 0,
        {
            message: "A reply or attachment is required",
            path: ["body", "comment_text"]
        }
    );
