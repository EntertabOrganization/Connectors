export function successResponse<T>(data: T, extra: Record<string, unknown> = {}) {
  return {
    success: true,
    ...extra,
    data
  };
}
