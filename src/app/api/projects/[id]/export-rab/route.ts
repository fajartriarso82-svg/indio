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
        realisasi: {
          where: { isAdditional: false },
          include: { vendor: { select: { name: true } } },
        },
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
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    }
    const topicFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }, // Slate 100
    }
    const totalFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' }, // Slate 50
    }

    const headerFont = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } }
    const boldFont = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
    const regularFont = { name: 'Calibri', size: 10.5, color: { argb: 'FF0F172A' } }
    const numberFormat = '#,##0;[Red]-#,##0;"-"'

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }

    const topicBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }

    const totalBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }

    // ==========================================
    // SHEET 1: Rekapitulasi RAB
    // ==========================================
    const ws1 = workbook.addWorksheet('Rekapitulasi RAB', {
      views: [{ state: 'frozen', ySplit: 5 }],
    })

    // Project Info Banner (Rows 1-3)
    ws1.mergeCells('A1:K1')
    ws1.getCell('A1').value = 'REKAPITULASI RENCANA ANGGARAN BIAYA (RAB)'
    ws1.getCell('A1').font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } }
    ws1.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }

    ws1.mergeCells('A2:K2')
    ws1.getCell('A2').value = `PROYEK: ${project.name} (${project.projectCode})`
    ws1.getCell('A2').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } }
    ws1.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left' }

    ws1.mergeCells('A3:K3')
    ws1.getCell('A3').value = `Klien: ${project.client?.name || '—'} | Nilai Kontrak: Rp ${(project.contractValue || 0).toLocaleString('id-ID')}${project.ppnFromClient ? ' (Include PPN)' : ''}`
    ws1.getCell('A3').font = { name: 'Calibri', size: 10.5, color: { argb: 'FF64748B' } }
    ws1.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' }

    // Row 4: Empty spacing
    ws1.getRow(4).height = 10

    // Header Row (Row 5)
    const headers1 = [
      'No',
      'Deskripsi / Nama Item',
      'Volume',
      'Satuan',
      'Harga Satuan',
      'Total',
      'Jumlah',
      'Realisasi',
      'Kurang',
      'Vendor Terkait',
      'Status',
    ]

    const headerRow1 = ws1.getRow(5)
    headers1.forEach((h, idx) => {
      const cell = headerRow1.getCell(idx + 1)
      cell.value = h
      cell.fill = headerFill
      cell.font = headerFont
      cell.alignment = {
        vertical: 'middle',
        horizontal: idx === 1 ? 'left' : 'center',
        wrapText: true,
      }
      cell.border = thinBorder
    })
    headerRow1.height = 26

    ws1.columns = [
      { width: 6 },  // A: No
      { width: 44 }, // B: Deskripsi / Nama Item
      { width: 10 }, // C: Volume
      { width: 10 }, // D: Satuan
      { width: 16 }, // E: Harga Satuan
      { width: 18 }, // F: Total
      { width: 18 }, // G: Jumlah
      { width: 18 }, // H: Realisasi
      { width: 18 }, // I: Kurang
      { width: 24 }, // J: Vendor Terkait
      { width: 16 }, // K: Status
    ]

    let currentRow1 = 6
    let itemCounter = 1
    const topicRows: number[] = []

    let totalRencanaAll = 0
    let totalRealisasiAll = 0

    topiks.forEach((topik) => {
      const topicRowIdx = currentRow1
      topicRows.push(topicRowIdx)
      const tRow = ws1.getRow(topicRowIdx)
      tRow.height = 22

      // Topik Title in Column B
      tRow.getCell(2).value = `[TOPIK] ${topik.nama}`
      tRow.getCell(2).font = boldFont

      // Topik realisasi calculation
      const realisasiItems = topik.items.flatMap((i) => i.realisasi || [])
      const realisasiTopikLangsung = topik.realisasi || []
      const semuaRealisasiTopik = [...realisasiItems, ...realisasiTopikLangsung]

      const totalRealisasiTopik = semuaRealisasiTopik.reduce((s, r) => s + (Number(r.jumlah) || 0), 0)
      const totalLunasTopik = semuaRealisasiTopik
        .filter((r) => r.statusBayar === 'sudah_dibayar')
        .reduce((s, r) => s + (Number(r.jumlah) || 0), 0)
      const unpaidCountTopik = semuaRealisasiTopik.filter((r) => r.statusBayar !== 'sudah_dibayar').length

      const totalRencanaTopik = topik.items.reduce(
        (s, i) => s + (Number(i.volumeRencana) || 0) * (Number(i.hargaSatuanRencana) || 0),
        0
      )

      totalRencanaAll += totalRencanaTopik
      totalRealisasiAll += totalRealisasiTopik

      let statusLabel = ''
      if (unpaidCountTopik > 0) {
        statusLabel = 'Menunggu Bayar'
      } else if (totalLunasTopik > 0) {
        if (
          (totalRencanaTopik > 0 && totalLunasTopik >= totalRencanaTopik) ||
          (topik.items.length > 0 &&
            topik.items.every(
              (i) => i.realisasi && i.realisasi.length > 0 && i.realisasi.every((r) => r.statusBayar === 'sudah_dibayar')
            ))
        ) {
          statusLabel = 'Lunas'
        } else {
          statusLabel = 'Sebagian (DP)'
        }
      }

      // Vendor for Topic Row
      let topicVendor = ''
      if (realisasiTopikLangsung.length > 0) {
        topicVendor = realisasiTopikLangsung[0].vendor?.name || realisasiTopikLangsung[0].vendorNama || ''
      } else if (topik.items.some((i) => i.realisasi && i.realisasi.length > 0)) {
        const vNames = Array.from(
          new Set(
            topik.items
              .flatMap((i) => i.realisasi || [])
              .map((r) => r.vendor?.name || r.vendorNama)
              .filter(Boolean)
          )
        )
        if (vNames.length > 0) topicVendor = vNames.join(', ')
      }

      const itemStartRow = currentRow1 + 1

      // Render Item Rows
      topik.items.forEach((item) => {
        currentRow1++
        const iRow = ws1.getRow(currentRow1)
        iRow.height = 20

        const vol = Number(item.volumeRencana) || 0
        const harga = Number(item.hargaSatuanRencana) || 0
        const totalItem = vol * harga

        let itemVendor = '—'
        if (item.realisasi && item.realisasi.length > 0) {
          const v = item.realisasi[0].vendor?.name || item.realisasi[0].vendorNama
          if (v) itemVendor = v
        }

        iRow.getCell(1).value = itemCounter++
        iRow.getCell(1).alignment = { horizontal: 'center' }

        iRow.getCell(2).value = item.namaItem
        iRow.getCell(2).alignment = { horizontal: 'left' }

        iRow.getCell(3).value = vol
        iRow.getCell(3).alignment = { horizontal: 'center' }
        iRow.getCell(3).numFmt = '#,##0.##'

        iRow.getCell(4).value = item.satuan
        iRow.getCell(4).alignment = { horizontal: 'center' }

        iRow.getCell(5).value = harga
        iRow.getCell(5).alignment = { horizontal: 'right' }
        iRow.getCell(5).numFmt = numberFormat

        // Formula Total: =C{row}*E{row}
        iRow.getCell(6).value = {
          formula: `C${currentRow1}*E${currentRow1}`,
          result: totalItem,
        }
        iRow.getCell(6).alignment = { horizontal: 'right' }
        iRow.getCell(6).numFmt = numberFormat

        iRow.getCell(10).value = itemVendor
        iRow.getCell(10).alignment = { horizontal: 'center' }

        for (let c = 1; c <= 11; c++) {
          iRow.getCell(c).border = thinBorder
          iRow.getCell(c).font = regularFont
        }
      })

      const itemEndRow = currentRow1

      // Topic Row Formulas & Values
      if (topik.items.length > 0) {
        tRow.getCell(7).value = {
          formula: `SUM(F${itemStartRow}:F${itemEndRow})`,
          result: totalRencanaTopik,
        }
      } else {
        tRow.getCell(7).value = 0
      }
      tRow.getCell(7).alignment = { horizontal: 'right' }
      tRow.getCell(7).numFmt = numberFormat
      tRow.getCell(7).font = boldFont

      if (totalRealisasiTopik > 0) {
        tRow.getCell(8).value = totalRealisasiTopik
        tRow.getCell(8).alignment = { horizontal: 'right' }
        tRow.getCell(8).numFmt = numberFormat
        tRow.getCell(8).font = boldFont

        // Kurang: H - G (negatif jika realisasi < rencana)
        if (statusLabel !== 'Lunas') {
          tRow.getCell(9).value = {
            formula: `H${topicRowIdx}-G${topicRowIdx}`,
            result: totalRealisasiTopik - totalRencanaTopik,
          }
          tRow.getCell(9).alignment = { horizontal: 'right' }
          tRow.getCell(9).numFmt = numberFormat
          tRow.getCell(9).font = boldFont
        }
      }

      if (topicVendor) {
        tRow.getCell(10).value = topicVendor
        tRow.getCell(10).alignment = { horizontal: 'center' }
        tRow.getCell(10).font = boldFont
      }

      if (statusLabel) {
        tRow.getCell(11).value = statusLabel
        tRow.getCell(11).alignment = { horizontal: 'center' }
        tRow.getCell(11).font = {
          name: 'Calibri',
          size: 10.5,
          bold: true,
          color: {
            argb: statusLabel === 'Lunas' ? 'FF16A34A' : statusLabel === 'Sebagian (DP)' ? 'FFD97706' : 'FFE11D48',
          },
        }
      }

      for (let c = 1; c <= 11; c++) {
        tRow.getCell(c).fill = topicFill
        tRow.getCell(c).border = topicBorder
      }

      currentRow1++
    })

    // Blank row before Grand Total
    currentRow1++

    // Grand Total Row
    const grandTotalRow = ws1.getRow(currentRow1)
    grandTotalRow.height = 24

    grandTotalRow.getCell(6).value = 'Jumlah'
    grandTotalRow.getCell(6).alignment = { horizontal: 'right' }
    grandTotalRow.getCell(6).font = boldFont

    // Formula for Col G: SUM of topic G cells
    if (topicRows.length > 0) {
      const gCells = topicRows.map((r) => `G${r}`).join(',')
      grandTotalRow.getCell(7).value = {
        formula: `SUM(${gCells})`,
        result: totalRencanaAll,
      }
    } else {
      grandTotalRow.getCell(7).value = 0
    }
    grandTotalRow.getCell(7).alignment = { horizontal: 'right' }
    grandTotalRow.getCell(7).numFmt = numberFormat
    grandTotalRow.getCell(7).font = boldFont

    // Formula for Col H: SUM of topic H cells
    if (topicRows.length > 0) {
      const hCells = topicRows.map((r) => `H${r}`).join(',')
      grandTotalRow.getCell(8).value = {
        formula: `SUM(${hCells})`,
        result: totalRealisasiAll,
      }
    } else {
      grandTotalRow.getCell(8).value = 0
    }
    grandTotalRow.getCell(8).alignment = { horizontal: 'right' }
    grandTotalRow.getCell(8).numFmt = numberFormat
    grandTotalRow.getCell(8).font = boldFont

    for (let c = 1; c <= 11; c++) {
      grandTotalRow.getCell(c).fill = totalFill
      grandTotalRow.getCell(c).border = totalBorder
    }

    // ==========================================
    // SHEET 2: Detail Realisasi & Invoice Vendor
    // ==========================================
    const ws2 = workbook.addWorksheet('Realisasi & Invoice Vendor', {
      views: [{ state: 'frozen', ySplit: 2 }],
    })

    ws2.mergeCells('A1:J1')
    ws2.getCell('A1').value = `DAFTAR TRANSAKSI REALISASI BIAYA & INVOICE VENDOR — ${project.name}`
    ws2.getCell('A1').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } }

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
      cell.border = thinBorder
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
      row.getCell(7).numFmt = numberFormat
      row.getCell(8).value = rel.kenaPPN ? `Ya (${rel.persenPPN}%)` : 'Tidak'
      row.getCell(8).alignment = { horizontal: 'center' }
      row.getCell(9).value = statusLabel
      row.getCell(9).alignment = { horizontal: 'center' }
      row.getCell(9).font = {
        name: 'Calibri',
        size: 10.5,
        bold: true,
        color: { argb: rel.statusBayar === 'sudah_dibayar' ? 'FF16A34A' : 'FFE11D48' },
      }
      row.getCell(10).value = tglByr
      row.getCell(10).alignment = { horizontal: 'center' }

      for (let c = 1; c <= 10; c++) {
        row.getCell(c).border = thinBorder
        if (c !== 9) row.getCell(c).font = regularFont
      }

      row2Idx++
    })

    // Total Row Sheet 2
    const totalRow2 = ws2.getRow(row2Idx)
    ws2.mergeCells(`A${row2Idx}:F${row2Idx}`)
    totalRow2.getCell(1).value = 'TOTAL REALISASI'
    totalRow2.getCell(1).font = boldFont
    totalRow2.getCell(1).alignment = { horizontal: 'right' }
    totalRow2.getCell(7).value = sumTotalRealisasi
    totalRow2.getCell(7).numFmt = numberFormat
    totalRow2.getCell(7).font = boldFont
    for (let c = 1; c <= 10; c++) {
      totalRow2.getCell(c).border = totalBorder
      totalRow2.getCell(c).fill = totalFill
    }

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
