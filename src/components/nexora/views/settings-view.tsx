'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/nexora/stat-card'
import { Settings, CheckCircle2, Building2, Server, Cpu, Database, ShieldCheck, FileCode2, GitBranch, BookOpen, Info } from 'lucide-react'

interface InfoRow {
  label: string
  value: string
}

const COMPANY_INFO: InfoRow[] = [
  { label: 'Razón social', value: 'NEXORA Commerce S.A.S.' },
  { label: 'NIT', value: '901.234.567-8' },
  { label: 'Correo', value: 'info@nexora.co' },
  { label: 'Teléfono', value: '+57 601 234 5678' },
  { label: 'País', value: 'Colombia' },
  { label: 'Moneda', value: 'USD' },
  { label: 'Zona horaria', value: 'America/Bogota' },
  { label: 'Sitio web', value: 'https://nexora.co' },
]

interface SystemParam {
  label: string
  value: string
  icon: typeof Database
}

const SYSTEM_PARAMS: SystemParam[] = [
  { label: 'Motor de base de datos', value: 'PostgreSQL 15', icon: Database },
  { label: 'ORM', value: 'Prisma 6', icon: FileCode2 },
  { label: 'Autenticación', value: 'JWT (NextAuth.js)', icon: ShieldCheck },
  { label: 'Asistente de IA', value: 'NAIOS — modo asesor', icon: Cpu },
  { label: 'Soft Delete', value: 'Habilitado', icon: CheckCircle2 },
  { label: 'Auditoría', value: 'Activa (audit_logs)', icon: Server },
]

const PHILOSOPHY = [
  {
    title: 'Arquitectura limpia',
    description: 'Separación estricta de capas: dominio, aplicación, infraestructura y presentación.',
  },
  {
    title: 'Código modular',
    description: 'Componentes reutilizables y desacoplados que facilitan el mantenimiento y la escalabilidad.',
  },
  {
    title: 'Documentación obligatoria',
    description: 'Cada módulo y decisión de diseño queda registrado en un RFC o documento técnico (DOC-xxx).',
  },
  {
    title: 'Control de versiones Git',
    description: 'Flujo de trabajo con ramas, revisiones por pares y trazabilidad completa de cambios.',
  },
  {
    title: 'Documentation-Driven Development',
    description: 'Se diseña y documenta primero, se implementa después — el documento guía al código.',
  },
]

export function SettingsView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Ajustes de la empresa y del sistema" icon={Settings} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Company info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Información de la empresa
            </CardTitle>
            <CardDescription>Datos registrados de NEXORA Commerce S.A.S.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              {COMPANY_INFO.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-medium sm:text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* System parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-primary" />
              Parámetros del sistema
            </CardTitle>
            <CardDescription>Stack tecnológico y configuración operativa</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {SYSTEM_PARAMS.map((p) => (
                <li key={p.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <p.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{p.value}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Development philosophy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Filosofía de desarrollo
          </CardTitle>
          <CardDescription>Principios rectores según DOC-001 §9</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHILOSOPHY.map((p, i) => (
              <li
                key={p.title}
                className="relative rounded-xl border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Demo notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Info className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Vista demostrativa</p>
            <p className="mt-1 text-muted-foreground">
              Esta vista es demostrativa. La configuración funcional se habilitará en futuros RFCs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
