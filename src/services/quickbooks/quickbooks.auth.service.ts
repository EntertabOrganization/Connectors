import axios from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";
import { logger } from "../../utils/logger";
import {
  persistQuickBooksCredentials,
  setQuickBooksCredentials
} from "./quickbooks.credentials";

export function getQuickBooksConnectionDiagnostics() {
  const hasClientId = Boolean(quickbooksConfig.clientId);
  const hasClientSecret = Boolean(quickbooksConfig.clientSecret);
  const hasRedirectUri = Boolean(quickbooksConfig.redirectUri);
  const hasAccessToken = Boolean(quickbooksConfig.accessToken);
  const hasRefreshToken = Boolean(quickbooksConfig.refreshToken);
  const hasRealmId = Boolean(quickbooksConfig.realmId);
  const configured = hasClientId && hasClientSecret && hasRedirectUri;
  const connected = configured && hasRefreshToken && hasRealmId;

  return {
    enabled: quickbooksConfig.enabled,
    environment: quickbooksConfig.environment,
    configured,
    connected,
    hasClientId,
    hasClientSecret,
    hasRedirectUri,
    hasAccessToken,
    hasRefreshToken,
    hasRealmId,
    missing: {
      configuration: [
        !hasClientId ? "QUICKBOOKS_CLIENT_ID" : null,
        !hasClientSecret ? "QUICKBOOKS_CLIENT_SECRET" : null,
        !hasRedirectUri ? "QUICKBOOKS_REDIRECT_URI" : null
      ].filter(Boolean),
      connection: [
        !hasRefreshToken ? "QUICKBOOKS_REFRESH_TOKEN" : null,
        !hasRealmId ? "QUICKBOOKS_REALM_ID" : null
      ].filter(Boolean)
    }
  };
}

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
  logger.info("quickbooks.oauth.exchange.started", {
    environment: quickbooksConfig.environment,
    redirectUri: quickbooksConfig.redirectUri
  });

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

  logger.info("quickbooks.oauth.exchange.completed", {
    hasAccessToken: Boolean(response.data?.access_token),
    hasRefreshToken: Boolean(response.data?.refresh_token),
    realmIdWillBeStoredByCallback: true
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

  logger.info("quickbooks.token.refresh.started", {
    hasRefreshToken: Boolean(finalRefreshToken)
  });

  const response = await axios.post(quickbooksConfig.tokenUrl, payload.toString(), {
    headers: {
      Authorization: `Basic ${getBasicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  logger.info("quickbooks.token.refresh.completed", {
    hasAccessToken: Boolean(response.data?.access_token),
    hasRefreshToken: Boolean(response.data?.refresh_token)
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
  const diagnostics = getQuickBooksConnectionDiagnostics();

  if (accessToken && realmId) {
    logger.info("quickbooks.connection.ready", {
      realmId,
      source: options?.accessToken || options?.realmId ? "request-options" : "stored-config"
    });
    return { accessToken, realmId };
  }

  if (!realmId) {
    logger.error("quickbooks.connection.missing_realm_id", {
      diagnostics,
      action: "Open /api/v1/quickbooks/connect and complete the Intuit approval flow."
    });
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
    logger.error("quickbooks.connection.missing_refresh_token", {
      diagnostics,
      action: "Open /api/v1/quickbooks/connect and complete the Intuit approval flow."
    });
    throw new HttpError(
      503,
      "QuickBooks is not connected yet. Open /api/v1/quickbooks/connect and complete the OAuth approval once.",
      {
        authUrl: getQuickBooksAuthUrl(),
        redirectUri: quickbooksConfig.redirectUri
      }
    );
  }

  logger.info("quickbooks.connection.refreshing_access_token", {
    realmId,
    hasStoredRefreshToken: true
  });

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

  logger.info("quickbooks.connection.refreshed", {
    realmId,
    hasAccessToken: Boolean(quickbooksConfig.accessToken),
    hasRefreshToken: Boolean(quickbooksConfig.refreshToken)
  });

  return {
    accessToken: quickbooksConfig.accessToken!,
    realmId
  };
}
