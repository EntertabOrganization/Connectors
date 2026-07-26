import axios from "axios";
import { HttpError } from "../../utils/http-error";

export function escapeQuickBooksQueryValue(value: string) {
  return value.replace(/'/g, "\\'");
}

export function toQuickBooksHttpError(error: unknown) {
  if (error instanceof HttpError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return error;
  }

  const statusCode = error.response?.status ?? 500;
  const responseData = error.response?.data;
  const intuitError =
    responseData?.Fault?.Error?.[0]?.Detail ??
    responseData?.Fault?.Error?.[0]?.Message ??
    responseData?.Fault?.Error?.[0]?.code;
  const message = intuitError
    ? `QuickBooks request failed: ${intuitError}`
    : error.message;

  return new HttpError(statusCode, message, responseData);
}
