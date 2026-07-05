import { env } from "./env";

const baseUrlByEnvironment = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com"
} as const;

const authBaseUrlByEnvironment = {
  sandbox: "https://appcenter.intuit.com/connect/oauth2",
  production: "https://appcenter.intuit.com/connect/oauth2"
} as const;

const tokenBaseUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export const quickbooksConfig = {
  enabled: Boolean(env.QUICKBOOKS_ENABLED),
  environment: env.QUICKBOOKS_ENVIRONMENT,
  clientId: env.QUICKBOOKS_CLIENT_ID,
  clientSecret: env.QUICKBOOKS_CLIENT_SECRET,
  redirectUri: env.QUICKBOOKS_REDIRECT_URI,
  minorVersion: env.QUICKBOOKS_MINOR_VERSION,
  accessToken: env.QUICKBOOKS_ACCESS_TOKEN,
  refreshToken: env.QUICKBOOKS_REFRESH_TOKEN,
  realmId: env.QUICKBOOKS_REALM_ID,
  scopes: env.QUICKBOOKS_SCOPES.split(/\s+/).filter(Boolean),
  apiBaseUrl: baseUrlByEnvironment[env.QUICKBOOKS_ENVIRONMENT],
  authBaseUrl: authBaseUrlByEnvironment[env.QUICKBOOKS_ENVIRONMENT],
  tokenUrl: tokenBaseUrl
};

export function isQuickBooksConfigured(): boolean {
  return Boolean(
    quickbooksConfig.enabled &&
      quickbooksConfig.clientId &&
      quickbooksConfig.clientSecret &&
      quickbooksConfig.redirectUri
  );
}
