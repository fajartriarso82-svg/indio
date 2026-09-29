'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronRight, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface RABSummaryProps {
  projectId: string
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export default function RABSummaryCard({ projectId }: RABSummaryProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState(false)

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-summary`)
      const d = await res.json()
      if (d.success) setData(d.data)
    } catch {
      // silent fail — it's a summary widget
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { summary, topiksSummary, additionalCosts } = data
  const overBudgetTopiks = topiksSummary?.filter((t: any) => t.isOverBudget) ?? []

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {summary.marginAktual >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-600" />
          )}
          Ringkasan Laba / Rugi RAB
          {overBudgetTopiks.length > 0 && (
            <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 bg-amber-50 border-amber-300">
              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
              {overBudgetTopiks.length} topik over budget
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-[10px] text-blue-500 font-medium">Nilai Kontrak</p>
            <p className="text-sm font-bold text-blue-800 mt-0.5">{formatCurrency(summary.contractValue)}</p>
            {summary.ppnFromClient && (
              <p className="text-[10px] text-blue-400 mt-0.5">Termasuk PPN → profit bruto</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium">Total RAB Rencana</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(summary.totalRABRencana)}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-[10px] text-amber-600 font-medium">Total Realisasi</p>
            <p className="text-sm font-bold text-amber-800 mt-0.5">{formatCurrency(summary.totalRABRealisasi)}</p>
            <p className="text-[10px] text-amber-400 mt-0.5">
              {summary.persenTerserap.toFixed(1)}% terserap
            </p>
          </div>
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
            <p className="text-[10px] text-rose-500 font-medium">Biaya Tambahan</p>
            <p className="text-sm font-bold text-rose-800 mt-0.5">{formatCurrency(summary.totalAdditional)}</p>
          </div>
        </div>

        <Separator />

        {/* Hutang vendor */}
        {summary.hutangVendor > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-1.5 text-orange-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Hutang ke Vendor (Belum Dibayar)</span>
            </div>
            <span className="text-sm font-bold text-orange-800">{formatCurrency(summary.hutangVendor)}</span>
          </div>
        )}

        {/* Margin rencana */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Margin Rencana</span>
          <span className={`font-medium tabular-nums ${summary.marginRencana >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(summary.marginRencana)}
          </span>
        </div>

        {/* Margin aktual */}
        <div className="flex justify-between items-center text-sm border-t border-border pt-2">
          <span className="font-semibold">Margin Aktual</span>
          <div className="text-right">
            <div className={`text-base font-bold tabular-nums ${summary.marginAktual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(summary.marginAktual)}
            </div>
            {summary.contractValue > 0 && (
              <div className="text-[10px] text-muted-foreground">
                {((summary.marginAktual / summary.contractValue) * 100).toFixed(1)}% dari kontrak
              </div>
            )}
          </div>
        </div>

        {/* Per-topik breakdown toggle */}
        {topiksSummary?.length > 0 && (
          <>
            <button
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowDetail(!showDetail)}
            >
              {showDetail ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Lihat per topik ({topiksSummary.length})
            </button>

            {showDetail && (
              <div className="space-y-1.5 pl-3 border-l-2 border-border">
                {topiksSummary.map((topik: any) => (
                  <div key={topik.id} className={`flex justify-between items-center text-xs py-1 ${topik.isOverBudget ? 'text-rose-600' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      {topik.isOverBudget && <AlertTriangle className="w-2.5 h-2.5" />}
                      <span className="font-medium">{topik.nama}</span>
                    </div>
                    <div className="text-right">
                      <div className={topik.isOverBudget ? 'text-rose-600 font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(topik.totalRealisasiTopik)} / {formatCurrency(topik.totalRencanaTopik)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="pt-2 border-t flex justify-end">
          <button
            onClick={() => window.open(`/api/projects/${projectId}/export-rab`, '_blank')}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Laporan Excel (.xlsx)
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
