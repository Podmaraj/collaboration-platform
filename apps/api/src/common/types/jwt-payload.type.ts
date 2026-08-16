export interface JwtPayload {
  sub: string;    // userId
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;   // userId
  tokenVersion: number;
  iat?: number;
  exp?: number;
}
