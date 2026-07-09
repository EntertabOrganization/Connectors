import axios from "axios";
import { quickbooksConfig } from "../../config/quickbooks.config";
import { logger } from "../../utils/logger";

export function logQuickBooksIntuitFailure(
  message: string,
  error: unknown,
  context?: {
    realmId?: string;
  }
) {
  if (!axios.isAxiosError(error)) {
    return;
  }

  const status = error.response?.status;

  if (status !== 401 && status !== 403) {
    return;
  }

  logger.error(message, {
    environment: quickbooksConfig.environment,
    hasAccessToken: Boolean(quickbooksConfig.accessToken),
    hasRefreshToken: Boolean(quickbooksConfig.refreshToken),
    hasRealmId: Boolean(context?.realmId ?? quickbooksConfig.realmId),
    realmId: context?.realmId ?? quickbooksConfig.realmId,
    intuitResponseStatus: status,
    intuitResponseBody: error.response?.data
  });
}
