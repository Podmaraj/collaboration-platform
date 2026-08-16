// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;       // userId
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}
