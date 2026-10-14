import { z } from "zod";
import { usernamePattern } from "../auth.js";

const usernameMessage =
  "Username must be 2-32 characters and contain only letters, numbers, or underscores";

export const credentialsSchema = z.object({
  username: z.string().trim().regex(usernamePattern, usernameMessage),
  password: z.string().min(8).max(128),
});

export const profileUpdateSchema = z
  .object({
    username: z.string().trim().regex(usernamePattern, usernameMessage).optional(),
    nickname: z.string().trim().min(2).max(32).optional(),
  })
  .refine((value) => value.username !== undefined || value.nickname !== undefined, {
    message: "At least one profile field is required",
  });
