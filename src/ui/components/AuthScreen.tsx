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
  const { login, register } = useAuth();
  const cloud = isSupabaseEnabled;
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
              Mínimo 8 caracteres. Si es corta, combina mayúsculas, minúsculas, números o símbolos;
              o usa una frase larga (12+).
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

      <p className="hint" style={{ marginTop: '0.75rem' }}>
        {cloud
          ? 'Tu cuenta y la comunidad viven en la nube (Supabase), con la privacidad de cada publicación impuesta en el servidor. Tus entrenos, nutrición y sueño siguen solo en tu dispositivo.'
          : 'Modo local de demostración: tu cuenta vive solo en este dispositivo. La seguridad real llega con la fase en la nube — ver docs/SECURITY.md.'}
      </p>
    </div>
  );
}
