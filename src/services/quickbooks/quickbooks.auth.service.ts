import axios from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";

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
