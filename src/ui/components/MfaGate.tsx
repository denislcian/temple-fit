// CAPA 3 · Interfaz — Segundo paso del login (2FA/TOTP).
// Aparece cuando la sesión está en nivel aal1 y la cuenta tiene 2FA activada:
// nada de la app se muestra hasta completar el reto con el código de la app de
// autenticación (Google Authenticator, Aegis, 1Password…).
import { useState } from 'react';
import { completeMfaChallenge } from '../../data/mfa';

interface MfaGateProps {
  onDone: () => void;
  onLogout: () => void;
}

export function MfaGate({ onDone, onLogout }: MfaGateProps) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const c = code.trim();
    if (c.length < 6 || busy) return;
    setBusy(true);
    setError('');
    const err = await completeMfaChallenge(c);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    onDone();
  }

  return (
    <div className="gate gate--loading" role="dialog" aria-labelledby="mfa-title">
      <div className="card" style={{ maxWidth: '22rem', width: '100%' }}>
        <h1 id="mfa-title" style={{ fontSize: '1.3rem' }}>
          Verificación en dos pasos
        </h1>
        <p className="muted">
          Tu cuenta tiene 2FA activada. Escribe el código de 6 dígitos de tu app de autenticación.
        </p>
        <div className="field">
          <label htmlFor="mfa-code">Código</label>
          <input
            id="mfa-code"
            className="input num"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
          />
        </div>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={submit}
            disabled={busy || code.trim().length < 6}
          >
            {busy ? 'Verificando…' : 'Entrar'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onLogout} disabled={busy}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
