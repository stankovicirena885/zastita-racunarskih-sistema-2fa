import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../api.js';
import { useAtom } from 'jotai';
import { userAtom, ticketAtom } from '../store.js';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function Login() {
  const [, setUser] = useAtom(userAtom);
  const [, setTicket] = useAtom(ticketAtom);
  const nav = useNavigate();
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values) {
    if (!recaptchaToken) return;
    const { data } = await api.post('/auth/login', {
      ...values,
      recaptchaToken,
    });
    setRecaptchaToken(null);

    if (data.need2fa) {
      setTicket(data.ticketId);
      nav('/2fa');
    } else {
      setUser(data.user);
      nav('/');
    }
  }

  return (
    <div className='card'>
      <h1>Login</h1>
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
            {...register('password')}
          />
          {errors.password && (
            <small style={{ color: 'salmon' }}>{errors.password.message}</small>
          )}
        </div>

        <div style={{ margin: '10px 0' }}>
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={setRecaptchaToken}
            onExpired={() => setRecaptchaToken(null)}
          />
        </div>

        <button disabled={isSubmitting || !recaptchaToken}>
          {isSubmitting ? '...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
