import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),

  email: z.email("Invalid email"),

  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validates partial document updates before they reach the database. The content
 * cap rejects oversized JSON payloads before expensive downstream processing or
 * persistence can exhaust server memory in a denial-of-service attempt.
 */
export const documentUpdateSchema = z.object({
  title: z.string().max(300, "Title must be at most 300 characters").nullable().optional(),
  content: z
    .unknown()
    .optional()
    .refine(
      (content) => {
        const serializedContent = JSON.stringify(content);
        return serializedContent === undefined || serializedContent.length < 500000;
      },
      "Content must be smaller than 500KB",
    ),
  clientUpdatedAt: z.number().optional(),
});
