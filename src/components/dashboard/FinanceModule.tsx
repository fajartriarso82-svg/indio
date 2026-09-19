'use client'

import { useState } from 'react'
import { Plus, Wallet, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FinanceModule() {
  const [activeTab, setActiveTab] = useState('penjualan')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Keuangan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Laporan penjualan, profit, dan kelola kas kecil perusahaan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Pemasukan</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(0)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Estimasi Profit</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Coins className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Kas Kecil</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-100">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-100 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Pengeluaran Kas</p>
            </div>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="penjualan">Rekap Penjualan</TabsTrigger>
          <TabsTrigger value="kaskecil">Kas Kecil</TabsTrigger>
        </TabsList>

        <TabsContent value="penjualan" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:px-6 pb-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg">Daftar Transaksi Selesai</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                <Wallet className="w-8 h-8 mb-2 text-muted-foreground/50" />
                <p className="font-medium text-foreground">Belum ada data penjualan tercatat</p>
                <p className="text-sm">Data akan muncul setelah ada transaksi berstatus selesai.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kaskecil" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:px-6 pb-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg">Riwayat Kas Kecil</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <Plus className="w-4 h-4" /> Tambah Saldo
                  </Button>
                  <Button size="sm" className="flex-1 sm:flex-none gap-2 bg-rose-600 hover:bg-rose-700 text-white">
                    <Plus className="w-4 h-4" /> Pengeluaran
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                <Coins className="w-8 h-8 mb-2 text-muted-foreground/50" />
                <p className="font-medium text-foreground">Belum ada aktivitas kas kecil</p>
                <p className="text-sm">Catat saldo awal atau pengeluaran untuk memulai.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
