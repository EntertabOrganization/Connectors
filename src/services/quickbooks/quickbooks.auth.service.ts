import axios from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";
import { logger } from "../../utils/logger";
import {
  hydrateQuickBooksCredentials,
  persistQuickBooksCredentials,
  setQuickBooksCredentials
} from "./quickbooks.credentials";
import { logQuickBooksIntuitFailure } from "./quickbooks.observability";

function toExpiryIso(expiresInSeconds: unknown) {
  if (typeof expiresInSeconds !== "number" || !Number.isFinite(expiresInSeconds)) {
    return undefined;
  }

  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) {
    return false;
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return false;
  }

  return expiresAtMs <= Date.now();
}

async function getQuickBooksCompanyName(accessToken?: string, realmId?: string) {
  if (!accessToken || !realmId) {
    return undefined;
  }

  try {
    const response = await axios.get(
      `${quickbooksConfig.apiBaseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        },
        params: {
          minorversion: quickbooksConfig.minorVersion
        }
      }
    );

    return response.data?.CompanyInfo?.CompanyName as string | undefined;
  } catch (error) {
    logQuickBooksIntuitFailure("quickbooks.company_info.failed", error, { realmId });
    return undefined;
  }
}

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

  try {
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
  } catch (error) {
    logQuickBooksIntuitFailure("quickbooks.oauth.exchange.failed", error);
    throw error;
  }
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

  try {
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
  } catch (error) {
    logQuickBooksIntuitFailure("quickbooks.token.refresh.failed", error, {
      realmId: quickbooksConfig.realmId
    });
    throw error;
  }
}

export async function storeQuickBooksTokens(
  tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    x_refresh_token_expires_in?: number;
    refresh_token_expires_in?: number;
  },
  realmId?: string
) {
  const companyName = await getQuickBooksCompanyName(tokenData.access_token, realmId);

  await persistQuickBooksCredentials({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    realmId,
    accessTokenExpiresAt: toExpiryIso(tokenData.expires_in),
    refreshTokenExpiresAt: toExpiryIso(
      tokenData.x_refresh_token_expires_in ?? tokenData.refresh_token_expires_in
    ),
    companyName
  });
}

export async function ensureQuickBooksConnection(options?: {
  accessToken?: string;
  realmId?: string;
}) {
  await hydrateQuickBooksCredentials();

  const realmId = options?.realmId ?? quickbooksConfig.realmId;
  const accessToken = options?.accessToken ?? quickbooksConfig.accessToken;
  const diagnostics = getQuickBooksConnectionDiagnostics();

  if (accessToken && realmId && !isExpired(quickbooksConfig.accessTokenExpiresAt)) {
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
    hasStoredRefreshToken: true,
    reason: accessToken ? "expired" : "missing"
  });

  const tokenData = await refreshQuickBooksToken(quickbooksConfig.refreshToken);
  const refreshedRecord = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? quickbooksConfig.refreshToken,
    realmId,
    accessTokenExpiresAt: toExpiryIso(tokenData.expires_in),
    refreshTokenExpiresAt: toExpiryIso(
      tokenData.x_refresh_token_expires_in ?? tokenData.refresh_token_expires_in
    )
  };

  setQuickBooksCredentials(refreshedRecord);
  await persistQuickBooksCredentials(refreshedRecord);

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
