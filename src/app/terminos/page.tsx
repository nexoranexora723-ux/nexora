import type { Metadata } from 'next'
import { LegalLayout, LegalSection, LegalSubSection, LegalList } from '@/components/nexora/public/legal-layout'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description:
    'Términos y condiciones de uso de la plataforma NEXORA Importaciones S.A.S. — importación de productos desde China a Colombia.',
  alternates: { canonical: '/terminos' },
  openGraph: {
    title: 'Términos y condiciones | NEXORA',
    description:
      'Términos y condiciones de uso de la plataforma NEXORA Importaciones S.A.S. — importación de productos desde China a Colombia.',
  },
}

export default function TerminosPage() {
  return (
    <LegalLayout
      title="Términos y condiciones"
      subtitle="Reglas que rigen el uso de la plataforma NEXORA Importaciones S.A.S."
      lastUpdated="1 de julio de 2025"
    >
      <LegalSection id="empresa" title="1. Información de la empresa">
        <p>
          NEXORA Importaciones S.A.S., sociedad comercial identificada con <strong>NIT 901.234.567-8</strong>,
          domiciliada en Bogotá D.C., Colombia. Correo de contacto:{' '}
          <a className="text-primary hover:underline" href="mailto:info@nexora.co">
            info@nexora.co
          </a>{' '}
          · WhatsApp: +57 310 555 0100.
        </p>
        <p>
          En adelante, “NEXORA”, “nosotros” o “la plataforma” se refieren a NEXORA Importaciones S.A.S. “El usuario”,
          “el cliente” o “tú” se refieren a toda persona que accede, navega o contrata los servicios de NEXORA.
        </p>
      </LegalSection>

      <LegalSection id="objeto" title="2. Objeto">
        <p>
          NEXORA es una plataforma digital de intermediación para la <strong>importación de productos desde China
          hacia Colombia</strong>. Nuestro servicio incluye la búsqueda y verificación de proveedores, cotización,
          compra, gestión logística (envío, aduana y entrega), seguimiento y atención al cliente.
        </p>
        <p>
          NEXORA <strong>no es un almacén</strong> ni un marketplaces de venta directa. Actuamos como intermediario
          entre el cliente final y proveedores ubicados en China u otros países de Asia.
        </p>
      </LegalSection>

      <LegalSection id="uso" title="3. Uso de la plataforma">
        <p>Al usar la plataforma aceptas:</p>
        <LegalList
          items={[
            'Proporcionar información veraz, completa y actualizada al registrarte y al crear solicitudes de importación.',
            'No usar la plataforma para fines ilícitos, fraudulentos o contrarios a la ley colombiana.',
            'No intentar vulnerar, dañar o sobrecargar los sistemas de NEXORA.',
            'Respetar los derechos de propiedad intelectual de NEXORA y de terceros.',
            'Ser mayor de edad (18 años) o tener capacidad legal para contratar.',
          ]}
        />
        <p>
          NEXORA podrá suspender o cancelar cuentas que infrinjan estos términos o que presenten actividad sospechosa,
          sin perjuicio de las acciones legales correspondientes.
        </p>
      </LegalSection>

      <LegalSection id="productos" title="4. Productos y precios">
        <LegalSubSection title="Precios en USD">
          <p>
            Todos los precios publicados en la plataforma están expresados en <strong>dólares de los Estados Unidos
            (USD)</strong>, salvo que se indique expresamente lo contrario.
          </p>
        </LegalSubSection>
        <LegalSubSection title="Qué incluyen los precios">
          <p>Los precios publicados incluyen:</p>
          <LegalList
            items={[
              'Costo del producto pagado al proveedor en China.',
              'Envío internacional desde China hasta Colombia.',
              'Aranceles, impuestos y trámites de aduana en Colombia.',
              'IVA aplicable (19% en Colombia).',
              'Margen comercial de NEXORA por gestión e intermediación.',
            ]}
          />
          <p>
            El precio <strong>no incluye</strong> costos de envío interno dentro de Colombia (esto sí está incluido
            cuando se trata de envío urbano por DHL/FedEx a toda Colombia, salvo zonas no urbanas o remotas).
          </p>
        </LegalSubSection>
        <LegalSubSection title="Réplicas premium">
          <p>
            Algunos productos publicados son <strong>réplicas premium</strong> (no originales). Esto se indica
            claramente en cada ficha de producto. Ver sección 10 para más información.
          </p>
        </LegalSubSection>
        <LegalSubSection title="Disponibilidad y cambios de precio">
          <p>
            Los precios pueden cambiar sin previo debido a variaciones en el tipo de cambio, costos del proveedor o
            aranceles. El precio final es el que se confirma en la cotización aprobada por el cliente.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="pedidos" title="5. Pedidos y cotizaciones">
        <p>El proceso de pedido sigue el siguiente flujo:</p>
        <LegalList
          ordered
          items={[
            'El cliente crea una solicitud de importación indicando producto, cantidad, presupuesto y referencias.',
            'NEXORA busca proveedores, valida calidad y precio, y envía una cotización al cliente.',
            'El cliente aprueba o rechaza la cotización. La aprobación es vinculante.',
            'El cliente realiza el pago según el método elegido.',
            'NEXORA compra al proveedor, gestiona producción, envío, aduana y entrega.',
            'El cliente recibe el producto y confirma la entrega.',
          ]}
        />
        <p>
          Las cotizaciones tienen una <strong>validez de 7 días calendario</strong> desde su emisión, salvo que se
          indique otra cosa. Vencido el plazo, el precio y las condiciones pueden variar.
        </p>
      </LegalSection>

      <LegalSection id="pagos" title="6. Pagos">
        <p>NEXORA acepta los siguientes métodos de pago:</p>
        <LegalList
          items={[
            <><strong>Nequi</strong> — transferencia a número +57 310 555 0100.</>,
            <><strong>Daviplata</strong> — transferencia a número +57 310 555 0100.</>,
            <><strong>PayPal</strong> — para pagos internacionales o clientes en el exterior.</>,
            <><strong>Transferencia bancaria</strong> — cuenta de ahorros Bancolombia (datos se comparten al confirmar el pedido).</>,
          ]}
        />
        <p>
          <strong>NEXORA no acepta pago contraentrega</strong> bajo ninguna modalidad. El producto se compra al
          proveedor en China únicamente después de recibir el pago del cliente.
        </p>
        <p>
          La conversión de USD a COP se realiza al tipo de cambio del día del pago (TRM publicada por la
          Superintendencia Financiera de Colombia).
        </p>
      </LegalSection>

      <LegalSection id="plazos" title="7. Plazos de entrega">
        <p>
          El plazo estimado de entrega, desde la confirmación del pago hasta la recepción del producto, es de{' '}
          <strong>aproximadamente 22 días calendario</strong>, distribuidos así:
        </p>
        <LegalList
          items={[
            'Producción / preparación por el proveedor: 5 a 10 días.',
            'Envío internacional China → Colombia: 7 a 12 días.',
            'Trámites de aduana en Colombia: 2 a 4 días.',
            'Envío interno a la ciudad del cliente: 1 a 3 días.',
          ]}
        />
        <p>
          Los plazos son <strong>estimados</strong> y pueden variar por factores fuera del control de NEXORA: presión
          aduanera, festivos, eventos climáticos, paros, capacidad del proveedor, etc. NEXORA mantendrá al cliente
          informado del estado del pedido en cada etapa.
        </p>
      </LegalSection>

      <LegalSection id="envios" title="8. Envíos">
        <p>
          Realizamos envíos a <strong>toda Colombia</strong> a través de <strong>DHL</strong> y <strong>FedEx</strong>.
          El costo del envío está incluido en el precio publicado.
        </p>
        <LegalList
          items={[
            'Ciudades principales: 1 a 2 días hábiles desde que el paquete llega a Bogotá.',
            'Zonas suburbanas y rurales: 3 a 5 días hábiles.',
            'Zonas no urbanas o de difícil acceso: pueden tener recargo o plazo extendido.',
          ]}
        />
        <p>
          El cliente recibirá un <strong>número de seguimiento (tracking)</strong> para monitorear su envío en tiempo
          real.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidad" title="9. Limitación de responsabilidad">
        <p>NEXORA no se hace responsable por:</p>
        <LegalList
          items={[
            'Retrasos en aduana, transporte internacional o eventos de fuerza mayor fuera de su control.',
            'Diferencias menores entre la foto del catálogo y el producto recibido (iluminación, calibración de pantalla, etc.).',
            'Uso indebido del producto por parte del cliente una vez entregado.',
            'Pérdida o daño del producto después de la entrega confirmada por el transportador.',
            'Decisiones del proveedor en China que escapen al control de NEXORA (cambios de modelo, descontinuación, etc.).',
          ]}
        />
        <p>
          En caso de defecto, producto equivocado o no recibido, el cliente debe reportarlo dentro de las{' '}
          <strong>48 horas siguientes a la entrega</strong> (ver política de devoluciones).
        </p>
        <p>
          La responsabilidad máxima de NEXORA por cualquier concepto estará limitada al <strong>valor total pagado
          por el cliente</strong> en el pedido correspondiente.
        </p>
      </LegalSection>

      <LegalSection id="replicas" title="10. Productos réplicas">
        <p>
          Algunos productos del catálogo son <strong>réplicas premium</strong>, lo que significa que son imitaciones
          de alta calidad de productos originales de marcas reconocidas (Apple, Nike, Rolex, Dior, etc.), pero{' '}
          <strong>no son productos originales</strong> ni están fabricados ni autorizados por dichas marcas.
        </p>
        <p>
          NEXORA actúa con <strong>transparencia total</strong>: cada ficha de producto indica claramente si se trata
          de una réplica premium o de un producto genérico/OEM.
        </p>
        <LegalList
          items={[
            'Las réplicas premium usan materiales y acabados de alta calidad, pero no son idénticos al original.',
            'No usamos logos o marcas registradas que infrinjan derechos de propiedad intelectual más allá del uso permitido por la ley colombiana.',
            'El cliente acepta conocer la naturaleza de réplica del producto al momento de la compra.',
            'Las garantías aplican sobre defectos de fabricación, no sobre el hecho de ser réplica.',
          ]}
        />
      </LegalSection>

      <LegalSection id="ley" title="11. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la <strong>República de Colombia</strong>, en especial por el
          Estatuto del Consumidor (Ley 1480 de 2011) y el Código de Comercio.
        </p>
        <p>
          Para cualquier controversia, las partes se someten a la jurisdicción de los <strong>jueces y tribunales de
          Bogotá D.C., Colombia</strong>, renunciando a cualquier otro fuero que pudiera corresponderles.
        </p>
        <p>
          Antes de acudir a instancias judiciales, NEXORA promoverá la resolución de conflictos a través de servicio al
          cliente y, si es necesario, mediante la <strong>Superintendencia de Industria y Comercio (SIC)</strong>.
        </p>
      </LegalSection>

      <LegalSection id="modificaciones" title="12. Modificaciones">
        <p>
          NEXORA podrá modificar los presentes términos y condiciones en cualquier momento. Las modificaciones
          entrarán en vigor desde su publicación en esta página.
        </p>
        <p>
          Es responsabilidad del cliente revisar periódicamente esta página. El uso continuado de la plataforma
          después de los cambios implica la aceptación de los términos actualizados.
        </p>
        <p>
          Para consultas sobre estos términos, escríbenos a{' '}
          <a className="text-primary hover:underline" href="mailto:info@nexora.co">
            info@nexora.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
