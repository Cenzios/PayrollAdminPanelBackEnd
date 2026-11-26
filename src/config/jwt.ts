const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const jwtConfig = {
  secret: required('JWT_SECRET'),
  expiresIn: required('JWT_EXPIRES_IN'),
  refreshSecret: required('JWT_REFRESH_SECRET'),
  refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN'),
};

export const refreshCookieConfig = {
  name: 'payroll_admin_rt',
  path: '/api/auth',
  // Secure by default; only an explicit COOKIE_SECURE=false disables it (plain-http local testing)
  secure: process.env.COOKIE_SECURE !== 'false',
};
