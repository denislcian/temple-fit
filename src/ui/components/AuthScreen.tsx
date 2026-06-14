// CAPA 3 · Interfaz — Registro / inicio de sesión.
// Puerta de entrada a la red social (Comunidad). Cumple WCAG 3.3.8: permite
// pegar y autocompletar (gestores de contraseñas), sin CAPTCHA cognitivo.
import { useState } from 'react';
import { useAnnounce } from './Announcer';
import { useAuth } from './AuthContext';
import { TextField } from './Field';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const announce = useAnnounce();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') {
        await register({ username, displayName, password });
        announce(`Cuenta creada. Bienvenido, ${displayName}`);
      } else {
        await login(username, password);
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
        <button type="button" aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(null); }}>
          Iniciar sesión
        </button>
        <button type="button" aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError(null); }}>
          Crear cuenta
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TextField
          label="Nombre de usuario"
          value={username}
          onChange={setUsername}
          autoComplete="username"
          hint={mode === 'register' ? '3-20 caracteres: letras, números, _ o .' : undefined}
        />
        {mode === 'register' && (
          <TextField
            label="Nombre para mostrar"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="nickname"
          />
        )}
        {/* Campo de contraseña: type=password, permite pegar y autocompletar. */}
        <div className="field">
          <label htmlFor="auth-password">Contraseña</label>
          {mode === 'register' && (
            <p className="hint" id="auth-password-hint">
              Mínimo 8 caracteres.
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
        </div>

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

      <p className="hint" style={{ marginTop: '0.75rem' }}>
        Modo local de demostración: tu cuenta vive solo en este dispositivo. La seguridad real
        (servidor, contraseñas cifradas, privacidad aplicada) llega con la fase en la nube —
        ver docs/SECURITY.md.
      </p>
    </div>
  );
}
