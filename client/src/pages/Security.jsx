import { useState } from 'react';
import { api } from '../api.js';

export default function Security() {
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function startSetup() {
    try {
      setBusy(true);
      setMsg('');
      const { data } = await api.post('/auth/2fa/totp/setup');
      setQr(data.qrPngDataUrl);
    } catch (e) {
      setMsg('Failed to start TOTP setup.');
    } finally {
      setBusy(false);
    }
  }

  async function enable() {
    try {
      setBusy(true);
      setMsg('');
      const { data } = await api.post('/auth/2fa/totp/enable', { code });
      setEnabled(data.totpEnabled);
      setMsg('TOTP enabled.');
    } catch (e) {
      setMsg('Invalid code.');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    try {
      setBusy(true);
      setMsg('');
      const { data } = await api.post('/auth/2fa/totp/disable');
      setEnabled(data.totpEnabled);
      setQr(null);
      setCode('');
      setMsg('TOTP disabled.');
    } catch (e) {
      setMsg('Failed to disable.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='card'>
      <h1>Security</h1>
      <p>Setup two-factor authentication (TOTP).</p>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {!qr ? (
          <button onClick={startSetup} disabled={busy}>
            Setup TOTP
          </button>
        ) : (
          <div>
            <img alt='qr' src={qr} width={220} height={220} />
            <div className='row' style={{ marginTop: 12 }}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder='123456'
              />
            </div>
            <button onClick={enable} disabled={busy || !code}>
              Enable
            </button>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={disable} disabled={busy}>
            Disable TOTP
          </button>
        </div>
      </div>
      {enabled !== null && (
        <p style={{ marginTop: 10 }}>TOTP enabled: {String(enabled)}</p>
      )}
      {msg && <p style={{ marginTop: 10, opacity: 0.9 }}>{msg}</p>}
    </div>
  );
}
