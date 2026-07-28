// NEXORA — Database Seeder
// Generates realistic business data per DOC-005 / DOC-006 entity specs
import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding NEXORA database...')

  // Clean
  await db.session.deleteMany()
  await db.rolePermission.deleteMany()
  await db.permission.deleteMany()
  await db.role.deleteMany()
  await db.branch.deleteMany()
  await db.naiosConversation.deleteMany()
  await db.naiosRecommendation.deleteMany()
  await db.transaction.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.inventoryMovement.deleteMany()
  await db.inventory.deleteMany()
  await db.purchaseOrderItem.deleteMany()
  await db.purchaseOrder.deleteMany()
  await db.supplierQuote.deleteMany()
  await db.supplierRating.deleteMany()
  await db.supplier.deleteMany()
  await db.customer.deleteMany()
  await db.productImage.deleteMany()
  await db.productVideo.deleteMany()
  await db.productVariant.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.brand.deleteMany()
  await db.warehouse.deleteMany()
  await db.setting.deleteMany()
  await db.auditLog.deleteMany()
  await db.user.deleteMany()
  await db.company.deleteMany()
  await db.file.deleteMany()

  // ===== Company =====
  const company = await db.company.create({
    data: {
      legalName: 'NEXORA Commerce S.A.S.',
      commercialName: 'NEXORA',
      nit: '901.234.567-8',
      email: 'info@nexora.co',
      phone: '+57 310 555 0100',
      country: 'CO',
      currencyCode: 'USD',
      timezone: 'America/Bogota',
      website: 'https://nexora.co',
    },
  })

  // ===== Roles & Permissions (RBAC) =====
  const MODULES = ['products', 'orders', 'users', 'suppliers', 'inventory', 'finance', 'customers', 'purchases', 'settings', 'naios']
  const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'approve', 'configure', 'admin']

  // Create permissions
  const permissions = []
  for (const mod of MODULES) {
    for (const action of ACTIONS) {
      permissions.push(
        await db.permission.create({
          data: { module: mod, action, description: `${action} on ${mod}` },
        }),
      )
    }
  }

  // Create system roles
  const adminRole = await db.role.create({
    data: {
      name: 'ADMIN',
      description: 'Administrador con acceso total',
      isSystem: true,
      status: 'ACTIVE',
      companyId: company.id,
    },
  })
  const ceoRole = await db.role.create({
    data: {
      name: 'CEO',
      description: 'Director ejecutivo — acceso total + configuración',
      isSystem: true,
      status: 'ACTIVE',
      companyId: company.id,
    },
  })
  const comprasRole = await db.role.create({
    data: {
      name: 'COMPRAS',
      description: 'Departamento de compras',
      isSystem: true,
      status: 'ACTIVE',
      companyId: company.id,
    },
  })
  const ventasRole = await db.role.create({
    data: {
      name: 'VENTAS',
      description: 'Departamento de ventas',
      isSystem: true,
      status: 'ACTIVE',
      companyId: company.id,
    },
  })
  const inventarioRole = await db.role.create({
    data: {
      name: 'INVENTARIO',
      description: 'Departamento de inventario',
      isSystem: true,
      status: 'ACTIVE',
      companyId: company.id,
    },
  })
  const finanzasRole = await db.role.create({
    data: {
      name: 'FINANZAS',
      description: 'Departamento financiero',
      isSystem: true,
      status: 'ACTIVE',
      companyId: company.id,
    },
  })

  // Assign all permissions to ADMIN and CEO
  const allPermIds = permissions.map((p) => p.id)
  await db.rolePermission.createMany({
    data: [
      ...allPermIds.map((pid) => ({ roleId: adminRole.id, permissionId: pid })),
      ...allPermIds.map((pid) => ({ roleId: ceoRole.id, permissionId: pid })),
    ],
  })
  // Assign scoped permissions to other roles
  const scopedPerms = (modules: string[], actions: string[]) =>
    permissions.filter((p) => modules.includes(p.module) && actions.includes(p.action)).map((p) => p.id)
  await db.rolePermission.createMany({
    data: [
      ...scopedPerms(['products', 'suppliers', 'purchases', 'inventory'], ['view', 'create', 'edit', 'export']).map((pid) => ({ roleId: comprasRole.id, permissionId: pid })),
      ...scopedPerms(['products', 'orders', 'customers', 'inventory'], ['view', 'create', 'edit', 'export']).map((pid) => ({ roleId: ventasRole.id, permissionId: pid })),
      ...scopedPerms(['products', 'inventory'], ['view', 'edit', 'export']).map((pid) => ({ roleId: inventarioRole.id, permissionId: pid })),
      ...scopedPerms(['finance', 'orders', 'purchases', 'customers'], ['view', 'export', 'approve']).map((pid) => ({ roleId: finanzasRole.id, permissionId: pid })),
    ],
  })

  // ===== Branches =====
  const bogBranch = await db.branch.create({
    data: { name: 'Sede Principal Bogotá', code: 'BOG-01', address: 'Calle 100 #15-20', city: 'Bogotá', country: 'CO', state: 'Cundinamarca', companyId: company.id, status: 'ACTIVE' },
  })
  const mdeBranch = await db.branch.create({
    data: { name: 'Sucursal Medellín', code: 'MDE-02', address: 'Carrera 70 #45-12', city: 'Medellín', country: 'CO', state: 'Antioquia', companyId: company.id, status: 'ACTIVE' },
  })

  // ===== Users (per DOC-006 roles) =====
  const passwordHash = await bcrypt.hash('nexora123', 10)
  const adrian = await db.user.create({
    data: { firstName: 'Adrián', lastName: 'CEO', email: 'adrian@nexora.co', password: passwordHash, position: 'CEO', role: 'CEO', roleId: ceoRole.id, status: 'ACTIVE', companyId: company.id, branchId: bogBranch.id, timezone: 'America/Bogota', language: 'es' },
  })
  const laura = await db.user.create({
    data: { firstName: 'Laura', lastName: 'Admin', email: 'laura@nexora.co', password: passwordHash, position: 'Administradora del sistema', role: 'ADMIN', roleId: adminRole.id, status: 'ACTIVE', companyId: company.id, branchId: bogBranch.id, timezone: 'America/Bogota', language: 'es' },
  })
  const carlos = await db.user.create({
    data: { firstName: 'Carlos', lastName: 'Compras', email: 'carlos@nexora.co', password: passwordHash, position: 'Jefe de compras', role: 'COMPRAS', roleId: comprasRole.id, status: 'ACTIVE', companyId: company.id, branchId: bogBranch.id, timezone: 'America/Bogota', language: 'es' },
  })
  await db.user.create({
    data: { firstName: 'Sofía', lastName: 'Ventas', email: 'sofia@nexora.co', password: passwordHash, position: 'Ejecutiva de ventas', role: 'VENTAS', roleId: ventasRole.id, status: 'ACTIVE', companyId: company.id, branchId: mdeBranch.id, timezone: 'America/Bogota', language: 'es' },
  })
  await db.user.create({
    data: { firstName: 'Diego', lastName: 'Inventario', email: 'diego@nexora.co', password: passwordHash, position: 'Coordinador de inventario', role: 'INVENTARIO', roleId: inventarioRole.id, status: 'ACTIVE', companyId: company.id, branchId: bogBranch.id, timezone: 'America/Bogota', language: 'es' },
  })
  await db.user.create({
    data: { firstName: 'Valeria', lastName: 'Finanzas', email: 'valeria@nexora.co', password: passwordHash, position: 'Analista financiera', role: 'FINANZAS', roleId: finanzasRole.id, status: 'ACTIVE', companyId: company.id, branchId: bogBranch.id, timezone: 'America/Bogota', language: 'es' },
  })

  // Set branch responsible
  await db.branch.update({ where: { id: bogBranch.id }, data: { responsibleId: adrian.id } })
  await db.branch.update({ where: { id: mdeBranch.id }, data: { responsibleId: laura.id } })

  // Login audit entries
  await db.auditLog.create({
    data: { userId: adrian.id, action: 'LOGIN', entity: 'auth', entityId: adrian.id, result: 'SUCCESS', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0' },
  })

  // ===== Settings =====
  await db.setting.createMany({
    data: [
      { key: 'company.country', value: 'Colombia', category: 'company', companyId: company.id },
      { key: 'company.currency', value: 'USD', category: 'company', companyId: company.id },
      { key: 'naios.enabled', value: 'true', category: 'naios' },
      { key: 'naios.autonomy', value: 'advisory', category: 'naios' },
    ],
  })

  // ===== Warehouses =====
  const mainWarehouse = await db.warehouse.create({
    data: { name: 'Almacén Central Bogotá', code: 'BOG-01', address: 'Bogotá, Colombia', isActive: true },
  })
  const secondaryWarehouse = await db.warehouse.create({
    data: { name: 'Almacén Medellín', code: 'MDE-02', address: 'Medellín, Colombia', isActive: true },
  })

  // ===== Brands =====
  const brands = await db.brand.createMany({
    data: [
      { name: 'Apple', description: 'Consumer electronics' },
      { name: 'Nike', description: 'Athletic footwear & apparel' },
      { name: 'Dior', description: 'Luxury fashion house' },
      { name: 'Rolex', description: 'Luxury watches' },
      { name: 'Generic OEM', description: 'White-label goods' },
    ],
  })
  const brandMap = await db.brand.findMany()
  const apple = brandMap.find((b) => b.name === 'Apple')!
  const nike = brandMap.find((b) => b.name === 'Nike')!
  const dior = brandMap.find((b) => b.name === 'Dior')!
  const rolex = brandMap.find((b) => b.name === 'Rolex')!
  const generic = brandMap.find((b) => b.name === 'Generic OEM')!

  // ===== Categories =====
  const catElectronics = await db.category.create({ data: { name: 'Electrónica', slug: 'electronica' } })
  const catAudio = await db.category.create({ data: { name: 'Audio', slug: 'audio', parentId: catElectronics.id } })
  const catWearables = await db.category.create({ data: { name: 'Wearables', slug: 'wearables', parentId: catElectronics.id } })
  const catFootwear = await db.category.create({ data: { name: 'Calzado', slug: 'calzado' } })
  const catBags = await db.category.create({ data: { name: 'Bolsos', slug: 'bolsos' } })
  const catWatches = await db.category.create({ data: { name: 'Relojes', slug: 'relojes' } })

  // ===== Suppliers (per DOC-006 — Chinese suppliers with rich ratings) =====
  const sShenzhen = await db.supplier.create({
    data: {
      companyName: 'Shenzhen TechLink Electronics',
      contactName: 'Wei Zhang',
      whatsapp: '+86 138 1234 5678',
      wechat: 'techlink_zhang',
      email: 'sales@techlink.cn',
      website: 'techlink.cn',
      country: 'CN',
      city: 'Shenzhen',
      address: 'Huaqiangbei, Futian District',
      moq: 50,
      paymentMethods: 'T/T, PayPal, Alibaba Trade Assurance',
      shippingMethods: 'DHL, FedEx, Air Cargo',
      warranty: '12 meses',
      leadTime: 7,
      productionTime: 15,
      oem: true,
      odm: true,
      status: 'ACTIVE',
      riskLevel: 'LOW',
      companyId: company.id,
    },
  })
  const sGuangzhou = await db.supplier.create({
    data: {
      companyName: 'Guangzhou Premium Footwear Co.',
      contactName: 'Ling Chen',
      whatsapp: '+86 139 8765 4321',
      wechat: 'gz_footwear',
      email: 'export@gzfootwear.com',
      yupoo: 'x.yupoo.com/gzfootwear',
      country: 'CN',
      city: 'Guangzhou',
      address: 'Baiyun District',
      moq: 20,
      paymentMethods: 'T/T, Western Union',
      shippingMethods: 'EMS, DHL',
      warranty: '3 meses',
      leadTime: 10,
      productionTime: 20,
      oem: true,
      odm: false,
      status: 'ACTIVE',
      riskLevel: 'MEDIUM',
      companyId: company.id,
    },
  })
  const sYiwu = await db.supplier.create({
    data: {
      companyName: 'Yiwu Luxury Bags Trading',
      contactName: 'Mei Wang',
      whatsapp: '+86 137 5555 1212',
      email: 'mei@yiwubags.cn',
      country: 'CN',
      city: 'Yiwu',
      moq: 10,
      paymentMethods: 'PayPal, Western Union',
      shippingMethods: 'EMS, ePacket',
      warranty: '1 mes',
      leadTime: 14,
      productionTime: 25,
      oem: false,
      odm: false,
      status: 'ACTIVE',
      riskLevel: 'HIGH',
      companyId: company.id,
    },
  })
  const sShanghai = await db.supplier.create({
    data: {
      companyName: 'Shanghai TimeMaster Watches',
      contactName: 'Jian Liu',
      whatsapp: '+86 136 2222 3333',
      email: 'sales@timemaster.cn',
      country: 'CN',
      city: 'Shanghai',
      moq: 30,
      paymentMethods: 'T/T, Alibaba Trade Assurance',
      shippingMethods: 'DHL, FedEx',
      warranty: '6 meses',
      leadTime: 8,
      productionTime: 18,
      oem: true,
      odm: true,
      status: 'ACTIVE',
      riskLevel: 'MEDIUM',
      companyId: company.id,
    },
  })

  // ===== Supplier Ratings =====
  await db.supplierRating.createMany({
    data: [
      { supplierId: sShenzhen.id, communicationScore: 92, qualityScore: 95, priceScore: 88, shippingScore: 90, warrantyScore: 93, trustScore: 94, overallScore: 92.0, review: 'Excellent quality, fast shipping. Top tier supplier.', ratedBy: 'carlos@nexora.co' },
      { supplierId: sGuangzhou.id, communicationScore: 78, qualityScore: 82, priceScore: 90, shippingScore: 75, warrantyScore: 60, trustScore: 76, overallScore: 76.8, review: 'Good price, quality varies by batch.', ratedBy: 'carlos@nexora.co' },
      { supplierId: sYiwu.id, communicationScore: 65, qualityScore: 58, priceScore: 92, shippingScore: 62, warrantyScore: 40, trustScore: 55, overallScore: 62.0, review: 'Cheap but inconsistent. Risk of defects.', ratedBy: 'carlos@nexora.co' },
      { supplierId: sShanghai.id, communicationScore: 85, qualityScore: 88, priceScore: 80, shippingScore: 86, warrantyScore: 82, trustScore: 85, overallScore: 84.3, review: 'Reliable watch supplier, good OEM support.', ratedBy: 'carlos@nexora.co' },
    ],
  })

  // ===== Supplier Quotes =====
  await db.supplierQuote.createMany({
    data: [
      { supplierId: sShenzhen.id, productName: 'AirPods Pro 2 OEM', quantity: 100, unitPrice: 68.5, currencyCode: 'USD', status: 'APPROVED', validUntil: new Date('2025-12-31') },
      { supplierId: sGuangzhou.id, productName: 'Air Jordan 1 Retro', quantity: 50, unitPrice: 42.0, currencyCode: 'USD', status: 'PENDING' },
      { supplierId: sYiwu.id, productName: 'Bolso Dior Replica', quantity: 30, unitPrice: 28.0, currencyCode: 'USD', status: 'REJECTED' },
      { supplierId: sShanghai.id, productName: 'Apple Watch Ultra Clone', quantity: 60, unitPrice: 55.0, currencyCode: 'USD', status: 'APPROVED' },
    ],
  })

  // ===== Products (per DOC-006 examples: AirPods, Jordan, Dior, Apple Watch) =====
  const products = await db.product.createMany({
    data: [
      {
        sku: 'APL-APP-PRO2', name: 'AirPods Pro 2', description: 'Active noise cancellation, adaptive transparency, USB-C charging case.', brandId: apple.id, categoryId: catAudio.id, supplierId: sShenzhen.id, weight: 0.054, material: 'Plástico ABS', warranty: '12 meses', purchasePrice: 68.5, salePrice: 189.0, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400', companyId: company.id,
      },
      {
        sku: 'APL-AW-U9', name: 'Apple Watch Ultra 2', description: 'Titanium case, 72-hour battery, precision dual-frequency GPS.', brandId: apple.id, categoryId: catWearables.id, supplierId: sShenzhen.id, weight: 0.061, material: 'Titanio', warranty: '12 meses', purchasePrice: 95.0, salePrice: 329.0, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400', companyId: company.id,
      },
      {
        sku: 'NKE-AJ1-RETRO', name: 'Air Jordan 1 Retro High', description: 'Classic high-top silhouette, leather upper, iconic colorway.', brandId: nike.id, categoryId: catFootwear.id, supplierId: sGuangzhou.id, weight: 1.2, material: 'Cuero', warranty: '3 meses', purchasePrice: 42.0, salePrice: 159.0, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400', companyId: company.id,
      },
      {
        sku: 'NKE-AJ4-BLACK', name: 'Air Jordan 4 Black Canvas', description: 'Premium canvas upper, visible air cushioning.', brandId: nike.id, categoryId: catFootwear.id, supplierId: sGuangzhou.id, weight: 1.3, material: 'Lona', warranty: '3 meses', purchasePrice: 48.0, salePrice: 179.0, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', companyId: company.id,
      },
      {
        sku: 'DIO-SADDLE-BLK', name: 'Bolso Dior Saddle', description: 'Iconic saddle silhouette, calfskin leather, adjustable strap.', brandId: dior.id, categoryId: catBags.id, supplierId: sYiwu.id, weight: 0.85, material: 'Piel de ternero', warranty: '1 mes', purchasePrice: 28.0, salePrice: 129.0, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', companyId: company.id,
      },
      {
        sku: 'RLX-SUB-DATE', name: 'Rolex Submariner Date', description: 'Oystersteel, 41mm, Cerachrom bezel, automatic movement.', brandId: rolex.id, categoryId: catWatches.id, supplierId: sShanghai.id, weight: 0.15, material: 'Acero Oystersteel', warranty: '6 meses', purchasePrice: 120.0, salePrice: 449.0, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', companyId: company.id,
      },
      {
        sku: 'GEN-CHGR-65W', name: 'Cargador GaN 65W', description: 'USB-C PD fast charger, dual port, compact GaN design.', brandId: generic.id, categoryId: catElectronics.id, supplierId: sShenzhen.id, weight: 0.09, material: 'PC + ABS', warranty: '12 meses', purchasePrice: 8.5, salePrice: 34.9, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', companyId: company.id,
      },
      {
        sku: 'GEN-CABLE-USBC', name: 'Cable USB-C a Lightning (2m)', description: 'MFi certified, braided nylon, 2 meter length.', brandId: generic.id, categoryId: catElectronics.id, supplierId: sShenzhen.id, weight: 0.05, material: 'Nylon trenzado', warranty: '6 meses', purchasePrice: 2.8, salePrice: 19.9, currencyCode: 'USD', status: 'ACTIVE', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400', companyId: company.id,
      },
    ],
  })
  const allProducts = await db.product.findMany()

  // ===== Inventory =====
  const invData = [
    { sku: 'APL-APP-PRO2', stock: 124, reserved: 12, minStock: 30, warehouse: mainWarehouse.id, location: 'A-01-03' },
    { sku: 'APL-AW-U9', stock: 18, reserved: 4, minStock: 25, warehouse: mainWarehouse.id, location: 'A-02-01' },
    { sku: 'NKE-AJ1-RETRO', stock: 76, reserved: 8, minStock: 20, warehouse: secondaryWarehouse.id, location: 'B-01-05' },
    { sku: 'NKE-AJ4-BLACK', stock: 9, reserved: 2, minStock: 15, warehouse: secondaryWarehouse.id, location: 'B-02-02' },
    { sku: 'DIO-SADDLE-BLK', stock: 3, reserved: 1, minStock: 10, warehouse: mainWarehouse.id, location: 'C-01-01' },
    { sku: 'RLX-SUB-DATE', stock: 5, reserved: 0, minStock: 5, warehouse: mainWarehouse.id, location: 'D-01-01' },
    { sku: 'GEN-CHGR-65W', stock: 340, reserved: 20, minStock: 50, warehouse: mainWarehouse.id, location: 'E-01-04' },
    { sku: 'GEN-CABLE-USBC', stock: 0, reserved: 0, minStock: 100, warehouse: mainWarehouse.id, location: 'E-02-08' },
  ]
  for (const inv of invData) {
    const p = allProducts.find((x) => x.sku === inv.sku)!
    await db.inventory.create({
      data: { productId: p.id, warehouseId: inv.warehouse, stock: inv.stock, reserved: inv.reserved, minStock: inv.minStock, maxStock: 500, location: inv.location },
    })
  }

  // ===== Customers =====
  const customers = await db.customer.createMany({
    data: [
      { firstName: 'Andrés', lastName: 'Gómez', email: 'andres.gomez@gmail.com', phone: '+57 311 234 5678', country: 'CO', city: 'Bogotá', address: 'Calle 85 #12-34', status: 'VIP', lifetimeValue: 4580.5, totalOrders: 14, tags: 'vip,frequent', companyId: company.id },
      { firstName: 'María', lastName: 'Rodríguez', email: 'maria.r@hotmail.com', phone: '+57 320 987 6543', country: 'CO', city: 'Medellín', address: 'Carrera 70 #45-12', status: 'ACTIVE', lifetimeValue: 1240.0, totalOrders: 6, tags: 'frequent', companyId: company.id },
      { firstName: 'Jorge', lastName: 'Martínez', email: 'jorge.m@gmail.com', phone: '+57 315 456 7890', country: 'CO', city: 'Cali', address: 'Av 6N #22-10', status: 'ACTIVE', lifetimeValue: 680.0, totalOrders: 3, companyId: company.id },
      { firstName: 'Daniela', lastName: 'Sánchez', email: 'dani.sanchez@gmail.com', phone: '+57 300 111 2233', country: 'CO', city: 'Barranquilla', address: 'Calle 50 #30-18', status: 'ACTIVE', lifetimeValue: 320.0, totalOrders: 2, companyId: company.id },
      { firstName: 'Felipe', lastName: 'Castro', email: 'felipe.castro@gmail.com', phone: '+57 318 444 5566', country: 'MX', city: 'CDMX', address: 'Polanco 45', status: 'VIP', lifetimeValue: 2980.0, totalOrders: 9, tags: 'vip,international', companyId: company.id },
    ],
  })
  const allCustomers = await db.customer.findMany()

  // ===== Orders =====
  const orderSeed = [
    { cust: 0, items: [{ sku: 'APL-APP-PRO2', qty: 1 }, { sku: 'GEN-CABLE-USBC', qty: 2 }], status: 'DELIVERED', daysAgo: 28, paymentMethod: 'Tarjeta' },
    { cust: 4, items: [{ sku: 'RLX-SUB-DATE', qty: 1 }], status: 'SHIPPED', daysAgo: 3, paymentMethod: 'Nequi' },
    { cust: 1, items: [{ sku: 'NKE-AJ1-RETRO', qty: 1 }], status: 'PAID', daysAgo: 1, paymentMethod: 'Tarjeta' },
    { cust: 2, items: [{ sku: 'APL-AW-U9', qty: 1 }, { sku: 'GEN-CHGR-65W', qty: 1 }], status: 'PENDING', daysAgo: 0, paymentMethod: 'Contraentrega' },
    { cust: 3, items: [{ sku: 'DIO-SADDLE-BLK', qty: 1 }], status: 'PAID', daysAgo: 5, paymentMethod: 'PayPal' },
    { cust: 0, items: [{ sku: 'NKE-AJ4-BLACK', qty: 1 }], status: 'DELIVERED', daysAgo: 40, paymentMethod: 'Tarjeta' },
    { cust: 4, items: [{ sku: 'APL-APP-PRO2', qty: 2 }], status: 'DELIVERED', daysAgo: 60, paymentMethod: 'Tarjeta' },
    { cust: 1, items: [{ sku: 'GEN-CHGR-65W', qty: 3 }], status: 'DELIVERED', daysAgo: 18, paymentMethod: 'Nequi' },
    // Additional historical sales for a healthier P&L
    { cust: 0, items: [{ sku: 'APL-APP-PRO2', qty: 2 }, { sku: 'GEN-CHGR-65W', qty: 2 }], status: 'DELIVERED', daysAgo: 12, paymentMethod: 'Tarjeta' },
    { cust: 4, items: [{ sku: 'RLX-SUB-DATE', qty: 2 }], status: 'DELIVERED', daysAgo: 22, paymentMethod: 'Tarjeta' },
    { cust: 1, items: [{ sku: 'NKE-AJ1-RETRO', qty: 2 }, { sku: 'NKE-AJ4-BLACK', qty: 1 }], status: 'DELIVERED', daysAgo: 9, paymentMethod: 'Nequi' },
    { cust: 2, items: [{ sku: 'APL-AW-U9', qty: 2 }], status: 'DELIVERED', daysAgo: 16, paymentMethod: 'Tarjeta' },
    { cust: 3, items: [{ sku: 'DIO-SADDLE-BLK', qty: 2 }, { sku: 'GEN-CABLE-USBC', qty: 3 }], status: 'DELIVERED', daysAgo: 25, paymentMethod: 'PayPal' },
    { cust: 0, items: [{ sku: 'APL-APP-PRO2', qty: 3 }], status: 'DELIVERED', daysAgo: 35, paymentMethod: 'Tarjeta' },
    { cust: 4, items: [{ sku: 'NKE-AJ1-RETRO', qty: 1 }, { sku: 'GEN-CHGR-65W', qty: 2 }], status: 'DELIVERED', daysAgo: 48, paymentMethod: 'Tarjeta' },
    { cust: 1, items: [{ sku: 'RLX-SUB-DATE', qty: 1 }, { sku: 'APL-APP-PRO2', qty: 1 }], status: 'DELIVERED', daysAgo: 55, paymentMethod: 'Nequi' },
    { cust: 2, items: [{ sku: 'NKE-AJ4-BLACK', qty: 2 }], status: 'DELIVERED', daysAgo: 7, paymentMethod: 'Tarjeta' },
    { cust: 3, items: [{ sku: 'APL-AW-U9', qty: 1 }, { sku: 'GEN-CHGR-65W', qty: 1 }], status: 'DELIVERED', daysAgo: 14, paymentMethod: 'PayPal' },
    // High-value sales to reflect a healthy, growing business
    { cust: 0, items: [{ sku: 'RLX-SUB-DATE', qty: 3 }], status: 'DELIVERED', daysAgo: 19, paymentMethod: 'Tarjeta' },
    { cust: 4, items: [{ sku: 'APL-AW-U9', qty: 4 }], status: 'DELIVERED', daysAgo: 26, paymentMethod: 'Tarjeta' },
    { cust: 1, items: [{ sku: 'APL-APP-PRO2', qty: 5 }, { sku: 'GEN-CABLE-USBC', qty: 5 }], status: 'DELIVERED', daysAgo: 31, paymentMethod: 'Nequi' },
    { cust: 2, items: [{ sku: 'NKE-AJ1-RETRO', qty: 4 }], status: 'DELIVERED', daysAgo: 42, paymentMethod: 'Tarjeta' },
    { cust: 3, items: [{ sku: 'DIO-SADDLE-BLK', qty: 3 }], status: 'DELIVERED', daysAgo: 50, paymentMethod: 'PayPal' },
    { cust: 4, items: [{ sku: 'RLX-SUB-DATE', qty: 2 }, { sku: 'APL-APP-PRO2', qty: 3 }], status: 'DELIVERED', daysAgo: 58, paymentMethod: 'Tarjeta' },
    { cust: 0, items: [{ sku: 'APL-AW-U9', qty: 3 }, { sku: 'GEN-CHGR-65W', qty: 3 }], status: 'DELIVERED', daysAgo: 11, paymentMethod: 'Tarjeta' },
    { cust: 4, items: [{ sku: 'RLX-SUB-DATE', qty: 2 }], status: 'DELIVERED', daysAgo: 33, paymentMethod: 'Tarjeta' },
    { cust: 1, items: [{ sku: 'APL-APP-PRO2', qty: 4 }, { sku: 'APL-AW-U9', qty: 2 }], status: 'DELIVERED', daysAgo: 45, paymentMethod: 'Nequi' },
    { cust: 0, items: [{ sku: 'RLX-SUB-DATE', qty: 2 }, { sku: 'NKE-AJ1-RETRO', qty: 2 }], status: 'DELIVERED', daysAgo: 38, paymentMethod: 'Tarjeta' },
  ]
  let orderNum = 1001
  for (const o of orderSeed) {
    const customer = allCustomers[o.cust]
    let subtotal = 0
    const itemRows = o.items.map((it) => {
      const p = allProducts.find((x) => x.sku === it.sku)!
      const total = p.salePrice * it.qty
      subtotal += total
      return { productId: p.id, quantity: it.qty, unitPrice: p.salePrice, total }
    })
    const shippingCost = subtotal > 200 ? 0 : 12
    const tax = subtotal * 0.19
    const total = subtotal + shippingCost + tax
    await db.order.create({
      data: {
        number: `ORD-${orderNum++}`,
        customerId: customer.id,
        userId: adrian.id,
        status: o.status,
        subtotal,
        shippingCost,
        tax,
        discount: 0,
        total,
        currencyCode: 'USD',
        paymentMethod: o.paymentMethod,
        trackingNumber: o.status === 'SHIPPED' || o.status === 'DELIVERED' ? `TRK${Math.floor(Math.random() * 9000000 + 1000000)}` : null,
        createdAt: new Date(Date.now() - o.daysAgo * 86400000),
        items: { create: itemRows },
      },
    })
  }

  // ===== Purchase Orders =====
  const poSeed = [
    { supplier: sShenzhen, items: [{ sku: 'APL-APP-PRO2', qty: 100 }, { sku: 'GEN-CHGR-65W', qty: 200 }], status: 'RECEIVED', daysAgo: 35 },
    { supplier: sGuangzhou, items: [{ sku: 'NKE-AJ1-RETRO', qty: 80 }], status: 'SHIPPED', daysAgo: 6 },
    { supplier: sShanghai, items: [{ sku: 'RLX-SUB-DATE', qty: 40 }], status: 'PENDING', daysAgo: 1 },
    { supplier: sShenzhen, items: [{ sku: 'GEN-CABLE-USBC', qty: 500 }], status: 'APPROVED', daysAgo: 3 },
  ]
  let poNum = 5001
  for (const po of poSeed) {
    let subtotal = 0
    const itemRows = po.items.map((it) => {
      const p = allProducts.find((x) => x.sku === it.sku)!
      const totalCost = p.purchasePrice * it.qty
      subtotal += totalCost
      return { productId: p.id, quantity: it.qty, unitCost: p.purchasePrice, totalCost }
    })
    const shippingCost = 45
    const tax = subtotal * 0.0
    const total = subtotal + shippingCost + tax
    await db.purchaseOrder.create({
      data: {
        number: `PO-${poNum++}`,
        status: po.status,
        supplierId: po.supplier.id,
        userId: carlos.id,
        subtotal,
        shippingCost,
        tax,
        total,
        currencyCode: 'USD',
        expectedDate: new Date(Date.now() + 14 * 86400000),
        receivedDate: po.status === 'RECEIVED' ? new Date(Date.now() - 5 * 86400000) : null,
        createdAt: new Date(Date.now() - po.daysAgo * 86400000),
        items: { create: itemRows },
      },
    })
  }

  // ===== Transactions (Finance) =====
  const orders = await db.order.findMany({ include: { items: true } })
  for (const order of orders) {
    if (order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      await db.transaction.create({
        data: { type: 'INCOME', category: 'SALES', description: `Venta ${order.number}`, amount: order.total, currencyCode: 'USD', reference: order.number, date: order.createdAt },
      })
    }
  }
  const purchases = await db.purchaseOrder.findMany()
  for (const po of purchases) {
    if (po.status === 'APPROVED' || po.status === 'SHIPPED' || po.status === 'RECEIVED') {
      await db.transaction.create({
        data: { type: 'EXPENSE', category: 'PURCHASES', description: `Compra ${po.number}`, amount: po.total, currencyCode: 'USD', reference: po.number, date: po.createdAt },
      })
    }
  }
  // Operating expenses
  const expenses = [
    { category: 'MARKETING', description: 'Campaña Meta Ads - Octubre', amount: 850, daysAgo: 10 },
    { category: 'SALARY', description: 'Nómina personal - Quincena', amount: 3200, daysAgo: 5 },
    { category: 'RENT', description: 'Arriendo bodega Bogotá', amount: 1200, daysAgo: 12 },
    { category: 'UTILITY', description: 'Servicios públicos', amount: 180, daysAgo: 8 },
    { category: 'SHIPPING', description: 'Envíos DHL Express', amount: 540, daysAgo: 3 },
    { category: 'MARKETING', description: 'Influencer - TikTok', amount: 600, daysAgo: 20 },
  ]
  for (const e of expenses) {
    await db.transaction.create({
      data: { type: 'EXPENSE', category: e.category, description: e.description, amount: e.amount, currencyCode: 'USD', date: new Date(Date.now() - e.daysAgo * 86400000) },
    })
  }

  // ===== Inventory Movements =====
  for (const inv of await db.inventory.findMany()) {
    await db.inventoryMovement.create({
      data: { productId: inv.productId, warehouseId: inv.warehouseId, type: 'IN', quantity: inv.stock + 20, reason: 'Recepción de compra', reference: 'PO-5001', createdAt: new Date(Date.now() - 30 * 86400000) },
    })
    if (inv.stock > 10) {
      await db.inventoryMovement.create({
        data: { productId: inv.productId, warehouseId: inv.warehouseId, type: 'OUT', quantity: 20, reason: 'Venta', reference: 'ORD-1001', createdAt: new Date(Date.now() - 20 * 86400000) },
      })
    }
  }

  // ===== NAIOS Recommendations (per DOC-006 — alerts, opportunities, risks, insights) =====
  await db.naiosRecommendation.createMany({
    data: [
      { type: 'ALERT', severity: 'CRITICAL', title: 'Stock agotado: Cable USB-C', description: 'El producto "Cable USB-C a Lightning" tiene 0 unidades disponibles. Es el accesorio más vendido.', module: 'inventory', action: 'Crear orden de compra urgente al proveedor Shenzhen TechLink.', status: 'PENDING' },
      { type: 'ALERT', severity: 'HIGH', title: 'Stock bajo en 4 productos', description: 'Apple Watch Ultra 2, Air Jordan 4, Bolso Dior Saddle y Rolex Submariner están por debajo del stock mínimo.', module: 'inventory', action: 'Revisar rotación y programar reposición.', status: 'PENDING' },
      { type: 'RISK', severity: 'HIGH', title: 'Proveedor de alto riesgo: Yiwu', description: 'Yiwu Luxury Bags tiene un overall score de 62.0 y warranty score de 40. Riesgo de defectos elevado.', module: 'suppliers', action: 'Diversificar hacia Shanghai TimeMaster o renegociar garantía.', status: 'PENDING' },
      { type: 'OPPORTUNITY', severity: 'MEDIUM', title: 'Margen alto en Rolex Submariner', description: 'El Rolex Submariner tiene un margen del 73.3% (precio compra $120 → venta $449). La demanda es fuerte.', module: 'products', action: 'Aumentar inventario y explorar campañas de marketing.', status: 'PENDING' },
      { type: 'INSIGHT', severity: 'MEDIUM', title: 'Cliente VIP Andrés Gómez', description: 'Andrés ha realizado 14 pedidos por $4,580. Su ticket promedio creció 22% en los últimos 3 meses.', module: 'customers', action: 'Ofrecer programa de fidelización y acceso anticipado a lanzamientos.', status: 'PENDING' },
      { type: 'INSIGHT', severity: 'LOW', title: 'Flujo de caja saludable', description: 'Ingresos del mes superan gastos en 38%. Utilidad neta proyectada positiva para el trimestre.', module: 'finance', action: 'Considerar reinversión en inventario de alta rotación.', status: 'PENDING' },
      { type: 'OPPORTUNITY', severity: 'MEDIUM', title: 'Mercado internacional en crecimiento', description: 'Felipe Castro (México) representa el 18% de ingresos del mes. Potencial de expansión a LATAM.', module: 'customers', action: 'Habilitar envíos internacionales y marketing geolocalizado.', status: 'PENDING' },
      { type: 'RISK', severity: 'LOW', title: 'Garantía limitada en calzado', description: 'Guangzhou Premium Footwear ofrece solo 3 meses de garantía. Historial de devoluciones del 4%.', module: 'suppliers', action: 'Negociar extensión de garantía a 6 meses.', status: 'PENDING' },
    ],
  })

  console.log('✅ NEXORA database seeded successfully!')
  console.log(`   - Company: ${company.commercialName}`)
  console.log(`   - Users: 6`)
  console.log(`   - Products: ${allProducts.length}`)
  console.log(`   - Suppliers: 4 (con ratings)`)
  console.log(`   - Customers: ${allCustomers.length}`)
  console.log(`   - Orders: ${orderNum - 1001}`)
  console.log(`   - Purchase Orders: ${poNum - 5001}`)
  console.log(`   - NAIOS Recommendations: 8`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
