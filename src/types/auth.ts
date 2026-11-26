export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
  sid: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sid: string;
  type: 'refresh';
  /** Single-use id; must equal UserLoginSession.refreshJti or the token counts as reused. */
  jti: string;
}

export interface SessionMeta {
  ipAddress: string;
  userAgent: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResultDto {
  token: string;
  user: AuthUserDto;
}

export interface IssuedTokens {
  data: AuthResultDto;
  refreshToken: string;
  refreshExpiresAt: Date;
}
