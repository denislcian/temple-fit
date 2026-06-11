// CAPA 3 · Interfaz — Campos de formulario accesibles.
// Patrón GOV.UK para números: type="text" + inputmode (nunca type="number").
// Errores vinculados con aria-describedby + aria-invalid, nunca solo color.
import { useId, type ReactNode } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string | undefined;
  hint?: string;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** 'int' → teclado numérico; 'decimal' → teclado decimal; 'text' → normal. */
  mode?: 'text' | 'int' | 'decimal';
  autoComplete?: string;
  required?: boolean;
  /**
   * Nombre accesible extendido cuando la etiqueta visible es corta (p. ej.
   * label="Reps", ariaLabel="Reps, serie 2 de Press de banca"). Para cumplir
   * WCAG 2.5.3 (Label in Name) DEBE empezar por el texto visible.
   */
  ariaLabel?: string;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  mode = 'text',
  autoComplete,
  required,
  ariaLabel,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      <input
        id={id}
        className="input"
        type="text"
        inputMode={mode === 'int' ? 'numeric' : mode === 'decimal' ? 'decimal' : undefined}
        pattern={mode === 'int' ? '[0-9]*' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
      />
      {error && (
        <p className="error" id={errorId}>
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function SelectField({ label, value, onChange, error, children }: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        {children}
      </select>
      {error && (
        <p className="error" id={errorId}>
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function TextAreaField({ label, value, onChange, hint, rows = 3 }: TextAreaFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      <textarea
        id={id}
        className="input"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? hintId : undefined}
      />
    </div>
  );
}
