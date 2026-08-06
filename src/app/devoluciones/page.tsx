import type { Metadata } from 'next'
import { LegalLayout, LegalSection, LegalSubSection, LegalList } from '@/components/nexora/public/legal-layout'

export const metadata: Metadata = {
  title: 'Devoluciones y garantías',
  description:
    'Política de devoluciones y garantías de NEXORA Importaciones S.A.S., conforme al Estatuto del Consumidor (Ley 1480 de 2011).',
  alternates: { canonical: '/devoluciones' },
  openGraph: {
    title: 'Devoluciones y garantías | NEXORA',
    description:
      'Política de devoluciones y garantías de NEXORA Importaciones S.A.S., conforme al Estatuto del Consumidor (Ley 1480 de 2011).',
  },
}

export default function DevolucionesPage() {
  return (
    <LegalLayout
      title="Devoluciones y garantías"
      subtitle="Conforme al Estatuto del Consumidor — Ley 1480 de 2011"
      lastUpdated="1 de julio de 2025"
    >
      <LegalSection id="garantia-legal" title="1. Garantía legal">
        <p>
          Todos los productos adquiridos a través de NEXORA cuentan con una <strong>garantía legal mínima de 1 año</strong>{' '}
          contado a partir de la entrega, conforme al <strong>Estatuto del Consumidor (Ley 1480 de 2011)</strong>.
        </p>
        <p>
          La garantía cubre defectos de fabricación, no funcionamiento, fallas técnicas o diferencias significativas
          con el producto cotizado. No cubre daño por uso indebido, maltrato, caídas, agua o modificaciones del
          cliente.
        </p>
      </LegalSection>

      <LegalSection id="retracto" title="2. Derecho de retracto">
        <p>
          Conforme al artículo 47 del Estatuto del Consumidor, el cliente puede ejercer el{' '}
          <strong>derecho de retracto dentro de los 5 días hábiles</strong> siguientes a la recepción del producto,
          siempre que:
        </p>
        <LegalList
          items={[
            'El producto esté en su empaque original, sin uso y sin daños.',
            'Se devuelvan todos los accesorios y documentos incluidos.',
            'El producto no sea de los considerados “no retornables” (ver sección 7).',
          ]}
        />
        <p>
          Ejercido el retracto, NEXORA reembolsará el 100% del valor pagado dentro de los <strong>30 días
          calendario</strong> siguientes a la devolución.
        </p>
      </LegalSection>

      <LegalSection id="motivos-validos" title="3. Motivos de devolución válidos">
        <LegalList
          items={[
            <><strong>Defecto de fabricación</strong>: el producto llegó con fallas, no funciona o tiene desperfectos.</>,
            <><strong>Producto diferente al cotizado</strong>: modelo, color, talla o especificaciones distintas a las aprobadas en la cotización.</>,
            <><strong>Producto no recibido</strong>: si pasados 60 días desde el pago el producto no ha llegado y el cliente decide cancelar el pedido.</>,
            <><strong>Daño en transporte</strong>: el producto llegó dañado visiblemente por el envío.</>,
            <><strong>Producto incompleto</strong>: faltan accesorios o piezas indicadas en la cotización.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="motivos-no-validos" title="4. Motivos no válidos para devolución">
        <LegalList
          items={[
            'Cambio de opinión del cliente sin motivo objetivo.',
            'Diferencias menores de color por iluminación o calibración de pantalla.',
            'Tallas que no ajustan si la talla fue seleccionada por el cliente.',
            'Productos usados, desempacados o con signos de maltrato.',
            'Productos personalizados o fabricados a pedido especial.',
            'Insatisfacción subjetiva sobre una réplica premium ya identifcada como tal en la ficha.',
          ]}
        />
      </LegalSection>

      <LegalSection id="proceso" title="5. Proceso de devolución">
        <LegalList
          ordered
          items={[
            <><strong>Contactar en 48h</strong>: el cliente debe escribir a <a className="text-primary hover:underline" href="mailto:info@nexora.co">info@nexora.co</a> dentro de las 48 horas siguientes a la recepción del producto, indicando el motivo y el número de pedido.</>,
            <><strong>Fotos y evidencia</strong>: enviar fotos y/o video del producto, del empaque y del defecto (si aplica).</>,
            <><strong>Evaluación</strong>: NEXORA evalúa la solicitud en un máximo de 3 días hábiles y responde aprobando o rechazando la devolución.</>,
            <><strong>Devolución</strong>: si se aprueba, el cliente envía el producto (los costos de envío corren por cuenta de NEXORA si la devolución es por defecto nuestro; si no, por cuenta del cliente).</>,
            <><strong>Resolución</strong>: una vez recibido y verificado el producto, NEXORA aplica la resolución elegida (reembolso, cambio o crédito).</>,
            <><strong>Reembolso</strong>: el reembolso se realiza dentro de los 15 días calendario siguientes a la verificación del producto devuelto.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="resolucion" title="6. Tipos de resolución">
        <LegalSubSection title="Reembolso">
          <p>
            Devolución del 100% del valor pagado por el mismo medio utilizado en el pago (Nequi, Daviplata, PayPal o
            transferencia).
          </p>
        </LegalSubSection>
        <LegalSubSection title="Cambio">
          <p>
            Reemplazo del producto por uno igual o equivalente. Aplica cuando el cliente prefiere un nuevo producto en
            lugar del reembolso.
          </p>
        </LegalSubSection>
        <LegalSubSection title="Crédito NEXORA">
          <p>
            Saldo a favor del cliente, utilizable en futuros pedidos. Aplica cuando el cliente quiere reintentar la
            importación de otro producto.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="no-retornables" title="7. Productos no retornables">
        <LegalList
          items={[
            'Productos personalizados o hechos a medida (ej. tallas especiales, grabados, etc.).',
            'Productos íntimos (ropa interior, swimwear, cosméticos abiertos).',
            'Productos alimenticios, bebidas o consumibles.',
            'Productos digitales o suscripciones ya activadas.',
            'Productos modificados por el cliente.',
            'Pedidos cancelados después de las 24 horas de pago cuando el proveedor ya inició producción.',
          ]}
        />
      </LegalSection>

      <LegalSection id="importacion" title="8. Productos de importación">
        <p>
          Por la naturaleza del proceso (compra a proveedores en China), los plazos de reposición o cambio pueden ser
          más extensos que en un comercio tradicional.
        </p>
        <LegalList
          items={[
            <><strong>Reposición por defecto</strong>: 30 a 45 días desde la aprobación de la devolución.</>,
            <><strong>Reposición por producto diferente al cotizado</strong>: 30 a 45 días desde la aprobación.</>,
            <><strong>Reembolso por no recepción (60+ días)</strong>: dentro de los 15 días calendario siguientes a la solicitud.</>,
          ]}
        />
        <p>
          Si el cliente prefiere no esperar la reposición, puede optar por reembolso o crédito NEXORA.
        </p>
      </LegalSection>

      <LegalSection id="reembolsos" title="9. Reembolsos">
        <p>Los tiempos de reembolso dependen del método de pago:</p>
        <LegalList
          items={[
            <><strong>Nequi</strong>: 3 a 5 días hábiles.</>,
            <><strong>Daviplata</strong>: 3 a 5 días hábiles.</>,
            <><strong>PayPal</strong>: 5 a 10 días hábiles.</>,
            <><strong>Transferencia bancaria</strong>: 1 a 2 días hábiles.</>,
          ]}
        />
        <p>
          El reembolso se realiza por el mismo medio de pago utilizado en la compra original. No se realizan
          reembolsos en efectivo ni a terceros.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidad" title="10. Responsabilidad">
        <p>
          NEXORA cumple estrictamente con el <strong>Estatuto del Consumidor (Ley 1480 de 2011)</strong> y la{' '}
          <strong>resolución 3466 de 2011</strong> sobre garantías. En caso de desacuerdo, el cliente puede acudir a la{' '}
          <strong>Superintendencia de Industria y Comercio (SIC)</strong>.
        </p>
        <p>
          Para consultas sobre esta política, escríbenos a{' '}
          <a className="text-primary hover:underline" href="mailto:info@nexora.co">
            info@nexora.co
          </a>{' '}
          o por WhatsApp al +57 324 758 3173.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
