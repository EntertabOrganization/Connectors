import axios, { AxiosInstance } from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { HttpError } from "../../utils/http-error";

export function createQuickBooksClient(options?: {
  accessToken?: string;
  realmId?: string;
}): AxiosInstance {
  const accessToken = options?.accessToken ?? quickbooksConfig.accessToken;
  const realmId = options?.realmId ?? quickbooksConfig.realmId;

  if (!accessToken || !realmId) {
    throw new HttpError(503, "QuickBooks access token or realm ID is missing");
  }

  return axios.create({
    baseURL: `${quickbooksConfig.apiBaseUrl}/v3/company/${realmId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    params: {
      minorversion: quickbooksConfig.minorVersion
    }
  });
}
