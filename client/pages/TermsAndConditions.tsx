import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useScrollTop from "@/hooks/useScrollTop";

export default function TermsAndConditions() {
  useScrollTop();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-oswald text-4xl md:text-5xl font-bold text-black mb-4">
              Términos y Condiciones
            </h1>
            <p className="font-raleway text-lg text-gray-600">
              Campañas Promocionales – Minga Aurumec
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="font-raleway text-gray-700 leading-relaxed mb-4">
              Bienvenido a las campañas promocionales organizadas por <strong>Minga Aurumec</strong>.
            </p>
            <p className="font-raleway text-gray-700 leading-relaxed">
              Al adquirir un ticket en línea y participar en nuestros sorteos, usted acepta de manera
              expresa y sin reservas los siguientes Términos y Condiciones:
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {/* 1. Organización */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                1. Organización
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-2">
                <p>Estas campañas son organizadas por <strong>Minga Aurum EC</strong>, con domicilio en Ecuador.</p>
                <p>La participación en estas actividades implica la aceptación total de estos Términos y Condiciones.</p>
              </div>
            </section>

            {/* 2. Naturaleza de la campaña */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                2. Naturaleza de la campaña
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-3">
                <p>Las campañas consisten en la venta de tickets en línea, que permiten participar en sorteos de premios como:</p>
                <ul className="list-none space-y-2 ml-4">
                  <li>🔧 Herramientas eléctricas</li>
                  <li>🔋 Herramientas inalámbricas</li>
                  <li>⚙️ Motores de 2 tiempos</li>
                  <li>🛠️ Herramientas manuales</li>
                </ul>
                <p className="mt-4">
                  <strong>Importante:</strong> La compra de un ticket otorga derecho a participar, pero no garantiza ganar un premio.
                </p>
              </div>
            </section>

            {/* 3. Requisitos de participación */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                3. Requisitos de participación
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>Podrán participar únicamente personas mayores de 18 años, residentes en Ecuador.</li>
                <li>La participación es personal e intransferible.</li>
                <li>La compra de tickets implica la aceptación de estos Términos y Condiciones.</li>
              </ul>
            </section>

            {/* 4. Tickets */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                4. Tickets
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>Cada ticket tiene un valor de <strong>$1 USD</strong> y será emitido de manera digital.</li>
                <li>El ticket es válido solo para la campaña en la que fue adquirido.</li>
                <li><strong>No existen devoluciones ni reembolsos.</strong></li>
              </ul>
            </section>

            {/* 5. Sorteos y premios */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                5. Sorteos y premios
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-3">
                <ul className="list-disc ml-6 space-y-2">
                  <li>Los sorteos se realizarán en la fecha y hora anunciadas previamente por Minga Aurum EC.</li>
                  <li>Los ganadores se seleccionarán mediante un sistema aleatorio y transparente.</li>
                </ul>
                <p className="mt-4"><strong>Los premios:</strong></p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>No son canjeables por dinero ni por otros productos/servicios.</li>
                  <li>Se entregarán únicamente al ganador, previa verificación de su identidad.</li>
                  <li>Si el ganador no reclama su premio en el plazo indicado, este se considerará renunciado sin responsabilidad de la Organización.</li>
                </ul>
              </div>
            </section>

            {/* 6. Responsabilidad de la organización */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                6. Responsabilidad de la organización
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-3">
                <p>Minga Aurum EC <strong>no se hace responsable</strong> por:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Daños, pérdidas o desperfectos ocurridos después de la entrega del premio.</li>
                  <li>Problemas técnicos de internet, plataformas de pago o fallos de conexión.</li>
                  <li>Conductas fraudulentas de los participantes (lo que conllevará descalificación inmediata).</li>
                </ul>
              </div>
            </section>

            {/* 7. Legalidad y transparencia */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                7. Legalidad y transparencia
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-2">
                <p>Los sorteos se realizarán en conformidad con las <strong>normas vigentes en Ecuador</strong> en materia de promociones comerciales.</p>
                <p>De ser necesario, se cumplirán los trámites y permisos correspondientes ante autoridades competentes.</p>
              </div>
            </section>

            {/* 8. Protección de datos personales */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                8. Protección de datos personales
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-2">
                <p>Los datos proporcionados serán tratados de manera confidencial.</p>
                <p>Se usarán únicamente para fines relacionados con la campaña, en cumplimiento de la <strong>Ley Orgánica de Protección de Datos Personales</strong>.</p>
              </div>
            </section>

            {/* 9. Modificaciones */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                9. Modificaciones
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-2">
                <p>La Organización podrá modificar, suspender o cancelar las campañas por causas de fuerza mayor o circunstancias fuera de su control.</p>
                <p>Dichos cambios no generarán responsabilidad alguna hacia los participantes.</p>
              </div>
            </section>

            {/* 10. Aceptación final */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                10. Aceptación final
              </h2>
              <p className="font-raleway text-gray-700 leading-relaxed">
                Al comprar un ticket, el participante declara haber leído, comprendido y aceptado estos Términos y Condiciones.
              </p>
            </section>
          </div>

          {/* Footer Message */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="font-raleway text-center text-gray-600 text-lg">
              👉 <strong>Minga Aurum EC</strong> agradece su confianza y le desea éxito en cada sorteo.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
