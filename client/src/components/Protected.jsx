import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { userAtom, loadingMeAtom } from '../store.js';
import { api } from '../api.js';

export default function Protected({ children }) {
  const [user, setUser] = useAtom(userAtom);
  const [loadingMe, setLoadingMe] = useAtom(loadingMeAtom);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user || !loadingMe) return;
      try {
        const { data } = await api.get('/me');
        if (!mounted) return;
        setUser(data);
      } catch {
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, loadingMe, setUser, setLoadingMe]);

  if (loadingMe) {
    return <div className='card'>Loading…</div>;
  }
  if (!user) {
    nav('/login');
    return null;
  }
  return children;
}
