import { CookieOptions, Request, Response } from 'express';
import { refreshCookieConfig } from '../config/jwt';

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: refreshCookieConfig.secure,
  sameSite: 'strict',
  path: refreshCookieConfig.path,
});

export const setRefreshCookie = (res: Response, refreshToken: string, expiresAt: Date): void => {
  res.cookie(refreshCookieConfig.name, refreshToken, {
    ...baseCookieOptions(),
    maxAge: Math.max(expiresAt.getTime() - Date.now(), 0),
  });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(refreshCookieConfig.name, baseCookieOptions());
};

export const getRefreshCookie = (req: Request): string | undefined => {
  const cookies: Record<string, unknown> = req.cookies ?? {};
  const value = cookies[refreshCookieConfig.name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const getBearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return undefined;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : undefined;
};
