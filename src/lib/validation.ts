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
 * Validates partial document updates before they reach the database.
 * Large JSON payloads are rejected early to prevent excessive memory
 * usage during parsing and persistence.
 */
export const documentUpdateSchema = z.object({
  title: z
    .string()
    .max(300, "Title must be at most 300 characters")    
    .optional(),

  content: z
    .unknown()
    .optional()
    .refine((content) => {
      if (content === undefined) return true;

      return JSON.stringify(content).length < 500_000;
    }, "Content must be smaller than 500KB"),
});