import axios from "axios";
import { salesforceConfig } from "../../config/salesforce.config";
import { HttpError } from "../../utils/http-error";

export interface SalesforceAccessToken {
  accessToken: string;
  instanceUrl: string;
}

export async function getSalesforceAccessToken(): Promise<SalesforceAccessToken> {
  if (!salesforceConfig.clientId || !salesforceConfig.clientSecret || !salesforceConfig.tokenUrl) {
    throw new HttpError(503, "Salesforce is not configured");
  }

  const payload = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: salesforceConfig.clientId,
    client_secret: salesforceConfig.clientSecret
  });

  const response = await axios.post(salesforceConfig.tokenUrl, payload.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return {
    accessToken: response.data.access_token,
    instanceUrl: response.data.instance_url
  };
}
