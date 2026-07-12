import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";
import { logger } from "../../utils/logger";

export interface QuickBooksCredentialUpdates {
  accessToken?: string;
  refreshToken?: string;
  realmId?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  companyName?: string;
}

export interface QuickBooksConnectionRecord extends QuickBooksCredentialUpdates {
  environment: typeof quickbooksConfig.environment;
}

const QUICKBOOKS_STORAGE_KEY_PREFIX = "quickbooks";
const QUICKBOOKS_STORAGE_SETUP_ERROR =
  "QuickBooks persistent storage is not configured for Vercel. Configure KV_REST_API_URL and KV_REST_API_TOKEN.";

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!quickbooksConfig.kvRestApiUrl || !quickbooksConfig.kvRestApiToken) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: quickbooksConfig.kvRestApiUrl,
    token: quickbooksConfig.kvRestApiToken
  });

  return redisClient;
}

function getStorageKey() {
  return `${QUICKBOOKS_STORAGE_KEY_PREFIX}:${quickbooksConfig.environment}:connection`;
}

function ensureVercelStorageConfigured() {
  if (!quickbooksConfig.isVercel) {
    return;
  }

  if (quickbooksConfig.kvRestApiUrl && quickbooksConfig.kvRestApiToken) {
    return;
  }

  logger.error("quickbooks.storage.unconfigured", {
    environment: quickbooksConfig.environment,
    isVercel: true,
    expectedEnvVars: ["KV_REST_API_URL", "KV_REST_API_TOKEN"]
  });
  throw new HttpError(503, QUICKBOOKS_STORAGE_SETUP_ERROR);
}

function getCurrentRecord(): QuickBooksConnectionRecord {
  return {
    environment: quickbooksConfig.environment,
    accessToken: quickbooksConfig.accessToken,
    refreshToken: quickbooksConfig.refreshToken,
    realmId: quickbooksConfig.realmId,
    accessTokenExpiresAt: quickbooksConfig.accessTokenExpiresAt,
    refreshTokenExpiresAt: quickbooksConfig.refreshTokenExpiresAt,
    companyName: quickbooksConfig.companyName
  };
}

function updateConfigValue(key: keyof QuickBooksCredentialUpdates, value: string | undefined) {
  if (value === undefined) {
    return;
  }

  if (key === "accessToken") {
    quickbooksConfig.accessToken = value;
  }

  if (key === "refreshToken") {
    quickbooksConfig.refreshToken = value;
  }

  if (key === "realmId") {
    quickbooksConfig.realmId = value;
  }

  if (key === "accessTokenExpiresAt") {
    quickbooksConfig.accessTokenExpiresAt = value;
  }

  if (key === "refreshTokenExpiresAt") {
    quickbooksConfig.refreshTokenExpiresAt = value;
  }

  if (key === "companyName") {
    quickbooksConfig.companyName = value;
  }
}

function upsertEnvValue(content: string, key: string, value: string) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const replacement = `${key}=${value}`;

  if (pattern.test(content)) {
    return content.replace(pattern, replacement);
  }

  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  return `${content}${suffix}${replacement}\n`;
}

async function readLocalEnvContent() {
  const envPath = path.join(process.cwd(), ".env");

  try {
    return await fs.readFile(envPath, "utf8");
  } catch {
    return "";
  }
}

async function writeLocalEnvRecord(record: QuickBooksConnectionRecord) {
  const envPath = path.join(process.cwd(), ".env");
  const currentContent = await readLocalEnvContent();

  let nextContent = currentContent;

  if (record.accessToken) {
    nextContent = upsertEnvValue(nextContent, "QUICKBOOKS_ACCESS_TOKEN", record.accessToken);
  }

  if (record.refreshToken) {
    nextContent = upsertEnvValue(nextContent, "QUICKBOOKS_REFRESH_TOKEN", record.refreshToken);
  }

  if (record.realmId) {
    nextContent = upsertEnvValue(nextContent, "QUICKBOOKS_REALM_ID", record.realmId);
  }

  if (record.accessTokenExpiresAt) {
    nextContent = upsertEnvValue(
      nextContent,
      "QUICKBOOKS_ACCESS_TOKEN_EXPIRES_AT",
      record.accessTokenExpiresAt
    );
  }

  if (record.refreshTokenExpiresAt) {
    nextContent = upsertEnvValue(
      nextContent,
      "QUICKBOOKS_REFRESH_TOKEN_EXPIRES_AT",
      record.refreshTokenExpiresAt
    );
  }

  if (record.companyName) {
    nextContent = upsertEnvValue(nextContent, "QUICKBOOKS_COMPANY_NAME", record.companyName);
  }

  if (nextContent !== currentContent) {
    await fs.writeFile(envPath, nextContent, "utf8");
  }
}

function mergeRecord(
  current: QuickBooksConnectionRecord,
  updates: QuickBooksCredentialUpdates
): QuickBooksConnectionRecord {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ),
    environment: quickbooksConfig.environment
  };
}

async function readPersistentRecord() {
  ensureVercelStorageConfigured();
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  const record = await redis.get<QuickBooksConnectionRecord>(getStorageKey());
  return record ?? null;
}

async function writePersistentRecord(record: QuickBooksConnectionRecord) {
  ensureVercelStorageConfigured();
  const redis = getRedisClient();

  if (!redis) {
    await writeLocalEnvRecord(record);
    return;
  }

  await redis.set(getStorageKey(), record);
}

export function setQuickBooksCredentials(updates: QuickBooksCredentialUpdates) {
  updateConfigValue("accessToken", updates.accessToken);
  updateConfigValue("refreshToken", updates.refreshToken);
  updateConfigValue("realmId", updates.realmId);
  updateConfigValue("accessTokenExpiresAt", updates.accessTokenExpiresAt);
  updateConfigValue("refreshTokenExpiresAt", updates.refreshTokenExpiresAt);
  updateConfigValue("companyName", updates.companyName);
}

export async function hydrateQuickBooksCredentials() {
  const record = await readPersistentRecord();

  if (!record) {
    return null;
  }

  setQuickBooksCredentials(record);
  return record;
}

export async function persistQuickBooksCredentials(updates: QuickBooksCredentialUpdates) {
  const current = (await readPersistentRecord()) ?? getCurrentRecord();
  const nextRecord = mergeRecord(current, updates);

  setQuickBooksCredentials(nextRecord);
  await writePersistentRecord(nextRecord);

  return nextRecord;
}
