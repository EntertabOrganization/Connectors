import { env } from "./env";

export const salesforceConfig = {
  clientId: env.SALESFORCE_CLIENT_ID,
  clientSecret: env.SALESFORCE_CLIENT_SECRET,
  tokenUrl: env.SALESFORCE_TOKEN_URL,
  apiVersion: env.SALESFORCE_API_VERSION
};

export function isSalesforceConfigured(): boolean {
  return Boolean(
    salesforceConfig.clientId &&
      salesforceConfig.clientSecret &&
      salesforceConfig.tokenUrl
  );
}
