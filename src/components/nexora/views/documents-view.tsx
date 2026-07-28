'use client'

import { useMemo, useState } from 'react'
import {
  useDocuments,
  useDeleteDocument,
  useArchiveDocument,
} from '@/hooks/use-documents'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { DocumentFormDialog } from '@/components/nexora/documents/document-form-dialog'
import { formatNumber, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { DocumentView } from '@/server/services/document.service'
import type { DocumentCategory } from '@/lib/schemas/document.schema'
import {
  FileText,
  FileSpreadsheet,
  FileCheck,
  FileSignature,
  ShieldCheck,
  BookOpen,
  Scale,
  Megaphone,
  File,
  Folder,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Download,
  ExternalLink,
  Boxes,
  Archive as ArchiveIcon,
  Tags,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type StatusFilter = 'all' | 'ACTIVE' | 'ARCHIVED'

interface CategoryConfig {
  icon: LucideIcon
  label: string
  bg: string
  text: string
  ring: string
}

const CATEGORY_CONFIG: Record<DocumentCategory, CategoryConfig> = {
  invoice: { icon: FileSpreadsheet, label: 'Factura', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900' },
  contract: { icon: FileSignature, label: 'Contrato', bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-900' },
  catalog: { icon: BookOpen, label: 'Catálogo', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-200 dark:ring-sky-900' },
  proforma: { icon: FileText, label: 'Proforma', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-900' },
  guarantee: { icon: ShieldCheck, label: 'Garantía', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-200 dark:ring-teal-900' },
  manual: { icon: BookOpen, label: 'Manual', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', text: 'text-fuchsia-600 dark:text-fuchsia-400', ring: 'ring-fuchsia-200 dark:ring-fuchsia-900' },
  legal: { icon: Scale, label: 'Legal', bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-200 dark:ring-rose-900' },
  marketing: { icon: Megaphone, label: 'Marketing', bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-900' },
  general: { icon: File, label: 'General', bg: 'bg-zinc-100 dark:bg-zinc-800/50', text: 'text-zinc-600 dark:text-zinc-400', ring: 'ring-zinc-200 dark:ring-zinc-700' },
  other: { icon: File, label: 'Otro', bg: 'bg-zinc-100 dark:bg-zinc-800/50', text: 'text-zinc-600 dark:text-zinc-400', ring: 'ring-zinc-200 dark:ring-zinc-700' },
}

const CATEGORY_CHIPS: { value: DocumentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'invoice', label: 'Facturas' },
  { value: 'contract', label: 'Contratos' },
  { value: 'catalog', label: 'Catálogos' },
  { value: 'proforma', label: 'Proformas' },
  { value: 'guarantee', label: 'Garantías' },
  { value: 'manual', label: 'Manuales' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Otros' },
]

function catConfig(c: string): CategoryConfig {
  return CATEGORY_CONFIG[c as DocumentCategory] ?? CATEGORY_CONFIG.general
}

export function DocumentsView() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentView | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentView | null>(null)

  const { toast } = useToast()
  const deleteMut = useDeleteDocument()
  const archiveMut = useArchiveDocument()

  const queryParams = useMemo(
    () => ({
      q: query || undefined,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [query, categoryFilter, statusFilter],
  )

  const { data, isLoading } = useDocuments(queryParams)
  const items = data?.items ?? []
  const stats = data?.stats ?? {
    total: 0,
    active: 0,
    archived: 0,
    categories: 0,
    byCategory: [],
    recent: 0,
  }

  const handleEdit = (d: DocumentView) => {
    setEditing(d)
    setFormOpen(true)
  }
  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleArchive = async (d: DocumentView) => {
    const action = d.status === 'ARCHIVED' ? 'restore' : 'archive'
    try {
      await archiveMut.mutateAsync({ id: d.id, action })
      toast({
        title: action === 'archive' ? 'Documento archivado' : 'Documento restaurado',
        description: d.name,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo completar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Documento eliminado', description: deleteTarget.name })
      setDeleteTarget(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo eliminar',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gestión documental · Facturas, contratos, catálogos y más"
        icon={FileText}
        action={
          <Button className="gap-1.5" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nuevo documento
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total documentos"
          value={formatNumber(stats.total)}
          icon={FileText}
          accent="emerald"
          subtitle={`${stats.active} activos`}
        />
        <StatCard
          title="Activos"
          value={formatNumber(stats.active)}
          icon={Folder}
          accent="sky"
          subtitle="Disponibles"
        />
        <StatCard
          title="Archivados"
          value={formatNumber(stats.archived)}
          icon={ArchiveIcon}
          accent="amber"
          subtitle="Fuera de circulación"
        />
        <StatCard
          title="Categorías"
          value={formatNumber(stats.categories)}
          icon={Boxes}
          accent="violet"
          subtitle={`${stats.recent} esta semana`}
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, etiqueta o URL..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {(['all', 'ACTIVE', 'ARCHIVED'] as StatusFilter[]).map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Todos' : s === 'ACTIVE' ? 'Activos' : 'Archivados'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORY_CHIPS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategoryFilter(c.value)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    categoryFilter === c.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron documentos</p>
            <p className="text-xs text-muted-foreground">
              {query || categoryFilter !== 'all'
                ? 'Prueba con otra búsqueda o filtro'
                : 'Crea tu primer documento para empezar'}
            </p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}>
              <Plus className="h-4 w-4" /> Nuevo documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((d) => (
            <DocumentCard
              key={d.id}
              doc={d}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <DocumentFormDialog open={formOpen} onOpenChange={setFormOpen} document={editing} />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong> (v{deleteTarget?.version}).
              El documento se marcará como archivado y oculto (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DocumentCard({
  doc,
  onEdit,
  onArchive,
  onDelete,
}: {
  doc: DocumentView
  onEdit: (d: DocumentView) => void
  onArchive: (d: DocumentView) => void
  onDelete: (d: DocumentView) => void
}) {
  const cfg = catConfig(doc.category)
  const Icon = cfg.icon
  const isArchived = doc.status === 'ARCHIVED'

  return (
    <Card
      className={cn(
        'group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg',
        isArchived && 'opacity-70',
      )}
    >
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
              cfg.bg,
              cfg.text,
              cfg.ring,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(doc)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(doc)}>
                {isArchived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-3.5 w-3.5" /> Restaurar
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-3.5 w-3.5" /> Archivar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir enlace
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={() => onDelete(doc)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body */}
        <button onClick={() => onEdit(doc)} className="mt-3 text-left">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{doc.name}</p>
        </button>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-medium">
            {cfg.label}
          </Badge>
          {isArchived && (
            <Badge variant="outline" className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
              Archivado
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-medium tabular-nums">
            v{doc.version}
          </Badge>
        </div>

        {/* Tags */}
        {doc.tagsList.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {doc.tagsList.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                <Tags className="h-2.5 w-2.5" />
                {t}
              </span>
            ))}
            {doc.tagsList.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{doc.tagsList.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Entity link */}
        {doc.entityType && doc.entityId && (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="capitalize">{doc.entityType}</span>
            <span>·</span>
            <code className="font-mono text-[10px]">{doc.entityId.slice(-6)}</code>
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[11px] text-muted-foreground">
            {formatDate(doc.updatedAt)}
          </span>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Descargar o abrir"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
