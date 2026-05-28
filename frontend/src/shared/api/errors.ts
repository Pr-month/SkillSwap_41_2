export class ApiClientError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class UnauthorizedError extends ApiClientError {
  constructor(message = 'Unauthorized') {
    super(401, message);

    this.name = 'UnauthorizedError';
  }
}