import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { validateFile } from '@/lib/platform-utils'

export async function POST(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const validation = validateFile(file)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filepath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
