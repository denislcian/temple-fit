// CAPA 3 · Interfaz — Registro / inicio de sesión.
// Puerta de entrada a la Comunidad. Cumple WCAG 3.3.8: permite pegar y
// autocompletar (gestores de contraseñas), sin CAPTCHA cognitivo.
// En la nube (Supabase) el acceso es por email + contraseña con confirmación.
import { useState } from 'react';
import { passwordStrength } from '../../data/authModels';
import { isSupabaseEnabled } from '../../data/supabase';
import { useAnnounce } from './Announcer';
import { useAuth } from './AuthContext';
import { TextField } from './Field';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const announce = useAnnounce();
  const { login, register, signInWithGoogle } = useAuth();
  const cloud = isSupabaseEnabled;

  async function onGoogle() {
    setError(null);
    try {
      await signInWithGoogle?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google');
    }
  }
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'register') {
        const { needsConfirmation } = await register({
          ...(cloud ? { email } : {}),
          username,
          displayName,
          password,
        });
        if (needsConfirmation) {
          setInfo('Te hemos enviado un email para confirmar tu cuenta. Ábrelo y luego inicia sesión.');
          setMode('login');
          setPassword('');
        } else {
          announce(`Cuenta creada. Bienvenido, ${displayName}`);
        }
      } else {
        await login(cloud ? email : username, password);
        announce('Sesión iniciada');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card--accent" style={{ maxWidth: '26rem', margin: '0 auto' }}>
      <div className="segmented" role="group" aria-label="Acceder o crear cuenta">
        <button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>
          Iniciar sesión
        </button>
        <button type="button" aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>
          Crear cuenta
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {cloud && (
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        {(!cloud || mode === 'register') && (
          <TextField
            label="Nombre de usuario"
            value={username}
            onChange={setUsername}
            autoComplete="username"
            hint={mode === 'register' ? '3-20 caracteres: letras, números, _ o .' : undefined}
          />
        )}

        {mode === 'register' && (
          <TextField
            label="Nombre para mostrar"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="nickname"
          />
        )}

        <div className="field">
          <label htmlFor="auth-password">Contraseña</label>
          {mode === 'register' && (
            <p className="hint" id="auth-password-hint">
              Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.
            </p>
          )}
          <input
            id="auth-password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            aria-describedby={mode === 'register' ? 'auth-password-hint' : undefined}
          />
          {mode === 'register' && password.length > 0 && (
            <div className="pw-strength" data-score={passwordStrength(password).score}>
              <div className="pw-bars" aria-hidden="true">
                <span /> <span /> <span /> <span />
              </div>
              <span className="pw-label" role="status">
                Seguridad: {passwordStrength(password).label}
              </span>
            </div>
          )}
        </div>

        {info && (
          <p className="notice notice--success" role="status">
            {info}
          </p>
        )}
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}

        <div className="btn-row">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'register' ? 'Crear mi cuenta' : 'Entrar'}
          </button>
        </div>
      </form>

      {cloud && signInWithGoogle && (
        <>
          <div className="auth-divider" aria-hidden="true">
            <span>o</span>
          </div>
          <button type="button" className="btn btn--google" onClick={onGoogle}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
              />
            </svg>
            Entrar con Google
          </button>
        </>
      )}

      {!cloud && (
        <p className="hint" style={{ marginTop: '0.75rem' }}>
          Modo local de demostración: tu cuenta vive solo en este dispositivo. La seguridad real
          llega con la fase en la nube — ver docs/SECURITY.md.
        </p>
      )}
    </div>
  );
}
