import axios, { AxiosInstance } from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";
import {
  ensureQuickBooksConnection,
  refreshQuickBooksToken
} from "./quickbooks.auth.service";
import { persistQuickBooksCredentials, setQuickBooksCredentials } from "./quickbooks.credentials";

export async function createQuickBooksClient(options?: {
  accessToken?: string;
  realmId?: string;
}): Promise<AxiosInstance> {
  const connection = await ensureQuickBooksConnection(options);

  if (!connection.accessToken || !connection.realmId) {
    throw new HttpError(503, "QuickBooks access token or realm ID is missing");
  }

  const client = axios.create({
    baseURL: `${quickbooksConfig.apiBaseUrl}/v3/company/${connection.realmId}`,
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    params: {
      minorversion: quickbooksConfig.minorVersion
    }
  });

  client.interceptors.response.use(undefined, async (error) => {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      !quickbooksConfig.refreshToken ||
      !error.config ||
      (error.config as { _quickBooksRetry?: boolean })._quickBooksRetry
    ) {
      throw error;
    }

    const tokenData = await refreshQuickBooksToken(quickbooksConfig.refreshToken);
    const refreshedAccessToken = tokenData.access_token;
    const refreshedRefreshToken = tokenData.refresh_token ?? quickbooksConfig.refreshToken;

    setQuickBooksCredentials({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
      realmId: connection.realmId
    });
    await persistQuickBooksCredentials({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
      realmId: connection.realmId
    });

    error.config.headers = error.config.headers ?? {};
    error.config.headers.Authorization = `Bearer ${refreshedAccessToken}`;
    (error.config as { _quickBooksRetry?: boolean })._quickBooksRetry = true;

    return client.request(error.config);
  });

  return client;
}
