// CAPA 3 · Interfaz — Gestión de la cuenta en Ajustes.
// Editar perfil, privacidad, cambiar contraseña y borrar la cuenta (RGPD).
import { useState } from 'react';
import { authService } from '../../data/repositories/authRepo';
import { useAnnounce } from './Announcer';
import { useAuth } from './AuthContext';
import { ConfirmDialog } from './AppDialog';
import { Avatar } from './Avatar';
import { TextAreaField, TextField } from './Field';

export function AccountCard() {
  const { account, refresh, logout } = useAuth();

  if (!account) {
    return (
      <section className="card" aria-labelledby="account-heading">
        <h2 id="account-heading">Tu cuenta</h2>
        <p className="muted">
          Aún no has iniciado sesión. Crea tu cuenta en <a href="#/social">Comunidad</a> para
          publicar y seguir a otras personas.
        </p>
      </section>
    );
  }

  return <AccountEditor key={account.id} accountId={account.id} onChange={refresh} onLogout={logout} />;
}

function AccountEditor({
  accountId,
  onChange,
  onLogout,
}: {
  accountId: string;
  onChange: () => Promise<void>;
  onLogout: () => void;
}) {
  const announce = useAnnounce();
  const { account } = useAuth();
  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [bio, setBio] = useState(account?.bio ?? '');
  const [privateProfile, setPrivateProfile] = useState(account?.privateProfile ?? false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!account) return null;

  async function saveProfile() {
    try {
      await authService.updateProfile(accountId, {
        displayName,
        bio: bio.trim(),
        privateProfile,
      });
      await onChange();
      setSavedMsg('Perfil actualizado');
      announce('Perfil actualizado');
    } catch (e) {
      setSavedMsg(e instanceof Error ? e.message : 'No se pudo guardar');
    }
  }

  async function changePassword() {
    try {
      await authService.changePassword(accountId, curPwd, newPwd);
      setCurPwd('');
      setNewPwd('');
      setPwdMsg({ kind: 'success', text: 'Contraseña actualizada' });
      announce('Contraseña actualizada');
    } catch (e) {
      setPwdMsg({ kind: 'error', text: e instanceof Error ? e.message : 'No se pudo cambiar' });
    }
  }

  return (
    <section className="card" aria-labelledby="account-heading">
      <div className="session-bar" style={{ marginBottom: '1rem' }}>
        <Avatar id={account.id} name={account.displayName} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="account-heading" style={{ margin: 0 }}>
            Tu cuenta
          </h2>
          <span className="meta">@{account.username}</span>
        </div>
        <button type="button" className="btn btn--small btn--ghost" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

      <h3>Perfil</h3>
      <TextField label="Nombre para mostrar" value={displayName} onChange={(v) => { setDisplayName(v); setSavedMsg(null); }} />
      <TextAreaField label="Biografía" value={bio} onChange={(v) => { setBio(v); setSavedMsg(null); }} hint="Una línea sobre ti (opcional)." />
      <label className="auto-rest">
        <input type="checkbox" checked={privateProfile} onChange={(e) => { setPrivateProfile(e.target.checked); setSavedMsg(null); }} />
        Perfil privado (tus publicaciones de «solo seguidores» no aparecen a desconocidos)
      </label>
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={saveProfile}>
          Guardar perfil
        </button>
        {savedMsg && (
          <span className="notice notice--success" role="status" style={{ margin: 0 }}>
            {savedMsg}
          </span>
        )}
      </div>

      <h3 style={{ marginTop: '1.25rem' }}>Cambiar contraseña</h3>
      <div className="field">
        <label htmlFor="cur-pwd">Contraseña actual</label>
        <input id="cur-pwd" className="input" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="field">
        <label htmlFor="new-pwd">Nueva contraseña</label>
        <input id="new-pwd" className="input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" />
      </div>
      {pwdMsg && (
        <p className={`notice notice--${pwdMsg.kind}`} role={pwdMsg.kind === 'error' ? 'alert' : 'status'}>
          {pwdMsg.text}
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn" onClick={changePassword} disabled={!curPwd || !newPwd}>
          Cambiar contraseña
        </button>
      </div>

      <h3 style={{ marginTop: '1.25rem' }}>Zona de peligro</h3>
      <p className="muted">
        Borrar tu cuenta elimina de forma permanente tu perfil, tus publicaciones y tus seguimientos
        (derecho al olvido, RGPD). Tus entrenamientos y nutrición locales no se tocan; expórtalos
        antes si quieres conservarlos.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
          Borrar mi cuenta
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar tu cuenta?"
        description="Se eliminarán para siempre tu perfil, tus publicaciones y tus seguimientos. Esta acción no se puede deshacer."
        confirmLabel="Sí, borrar mi cuenta"
        onConfirm={async () => {
          await authService.deleteAccount(accountId);
          setConfirmDelete(false);
          await onChange();
          announce('Cuenta eliminada');
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}
