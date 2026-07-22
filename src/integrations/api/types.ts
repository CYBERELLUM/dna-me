export type ApiError = { message: string; status?: number };

export type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export type Session = {
  access_token?: string;
  user: User;
  [key: string]: unknown;
};

export type AuthError = ApiError;
