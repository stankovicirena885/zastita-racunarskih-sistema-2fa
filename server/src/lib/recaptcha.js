import { env } from '../config/env.js';

export async function verifyRecaptcha(token, ip) {
  if (!env.recaptchaSecret) return false;
  try {
    const params = new URLSearchParams();
    params.append('secret', env.recaptchaSecret);
    params.append('response', token);
    if (ip) params.append('remoteip', ip);

    const resp = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      }
    );
    const data = await resp.json();
    return data.success === true;
  } catch {
    return false;
  }
}
