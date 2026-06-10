// CAPA 3 · Interfaz — Ajustes: tema, propiedad de los datos y ayuda.
// Export/import sin paywall: la queja nº 2 de los usuarios de apps
// comerciales es el secuestro de sus datos.
import { useCallback, useRef, useState } from 'react';
import { exportBundle, importBundle, sessionsToCsv } from '../../data/exportImport';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { useAnnounce } from '../components/Announcer';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Theme } from '../hooks/useTheme';

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
  const [importMessage, setImportMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));

  async function exportJson() {
    const bundle = await exportBundle();
    const date = new Date().toISOString().slice(0, 10);
    download(`forjafit-${date}.json`, JSON.stringify(bundle, null, 2), 'application/json');
    announce('Copia de seguridad JSON descargada');
  }

  async function exportCsv() {
    const [allSessions, exercises] = await Promise.all([getAllSessions(), getAllExercises()]);
    const date = new Date().toISOString().slice(0, 10);
    download(`forjafit-historial-${date}.csv`, sessionsToCsv(allSessions, exercises), 'text/csv');
    announce('Historial CSV descargado');
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text();
      const result = await importBundle(text);
      const text2 = `Importación completada: ${result.sessions} sesiones, ${result.routines} rutinas y ${result.exercises} ejercicios nuevos.`;
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
            <strong>Offline</strong>: tras la primera visita, ForjaFit funciona sin conexión. Puedes
            instalarla desde el menú del navegador («Añadir a pantalla de inicio»).
          </li>
        </ul>
      </section>

      <section className="card" aria-labelledby="about-heading">
        <h2 id="about-heading">Acerca de ForjaFit</h2>
        <p className="muted">
          Proyecto personal de código abierto (licencia MIT). Construido con React, TypeScript e
          IndexedDB, sin rastreadores ni analítica: tu entrenamiento es asunto tuyo.
        </p>
      </section>
    </>
  );
}
