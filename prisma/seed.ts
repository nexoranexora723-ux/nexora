// NEXORA — Import Platform Seeder
import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding NEXORA Import Platform...')

  // Clean
  await db.naiosConversation.deleteMany()
  await db.naiosRecommendation.deleteMany()
  await db.notification.deleteMany()
  await db.transaction.deleteMany()
  await db.import.deleteMany()
  await db.requestAttachment.deleteMany()
  await db.requestStatusHistory.deleteMany()
  await db.importRequest.deleteMany()
  await db.quote.deleteMany()
  await db.supplierRating.deleteMany()
  await db.supplier.deleteMany()
  await db.product.deleteMany()
  await db.brand.deleteMany()
  await db.category.deleteMany()
  await db.auditLog.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()
  await db.setting.deleteMany()
  await db.company.deleteMany()

  // ===== Company =====
  const company = await db.company.create({
    data: {
      legalName: 'NEXORA Importaciones S.A.S.',
      commercialName: 'NEXORA',
      nit: '901.234.567-8',
      email: 'info@nexora.co',
      phone: '+57 310 555 0100',
      country: 'CO',
      currencyCode: 'USD',
      timezone: 'America/Bogota',
      website: 'https://nexora.co',
      address: 'Bogotá, Colombia',
    },
  })

  // ===== Users =====
  const pwd = await bcrypt.hash('nexora123', 10)
  const admin = await db.user.create({
    data: { firstName: 'Adrián', lastName: 'Director', email: 'admin@nexora.co', password: pwd, role: 'ADMIN', position: 'Director de Operaciones', status: 'ACTIVE', companyId: company.id, phone: '+57 310 555 0001' },
  })
  const employee = await db.user.create({
    data: { firstName: 'Laura', lastName: 'Gestión', email: 'laura@nexora.co', password: pwd, role: 'EMPLOYEE', position: 'Gestora de Importaciones', status: 'ACTIVE', companyId: company.id, phone: '+57 310 555 0002' },
  })
  const client1 = await db.user.create({
    data: { firstName: 'Carlos', lastName: 'Emprendedor', email: 'carlos@email.com', password: pwd, role: 'CLIENT', status: 'ACTIVE', companyId: company.id, phone: '+57 320 111 2222' },
  })
  const client2 = await db.user.create({
    data: { firstName: 'María', lastName: 'Boutique', email: 'maria@email.com', password: pwd, role: 'CLIENT', status: 'ACTIVE', companyId: company.id, phone: '+57 311 333 4444' },
  })
  const client3 = await db.user.create({
    data: { firstName: 'Jorge', lastName: 'Tecnología', email: 'jorge@email.com', password: pwd, role: 'CLIENT', status: 'ACTIVE', companyId: company.id, phone: '+57 315 555 6666' },
  })
  const reseller = await db.user.create({
    data: { firstName: 'Valeria', lastName: 'Revendedora', email: 'valeria@email.com', password: pwd, role: 'RESELLER', status: 'ACTIVE', companyId: company.id, phone: '+57 318 777 8888' },
  })

  // ===== Categories =====
  const cats = await db.category.createMany({
    data: [
      { name: 'Tecnología', slug: 'tecnologia', icon: '💻' },
      { name: 'Hogar', slug: 'hogar', icon: '🏠' },
      { name: 'Moda', slug: 'moda', icon: '👗' },
      { name: 'Belleza', slug: 'belleza', icon: '💄' },
      { name: 'Herramientas', slug: 'herramientas', icon: '🔧' },
      { name: 'Mascotas', slug: 'mascotas', icon: '🐾' },
      { name: 'Automotriz', slug: 'automotriz', icon: '🚗' },
      { name: 'Deportes', slug: 'deportes', icon: '⚽' },
    ],
  })

  // ===== Brands =====
  await db.brand.createMany({
    data: [
      { name: 'Apple' }, { name: 'Nike' }, { name: 'Samsung' }, { name: 'Generic OEM' }, { name: 'Xiaomi' },
    ],
  })
  const brands = await db.brand.findMany()

  // ===== Suppliers (Chinese manufacturers) =====
  const sShenzhen = await db.supplier.create({
    data: {
      companyName: 'Shenzhen TechLink Electronics',
      contactName: 'Wei Zhang',
      whatsapp: '+86 138 1234 5678',
      wechat: 'techlink_zhang',
      email: 'sales@techlink.cn',
      website: 'techlink.cn',
      alibaba: 'https://techlink.en.alibaba.com',
      country: 'CN', city: 'Shenzhen', address: 'Huaqiangbei, Futian District',
      moq: 50, paymentMethods: 'T/T, PayPal, Alibaba Trade Assurance',
      shippingMethods: 'DHL, FedEx, Air Cargo',
      warranty: '12 meses', leadTime: 7, productionTime: 15,
      oem: true, odm: true, status: 'ACTIVE', riskLevel: 'LOW',
    },
  })
  const sGuangzhou = await db.supplier.create({
    data: {
      companyName: 'Guangzhou Premium Footwear Co.',
      contactName: 'Ling Chen',
      whatsapp: '+86 139 8765 4321',
      wechat: 'gz_footwear',
      email: 'export@gzfootwear.com',
      country: 'CN', city: 'Guangzhou',
      moq: 20, paymentMethods: 'T/T, Western Union',
      shippingMethods: 'EMS, DHL', warranty: '3 meses',
      leadTime: 10, productionTime: 20, oem: true, odm: false,
      status: 'ACTIVE', riskLevel: 'MEDIUM',
    },
  })
  const sYiwu = await db.supplier.create({
    data: {
      companyName: 'Yiwu Smart Trading Co.',
      contactName: 'Mei Wang',
      whatsapp: '+86 137 5555 1212',
      email: 'mei@yiwusmart.cn',
      country: 'CN', city: 'Yiwu',
      moq: 10, paymentMethods: 'PayPal, Western Union',
      shippingMethods: 'EMS, ePacket', warranty: '1 mes',
      leadTime: 14, productionTime: 25, oem: false, odm: false,
      status: 'ACTIVE', riskLevel: 'HIGH',
    },
  })

  // ===== Supplier Ratings =====
  await db.supplierRating.createMany({
    data: [
      { supplierId: sShenzhen.id, communicationScore: 92, qualityScore: 95, priceScore: 88, shippingScore: 90, warrantyScore: 93, trustScore: 94, overallScore: 92.0, review: 'Excelente calidad, envío rápido. Proveedor top.' },
      { supplierId: sGuangzhou.id, communicationScore: 78, qualityScore: 82, priceScore: 90, shippingScore: 75, warrantyScore: 60, trustScore: 76, overallScore: 76.8, review: 'Buen precio, calidad variable por lote.' },
      { supplierId: sYiwu.id, communicationScore: 65, qualityScore: 58, priceScore: 92, shippingScore: 62, warrantyScore: 40, trustScore: 55, overallScore: 62.0, review: 'Barato pero inconsistente. Riesgo de defectos.' },
    ],
  })

  // ===== Products (importable catalog) =====
  const catMap = await db.category.findMany()
  const tech = catMap.find((c) => c.slug === 'tecnologia')!
  const moda = catMap.find((c) => c.slug === 'moda')!
  const hogar = catMap.find((c) => c.slug === 'hogar')!
  const belleza = catMap.find((c) => c.slug === 'belleza')!
  const depor = catMap.find((c) => c.slug === 'deportes')!
  const apple = brands.find((b) => b.name === 'Apple')!
  const nike = brands.find((b) => b.name === 'Nike')!
  const xiaomi = brands.find((b) => b.name === 'Xiaomi')!
  const samsung = brands.find((b) => b.name === 'Samsung')!
  const generic = brands.find((b) => b.name === 'Generic OEM')!

  await db.product.createMany({
    data: [
      { sku: 'APL-APP-PRO2', name: 'AirPods Pro 2 (OEM)', brandId: apple.id, categoryId: tech.id, supplierId: sShenzhen.id, imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400', referenceUrl: 'https://www.alibaba.com/product/airpods-pro-2', estimatedCost: 68.5, suggestedPrice: 129, status: 'ACTIVE', isFeatured: true, description: 'AirPods Pro 2 OEM con cancelación de ruido activa. Calidad premium.' },
      { sku: 'APL-AW-U2', name: 'Apple Watch Ultra 2 (Clone)', brandId: apple.id, categoryId: tech.id, supplierId: sShenzhen.id, imageUrl: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400', referenceUrl: 'https://www.alibaba.com/product/apple-watch-ultra', estimatedCost: 95, suggestedPrice: 199, status: 'ACTIVE', isFeatured: true, description: 'Apple Watch Ultra clon de alta calidad. Pantalla AMOLED.' },
      { sku: 'XIA-EARBUDS', name: 'Xiaomi Earbuds Basic 2', brandId: xiaomi.id, categoryId: tech.id, supplierId: sShenzhen.id, imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', estimatedCost: 8.5, suggestedPrice: 25, status: 'ACTIVE', description: 'Auriculares Bluetooth económicos. Ideal para revender.' },
      { sku: 'NKE-AJ1', name: 'Air Jordan 1 Retro (Replica)', brandId: nike.id, categoryId: moda.id, supplierId: sGuangzhou.id, imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400', referenceUrl: 'https://www.alibaba.com/product/air-jordan-1', estimatedCost: 42, suggestedPrice: 89, status: 'ACTIVE', isFeatured: true, description: 'Air Jordan 1 replica premium. Cuero genuino.' },
      { sku: 'SAMS-PHONE', name: 'Samsung Galaxy S24 Case Lot', brandId: samsung.id, categoryId: tech.id, supplierId: sShenzhen.id, imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', estimatedCost: 1.2, suggestedPrice: 8, status: 'ACTIVE', description: 'Lote de 100 fundas Samsung Galaxy S24. Various colores.' },
      { sku: 'GEN-LED', name: 'Tira LED Inteligente 5m', brandId: generic.id, categoryId: hogar.id, supplierId: sYiwu.id, imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400', estimatedCost: 3.5, suggestedPrice: 15, status: 'ACTIVE', description: 'Tira LED RGB con control WiFi. Ideal para hogar.' },
      { sku: 'GEN-PHONES', name: 'Soporte Celular Coche (x100)', brandId: generic.id, categoryId: depor.id, supplierId: sYiwu.id, imageUrl: 'https://images.unsplash.com/photo-1582142306909-195724d0a735?w=400', estimatedCost: 0.8, suggestedPrice: 6, status: 'ACTIVE', description: 'Lote de 100 soportes para celular de coche.' },
      { sku: 'GEN-BEAUTY', name: 'Set Brochas Maquillaje (x50)', brandId: generic.id, categoryId: belleza.id, supplierId: sYiwu.id, imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', estimatedCost: 2.5, suggestedPrice: 12, status: 'ACTIVE', description: 'Set de 50 brochas de maquillaje profesional.' },
    ],
  })

  // ===== Import Requests (the heart) =====
  const requests = [
    {
      number: 'NX-2025-000001', clientId: client1.id, assignedToId: employee.id,
      productName: 'AirPods Pro 2', description: 'Busco AirPods Pro 2 originales o de alta calidad OEM para revender.',
      category: 'Tecnología', purpose: 'resale', quantity: 50, budget: 3500, currencyCode: 'USD',
      referenceUrl: 'https://www.alibaba.com/product/airpods-pro-2-oem',
      referenceImages: JSON.stringify(['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400']),
      details: 'Color blanco. Con caja original. Garantía mínima 6 meses.',
      priority: 'HIGH',
      naiosSummary: 'Cliente busca 50 unidades de AirPods Pro 2 para reventa. Presupuesto $3,500 ($70/u). Proveedor recomendado: Shenzhen TechLink Electronics (score 92). Margen estimado: 46%.',
      naiosCategory: 'Electrónica', naiosPriority: 'ALTO',
      status: 'COTIZACION_ENVIADA', notes: 'Cliente urgente. Cotización enviada con Shenzhen TechLink.',
    },
    {
      number: 'NX-2025-000002', clientId: client2.id, assignedToId: employee.id,
      productName: 'Air Jordan 1 Retro', description: 'Zapatillas Jordan 1 para boutique de moda.',
      category: 'Moda', purpose: 'business', quantity: 30, budget: 2500, currencyCode: 'USD',
      referenceUrl: 'https://www.alibaba.com/product/air-jordan-1-retro',
      details: 'Tallas 38-44. Colores variados. Calidad premium.',
      priority: 'MEDIUM',
      naiosSummary: 'Cliente boutique busca 30 pares de Jordan 1. Presupuesto $2,500 ($83/u). Proveedor: Guangzhou Premium Footwear (score 77). Margen estimado: 35%.',
      naiosCategory: 'Calzado', naiosPriority: 'MEDIO',
      status: 'BUSCANDO_PROVEEDOR', notes: 'Esperando respuesta de Guangzhou.',
    },
    {
      number: 'NX-2025-000003', clientId: client3.id, assignedToId: admin.id,
      productName: 'Smartwatch Xiaomi', description: 'Smartwatches Xiaomi para tienda online.',
      category: 'Tecnología', purpose: 'resale', quantity: 100, budget: 2000, currencyCode: 'USD',
      referenceUrl: 'https://www.alibaba.com/product/xiaomi-smartwatch',
      details: 'Modelo Mi Band 8. Color negro. Empaque retail.',
      priority: 'HIGH',
      naiosSummary: 'Cliente busca 100 smartwatches Xiaomi Mi Band 8. Presupuesto $2,000 ($20/u). Proveedor recomendado: Shenzhen TechLink. Margen estimado: 50%.',
      naiosCategory: 'Electrónica', naiosPriority: 'ALTO',
      status: 'PAGO_RECIBIDO', notes: 'Pago recibido. Listo para comprar.',
    },
    {
      number: 'NX-2025-000004', clientId: reseller.id, assignedToId: employee.id,
      productName: 'Fundas Samsung Galaxy S24', description: 'Lote de fundas para revender en marketplace.',
      category: 'Tecnología', purpose: 'resale', quantity: 200, budget: 500, currencyCode: 'USD',
      details: 'Colores variados. Material TPU + vidrio templado.',
      priority: 'LOW',
      naiosSummary: 'Revendedora busca 200 fundas Samsung S24. Presupuesto $500 ($2.5/u). Proveedor: Shenzhen TechLink. Margen estimado: 70%.',
      naiosCategory: 'Accesorios', naiosPriority: 'BAJO',
      status: 'EN_TRANSITO', notes: 'Enviado vía DHL. ETA 7 días.',
    },
    {
      number: 'NX-2025-000005', clientId: client1.id,
      productName: 'Tiras LED Inteligentes', description: 'Para proyecto de decoración de hogar.',
      category: 'Hogar', purpose: 'personal', quantity: 10, budget: 150, currencyCode: 'USD',
      details: '5 metros cada una. Control WiFi RGB.',
      priority: 'MEDIUM',
      naiosSummary: 'Cliente personal busca 10 tiras LED. Presupuesto $150 ($15/u). Proveedor: Yiwu Smart Trading. Margen bajo pero volumen alto.',
      naiosCategory: 'Iluminación', naiosPriority: 'MEDIO',
      status: 'NUEVA', notes: 'Solicitud nueva. Pendiente analizar.',
    },
    {
      number: 'NX-2025-000006', clientId: client2.id, assignedToId: employee.id,
      productName: 'Set Brochas Maquillaje', description: 'Para línea de productos de belleza.',
      category: 'Belleza', purpose: 'business', quantity: 50, budget: 600, currencyCode: 'USD',
      details: 'Set profesional. 12 piezas por set.',
      priority: 'MEDIUM',
      naiosSummary: 'Cliente boutique belleza busca 50 sets de brochas. Presupuesto $600 ($12/u). Proveedor: Yiwu. Riesgo medio.',
      naiosCategory: 'Cosméticos', naiosPriority: 'MEDIO',
      status: 'ENTREGADO', notes: 'Entregado exitosamente. Cliente satisfecho.',
    },
  ]

  for (const r of requests) {
    const req = await db.importRequest.create({ data: r })
    // Create status history
    await db.requestStatusHistory.create({
      data: { requestId: req.id, toStatus: 'NUEVA', notes: 'Solicitud creada' },
    })
    if (req.status !== 'NUEVA') {
      await db.requestStatusHistory.create({
        data: { requestId: req.id, fromStatus: 'NUEVA', toStatus: req.status, notes: 'Cambio de estado automático' },
      })
    }
  }

  // ===== Quotes =====
  const req1 = await db.importRequest.findFirst({ where: { number: 'NX-2025-000001' } })
  const req3 = await db.importRequest.findFirst({ where: { number: 'NX-2025-000003' } })
  if (req1) {
    await db.quote.create({
      data: {
        number: 'COT-2025-000001', requestId: req1.id, supplierId: sShenzhen.id, assignedToId: employee.id,
        unitPrice: 68.5, quantity: 50, subtotal: 3425, shippingCost: 180, tax: 0, total: 3605,
        currencyCode: 'USD', leadTime: 22, warranty: '12 meses', validity: new Date('2025-12-31'),
        status: 'ENVIADA_AL_CLIENTE', notes: 'Cotización con Shenzhen TechLink. Calidad OEM premium.',
      },
    })
  }
  if (req3) {
    await db.quote.create({
      data: {
        number: 'COT-2025-000002', requestId: req3.id, supplierId: sShenzhen.id, assignedToId: admin.id,
        unitPrice: 18, quantity: 100, subtotal: 1800, shippingCost: 150, tax: 0, total: 1950,
        currencyCode: 'USD', leadTime: 20, warranty: '6 meses',
        status: 'APROBADA', notes: 'Aprobada por cliente. Pago recibido.',
      },
    })
  }

  // ===== Imports =====
  const req4 = await db.importRequest.findFirst({ where: { number: 'NX-2025-000004' } })
  const req6 = await db.importRequest.findFirst({ where: { number: 'NX-2025-000006' } })
  if (req4) {
    await db.import.create({
      data: {
        number: 'IMP-2025-000001', requestId: req4.id, supplierId: sShenzhen.id,
        productCost: 240, shippingCost: 80, customsCost: 45, otherCosts: 15,
        totalCost: 380, salePrice: 1200, profit: 820, currencyCode: 'USD',
        status: 'EN_TRANSITO', purchasedAt: new Date(Date.now() - 15 * 86400000),
        shippedAt: new Date(Date.now() - 8 * 86400000),
        carrier: 'DHL Express', trackingNumber: 'DHL8871234567',
        incoterm: 'FOB', notes: 'En tránsito. ETA 5 días.',
      },
    })
  }
  if (req6) {
    await db.import.create({
      data: {
        number: 'IMP-2025-000002', requestId: req6.id, supplierId: sYiwu.id,
        productCost: 125, shippingCost: 60, customsCost: 30, otherCosts: 10,
        totalCost: 225, salePrice: 600, profit: 375, currencyCode: 'USD',
        status: 'ENTREGADO', purchasedAt: new Date(Date.now() - 45 * 86400000),
        shippedAt: new Date(Date.now() - 35 * 86400000),
        arrivedAt: new Date(Date.now() - 20 * 86400000),
        deliveredAt: new Date(Date.now() - 15 * 86400000),
        carrier: 'EMS', trackingNumber: 'EMS5566778899',
        incoterm: 'CIF', notes: 'Entregado exitosamente.',
      },
    })
  }

  // ===== Transactions =====
  const imports = await db.import.findMany()
  for (const imp of imports) {
    await db.transaction.create({
      data: { type: 'INCOME', category: 'SALES', description: `Venta importación ${imp.number}`, amount: imp.salePrice, reference: imp.number, requestId: imp.requestId, date: imp.createdAt },
    })
    await db.transaction.create({
      data: { type: 'EXPENSE', category: 'PURCHASE', description: `Compra a proveedor ${imp.number}`, amount: imp.totalCost, reference: imp.number, requestId: imp.requestId, date: imp.createdAt },
    })
  }

  // ===== Notifications =====
  const req5 = await db.importRequest.findFirst({ where: { number: 'NX-2025-000005' } })
  await db.notification.createMany({
    data: [
      { userId: admin.id, type: 'request', priority: 'HIGH', title: 'Nueva solicitud recibida', message: 'Solicitud NX-2025-000005: Tiras LED Inteligentes', data: JSON.stringify({ requestId: req5?.id }) },
      { userId: admin.id, type: 'quote', priority: 'MEDIUM', title: 'Cotización enviada', message: 'COT-2025-000001 enviada al cliente Carlos Emprendedor' },
      { userId: admin.id, type: 'import', priority: 'CRITICAL', title: 'Importación en tránsito', message: 'IMP-2025-000001 (Fundas Samsung) está en tránsito vía DHL. ETA 5 días.' },
      { userId: employee.id, type: 'request', priority: 'HIGH', title: 'Cliente esperando respuesta', message: 'NX-2025-000002: María Boutique lleva 48h esperando cotización' },
      { userId: client1.id, type: 'request', priority: 'MEDIUM', title: 'Tu solicitud fue actualizada', message: 'NX-2025-000001: Cotización enviada. Revisa los detalles.' },
      { userId: client3.id, type: 'request', priority: 'HIGH', title: 'Pago confirmado', message: 'NX-2025-000003: Hemos recibido tu pago. Iniciando proceso de compra.' },
    ],
  })

  // ===== NAIOS Recommendations =====
  await db.naiosRecommendation.createMany({
    data: [
      { type: 'ALERT', severity: 'CRITICAL', title: 'Solicitud sin analizar', description: 'NX-2025-000005 (Tiras LED) lleva más de 24h sin ser analizada. Asignar responsable.', module: 'requests', action: 'Asignar a Laura Gestión' },
      { type: 'RISK', severity: 'HIGH', title: 'Proveedor de alto riesgo', description: 'Yiwu Smart Trading tiene score 62. Considerar diversificar hacia Shenzhen TechLink.', module: 'suppliers', action: 'Evaluar proveedores alternativos' },
      { type: 'OPPORTUNITY', severity: 'MEDIUM', title: 'Cliente recurrente detectado', description: 'Carlos Emprendedor tiene 2 solicitudes activas. Ofrecer programa de fidelización.', module: 'requests', action: 'Contactar para ofrecer beneficios' },
      { type: 'INSIGHT', severity: 'LOW', title: 'Margen saludable', description: 'Importaciones completadas muestran margen promedio del 68%. Rentabilidad sólida.', module: 'finance' },
      { type: 'ALERT', severity: 'HIGH', title: 'Cliente esperando respuesta', description: 'NX-2025-000002 (María Boutique) lleva 48h esperando cotización de Jordan 1.', module: 'requests', action: 'Contactar proveedor Guangzhou urgentemente' },
    ],
  })

  console.log('✅ NEXORA Import Platform seeded!')
  console.log(`   Company: ${company.commercialName}`)
  console.log(`   Users: 6 (1 admin, 1 employee, 3 clients, 1 reseller)`)
  console.log(`   Suppliers: 3 (con ratings)`)
  console.log(`   Products: 8`)
  console.log(`   Import Requests: 6 (varios estados)`)
  console.log(`   Quotes: 2`)
  console.log(`   Imports: 2`)
  console.log(`   Notifications: 6`)
  console.log(`   NAIOS Recommendations: 5`)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })