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
              TÉRMINOS Y CONDICIONES
            </h1>
            <p className="font-raleway text-lg text-gray-600">
              Campañas Promocionales y Sorteos – Minga Aurum EC / Impacto Minga
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="font-raleway text-gray-700 leading-relaxed">
              Al adquirir un número digital y participar en nuestras campañas promocionales, usted acepta totalmente los presentes Términos y Condiciones, emitidos por <strong>Minga AurumEC / Impacto Minga</strong> en Ecuador.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {/* 1. Organización */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                1. Organización
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed">
                <p>Las campañas y sorteos son administrados por <strong>Minga AurumEC / Impacto Minga</strong>, responsables de la venta de números, validación de participantes, realización de sorteos y entrega de premios.</p>
              </div>
            </section>

            {/* 2. Naturaleza de la campaña */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                2. Naturaleza de la campaña
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-3">
                <p>Las campañas consisten en la venta de números digitales que permiten participar por premios tales como:</p>
                <ul className="list-none space-y-2 ml-4">
                  <li>🏍️ Motocicletas y vehículos</li>
                  <li>🎁 Gift cards y bonos de compra</li>
                  <li>💸 Premios económicos</li>
                  <li>🎉 Premios especiales</li>
                </ul>
                <p className="mt-4">
                  <strong>La compra de un número solo otorga participación, pero no garantiza ganar.</strong>
                </p>
              </div>
            </section>

            {/* 3. Participación */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                3. Participación
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>La compra está permitida a cualquier persona sin restricción de edad.</li>
                <li>Si el ganador es menor de edad, el premio será entregado únicamente a través de un representante legal mayor de edad, que valide su identificación.</li>
                <li>La participación es personal e intransferible.</li>
                <li>Al adquirir un número, el participante acepta todas las condiciones establecidas aquí.</li>
              </ul>
            </section>

            {/* 4. Números y asignación */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                4. Números y asignación
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>Cada número tiene un valor indicado y se entrega de forma digital.</li>
                <li>Los números se asignan de manera única, automática y aleatoria.</li>
                <li><strong>No se aceptan reembolsos ni devoluciones.</strong></li>
                <li>El número es válido solo para la campaña donde fue adquirido.</li>
              </ul>
            </section>

            {/* 5. Condición para realizar el sorteo */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                5. Condición para realizar el sorteo
              </h2>
              <p className="font-raleway text-gray-700 leading-relaxed">
                El sorteo se llevará a cabo únicamente cuando todos los números disponibles hayan sido vendidos.
              </p>
            </section>

            {/* 6. Método de selección del ganador */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                6. Método de selección del ganador
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-2">
                <p>El ganador será elegido mediante un sistema interno aleatorio gestionado por Impacto Minga / Minga AurumEC.</p>
                <p>El procedimiento será transparente, verificado y anunciado previamente en redes oficiales.</p>
              </div>
            </section>

            {/* 7. Entrega de premios */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                7. Entrega de premios
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-4">
                <div>
                  <h3 className="font-bold text-black mb-2">7.1 Premio mayor</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Será entregado personalmente al ganador o a su representante legal mayor de edad.</li>
                    <li>Pueden aplicarse condiciones de entrega según la ciudad del ganador.</li>
                    <li>El ganador acepta ser grabado en video durante la entrega por motivos de transparencia.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-black mb-2">7.2 Premios económicos o especiales</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Serán entregados de manera inmediata una vez verificado el número ganador, mediante transferencia, efectivo o entrega física según corresponda.</li>
                    <li>El ganador del premio especial deberá enviar un video mencionando a Impacto Minga, indicando el sorteo, el premio y mostrando el número ganador.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-black mb-2">7.3 Compromiso adicional</h3>
                  <p>Si un premio económico es igual o mayor a $200, el ganador se compromete a comprar $20 en números del sorteo vigente donde resultó beneficiado.</p>
                </div>
              </div>
            </section>

            {/* 8. Requisitos del participante */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                8. Requisitos del participante
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>Seguir las redes oficiales de Impacto Minga / Minga Aurum.</li>
                <li>Guardar el número digital asignado.</li>
                <li>Presentar evidencia del número en caso de resultar ganador.</li>
              </ul>
            </section>

            {/* 9. Pagos y confirmación */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                9. Pagos y confirmación
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>Para compras con transferencia, el participante cuenta con 1 hora para realizar el pago y enviar comprobante al WhatsApp oficial.</li>
                <li>Si el pago no se confirma dentro del tiempo indicado, el pedido queda anulado sin posibilidad de reembolso.</li>
              </ul>
            </section>

            {/* 10. Publicación y notificación */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                10. Publicación y notificación
              </h2>
              <ul className="font-raleway text-gray-700 leading-relaxed space-y-2 list-disc ml-6">
                <li>Nos comunicaremos con el ganador usando los datos proporcionados.</li>
                <li>Los resultados serán publicados en redes sociales y canales oficiales.</li>
                <li>Si el premio no es reclamado en el plazo indicado, se considerará renunciado.</li>
              </ul>
            </section>

            {/* 11. Promociones en redes */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                11. Promociones en redes
              </h2>
              <p className="font-raleway text-gray-700 leading-relaxed">
                Las promociones anunciadas en redes sociales son válidas únicamente desde su publicación hasta las 11:59 p.m. del mismo día.
              </p>
            </section>

            {/* 12. Limitación de responsabilidad */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                12. Limitación de responsabilidad
              </h2>
              <div className="font-raleway text-gray-700 leading-relaxed space-y-3">
                <p>La organización <strong>no se responsabiliza por:</strong></p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Daños o fallas ocurridas después de la entrega del premio.</li>
                  <li>Problemas técnicos de conexión, plataformas o sistemas externos.</li>
                  <li>Participaciones fraudulentas (serán descalificadas).</li>
                </ul>
              </div>
            </section>

            {/* 13. Protección de datos */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                13. Protección de datos
              </h2>
              <p className="font-raleway text-gray-700 leading-relaxed">
                Los datos de los participantes serán tratados de forma confidencial y usados únicamente para fines relacionados con la campaña, de acuerdo con la <strong>Ley Orgánica de Protección de Datos Personales</strong>.
              </p>
            </section>

            {/* 14. Modificaciones */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                14. Modificaciones
              </h2>
              <p className="font-raleway text-gray-700 leading-relaxed">
                La organización puede modificar, suspender o cancelar la campaña en caso de fuerza mayor o circunstancias externas, sin generar responsabilidades adicionales.
              </p>
            </section>

            {/* 15. Aceptación final */}
            <section>
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                15. Aceptación final
              </h2>
              <p className="font-raleway text-gray-700 leading-relaxed">
                Al comprar un número, el participante declara haber leído y aceptado estos Términos y Condiciones.
              </p>
            </section>
          </div>

          {/* Footer Message */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="font-raleway text-gray-600 text-lg mb-2">
              <strong>Impacto Minga / Minga AurumEC</strong> agradece su confianza.
            </p>
            <p className="font-oswald text-2xl font-bold text-[#d4af37]">
              ¡Mucho éxito en cada sorteo!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
