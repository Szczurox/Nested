import "dotenv/config";

import { z } from "zod";

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(4000),
  SESSION_COOKIE_NAME: z.string().min(1).default("nested_session"),
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  STORAGE_DIR: z.string().min(1).default("./uploads"),
  PUBLIC_URL: z.string().url().default("http://localhost:4000"),
});

export const config = configSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE,
  SESSION_TTL_DAYS: process.env.SESSION_TTL_DAYS,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
  NODE_ENV: process.env.NODE_ENV,
  STORAGE_DIR: process.env.STORAGE_DIR,
  PUBLIC_URL: process.env.PUBLIC_URL,
});
