// CAPA 3 · Interfaz — Descanso: música para dormir (pistas propias cacheadas
// para offline) y respiración guiada.
import { useCallback, useMemo, useState } from 'react';
import type { SleepSession } from '../../data/sleepModels';
import type { Visibility } from '../../data/nutritionModels';
import { getAllSleepSessions } from '../../data/repositories/sleepRepo';
import { socialRepo } from '../../data/repositories/socialRepo';
import { loadRecoveryDays, markRecoveryDay } from '../../data/recovery';
import { MUSIC_TRACKS, trackUrl } from '../audio/soundscapes';
import { BREATH_PATTERNS } from '../../domain/breathing';
import { recoveryStreak } from '../../domain/recoveryStreak';
import { useAnnounce } from '../components/Announcer';
import { AppDialog } from '../components/AppDialog';
import { useAuth } from '../components/AuthContext';
import { BreathingGuide } from '../components/BreathingGuide';
import { FlameIcon, MoonIcon, MusicNoteIcon, PlayIcon } from '../components/icons';
import { SelectField, TextAreaField } from '../components/Field';
import { SleepReport } from '../components/SleepReport';
import { SleepTracker } from '../components/SleepTracker';
import { useAsyncData } from '../hooks/useAsyncData';
import { useSoundscape } from '../hooks/useSoundscape';
import { formatShortDate, localDateISO } from '../utils/format';

interface ShareDraft {
  kind: 'sueno' | 'meditacion';
  title: string;
  lines: string[];
  defaultText: string;
}

const SLEEP_TIMERS = [15, 30, 60];
const SESSION_MINUTES = [1, 3, 5, 10];

export function DescansoView() {
  const sound = useSoundscape();
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0]!.id);
  const [sessionMin, setSessionMin] = useState(3);
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0]!;
  const { data: nights, reload: reloadNights } = useAsyncData(
    useCallback(() => getAllSleepSessions(), []),
  );
  const { account } = useAuth();
  const announce = useAnnounce();
  const [recoveryVersion, setRecoveryVersion] = useState(0);
  const [lastBreath, setLastBreath] = useState<{ label: string; min: number } | null>(null);
  const [share, setShare] = useState<ShareDraft | null>(null);
  const [shareText, setShareText] = useState('');
  const [shareVis, setShareVis] = useState<Visibility>('seguidores');
  const [sharing, setSharing] = useState(false);
  // Cuántas personas hay en mi lista de mejores amigos (aviso al compartir).
  const myId = account?.id ?? '';
  const { data: myCloseFriends } = useAsyncData(
    useCallback(() => (myId ? socialRepo.getCloseFriends(myId) : Promise.resolve([])), [myId]),
  );

  function markToday() {
    markRecoveryDay(localDateISO());
    setRecoveryVersion((v) => v + 1);
  }

  // La racha cuenta sueño registrado + respiraciones completadas (unión de
  // fechas), siempre solo desde el dispositivo.
  const streak = useMemo(() => {
    const days = [...loadRecoveryDays(), ...(nights ?? []).map((n) => n.date)];
    return recoveryStreak(days, localDateISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nights, recoveryVersion]);

  function openShare(draft: ShareDraft) {
    setShare(draft);
    setShareText(draft.defaultText);
    setShareVis('seguidores');
  }

  function shareSleep(n: SleepSession) {
    openShare({
      kind: 'sueno',
      title: `Noche del ${formatShortDate(n.startedAt)}`,
      lines: [
        `Duración: ${Math.floor(n.durationMin / 60)} h ${n.durationMin % 60} min`,
        `Ronquidos detectados: ${n.snoreCount}`,
      ],
      defaultText: 'Mi descanso de anoche',
    });
  }

  function shareBreath() {
    if (!lastBreath) return;
    openShare({
      kind: 'meditacion',
      title: `Respiración: ${lastBreath.label}`,
      lines: [`Duración: ${lastBreath.min} ${lastBreath.min === 1 ? 'minuto' : 'minutos'}`],
      defaultText: 'Un momento de calma',
    });
  }

  async function doShare() {
    if (!share || !account) return;
    setSharing(true);
    try {
      await socialRepo.publish({
        author: account.displayName,
        authorId: account.id,
        text: shareText.trim(),
        kind: share.kind,
        visibility: shareVis,
        payload: { title: share.title, lines: share.lines },
      });
      announce('Compartido en la comunidad');
      setShare(null);
    } catch (e) {
      announce(e instanceof Error ? e.message : 'No se pudo compartir');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="view-narrow">
      <span className="kicker">Recupérate y duerme mejor</span>
      <h1 id="view-title" tabIndex={-1}>
        Descanso
      </h1>

      {streak.total > 0 && (
        <section className="card recovery-streak" aria-labelledby="rstreak-heading">
          <span className="recovery-streak__flame" aria-hidden="true">
            {streak.current > 0 ? FlameIcon : MoonIcon}
          </span>
          <div>
            <h2 id="rstreak-heading" style={{ margin: 0 }}>
              Racha de recuperación
            </h2>
            <p className="muted" style={{ margin: '0.25rem 0 0' }}>
              {streak.current > 0
                ? `${streak.current} ${streak.current === 1 ? 'día' : 'días'} seguidos cuidándote.`
                : 'Retoma hoy tu racha con una respiración o registrando el sueño.'}
              {streak.best > streak.current ? ` Tu mejor racha: ${streak.best}.` : ''}
            </p>
          </div>
        </section>
      )}

      <section className="card" aria-labelledby="sleep-heading">
        <h2 id="sleep-heading">Seguimiento del sueño</h2>
        <p className="muted">
          Un reloj de noche con alarma que, además, escucha y detecta tus ruidos y ronquidos.
        </p>
        <SleepTracker
          onSaved={() => {
            markToday();
            reloadNights();
          }}
        />

        {nights && nights.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3>Tus noches</h3>
            {nights.map((n) => (
              <details key={n.id} className="night-row">
                <summary className="btn btn--small btn--ghost">
                  {formatShortDate(n.startedAt)} · {Math.floor(n.durationMin / 60)}h{' '}
                  {n.durationMin % 60}m · {n.snoreCount} ronquidos
                </summary>
                <SleepReport session={n} />
                {account && (
                  <div className="btn-row" style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn--small" onClick={() => shareSleep(n)}>
                      Compartir en la comunidad
                    </button>
                  </div>
                )}
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="sounds-heading">
        <h2 id="sounds-heading">Música para dormir</h2>
        <p className="muted">
          Pistas de relajación creadas para TMPL. Suena una a la vez; el volumen y el apagado
          automático valen para todas.
        </p>

        {!sound.supported && (
          <p className="notice notice--error" role="status">
            Tu navegador no permite reproducir audio. Prueba con otro navegador.
          </p>
        )}

        <div className="sound-grid">
          {MUSIC_TRACKS.map((t) => {
            const active = sound.current === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`sound-card ${active ? 'is-active' : ''}`}
                aria-pressed={active}
                onClick={() => sound.toggleTrack(t.id, trackUrl(t.file))}
                disabled={!sound.supported}
              >
                <span className="sound-emoji" aria-hidden="true">
                  {MusicNoteIcon}
                </span>
                <span className="sound-label">{t.label}</span>
                <span className="sound-state" aria-hidden="true">
                  {active ? (
                    <>
                      <span className="eq">
                        <i />
                        <i />
                        <i />
                      </span>{' '}
                      Sonando
                    </>
                  ) : (
                    <>
                      <span className="sound-play" aria-hidden="true">
                        {PlayIcon}
                      </span>{' '}
                      Reproducir
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="vol" className="field-label-row">
            <span>Volumen</span>
            <span className="field-value num">{Math.round(sound.volume * 100)}%</span>
          </label>
          <input
            id="vol"
            className="range"
            type="range"
            min={0}
            max={100}
            value={Math.round(sound.volume * 100)}
            onChange={(e) => sound.setVolume(Number(e.target.value) / 100)}
            aria-valuetext={`${Math.round(sound.volume * 100)} por ciento`}
            style={{ ['--pct' as string]: `${Math.round(sound.volume * 100)}%` }}
          />
        </div>

        <div className="btn-row" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span className="muted" style={{ alignSelf: 'center' }}>
            Apagado automático:
          </span>
          {SLEEP_TIMERS.map((m) => (
            <button
              key={m}
              type="button"
              className={`btn btn--small ${sound.sleepMin === m ? 'btn--primary' : 'btn--ghost'}`}
              aria-pressed={sound.sleepMin === m}
              disabled={!sound.current}
              onClick={() => sound.startSleepTimer(m)}
            >
              {m} min
            </button>
          ))}
          {sound.sleepMin > 0 && (
            <button type="button" className="btn btn--small btn--ghost" onClick={sound.cancelSleepTimer}>
              Cancelar
            </button>
          )}
        </div>
        {sound.sleepMin > 0 && (
          <p className="muted" role="status">
            El sonido se irá apagando durante los próximos {sound.sleepMin} minutos.
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="breath-heading">
        <h2 id="breath-heading">Respiración guiada</h2>
        <p className="muted">{pattern.description}</p>

        <div className="field-row">
          <SelectField label="Ejercicio" value={patternId} onChange={setPatternId}>
            {BREATH_PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Duración"
            value={String(sessionMin)}
            onChange={(v) => setSessionMin(Number(v))}
          >
            {SESSION_MINUTES.map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? 'minuto' : 'minutos'}
              </option>
            ))}
          </SelectField>
        </div>

        {/* key reinicia la guía al cambiar de ejercicio o duración. */}
        <BreathingGuide
          key={`${patternId}-${sessionMin}`}
          pattern={pattern}
          durationMin={sessionMin}
          onComplete={() => {
            markToday();
            setLastBreath({ label: pattern.label, min: sessionMin });
          }}
        />
        {account && lastBreath && (
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn--small" onClick={shareBreath}>
              Compartir esta sesión
            </button>
          </div>
        )}
      </section>

      <AppDialog
        open={share !== null}
        title="Compartir en la comunidad"
        onClose={() => setShare(null)}
      >
        {share && (
          <>
            <div className="card" style={{ background: 'var(--surface-2)', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem' }}>{share.title}</h2>
              <ul>
                {share.lines.map((l, i) => (
                  <li key={i} className="num">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <TextAreaField
              label="¿Quieres añadir algo?"
              value={shareText}
              onChange={setShareText}
              hint="Cómo te sientes, qué te ayudó a descansar…"
            />
            <SelectField
              label="¿Quién puede verla?"
              value={shareVis}
              onChange={(v) => setShareVis(v as Visibility)}
            >
              <option value="seguidores">Solo mis seguidores (recomendado)</option>
              <option value="mejores">Mejores amigos — solo tu lista</option>
              <option value="publica">Pública — cualquiera</option>
              <option value="privada">Privada — solo yo</option>
            </SelectField>
            {shareVis === 'mejores' && (
              <p className="muted" role="status" style={{ margin: '0.35rem 0 0', fontSize: 'var(--fs-sm)' }}>
                {(myCloseFriends?.length ?? 0) === 0
                  ? 'Tu lista está vacía: nadie más la verá. Añade mejores amigos con la estrella de su perfil.'
                  : myCloseFriends!.length === 1
                    ? 'La verá la única persona de tu lista de mejores amigos.'
                    : `La verán las ${myCloseFriends!.length} personas de tu lista de mejores amigos.`}
              </p>
            )}
            <p className="hint">
              Solo se comparte este resumen. Los detalles (clips de audio, niveles por minuto) se
              quedan en tu dispositivo.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={doShare} disabled={sharing}>
                {sharing ? 'Compartiendo…' : 'Compartir'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setShare(null)}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </AppDialog>
    </div>
  );
}
