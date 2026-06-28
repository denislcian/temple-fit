// CAPA 3 · Interfaz — Campos de formulario accesibles.
// Patrón GOV.UK para números: type="text" + inputmode (nunca type="number").
// Errores vinculados con aria-describedby + aria-invalid, nunca solo color.
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

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
  /** Unidad mostrada dentro del campo (p. ej. "kg", "cm", "kcal"). */
  suffix?: string;
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
  suffix,
  ariaLabel,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const input = (
    <input
      id={id}
      className={suffix ? 'input input--has-suffix' : 'input'}
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
  );

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="field-req" aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {suffix ? (
        <div className="input-affix">
          {input}
          <span className="field-suffix" aria-hidden="true">
            {suffix}
          </span>
        </div>
      ) : (
        input
      )}
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

interface SelectItem {
  value: string;
  node: ReactNode;
}

/** Extrae {value, etiqueta} de los <option> hijos (acepta map/condicionales). */
function childrenToItems(children: ReactNode): SelectItem[] {
  const items: SelectItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: ReactNode };
    if (props.value !== undefined) items.push({ value: String(props.value), node: props.children });
  });
  return items;
}

/**
 * Desplegable propio (patrón ARIA combobox + listbox): mismo aspecto premium
 * en todos los navegadores, con teclado completo (flechas, Inicio/Fin, Enter,
 * Esc) y lector de pantalla (aria-activedescendant). Sustituye al menú nativo
 * del SO, que no se puede estilar.
 */
function CustomSelect({
  id,
  labelId,
  value,
  onChange,
  items,
  describedBy,
  invalid,
}: {
  id: string;
  labelId: string;
  value: string;
  onChange: (value: string) => void;
  items: SelectItem[];
  describedBy?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedIdx = items.findIndex((i) => i.value === value);
  const [active, setActive] = useState(selectedIdx >= 0 ? selectedIdx : 0);
  // Ref espejo del activo: el teclado lo actualiza de forma SÍNCRONA, así una
  // ráfaga (flecha+flecha+Enter) no lee un valor obsoleto del closure.
  const activeRef = useRef(active);
  const move = (n: number) => {
    activeRef.current = n;
    setActive(n);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Posición fija calculada desde el botón: así el menú NO lo recorta el overflow
  // de un diálogo/contenedor y siempre se ve entero.
  const [pos, setPos] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  function positionList() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const vh = window.innerHeight;
    const below = vh - r.bottom;
    const above = r.top;
    const dropUp = below < 220 && above > below;
    const maxHeight = Math.min(260, Math.max(120, (dropUp ? above : below) - 12));
    setPos(
      dropUp
        ? { left: r.left, width: r.width, bottom: vh - r.top + 4, maxHeight }
        : { left: r.left, width: r.width, top: r.bottom + 4, maxHeight },
    );
  }

  useEffect(() => {
    if (open) move(selectedIdx >= 0 ? selectedIdx : 0);
  }, [open, selectedIdx]);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    positionList();
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function choose(idx: number) {
    if (items[idx]) onChange(items[idx]!.value);
    setOpen(false);
    btnRef.current?.focus();
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) setOpen(true);
        else move(Math.min(items.length - 1, activeRef.current + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) setOpen(true);
        else move(Math.max(0, activeRef.current - 1));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          move(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          move(items.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) choose(activeRef.current);
        else setOpen(true);
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  const selected = selectedIdx >= 0 ? items[selectedIdx] : undefined;

  return (
    <div className={`cselect${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        className={`input cselect__trigger${invalid ? ' cselect__trigger--invalid' : ''}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${labelId} ${id}`}
        aria-describedby={describedBy}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="cselect__value">{selected ? selected.node : ' '}</span>
        <svg className="cselect__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && pos && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          className="cselect__list"
          role="listbox"
          aria-labelledby={labelId}
          style={{
            position: 'fixed',
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
            ...(pos.top !== undefined ? { top: pos.top } : {}),
            ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
          }}
        >
          {items.map((it, idx) => (
            <li
              key={`${it.value}-${idx}`}
              id={`${id}-opt-${idx}`}
              data-idx={idx}
              role="option"
              aria-selected={it.value === value}
              className={`cselect__opt${idx === active ? ' is-active' : ''}${it.value === value ? ' is-selected' : ''}`}
              onMouseEnter={() => move(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(idx);
              }}
            >
              <span className="cselect__opt-label">{it.node}</span>
              {it.value === value && (
                <svg className="cselect__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5 9-11" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SelectField({ label, value, onChange, error, hint, children }: SelectFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  // Dentro de un <dialog> usamos el <select> nativo (el desplegable propio lo
  // recortaría el overflow/transform del modal). Fuera, el desplegable premium.
  // useLayoutEffect corrige antes de pintar → sin parpadeo (el cerrado es igual).
  const wrapRef = useRef<HTMLDivElement>(null);
  const [native, setNative] = useState(false);
  useLayoutEffect(() => {
    setNative(!!wrapRef.current?.closest('dialog, [role="dialog"]'));
  }, []);

  return (
    <div className="field" ref={wrapRef}>
      <label htmlFor={id} id={labelId}>
        {label}
      </label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {native ? (
        <select
          id={id}
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          {children}
        </select>
      ) : (
        <CustomSelect
          id={id}
          labelId={labelId}
          value={value}
          onChange={onChange}
          items={childrenToItems(children)}
          describedBy={describedBy}
          invalid={!!error}
        />
      )}
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
