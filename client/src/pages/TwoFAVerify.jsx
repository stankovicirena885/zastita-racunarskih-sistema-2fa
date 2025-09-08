import { useForm } from 'react-hook-form';
import { useAtom } from 'jotai';
import { ticketAtom, userAtom } from '../store.js';
import { api } from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function TwoFAVerify() {
  const [ticket] = useAtom(ticketAtom);
  const [, setUser] = useAtom(userAtom);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { code: '' } });
  const nav = useNavigate();

  async function onSubmit(values) {
    const { data } = await api.post('/auth/2fa/totp/verify', {
      ticketId: ticket,
      code: values.code,
    });
    setUser(data.user);
    nav('/');
  }

  if (!ticket) {
    return (
      <div className='card'>
        <p>
          Missing login ticket. <a href='/login'>Go to login</a>
        </p>
      </div>
    );
  }

  return (
    <div className='card'>
      <h1>Enter 2FA code</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='row'>
          <input placeholder='123456' {...register('code')} />
        </div>
        <button disabled={isSubmitting}>
          {isSubmitting ? '...' : 'Verify'}
        </button>
      </form>
    </div>
  );
}
