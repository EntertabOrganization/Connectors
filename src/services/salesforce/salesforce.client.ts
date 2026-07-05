import axios, { AxiosInstance } from "axios";
import { salesforceConfig } from "../../config/salesforce.config";
import { getSalesforceAccessToken } from "./salesforce.auth.service";

export async function createSalesforceClient(): Promise<AxiosInstance> {
  const token = await getSalesforceAccessToken();

  return axios.create({
    baseURL: `${token.instanceUrl}/services/data/${salesforceConfig.apiVersion}`,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json"
    }
  });
}
