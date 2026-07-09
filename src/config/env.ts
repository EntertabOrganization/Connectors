import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  SALESFORCE_CLIENT_ID: z.string().optional(),
  SALESFORCE_CLIENT_SECRET: z.string().optional(),
  SALESFORCE_TOKEN_URL: z.string().url().optional(),
  SALESFORCE_API_VERSION: z.string().default("v61.0"),
  QUICKBOOKS_ENABLED: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => {
      if (typeof value === "boolean") {
        return value;
      }
      return value === "true";
    }),
  QUICKBOOKS_ENVIRONMENT: z
    .enum(["sandbox", "production", "development"])
    .default("sandbox")
    .transform((value) => (value === "development" ? "sandbox" : value)),
  QUICKBOOKS_CLIENT_ID: z.string().optional(),
  QUICKBOOKS_CLIENT_SECRET: z.string().optional(),
  QUICKBOOKS_REDIRECT_URI: z.string().url().optional(),
  QUICKBOOKS_MINOR_VERSION: z.string().default("75"),
  QUICKBOOKS_ACCESS_TOKEN: z.string().optional(),
  QUICKBOOKS_REFRESH_TOKEN: z.string().optional(),
  QUICKBOOKS_REALM_ID: z.string().optional(),
  QUICKBOOKS_ACCESS_TOKEN_EXPIRES_AT: z.string().datetime().optional(),
  QUICKBOOKS_REFRESH_TOKEN_EXPIRES_AT: z.string().datetime().optional(),
  QUICKBOOKS_COMPANY_NAME: z.string().optional(),
  QUICKBOOKS_SCOPES: z.string().default("com.intuit.quickbooks.accounting"),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  VERCEL: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
