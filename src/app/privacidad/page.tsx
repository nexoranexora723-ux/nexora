import type { Metadata } from 'next'
import { LegalLayout, LegalSection, LegalSubSection, LegalList } from '@/components/nexora/public/legal-layout'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Política de tratamiento de datos personales de NEXORA Importaciones S.A.S., conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
  alternates: { canonical: '/privacidad' },
  openGraph: {
    title: 'Política de privacidad | NEXORA',
    description:
      'Política de tratamiento de datos personales de NEXORA Importaciones S.A.S., conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
  },
}

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      subtitle="Tratamiento de datos personales — Ley 1581 de 2012 y Decreto 1377 de 2013"
      lastUpdated="1 de julio de 2025"
    >
      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales es <strong>NEXORA Importaciones S.A.S.</strong>, NIT
          901.234.567-8, con domicilio principal en Bogotá D.C., Colombia.
        </p>
        <p>
          Correo de contacto para asuntos de privacidad:{' '}
          <a className="text-primary hover:underline" href="mailto:privacidad@nexora.co">
            privacidad@nexora.co
          </a>
        </p>
      </LegalSection>

      <LegalSection id="datos" title="2. Datos que recopilamos">
        <p>Recopilamos los siguientes datos personales:</p>
        <LegalSubSection title="Datos de identificación">
          <LegalList
            items={['Nombre y apellidos', 'Correo electrónico', 'Número de teléfono', 'Documento de identidad (cuando es necesario)']}
          />
        </LegalSubSection>
        <LegalSubSection title="Datos de dirección">
          <LegalList items={['Dirección de entrega (calle, ciudad, código postal)', 'Barrio / referencia de ubicación']} />
        </LegalSubSection>
        <LegalSubSection title="Datos de pago">
          <LegalList
            items={[
              'Método de pago utilizado (Nequi, Daviplata, PayPal, transferencia bancaria)',
              'Comprobante de pago',
              'NEXORA NO almacena datos de tarjetas de crédito ni información sensible de cuentas bancarias. El pago se procesa a través de pasarelas externas (PayPal, Nequi, Daviplata, Bancolombia).',
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="Datos de navegación (cookies)">
          <LegalList
            items={[
              'Dirección IP',
              'Tipo de navegador y dispositivo',
              'Páginas visitadas dentro de NEXORA',
              'Preferencias (tema claro/oscuro, idioma, artículos en carrito)',
            ]}
          />
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="finalidad" title="3. Finalidad del tratamiento">
        <p>Los datos personales se utilizan exclusivamente para:</p>
        <LegalList
          items={[
            'Gestionar el registro y la cuenta del cliente.',
            'Procesar solicitudes de importación, cotizaciones, pagos y envíos.',
            'Coordinar la entrega con transportadoras (DHL, FedEx).',
            'Comunicarnos con el cliente: estado del pedido, notificaciones, soporte.',
            'Cumplir obligaciones legales (facturación, contabilidad, DIAN).',
            'Enviar información comercial o promociones (solo si el cliente lo autoriza).',
            'Prevenir fraude y proteger la integridad de la plataforma.',
          ]}
        />
      </LegalSection>

      <LegalSection id="base-legal" title="4. Base legal">
        <p>
          El tratamiento de datos personales se realiza con base en la <strong>Ley 1581 de 2012</strong> y el{' '}
          <strong>Decreto 1377 de 2013</strong>, bajo la modalidad de:
        </p>
        <LegalList
          items={[
            <><strong>Autorización del titular</strong>: el cliente autoriza expresamente el tratamiento al registrarse y crear solicitudes.</>,
            <><strong>Ejecución de un contrato</strong>: cuando los datos son necesarios para cumplir con el servicio contratado.</>,
            <><strong>Cumplimiento de obligaciones legales</strong>: cuando la ley exige conservar y tratar ciertos datos.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="duracion" title="5. Duración de los datos">
        <p>
          Conservamos los datos personales <strong>mientras exista una relación contractual</strong> con el cliente y,
          posteriormente, durante el tiempo necesario para cumplir con obligaciones legales (facturación: 5 años;
          contabilidad: 5 años) o para atender reclamaciones.
        </p>
        <p>
          Una vez vencidos estos plazos, los datos serán eliminados o anonimizados, salvo que el cliente solicite su
          eliminación anticipada (cuando sea legalmente posible).
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="6. Derechos del titular">
        <p>Como titular de los datos personales, tienes derecho a:</p>
        <LegalList
          ordered
          items={[
            <><strong>Acceso</strong>: conocer qué datos tenemos sobre ti.</>,
            <><strong>Rectificación</strong>: corregir datos incompletos, inexactos o desactualizados.</>,
            <><strong>Actualización</strong>: mantener tus datos al día.</>,
            <><strong>Eliminación</strong>: solicitar la supresión de tus datos cuando no sean necesarios o el tratamiento sea ilícito.</>,
            <><strong>Revocación de la autorización</strong>: retirar tu consentimiento en cualquier momento.</>,
            <><strong>Queja ante la SIC</strong>: presentar reclamos ante la Superintendencia de Industria y Comercio si consideras que vulneramos tus derechos.</>,
          ]}
        />
        <p>
          Para ejercer estos derechos, escríbenos a{' '}
          <a className="text-primary hover:underline" href="mailto:privacidad@nexora.co">
            privacidad@nexora.co
          </a>{' '}
          con copia de tu documento de identidad. Responderemos en un plazo máximo de <strong>15 días hábiles</strong>.
        </p>
      </LegalSection>

      <LegalSection id="compartir" title="7. Con quién compartimos los datos">
        <p>Compartimos tus datos únicamente con terceros necesarios para prestar el servicio:</p>
        <LegalList
          items={[
            <><strong>DHL y FedEx</strong> — para gestionar la entrega del producto.</>,
            <><strong>Pasarelas de pago</strong> — PayPal, Nequi, Daviplata, Bancolombia — para procesar el pago.</>,
            <><strong>Proveedores en China</strong> — solo los datos mínimos para producir y enviar el producto (nombre, dirección de entrega, referencia del pedido).</>,
            <><strong>Autoridades colombianas</strong> — DIAN, SIC, policía judicial — cuando la ley lo exige.</>,
          ]}
        />
        <p>
          NEXORA <strong>no vende, alquila ni comparte</strong> tus datos personales con fines comerciales a terceros
          no relacionados con la prestación del servicio.
        </p>
      </LegalSection>

      <LegalSection id="seguridad" title="8. Seguridad">
        <p>
          Implementamos medidas técnicas, administrativas y físicas para proteger tus datos personales contra acceso
          no autorizado, alteración, divulgación o destrucción:
        </p>
        <LegalList
          items={[
            'Cifrado HTTPS / TLS en todo el sitio.',
            'Hash bcrypt para contraseñas (nunca se almacenan en texto plano).',
            'Acceso restringido a bases de datos, con autenticación y registro de auditoría.',
            'Backups cifrados y controlados.',
            'Capacitación del personal en protección de datos.',
          ]}
        />
        <p>
          En caso de una brecha de seguridad que afecte tus datos, NEXORA te notificará dentro de los plazos y
          condiciones que establece la ley colombiana.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="9. Cookies">
        <p>Usamos cookies y tecnologías similares para:</p>
        <LegalList
          items={[
            <><strong>Cookies esenciales</strong>: mantener la sesión, recordar artículos en el carrito. Son necesarias para el funcionamiento del sitio.</>,
            <><strong>Cookies de preferencias</strong>: recordar tema (claro/oscuro), idioma.</>,
            <><strong>Cookies analíticas</strong>: entender cómo se usa el sitio (Google Analytics, opcional).</>,
          ]}
        />
        <p>
          Puedes desactivar las cookies no esenciales desde la configuración de tu navegador. Las cookies esenciales
          no se pueden desactivar porque son necesarias para el funcionamiento del sitio.
        </p>
      </LegalSection>

      <LegalSection id="transferencia" title="10. Transferencia internacional de datos">
        <p>
          Dado que NEXORA importa productos desde China, algunos de tus datos (nombre, dirección de entrega,
          referencia del pedido) se transfieren a proveedores ubicados en <strong>China</strong>.
        </p>
        <p>
          Esta transferencia se realiza bajo las autorizaciones de la Ley 1581 de 2012 (artículo 26) y se limita a
          los datos estrictamente necesarios para producir y enviar el producto. El proveedor en China está obligado
          a tratar los datos con el mismo nivel de protección que NEXORA.
        </p>
      </LegalSection>

      <LegalSection id="cambios" title="11. Cambios a esta política">
        <p>
          NEXORA podrá actualizar esta política de privacidad cuando sea necesario para cumplir con la ley o reflejar
          cambios en nuestras prácticas. La versión vigente estará siempre publicada en esta página con su fecha de
          actualización.
        </p>
        <p>
          Te notificaremos sobre cambios materiales por correo electrónico o mediante un aviso visible en la página.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="12. Contacto">
        <p>Para cualquier consulta, reclamo o solicitud relacionada con la privacidad de tus datos:</p>
        <LegalList
          items={[
            <><strong>Correo:</strong>{' '}<a className="text-primary hover:underline" href="mailto:privacidad@nexora.co">privacidad@nexora.co</a></>,
            <><strong>WhatsApp:</strong>{' '}+57 310 555 0100</>,
            <><strong>Empresa:</strong>{' '}NEXORA Importaciones S.A.S. — NIT 901.234.567-8</>,
            <><strong>Dirección:</strong>{' '}Bogotá D.C., Colombia</>,
          ]}
        />
      </LegalSection>
    </LegalLayout>
  )
}
