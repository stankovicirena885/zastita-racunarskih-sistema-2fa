import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUrl: process.env.MONGO_URL,
  appUrl: process.env.APP_URL,
  cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
  isProd: process.env.NODE_ENV === 'production',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  recaptchaSecret: process.env.RECAPTCHA_SECRET,
};
