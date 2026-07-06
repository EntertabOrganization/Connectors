import axios from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";
import {
  persistQuickBooksCredentials,
  setQuickBooksCredentials
} from "./quickbooks.credentials";

function getBasicAuthHeader() {
  if (!quickbooksConfig.clientId || !quickbooksConfig.clientSecret) {
    throw new HttpError(503, "QuickBooks is not configured");
  }

  return Buffer.from(
    `${quickbooksConfig.clientId}:${quickbooksConfig.clientSecret}`
  ).toString("base64");
}

export function getQuickBooksAuthUrl() {
  if (!quickbooksConfig.clientId || !quickbooksConfig.redirectUri) {
    throw new HttpError(503, "QuickBooks is not configured");
  }

  const params = new URLSearchParams({
    client_id: quickbooksConfig.clientId,
    response_type: "code",
    scope: quickbooksConfig.scopes.join(" "),
    redirect_uri: quickbooksConfig.redirectUri,
    state: "connectors-mvp"
  });

  return `${quickbooksConfig.authBaseUrl}?${params.toString()}`;
}

export async function exchangeQuickBooksCode(code: string) {
  const payload = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: quickbooksConfig.redirectUri ?? ""
  });

  const response = await axios.post(quickbooksConfig.tokenUrl, payload.toString(), {
    headers: {
      Authorization: `Basic ${getBasicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return response.data;
}

export async function refreshQuickBooksToken(refreshToken?: string) {
  const finalRefreshToken = refreshToken ?? quickbooksConfig.refreshToken;
  if (!finalRefreshToken) {
    throw new HttpError(400, "QuickBooks refresh token is required");
  }

  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: finalRefreshToken
  });

  const response = await axios.post(quickbooksConfig.tokenUrl, payload.toString(), {
    headers: {
      Authorization: `Basic ${getBasicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return response.data;
}

export async function storeQuickBooksTokens(
  tokenData: {
    access_token?: string;
    refresh_token?: string;
  },
  realmId?: string
) {
  await persistQuickBooksCredentials({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    realmId
  });
}

export async function ensureQuickBooksConnection(options?: {
  accessToken?: string;
  realmId?: string;
}) {
  const realmId = options?.realmId ?? quickbooksConfig.realmId;
  const accessToken = options?.accessToken ?? quickbooksConfig.accessToken;

  if (accessToken && realmId) {
    return { accessToken, realmId };
  }

  if (!realmId) {
    throw new HttpError(
      503,
      "QuickBooks realm ID is missing. Complete QuickBooks OAuth once via /api/v1/quickbooks/connect.",
      {
        authUrl: getQuickBooksAuthUrl(),
        redirectUri: quickbooksConfig.redirectUri
      }
    );
  }

  if (!quickbooksConfig.refreshToken) {
    throw new HttpError(
      503,
      "QuickBooks is not connected yet. Open /api/v1/quickbooks/connect and complete the OAuth approval once.",
      {
        authUrl: getQuickBooksAuthUrl(),
        redirectUri: quickbooksConfig.redirectUri
      }
    );
  }

  const tokenData = await refreshQuickBooksToken(quickbooksConfig.refreshToken);
  setQuickBooksCredentials({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? quickbooksConfig.refreshToken,
    realmId
  });
  await persistQuickBooksCredentials({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? quickbooksConfig.refreshToken,
    realmId
  });

  return {
    accessToken: quickbooksConfig.accessToken!,
    realmId
  };
}
