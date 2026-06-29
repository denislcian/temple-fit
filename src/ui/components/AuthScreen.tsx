// CAPA 3 · Interfaz — Registro / inicio de sesión.
// Puerta de entrada a la Comunidad. Cumple WCAG 3.3.8: permite pegar y
// autocompletar (gestores de contraseñas), sin CAPTCHA cognitivo.
// El registro es un WIZARD deslizable (una pantalla por paso, estilo app
// moderna); el inicio de sesión es un formulario simple. En la nube (Supabase)
// el acceso es por email + contraseña con confirmación.
import { useEffect, useState, type ReactNode } from 'react';
import {
  GOAL_LABELS,
  passwordStrength,
  SEX_LABELS,
  validateBirthdate,
  validateDisplayName,
  validateHeightCm,
  validatePassword,
  validateUsername,
  validateWeightKg,
  normalizeUsername,
  type Goal,
  type Sex,
} from '../../data/authModels';
import { isSupabaseEnabled } from '../../data/supabase';
import { useAnnounce } from './Announcer';
import { useAuth } from './AuthContext';
import { SelectField, TextField } from './Field';

type Mode = 'login' | 'register';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
].map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }));

const pad2 = (n: number): string => String(n).padStart(2, '0');

interface Step {
  key: string;
  title: string;
  hint?: string;
  content: ReactNode;
  /** Devuelve un mensaje de error si el paso no es válido todavía, o null. */
  validate: () => string | null;
}

export function AuthScreen() {
  const announce = useAnnounce();
  const { login, register, signInWithGoogle } = useAuth();
  const cloud = isSupabaseEnabled;

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [bDay, setBDay] = useState('');
  const [bMonth, setBMonth] = useState('');
  const [bYear, setBYear] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Wizard de registro: paso actual y dirección de la animación (1 adelante, -1 atrás).
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const nowYear = new Date().getFullYear();
  const birthYears = Array.from({ length: 88 }, (_, i) => String(nowYear - 13 - i)); // 13–100 años
  const birthDays = Array.from({ length: 31 }, (_, i) => pad2(i + 1));
  const birthdate = bDay && bMonth && bYear ? `${bYear}-${bMonth}-${bDay}` : '';

  useEffect(() => {
    const raw = window.location.search + window.location.hash;
    const desc = /error_description=([^&]+)/.exec(raw)?.[1] ?? /[#&?]error=([^&]+)/.exec(raw)?.[1];
    if (desc) {
      setError(decodeURIComponent(desc.replace(/\+/g, ' ')));
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  async function onGoogle() {
    setError(null);
    try {
      await signInWithGoogle?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google');
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
    setStep(0);
    setStepError(null);
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
          ...(birthdate ? { birthdate } : {}),
          ...(sex ? { sex: sex as Sex } : {}),
          ...(height ? { heightCm: Number(height) } : {}),
          ...(weight ? { weightKg: Number(weight) } : {}),
          ...(goal ? { goal: goal as Goal } : {}),
        });
        if (needsConfirmation) {
          setInfo('Te hemos enviado un email para confirmar tu cuenta. Ábrelo y luego inicia sesión.');
          setMode('login');
          setStep(0);
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

  // ── Pasos del wizard de registro ────────────────────────
  const emailStep: Step = {
    key: 'email',
    title: 'Tu email',
    hint: 'Lo usarás para entrar y recuperar la cuenta.',
    validate: () => (/.+@.+\..+/.test(email) ? null : 'Escribe un email válido'),
    content: (
      <>
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
        {signInWithGoogle && (
          <>
            <div className="auth-divider" aria-hidden="true">
              <span>o regístrate en un toque</span>
            </div>
            <button type="button" className="btn btn--google" onClick={onGoogle}>
              <GoogleIcon /> Continuar con Google
            </button>
          </>
        )}
      </>
    ),
  };

  const passwordStep: Step = {
    key: 'password',
    title: 'Crea tu contraseña',
    hint: 'Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.',
    validate: () => validatePassword(password),
    content: (
      <div className="field">
        <label htmlFor="auth-password">Contraseña</label>
        <input
          id="auth-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {password.length > 0 && (
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
    ),
  };

  const identityStep: Step = {
    key: 'identity',
    title: '¿Cómo te llamas?',
    hint: 'Tu @usuario es único; el nombre para mostrar es el que verá la gente.',
    validate: () => validateUsername(normalizeUsername(username)) ?? validateDisplayName(displayName),
    content: (
      <>
        <TextField
          label="Nombre de usuario"
          value={username}
          onChange={setUsername}
          autoComplete="username"
          hint="3-20 caracteres: letras, números, _ o ."
        />
        <TextField
          label="Nombre para mostrar"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="nickname"
        />
      </>
    ),
  };

  const aboutStep: Step = {
    key: 'about',
    title: 'Sobre ti',
    hint: 'Opcional: personaliza tu coach y tu nutrición. Puedes rellenarlo más tarde.',
    validate: () => {
      if (birthdate) {
        const e = validateBirthdate(birthdate);
        if (e) return e;
      }
      if (height) {
        const e = validateHeightCm(Number(height));
        if (e) return e;
      }
      if (weight) {
        const e = validateWeightKg(Number(weight));
        if (e) return e;
      }
      return null;
    },
    content: (
      <>
        <div className="field">
          <span className="field-label" id="auth-bd-label">
            Fecha de nacimiento
          </span>
          <div className="birthdate" role="group" aria-labelledby="auth-bd-label">
            <select className="input" aria-label="Día" value={bDay} onChange={(e) => setBDay(e.target.value)}>
              <option value="">Día</option>
              {birthDays.map((d) => (
                <option key={d} value={d}>
                  {Number(d)}
                </option>
              ))}
            </select>
            <select className="input" aria-label="Mes" value={bMonth} onChange={(e) => setBMonth(e.target.value)}>
              <option value="">Mes</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select className="input" aria-label="Año" value={bYear} onChange={(e) => setBYear(e.target.value)}>
              <option value="">Año</option>
              {birthYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <SelectField label="Sexo" value={sex} onChange={setSex}>
          <option value="">Prefiero no decirlo</option>
          <option value="mujer">{SEX_LABELS.mujer}</option>
          <option value="hombre">{SEX_LABELS.hombre}</option>
        </SelectField>
        <div className="field-grid">
          <TextField label="Altura" value={height} onChange={setHeight} mode="int" suffix="cm" />
          <TextField label="Peso" value={weight} onChange={setWeight} mode="decimal" suffix="kg" />
        </div>
        <SelectField label="Objetivo" value={goal} onChange={setGoal}>
          <option value="">Sin objetivo concreto</option>
          <option value="perder">{GOAL_LABELS.perder}</option>
          <option value="ganar">{GOAL_LABELS.ganar}</option>
          <option value="mantener">{GOAL_LABELS.mantener}</option>
        </SelectField>
      </>
    ),
  };

  // Se reconstruyen en cada render (cierran sobre el estado actual): sin memo
  // para evitar closures obsoletos.
  const steps: Step[] = cloud
    ? [emailStep, passwordStep, identityStep, aboutStep]
    : [identityStep, passwordStep, aboutStep];

  const current = steps[Math.min(step, steps.length - 1)]!;
  const isLast = step >= steps.length - 1;

  function next() {
    const err = current.validate();
    if (err) {
      setStepError(err);
      announce(err);
      return;
    }
    setStepError(null);
    if (isLast) {
      void submit();
    } else {
      setDir(1);
      setStep((s) => s + 1);
    }
  }

  function back() {
    setStepError(null);
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="card card--accent auth-card">
      <div className="segmented" role="group" aria-label="Acceder o crear cuenta">
        <span
          className="segmented__thumb"
          aria-hidden="true"
          style={{ transform: mode === 'register' ? 'translateX(calc(100% + 2px))' : 'translateX(0)' }}
        />
        <button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>
          Iniciar sesión
        </button>
        <button type="button" aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>
          Crear cuenta
        </button>
      </div>

      {mode === 'login' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {cloud ? (
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <TextField label="Nombre de usuario" value={username} onChange={setUsername} autoComplete="username" />
          )}
          <div className="field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
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

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Un momento…' : 'Entrar'}
          </button>

          {cloud && signInWithGoogle && (
            <>
              <div className="auth-divider" aria-hidden="true">
                <span>o</span>
              </div>
              <button type="button" className="btn btn--google" onClick={onGoogle}>
                <GoogleIcon /> Entrar con Google
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="auth-wizard">
          <div className="auth-progress" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s.key} className={`auth-dot ${i <= step ? 'is-done' : ''}`} />
            ))}
          </div>
          <p className="auth-progress__label">
            Paso {step + 1} de {steps.length}
          </p>

          <div className="auth-step" key={current.key} data-dir={dir === 1 ? 'fwd' : 'back'}>
            <h2 className="auth-step__title">{current.title}</h2>
            {current.hint && <p className="hint">{current.hint}</p>}
            {current.content}
          </div>

          {stepError && (
            <p className="notice notice--error" role="alert">
              {stepError}
            </p>
          )}
          {error && (
            <p className="notice notice--error" role="alert">
              {error}
            </p>
          )}

          <div className="auth-nav">
            {step > 0 ? (
              <button type="button" className="btn btn--ghost" onClick={back} disabled={busy}>
                Atrás
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="btn btn--primary" onClick={next} disabled={busy}>
              {busy ? 'Un momento…' : isLast ? 'Crear mi cuenta' : 'Siguiente'}
            </button>
          </div>
        </div>
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

function GoogleIcon() {
  return (
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
  );
}
