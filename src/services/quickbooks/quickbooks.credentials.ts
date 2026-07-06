import fs from "fs/promises";
import path from "path";
import { quickbooksConfig } from "../../config/quickbooks.config";

interface QuickBooksCredentialUpdates {
  accessToken?: string;
  refreshToken?: string;
  realmId?: string;
}

function updateConfigValue(key: keyof QuickBooksCredentialUpdates, value: string | undefined) {
  if (!value) {
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

export function setQuickBooksCredentials(updates: QuickBooksCredentialUpdates) {
  updateConfigValue("accessToken", updates.accessToken);
  updateConfigValue("refreshToken", updates.refreshToken);
  updateConfigValue("realmId", updates.realmId);
}

export async function persistQuickBooksCredentials(updates: QuickBooksCredentialUpdates) {
  setQuickBooksCredentials(updates);

  const envPath = path.join(process.cwd(), ".env");
  const currentContent = await fs.readFile(envPath, "utf8");

  let nextContent = currentContent;

  if (updates.accessToken) {
    nextContent = upsertEnvValue(
      nextContent,
      "QUICKBOOKS_ACCESS_TOKEN",
      updates.accessToken
    );
  }

  if (updates.refreshToken) {
    nextContent = upsertEnvValue(
      nextContent,
      "QUICKBOOKS_REFRESH_TOKEN",
      updates.refreshToken
    );
  }

  if (updates.realmId) {
    nextContent = upsertEnvValue(nextContent, "QUICKBOOKS_REALM_ID", updates.realmId);
  }

  if (nextContent !== currentContent) {
    await fs.writeFile(envPath, nextContent, "utf8");
  }
}
