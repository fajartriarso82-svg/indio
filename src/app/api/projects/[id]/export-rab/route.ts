import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { name: true, picName: true, phone: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    const topiks = await db.rABTopik.findMany({
      where: { projectId, isDeleted: false },
      orderBy: { urutan: 'asc' },
      include: {
        items: {
          orderBy: { urutan: 'asc' },
          include: {
            realisasi: {
              where: { isAdditional: false },
              include: { vendor: { select: { name: true } } },
            },
          },
        },
      },
    })

    const allRealisasi = await db.rABRealisasi.findMany({
      where: { projectId },
      orderBy: { tanggalInvoice: 'asc' },
      include: {
        rabItem: { select: { namaItem: true, topik: { select: { nama: true } } } },
        vendor: { select: { name: true } },
      },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'PT Indio Solusi Mandiri'
    workbook.lastModifiedBy = 'System Indio'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Style constants
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Navy Blue
    }
    const topicFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // Slate 200
    }
    const overBudgetFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE4E6' }, // Rose 100
    }
    const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    const boldFont = { name: 'Calibri', size: 11, bold: true }
    const regularFont = { name: 'Calibri', size: 11 }
    const rupiahFormat = '"Rp"#,##0;("Rp"#,##0);"-"'

    // ==========================================
    // SHEET 1: RAB Rencana vs Realisasi
    // ==========================================
    const ws1 = workbook.addWorksheet('RAB Rencana vs Realisasi', {
      views: [{ state: 'frozen', ySplit: 5 }],
    })

    // Project Info Banner
    ws1.mergeCells('A1:I1')
    ws1.getCell('A1').value = `RENCANA ANGGARAN BIAYA (RAB) — ${project.name.toUpperCase()}`
    ws1.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } }

    ws1.mergeCells('A2:I2')
    ws1.getCell('A2').value = `Kode Proyek: ${project.projectCode} | Klien: ${project.client?.name || '—'} | Tipe: ${project.type} | Status: ${project.status}`
    ws1.getCell('A2').font = { name: 'Calibri', size: 10, italic: true }

    ws1.mergeCells('A3:I3')
    ws1.getCell('A3').value = `Nilai Kontrak: Rp ${(project.contractValue || 0).toLocaleString('id-ID')}${project.ppnFromClient ? ' (Include PPN)' : ''}`
    ws1.getCell('A3').font = { name: 'Calibri', size: 11, bold: true }

    // Header Row (Row 5)
    const headers1 = [
      'No',
      'Topik / Uraian Item RAB',
      'Satuan',
      'Volume',
      'Harga Satuan (Rp)',
      'Total Rencana (Rp)',
      'Realisasi Biaya (Rp)',
      'Sisa Anggaran (Rp)',
      '% Serap / Status',
    ]

    const headerRow1 = ws1.getRow(5)
    headers1.forEach((h, idx) => {
      const cell = headerRow1.getCell(idx + 1)
      cell.value = h
      cell.fill = headerFill
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: idx === 1 ? 'left' : 'center', wrapText: true }
    })
    headerRow1.height = 28

    ws1.columns = [
      { width: 6 },  // No
      { width: 38 }, // Topik / Item
      { width: 10 }, // Satuan
      { width: 10 }, // Volume
      { width: 18 }, // Harga Satuan
      { width: 20 }, // Total Rencana
      { width: 20 }, // Realisasi
      { width: 20 }, // Sisa
      { width: 16 }, // Status
    ]

    let currentRow1 = 6
    let totalRencanaAll = 0
    let totalRealisasiAll = 0

    topiks.forEach((topik, tIdx) => {
      // Topik row
      const topicRow = ws1.getRow(currentRow1)
      ws1.mergeCells(`A${currentRow1}:B${currentRow1}`)
      topicRow.getCell(1).value = `${tIdx + 1}. ${topik.nama.toUpperCase()}`
      topicRow.font = boldFont
      for (let c = 1; c <= 9; c++) {
        topicRow.getCell(c).fill = topicFill
      }

      const itemStartRow = currentRow1 + 1

      topik.items.forEach((item, iIdx) => {
        currentRow1++
        const rRow = ws1.getRow(currentRow1)
        const jumlahRencana = item.volumeRencana * item.hargaSatuanRencana
        const realisasiItem = item.realisasi.reduce((sum, r) => sum + r.jumlah, 0)
        const sisa = jumlahRencana - realisasiItem
        const pct = jumlahRencana > 0 ? (realisasiItem / jumlahRencana) * 100 : 0
        const isOver = realisasiItem > jumlahRencana

        totalRencanaAll += jumlahRencana
        totalRealisasiAll += realisasiItem

        rRow.getCell(1).value = `${tIdx + 1}.${iIdx + 1}`
        rRow.getCell(1).alignment = { horizontal: 'center' }
        rRow.getCell(2).value = `   ${item.namaItem}`
        rRow.getCell(3).value = item.satuan
        rRow.getCell(3).alignment = { horizontal: 'center' }
        rRow.getCell(4).value = item.volumeRencana
        rRow.getCell(4).numFmt = '#,##0.##'
        rRow.getCell(5).value = item.hargaSatuanRencana
        rRow.getCell(5).numFmt = rupiahFormat
        rRow.getCell(6).value = jumlahRencana
        rRow.getCell(6).numFmt = rupiahFormat
        rRow.getCell(7).value = realisasiItem
        rRow.getCell(7).numFmt = rupiahFormat
        rRow.getCell(8).value = sisa
        rRow.getCell(8).numFmt = rupiahFormat
        rRow.getCell(9).value = isOver ? `OVER (${pct.toFixed(0)}%)` : `${pct.toFixed(0)}%`
        rRow.getCell(9).alignment = { horizontal: 'center' }

        if (isOver) {
          for (let c = 1; c <= 9; c++) {
            rRow.getCell(c).fill = overBudgetFill
          }
          rRow.getCell(9).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFBE123C' } }
        } else {
          rRow.font = regularFont
        }
      })

      // Subtotal per topik
      const itemEndRow = currentRow1
      if (topik.items.length > 0) {
        topicRow.getCell(6).value = { formula: `SUM(F${itemStartRow}:F${itemEndRow})`, result: topik.items.reduce((s, i) => s + i.volumeRencana * i.hargaSatuanRencana, 0) }
        topicRow.getCell(6).numFmt = rupiahFormat
        topicRow.getCell(7).value = { formula: `SUM(G${itemStartRow}:G${itemEndRow})`, result: topik.items.reduce((s, i) => s + i.realisasi.reduce((sr, r) => sr + r.jumlah, 0), 0) }
        topicRow.getCell(7).numFmt = rupiahFormat
        topicRow.getCell(8).value = { formula: `F${currentRow1 - topik.items.length}-G${currentRow1 - topik.items.length}`, result: 0 }
        topicRow.getCell(8).numFmt = rupiahFormat
      }

      currentRow1++
    })

    // Total Keseluruhan Row
    const grandTotalRow = ws1.getRow(currentRow1)
    ws1.mergeCells(`A${currentRow1}:E${currentRow1}`)
    grandTotalRow.getCell(1).value = 'TOTAL KESELURUHAN RAB'
    grandTotalRow.getCell(1).font = boldFont
    grandTotalRow.getCell(1).alignment = { horizontal: 'right' }
    grandTotalRow.getCell(6).value = totalRencanaAll
    grandTotalRow.getCell(6).numFmt = rupiahFormat
    grandTotalRow.getCell(6).font = boldFont
    grandTotalRow.getCell(7).value = totalRealisasiAll
    grandTotalRow.getCell(7).numFmt = rupiahFormat
    grandTotalRow.getCell(7).font = boldFont
    grandTotalRow.getCell(8).value = totalRencanaAll - totalRealisasiAll
    grandTotalRow.getCell(8).numFmt = rupiahFormat
    grandTotalRow.getCell(8).font = boldFont
    for (let c = 1; c <= 9; c++) {
      grandTotalRow.getCell(c).border = {
        top: { style: 'thin' },
        bottom: { style: 'double' },
      }
    }

    // ==========================================
    // SHEET 2: Detail Realisasi & Invoice Vendor
    // ==========================================
    const ws2 = workbook.addWorksheet('Realisasi & Invoice Vendor', {
      views: [{ state: 'frozen', ySplit: 2 }],
    })

    ws2.mergeCells('A1:J1')
    ws2.getCell('A1').value = `DAFTAR TRANSAKSI REALISASI BIAYA & INVOICE VENDOR — ${project.name}`
    ws2.getCell('A1').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } }

    const headers2 = [
      'No',
      'Tanggal',
      'No. Invoice',
      'Vendor',
      'Item RAB Terkait',
      'Tipe / Kategori',
      'Nominal (Rp)',
      'PPN',
      'Status Bayar',
      'Tgl Bayar',
    ]

    const headerRow2 = ws2.getRow(2)
    headers2.forEach((h, idx) => {
      const cell = headerRow2.getCell(idx + 1)
      cell.value = h
      cell.fill = headerFill
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    headerRow2.height = 26

    ws2.columns = [
      { width: 6 },  // No
      { width: 14 }, // Tanggal
      { width: 18 }, // No Invoice
      { width: 26 }, // Vendor
      { width: 30 }, // Item RAB
      { width: 16 }, // Tipe
      { width: 20 }, // Nominal
      { width: 10 }, // PPN
      { width: 16 }, // Status Bayar
      { width: 14 }, // Tgl Bayar
    ]

    let row2Idx = 3
    let sumTotalRealisasi = 0
    let sumTotalLunas = 0
    let sumTotalHutang = 0

    allRealisasi.forEach((rel, idx) => {
      const row = ws2.getRow(row2Idx)
      const tglInv = rel.tanggalInvoice ? new Date(rel.tanggalInvoice).toLocaleDateString('id-ID') : '—'
      const tglByr = rel.tanggalBayar ? new Date(rel.tanggalBayar).toLocaleDateString('id-ID') : '—'
      const vendorName = rel.vendor?.name || rel.vendorNama || '—'
      const itemName = rel.isAdditional
        ? `Biaya Tambahan (${rel.kategoriAdditional || 'Lainnya'})`
        : rel.rabItem?.namaItem || '—'
      const tipe = rel.isAdditional ? 'Tambahan' : 'Item RAB'
      const statusLabel = rel.statusBayar === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'

      sumTotalRealisasi += rel.jumlah
      if (rel.statusBayar === 'sudah_dibayar') sumTotalLunas += rel.jumlah
      else sumTotalHutang += rel.jumlah

      row.getCell(1).value = idx + 1
      row.getCell(1).alignment = { horizontal: 'center' }
      row.getCell(2).value = tglInv
      row.getCell(2).alignment = { horizontal: 'center' }
      row.getCell(3).value = rel.nomorInvoice || '—'
      row.getCell(4).value = vendorName
      row.getCell(5).value = itemName
      row.getCell(6).value = tipe
      row.getCell(6).alignment = { horizontal: 'center' }
      row.getCell(7).value = rel.jumlah
      row.getCell(7).numFmt = rupiahFormat
      row.getCell(8).value = rel.kenaPPN ? `Ya (${rel.persenPPN}%)` : 'Tidak'
      row.getCell(8).alignment = { horizontal: 'center' }
      row.getCell(9).value = statusLabel
      row.getCell(9).alignment = { horizontal: 'center' }
      row.getCell(9).font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: rel.statusBayar === 'sudah_dibayar' ? 'FF16A34A' : 'FFE11D48' },
      }
      row.getCell(10).value = tglByr
      row.getCell(10).alignment = { horizontal: 'center' }

      row2Idx++
    })

    // Total Row Sheet 2
    const totalRow2 = ws2.getRow(row2Idx)
    ws2.mergeCells(`A${row2Idx}:F${row2Idx}`)
    totalRow2.getCell(1).value = 'TOTAL REALISASI'
    totalRow2.getCell(1).font = boldFont
    totalRow2.getCell(1).alignment = { horizontal: 'right' }
    totalRow2.getCell(7).value = sumTotalRealisasi
    totalRow2.getCell(7).numFmt = rupiahFormat
    totalRow2.getCell(7).font = boldFont
    for (let c = 1; c <= 10; c++) {
      totalRow2.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
    }

    // ==========================================
    // SHEET 3: Ringkasan Untung Rugi
    // ==========================================
    const ws3 = workbook.addWorksheet('Ringkasan Finansial')

    ws3.mergeCells('A1:D1')
    ws3.getCell('A1').value = `RINGKASAN LABA / RUGI PROYEK — ${project.name}`
    ws3.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } }

    ws3.columns = [
      { width: 4 },  // spacing
      { width: 34 }, // Indikator
      { width: 24 }, // Nilai (Rp)
      { width: 30 }, // Keterangan
    ]

    const contractVal = project.contractValue || 0
    const marginRencana = contractVal - totalRencanaAll
    const marginAktual = contractVal - sumTotalRealisasi
    const ppnBonus = project.ppnFromClient ? contractVal * 0.11 : 0
    const labaKotorAktual = marginAktual + ppnBonus

    const financialRows: Array<{ label: string; value: number | string; note?: string; isBold?: boolean; isHighlight?: boolean; isNegative?: boolean }> = [
      { label: 'Nilai Kontrak (PO dari Klien)', value: contractVal, note: project.ppnFromClient ? 'Termasuk PPN dari Klien' : 'Harga dasar', isBold: true },
      { label: 'Total RAB Rencana', value: totalRencanaAll, note: 'Anggaran awal disetujui', isBold: false },
      { label: 'Margin Rencana', value: marginRencana, note: `${contractVal > 0 ? ((marginRencana / contractVal) * 100).toFixed(1) : '0'}% dari kontrak`, isBold: true, isHighlight: true },
      { label: '', value: '' }, // divider
      { label: 'Realisasi Biaya Item RAB', value: totalRealisasiAll, note: 'Tagihan vendor item RAB', isBold: false },
      { label: 'Biaya Tambahan (Ongkir/Akomodasi/dll)', value: sumTotalRealisasi - totalRealisasiAll, note: 'Pengeluaran di luar item RAB', isBold: false },
      { label: 'Total Realisasi Keseluruhan', value: sumTotalRealisasi, note: 'Total biaya proyek aktual', isBold: true },
      { label: 'Margin Realisasi Aktual', value: marginAktual, note: `${contractVal > 0 ? ((marginAktual / contractVal) * 100).toFixed(1) : '0'}% dari kontrak`, isBold: true, isHighlight: true, isNegative: marginAktual < 0 },
      { label: 'Bonus Margin PPN Klien', value: ppnBonus, note: project.ppnFromClient ? '11% dari nilai kontrak' : 'Tidak berlaku', isBold: false },
      { label: 'Laba Kotor Proyek Aktual', value: labaKotorAktual, note: 'Margin Aktual + Bonus PPN', isBold: true, isHighlight: true, isNegative: labaKotorAktual < 0 },
      { label: '', value: '' }, // divider
      { label: 'Invoice Vendor LUNAS', value: sumTotalLunas, note: 'Sudah dibayar kas / transfer', isBold: false },
      { label: 'Hutang Vendor (Belum Dibayar)', value: sumTotalHutang, note: 'Kewajiban pembayaran aktif', isBold: true, isNegative: sumTotalHutang > 0 },
    ]

    let r3 = 3
    financialRows.forEach((item) => {
      const row = ws3.getRow(r3)
      if (item.label === '') {
        r3++
        return
      }

      row.getCell(2).value = item.label
      row.getCell(2).font = item.isBold ? boldFont : regularFont

      if (typeof item.value === 'number') {
        row.getCell(3).value = item.value
        row.getCell(3).numFmt = rupiahFormat
        row.getCell(3).font = {
          name: 'Calibri',
          size: 11,
          bold: item.isBold,
          color: { argb: item.isNegative ? 'FFE11D48' : item.isHighlight ? 'FF1E40AF' : 'FF000000' },
        }
      } else {
        row.getCell(3).value = item.value
      }

      row.getCell(4).value = item.note || ''
      row.getCell(4).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } }

      if (item.isHighlight) {
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
        row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
      }

      r3++
    })

    // Output buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `RAB_${safeName}_${dateStr}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting RAB:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export RAB' },
      { status: 500 }
    )
  }
}
