import { Link, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { userAtom } from '../store.js';
import { api } from '../api.js';

export default function Navbar() {
  const [user, setUser] = useAtom(userAtom);
  const nav = useNavigate();

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {}
    setUser(null);
    nav('/login');
  }

  return (
    <div className='navbar'>
      <div className='navbar-inner'>
        <Link to='/'>MERN 2FA</Link>
        <Link to='/security'>Security</Link>
        <div className='spacer' />
        {!user ? (
          <>
            <Link to='/login'>Login</Link>
            <Link to='/register'>Register</Link>
          </>
        ) : (
          <>
            <span style={{ opacity: 0.8 }}>{user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
}
