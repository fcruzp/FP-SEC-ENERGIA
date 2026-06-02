'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DataPoint } from '@/lib/supabase-types'

interface DataTableViewProps {
  dataPoints: DataPoint[]
  unit?: string
}

const PAGE_SIZE = 10

export default function DataTableView({ dataPoints, unit = '' }: DataTableViewProps) {
  const [page, setPage] = useState(0)

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[#6b7280] dark:text-[#8b949e]">
        No hay datos disponibles para mostrar.
      </div>
    )
  }

  // Sort by date descending for the table
  const sorted = [...dataPoints].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const startIdx = page * PAGE_SIZE
  const pageData = sorted.slice(startIdx, startIdx + PAGE_SIZE)

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div>
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#30363d] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f4f6f4] dark:bg-[#21262d] hover:bg-[#f4f6f4] dark:hover:bg-[#21262d]">
              <TableHead className="text-[#1c1c1e] dark:text-[#e6edf3] font-semibold">Fecha</TableHead>
              <TableHead className="text-[#1c1c1e] dark:text-[#e6edf3] font-semibold text-right">
                Valor {unit && `(${unit})`}
              </TableHead>
              <TableHead className="text-[#1c1c1e] dark:text-[#e6edf3] font-semibold">Período</TableHead>
              <TableHead className="text-[#1c1c1e] dark:text-[#e6edf3] font-semibold">Estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((dp) => (
              <TableRow key={dp.id} className="hover:bg-[#f4f6f4]/50 dark:hover:bg-[#21262d]">
                <TableCell className="text-sm text-[#1c1c1e] dark:text-[#e6edf3]">
                  {formatDate(dp.date)}
                </TableCell>
                <TableCell className="text-sm text-right font-mono font-medium text-[#1c1c1e] dark:text-[#e6edf3]">
                  {dp.value.toLocaleString('es-DO', { maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm text-[#6b7280] dark:text-[#8b949e] capitalize">
                  {dp.period_type}
                </TableCell>
                <TableCell className="text-sm">
                  {dp.is_estimated ? (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                      Sí
                    </span>
                  ) : (
                    <span className="text-xs text-[#6b7280] dark:text-[#8b949e]">No</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[#6b7280] dark:text-[#8b949e]">
            Mostrando {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, sorted.length)} de{' '}
            {sorted.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="h-8 w-8 p-0 border-[#e5e7eb] dark:border-[#30363d]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-[#6b7280] dark:text-[#8b949e]">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="h-8 w-8 p-0 border-[#e5e7eb] dark:border-[#30363d]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
