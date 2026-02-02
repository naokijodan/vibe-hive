/**
 * Unified error message extraction utility.
 * Converts any caught error into a user-friendly string.
 */
export function toErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error !== null && error !== undefined && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}
