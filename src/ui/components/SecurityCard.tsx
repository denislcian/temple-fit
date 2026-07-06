// CAPA 3 · Interfaz — Seguridad de la cuenta (Ajustes).
// 2FA por TOTP (Supabase MFA): activar con QR + código, y desactivar. Además,
// recomendaciones de seguridad honestas para la cuenta.
import { useEffect, useState } from 'react';
import { enrollTotp, getMfaState, unenrollTotp, verifyEnrollment, type MfaState } from '../../data/mfa';
import { useAuth } from './AuthContext';
import { useAnnounce } from './Announcer';
import { ConfirmDialog } from './AppDialog';

export function SecurityCard() {
  const { account } = useAuth();
  const announce = useAnnounce();
  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [enroll, setEnroll] = useState<{ factorId: string; qrSvg: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmOff, setConfirmOff] = useState(false);

  async function reload() {
    setMfa(await getMfaState());
  }
  useEffect(() => {
    void reload();
  }, []);

  async function startEnroll() {
    setBusy(true);
    setError('');
    const result = await enrollTotp();
    if ('error' in result) setError(result.error);
    else setEnroll(result);
    setBusy(false);
  }

  async function confirmEnroll() {
    if (!enroll || code.trim().length < 6) return;
    setBusy(true);
    setError('');
    const err = await verifyEnrollment(enroll.factorId, code);
    if (err) {
      setError(err);
    } else {
      setEnroll(null);
      setCode('');
      await reload();
      announce('Verificación en dos pasos activada');
    }
    setBusy(false);
  }

  async function disable() {
    if (!mfa?.factorId) return;
    setBusy(true);
    const err = await unenrollTotp(mfa.factorId);
    if (err) setError(err);
    else {
      await reload();
      announce('Verificación en dos pasos desactivada');
    }
    setBusy(false);
    setConfirmOff(false);
  }

  return (
    <section className="card" aria-labelledby="security-heading">
      <h2 id="security-heading">Seguridad</h2>

      {!mfa?.supported || !account ? (
        <p className="muted">
          La verificación en dos pasos (2FA) protege tu cuenta y requiere el modo nube con sesión
          iniciada.
        </p>
      ) : mfa.enrolled ? (
        <>
          <p className="muted">
            <strong>Verificación en dos pasos activada.</strong> Al iniciar sesión se pedirá el
            código de tu app de autenticación.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--small btn--danger" onClick={() => setConfirmOff(true)} disabled={busy}>
              Desactivar 2FA
            </button>
          </div>
        </>
      ) : enroll ? (
        <>
          <p className="muted">
            1) Escanea este código con tu app de autenticación (Google Authenticator, Aegis,
            1Password…). 2) Escribe el código de 6 dígitos que te muestre.
          </p>
          {/* SVG generado por Supabase (contenido propio, no entrada de usuario). */}
          <div className="mfa-qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: enroll.qrSvg }} />
          <p className="meta">
            ¿Sin cámara? Clave manual: <code className="num">{enroll.secret}</code>
          </p>
          <div className="field">
            <label htmlFor="totp-code">Código de 6 dígitos</label>
            <input
              id="totp-code"
              className="input num"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={confirmEnroll} disabled={busy || code.length < 6}>
              {busy ? 'Verificando…' : 'Confirmar y activar'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEnroll(null)} disabled={busy}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted">
            Añade una <strong>verificación en dos pasos (2FA)</strong>: además de tu contraseña,
            se pedirá un código temporal de tu app de autenticación. Es la mejora de seguridad más
            eficaz para tu cuenta.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={startEnroll} disabled={busy}>
              {busy ? 'Preparando…' : 'Activar 2FA'}
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="notice notice--error" role="alert" style={{ marginTop: '0.6rem' }}>
          {error}
        </p>
      )}

      <h3 style={{ marginTop: '1rem' }}>Recomendaciones</h3>
      <ul className="muted">
        <li>Usa una contraseña larga y única (mejor con un gestor de contraseñas).</li>
        <li>Activa el 2FA: sin el código, tu contraseña sola no basta para entrar.</li>
        <li>Exporta una copia de seguridad (JSON) de vez en cuando desde «Tus datos».</li>
        <li>Comparte con cabeza: revisa la visibilidad de cada publicación en la comunidad.</li>
      </ul>

      <ConfirmDialog
        open={confirmOff}
        title="¿Desactivar la verificación en dos pasos?"
        description="Tu cuenta volverá a protegerse solo con la contraseña."
        confirmLabel="Sí, desactivar"
        onConfirm={disable}
        onCancel={() => setConfirmOff(false)}
      />
    </section>
  );
}
