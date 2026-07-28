import { NextResponse } from 'next/server'
import { RoleService } from '@/server/services/role.service'

// List all available permissions grouped by module
export async function GET() {
  try {
    const grouped = await RoleService.listPermissions()
    return NextResponse.json(grouped)
  } catch (error) {
    console.error('GET /api/roles/permissions error:', error)
    return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 })
  }
}
