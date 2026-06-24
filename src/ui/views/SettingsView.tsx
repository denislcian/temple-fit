// CAPA 3 · Interfaz — Ajustes: tema, propiedad de los datos y ayuda.
// Export/import sin paywall: la queja nº 2 de los usuarios de apps
// comerciales es el secuestro de sus datos.
import { useCallback, useRef, useState } from 'react';
import { AI_PROVIDER_IDS, AI_PROVIDERS, type AIProviderId } from '../../data/aiProviders';
import { diaryToCsv, exportBundle, importBundle, sessionsToCsv } from '../../data/exportImport';
import { db } from '../../data/db';
import {
  loadAIKey,
  loadCoachProvider,
  loadGeminiKey,
  saveAIKey,
  saveCoachProvider,
  saveGeminiKey,
} from '../../data/profile';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { AccountCard } from '../components/AccountCard';
import { useAnnounce } from '../components/Announcer';
import { SelectField } from '../components/Field';
import { ProfileCard } from '../components/ProfileCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import type { Theme } from '../hooks/useTheme';
import { loadWeeklyGoal, MAX_GOAL, MIN_GOAL, saveWeeklyGoal } from '../weeklyGoal';

interface SettingsViewProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsView({ theme, setTheme }: SettingsViewProps) {
  const announce = useAnnounce();
  const fileInput = useRef<HTMLInputElement>(null);
  const [geminiKey, setGeminiKey] = useState(loadGeminiKey);
  const [coachProvider, setCoachProvider] = useState<AIProviderId>(loadCoachProvider);
  const [coachKey, setCoachKey] = useState(() => loadAIKey(loadCoachProvider()));
  const [weeklyGoal, setWeeklyGoalState] = useState(loadWeeklyGoal);

  function changeCoachProvider(id: string) {
    const p = id as AIProviderId;
    setCoachProvider(p);
    setCoachKey(loadAIKey(p));
  }
  const [importMessage, setImportMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));
  const install = useInstallPrompt();

  async function exportJson() {
    const bundle = await exportBundle();
    const date = new Date().toISOString().slice(0, 10);
    download(`temple-${date}.json`, JSON.stringify(bundle, null, 2), 'application/json');
    announce('Copia de seguridad JSON descargada');
  }

  async function exportCsv() {
    const [allSessions, exercises] = await Promise.all([getAllSessions(), getAllExercises()]);
    const date = new Date().toISOString().slice(0, 10);
    download(`temple-historial-${date}.csv`, sessionsToCsv(allSessions, exercises), 'text/csv');
    announce('Historial CSV descargado');
  }

  async function exportNutritionCsv() {
    const diary = await db.diary.toArray();
    if (diary.length === 0) {
      announce('Tu diario de nutrición está vacío todavía');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    download(`temple-nutricion-${date}.csv`, diaryToCsv(diary), 'text/csv');
    announce('Diario de nutrición CSV descargado');
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text();
      const result = await importBundle(text);
      const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
      const text2 = `Importación completada: ${plural(result.sessions, 'sesión', 'sesiones')}, ${plural(
        result.routines,
        'rutina',
        'rutinas',
      )} y ${plural(result.exercises, 'ejercicio nuevo', 'ejercicios nuevos')}.`;
      setImportMessage({ kind: 'success', text: text2 });
      announce(text2);
    } catch (error) {
      const text2 = error instanceof Error ? error.message : 'No se pudo importar el archivo';
      setImportMessage({ kind: 'error', text: text2 });
      announce(`Error al importar: ${text2}`);
    }
  }

  return (
    <>
      <span className="kicker">Tu app, tus datos</span>
      <h1 id="view-title" tabIndex={-1}>
        Ajustes
      </h1>

      <AccountCard />

      <ProfileCard />

      <section className="card" aria-labelledby="goal-heading">
        <h2 id="goal-heading">Objetivo semanal</h2>
        <p className="muted">
          Cuántos entrenamientos a la semana te propones. Verás tu progreso en la pantalla de
          Entrenar.
        </p>
        <div className="stepper" role="group" aria-label="Entrenamientos por semana">
          <button
            type="button"
            className="btn btn--small water-btn"
            disabled={weeklyGoal <= MIN_GOAL}
            aria-label="Reducir el objetivo semanal"
            onClick={() => {
              const next = saveWeeklyGoal(weeklyGoal - 1);
              setWeeklyGoalState(next);
              announce(`Objetivo: ${next} entrenamientos por semana`);
            }}
          >
            −
          </button>
          <span className="num stepper-value">
            <strong>{weeklyGoal}</strong> {weeklyGoal === 1 ? 'día' : 'días'} / semana
          </span>
          <button
            type="button"
            className="btn btn--small water-btn water-btn--add"
            disabled={weeklyGoal >= MAX_GOAL}
            aria-label="Aumentar el objetivo semanal"
            onClick={() => {
              const next = saveWeeklyGoal(weeklyGoal + 1);
              setWeeklyGoalState(next);
              announce(`Objetivo: ${next} entrenamientos por semana`);
            }}
          >
            +
          </button>
        </div>
      </section>

      {install.state !== 'instalada' && (
        <section className="card card--accent" aria-labelledby="install-heading">
          <h2 id="install-heading">Instalar Temple</h2>
          {install.state === 'instalable' && (
            <>
              <p className="muted">
                Instálala como app: se abre a pantalla completa, arranca al instante y funciona sin
                conexión, igual que una app del store.
              </p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    install.promptInstall();
                    announce('Abriendo el diálogo de instalación');
                  }}
                >
                  ⬇ Instalar la app
                </button>
              </div>
            </>
          )}
          {install.state === 'ios' && (
            <p className="muted">
              En iPhone/iPad: toca el botón <strong>Compartir</strong> de Safari y elige{' '}
              <strong>«Añadir a pantalla de inicio»</strong>. Temple se abrirá como una app
              independiente.
            </p>
          )}
          {install.state === 'no-disponible' && (
            <p className="muted">
              Tu navegador instalará Temple desde su menú (busca «Instalar app» o «Añadir a pantalla
              de inicio»). En el móvil es donde más brilla.
            </p>
          )}
        </section>
      )}

      <section className="card" aria-labelledby="theme-heading">
        <h2 id="theme-heading">Tema</h2>
        <p className="muted">Ambos temas cumplen el contraste AA de WCAG.</p>
        <div className="btn-row" role="group" aria-label="Elegir tema">
          <button
            type="button"
            className={`btn ${theme === 'dark' ? 'btn--primary' : ''}`}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            Oscuro (gimnasio)
          </button>
          <button
            type="button"
            className={`btn ${theme === 'light' ? 'btn--primary' : ''}`}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            Claro (papel)
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="data-heading">
        <h2 id="data-heading">Tus datos</h2>
        <p className="muted num">
          {sessions ? `${sessions.length} sesiones guardadas en este dispositivo.` : 'Cargando…'}{' '}
          Nada sale de aquí: no hay cuentas ni servidores.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={exportJson}>
            Exportar todo (JSON)
          </button>
          <button type="button" className="btn" onClick={exportCsv}>
            Exportar historial (CSV)
          </button>
          <button type="button" className="btn" onClick={exportNutritionCsv}>
            Exportar nutrición (CSV)
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Importar copia (JSON)
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label="Seleccionar archivo de copia de seguridad"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importMessage && (
          <p
            className={`notice notice--${importMessage.kind}`}
            role={importMessage.kind === 'error' ? 'alert' : 'status'}
            style={{ marginTop: '1rem' }}
          >
            {importMessage.text}
          </p>
        )}
        <p className="hint" style={{ marginTop: '0.75rem' }}>
          Consejo: exporta el JSON de vez en cuando como copia de seguridad. La importación fusiona
          datos, nunca borra lo que ya tienes.
        </p>
      </section>

      <section className="card" aria-labelledby="gemini-heading">
        <h2 id="gemini-heading">Escáner de macros por foto (opcional)</h2>
        <p className="muted">
          La función "Foto (IA)" de Nutrición usa la API gratuita de Google Gemini con tu propia
          clave. Créala gratis en{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com/apikey
          </a>
          . La clave se guarda <strong>solo en este dispositivo</strong> (nunca en el código ni en
          ningún servidor de la app).
        </p>
        <div className="field">
          <label htmlFor="gemini-key">Clave de API de Gemini</label>
          <input
            id="gemini-key"
            className="input"
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              saveGeminiKey(geminiKey);
              announce(geminiKey.trim() ? 'Clave de Gemini guardada en este dispositivo' : 'Clave de Gemini eliminada');
            }}
          >
            Guardar clave
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="coachai-heading">
        <h2 id="coachai-heading">Coach con IA (opcional)</h2>
        <p className="muted">
          El Coach funciona sin IA (todo el análisis es on-device). Si además quieres un consejo
          redactado en lenguaje natural, elige un proveedor <strong>gratuito</strong> y pega tu clave.
          Se guarda <strong>solo en este dispositivo</strong> y solo se envían datos agregados (RPE
          medio, sueño medio…), nunca tus sesiones.
        </p>
        <div className="field">
          <SelectField label="Proveedor de IA" value={coachProvider} onChange={changeCoachProvider}>
            {AI_PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {AI_PROVIDERS[id].label}
              </option>
            ))}
          </SelectField>
        </div>
        <p className="hint">
          {AI_PROVIDERS[coachProvider].privacy === 'alta' ? '🔒 ' : '⚠️ '}
          {AI_PROVIDERS[coachProvider].note} Clave gratis en{' '}
          <a href={AI_PROVIDERS[coachProvider].keyUrl} target="_blank" rel="noreferrer">
            {AI_PROVIDERS[coachProvider].keyUrl.replace('https://', '')}
          </a>
          .
        </p>
        <div className="field">
          <label htmlFor="coach-key">
            Clave de {AI_PROVIDERS[coachProvider].label.replace(' (recomendado)', '')}
          </label>
          <input
            id="coach-key"
            className="input"
            type="password"
            value={coachKey}
            onChange={(e) => setCoachKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              saveCoachProvider(coachProvider);
              saveAIKey(coachProvider, coachKey);
              announce(
                coachKey.trim()
                  ? `Coach con ${AI_PROVIDERS[coachProvider].label.replace(' (recomendado)', '')} activado`
                  : 'Clave del coach eliminada',
              );
            }}
          >
            Guardar
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="help-heading">
        <h2 id="help-heading">Ayuda</h2>
        <ul>
          <li>
            <strong>Entrenar</strong>: empieza libre o desde una rutina, apunta reps y peso, y marca ✓
            cada serie completada. La app te enseña lo que hiciste la última vez.
          </li>
          <li>
            <strong>Peso 0</strong> = ejercicio a peso corporal. En isométricos (plancha), registra
            los segundos como repeticiones.
          </li>
          <li>
            <strong>1RM estimado</strong>: media de las fórmulas de Epley y Brzycki sobre tu mejor
            serie. Es una estimación para seguir tu progreso, no un objetivo para probar máximos.
          </li>
          <li>
            <strong>Offline</strong>: tras la primera visita, Temple funciona sin conexión. Puedes
            instalarla desde el menú del navegador («Añadir a pantalla de inicio»).
          </li>
        </ul>
      </section>

      <section className="card" aria-labelledby="about-heading">
        <h2 id="about-heading">Acerca de Temple</h2>
        <p className="muted">
          Proyecto personal de código abierto (licencia MIT). Construido con React, TypeScript e
          IndexedDB, sin rastreadores ni analítica: tu entrenamiento es asunto tuyo.
        </p>
      </section>
    </>
  );
}
