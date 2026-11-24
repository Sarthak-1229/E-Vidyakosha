export class CustomApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CustomApiError';
  }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}
