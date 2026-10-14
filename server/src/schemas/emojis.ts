import { z } from "zod";

export const emojiSchema = z.object({
  name: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,32}$/),
});
