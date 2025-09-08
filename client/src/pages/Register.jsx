import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../api.js';
import { useAtom } from 'jotai';
import { userAtom } from '../store.js';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const hasUpper = (s) => /[A-Z]/.test(s);
const hasLower = (s) => /[a-z]/.test(s);
const hasNumber = (s) => /\d/.test(s);
const hasSpecial = (s) => /[^A-Za-z0-9]/.test(s);
const hasLength = (s) => (s?.length ?? 0) >= 9;

const schema = z.object({
  email: z.string().email('Neispravan email'),
  password: z
    .string()
    .min(9, 'Lozinka mora imati barem 9 karaktera')
    .refine(hasUpper, { message: 'Mora sadržati bar 1 veliko slovo (A-Z)' })
    .refine(hasLower, { message: 'Mora sadržati bar 1 malo slovo (a-z)' })
    .refine(hasNumber, { message: 'Mora sadržati bar 1 broj (0-9)' })
    .refine(hasSpecial, {
      message: 'Mora sadržati bar 1 specijalan znak (!@#$…)',
    }),
});

export default function Register() {
  const [, setUser] = useAtom(userAtom);
  const nav = useNavigate();
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const password = watch('password') || '';

  const checks = useMemo(() => {
    const list = [
      { label: 'Veliko slovo (A-Z)', ok: hasUpper(password) },
      { label: 'Malo slovo (a-z)', ok: hasLower(password) },
      { label: 'Broj (0-9)', ok: hasNumber(password) },
      { label: 'Specijalan znak (!@#$…)', ok: hasSpecial(password) },
      { label: 'Najmanje 9 karaktera', ok: hasLength(password) },
    ];
    const score = list.reduce((acc, x) => acc + (x.ok ? 1 : 0), 0);
    return { list, score };
  }, [password]);

  const progressPct = (checks.score / 5) * 100;
  const allGood = checks.score === 5;

  async function onSubmit(values) {
    if (!recaptchaToken) return;
    const { data } = await api.post('/auth/register', {
      ...values,
      recaptchaToken,
    });
    setUser(data.user);
    setRecaptchaToken(null);
    nav('/');
  }

  return (
    <div className='card'>
      <h1>Register</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='row'>
          <input placeholder='Email' {...register('email')} />
          {errors.email && (
            <small style={{ color: 'salmon' }}>{errors.email.message}</small>
          )}
        </div>

        <div className='row'>
          <input
            type='password'
            placeholder='Password'
            autoComplete='new-password'
            {...register('password')}
          />
          {errors.password && (
            <small style={{ color: 'salmon' }}>{errors.password.message}</small>
          )}
        </div>

        {/* Strength */}
        <div style={{ marginTop: 6 }}>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: 'var(--border)',
              overflow: 'hidden',
            }}
            aria-label='Password strength'
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 150ms ease',
              }}
            />
          </div>
          <small style={{ opacity: 0.9 }}>
            Jačina lozinke: {checks.score}/5
          </small>
        </div>

        {/* Checklist */}
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
          {checks.list.map((c) => (
            <li
              key={c.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: c.ok ? 1 : 0.8,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  display: 'inline-grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  border: `1px solid var(--border)`,
                  background: c.ok ? 'var(--ok)' : 'transparent',
                  color: c.ok ? '#08101f' : 'var(--muted)',
                }}
              >
                {c.ok ? '✓' : '•'}
              </span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>

        {/* reCAPTCHA */}
        <div style={{ margin: '10px 0' }}>
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={setRecaptchaToken}
            onExpired={() => setRecaptchaToken(null)}
          />
        </div>

        <button disabled={isSubmitting || !allGood || !recaptchaToken}>
          {isSubmitting ? '...' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}
