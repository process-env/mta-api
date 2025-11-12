import { z } from "zod";

const envSchema = z.object({
  MTA_API_KEY: z.string().optional(),
  FEED_BASE_URL: z
    .string()
    .url()
    .default("https://api.mta.info/"),
  CACHE_TTL_MS: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
});

type Env = z.infer<typeof envSchema> & { CACHE_TTL_MS: number };

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse({
    MTA_API_KEY: process.env.MTA_API_KEY,
    FEED_BASE_URL: process.env.FEED_BASE_URL ?? "https://api.mta.info/",
    CACHE_TTL_MS: process.env.CACHE_TTL_MS,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  cachedEnv = {
    ...parsed.data,
    CACHE_TTL_MS: parsed.data.CACHE_TTL_MS ?? 15_000,
  };

  return cachedEnv;
}
