// CAPA 3 · Interfaz — Legal: términos de uso, privacidad y cookies.
// Redactado para lo que la app HACE de verdad (local primero, nube opcional,
// IA con agregados, pagos con Stripe, sin rastreadores). Stripe exige que
// términos y privacidad sean accesibles desde el checkout.
export function LegalView() {
  return (
    <div className="view-narrow legal">
      <span className="kicker">Transparencia</span>
      <h1 id="view-title" tabIndex={-1}>
        Legal
      </h1>

      {/* Botones de scroll (no anclas #: chocarían con el router por hash). */}
      <nav className="btn-row" aria-label="Secciones legales" style={{ marginBottom: '1rem' }}>
        {(
          [
            ['terminos', 'Términos'],
            ['privacidad', 'Privacidad'],
            ['cookies', 'Cookies'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="card" aria-labelledby="terminos">
        <h2 id="terminos">Términos de uso</h2>
        <p className="muted">Última actualización: julio de 2026.</p>
        <h3>Qué es TMPL</h3>
        <p>
          TMPL es una aplicación de entrenamiento, nutrición, descanso y comunidad. Es un proyecto
          de código abierto (licencia MIT). Puedes usarla gratis; existe un plan Premium opcional.
        </p>
        <h3>No es consejo médico</h3>
        <p>
          TMPL ofrece información general de entrenamiento y nutrición apoyada en literatura
          científica citada, <strong>pensada para adultos sanos</strong>. No es consejo médico ni
          sustituye a un profesional sanitario. Ante lesiones, patologías, embarazo o cualquier
          duda de salud, consulta a un médico antes de entrenar o cambiar tu alimentación.
        </p>
        <h3>Tu cuenta y la comunidad</h3>
        <p>
          La cuenta es opcional (la app funciona en modo local). Si participas en la comunidad, te
          comprometes a no publicar contenido ilegal, ofensivo, engañoso o que suplante a otras
          personas. Podemos retirar contenido y suspender cuentas que incumplan estas normas.
          Publicas bajo tu responsabilidad y conservas los derechos de tu contenido, dándonos
          permiso para mostrarlo en la app según la visibilidad que elijas.
        </p>
        <h3>Premium y pagos</h3>
        <p>
          El plan Premium es una suscripción (mensual o anual, precio con IVA incluido) procesada
          por Stripe. Se renueva automáticamente y puedes cancelarla en cualquier momento desde el
          portal de cliente; al cancelar, conservas Premium hasta el final del periodo pagado. Se
          aplican los derechos de desistimiento y garantías de la normativa de consumo de la UE.
        </p>
        <h3>Responsabilidad</h3>
        <p>
          La app se ofrece «tal cual», sin garantías. En la medida que permita la ley, no nos
          hacemos responsables de daños derivados del uso de la app o del entrenamiento realizado
          con ella. Eres responsable de entrenar con técnica y cargas adecuadas a tu nivel.
        </p>
        <h3>Cambios</h3>
        <p>
          Podemos actualizar estos términos; los cambios relevantes se anunciarán en la app.
          Contacto: a través del repositorio del proyecto en GitHub (denislcian/temple-fit).
        </p>
      </section>

      <section className="card" aria-labelledby="privacidad">
        <h2 id="privacidad">Política de privacidad</h2>
        <p className="muted">Última actualización: julio de 2026.</p>
        <h3>La idea principal</h3>
        <p>
          TMPL está diseñada para que tus datos sean tuyos: <strong>sin rastreadores, sin
          analítica y sin publicidad</strong>. En modo local, todo vive en tu dispositivo y nada
          sale de él.
        </p>
        <h3>Qué datos se tratan y dónde</h3>
        <ul>
          <li>
            <strong>Modo local:</strong> tus entrenamientos, nutrición, sueño y ajustes se guardan
            solo en tu dispositivo (IndexedDB/localStorage). Puedes exportarlos o borrarlos desde
            Ajustes.
          </li>
          <li>
            <strong>Modo nube (con cuenta):</strong> tu email, perfil y los datos que sincronizas
            se almacenan en la infraestructura de Supabase, protegidos por políticas de acceso por
            fila. Lo que publicas en la comunidad es visible según la visibilidad que elijas.
          </li>
          <li>
            <strong>Ubicación (opcional):</strong> solo si la activas, guardamos tu ciudad y una
            posición aproximada (~1 km), nunca tu posición exacta.
          </li>
          <li>
            <strong>Coach con IA:</strong> al pedir un consejo o pregunta con IA se envían
            únicamente <strong>datos agregados sin identidad</strong> (RPE medio, sesiones por
            semana, horas de sueño) a nuestro proveedor de inferencia (Groq), cuyo contrato
            prohíbe usar esos datos para entrenar modelos. Nunca se envía tu nombre, email ni
            medidas corporales.
          </li>
          <li>
            <strong>Pagos:</strong> los procesa Stripe; nosotros no vemos ni guardamos tu tarjeta.
            Guardamos solo el estado de tu suscripción.
          </li>
          <li>
            <strong>Escáner de comida (opcional):</strong> si configuras tu propia clave de
            Gemini, las fotos que analices se envían a Google con tu clave, bajo sus términos.
          </li>
        </ul>
        <h3>Tus derechos (RGPD)</h3>
        <p>
          Acceso y portabilidad: exporta todo desde Ajustes. Supresión: borra tu cuenta y sus
          datos desde Ajustes en cualquier momento. Para cualquier otra solicitud, contacta a
          través del repositorio del proyecto en GitHub (denislcian/temple-fit).
        </p>
      </section>

      <section className="card" aria-labelledby="cookies">
        <h2 id="cookies">Política de cookies</h2>
        <p>
          TMPL <strong>no usa cookies de terceros, ni de publicidad, ni de analítica</strong>.
          Solo empleamos almacenamiento técnico imprescindible en tu dispositivo
          (localStorage/IndexedDB) para: mantener tu sesión iniciada, recordar tus preferencias
          (tema, ajustes) y guardar tus datos de entrenamiento. Este almacenamiento estrictamente
          necesario no requiere consentimiento y no se comparte con nadie.
        </p>
      </section>
    </div>
  );
}
