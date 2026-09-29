import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'
import { getSupabaseServer, getSupabaseBucket } from '@/lib/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_').trim().substring(0, 80)
}

function extractStoragePath(rawUrl: string, bucketName: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('uploads/')) return trimmed

  try {
    const parsed = new URL(trimmed)
    const pathname = decodeURIComponent(parsed.pathname)

    const marker = `/${bucketName}/`
    const idx = pathname.indexOf(marker)
    if (idx !== -1) {
      return pathname.substring(idx + marker.length)
    }

    const uploadsIdx = pathname.indexOf('/uploads/')
    if (uploadsIdx !== -1) {
      return pathname.substring(uploadsIdx + 1)
    }
  } catch {
    const uploadsIdx = trimmed.indexOf('uploads/')
    if (uploadsIdx !== -1) {
      return trimmed.substring(uploadsIdx)
    }
  }

  return null
}

async function fetchFileBuffer(rawUrl: string, bucket: string): Promise<{ buffer: Buffer; ext: string } | null> {
  if (!rawUrl) return null

  // 1. Coba download langsung dari Supabase Storage
  try {
    const path = extractStoragePath(rawUrl, bucket)
    if (path) {
      const supabase = getSupabaseServer()
      const { data, error } = await supabase.storage.from(bucket).download(path)
      if (!error && data) {
        const ab = await data.arrayBuffer()
        const ext = path.split('.').pop() || 'bin'
        return { buffer: Buffer.from(ab), ext }
      }
    }
  } catch {
    // continue ke fetch fallback
  }

  // 2. Fallback: HTTP fetch
  try {
    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IndioArchiveBot/1.0)' },
    })
    if (res.ok) {
      const ab = await res.arrayBuffer()
      let ext = 'bin'
      try {
        const parsed = new URL(rawUrl)
        const pathExt = parsed.pathname.split('.').pop()
        if (pathExt && pathExt.length <= 5) ext = pathExt
      } catch {
        // ignore
      }
      return { buffer: Buffer.from(ab), ext }
    }
  } catch (err) {
    console.warn(`Gagal mengunduh file dari ${rawUrl}:`, err)
  }

  return null
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        items: {
          include: {
            purchases: {
              include: { vendor: { select: { name: true } } },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        rabPurchases: {
          include: {
            vendor: { select: { name: true } },
            projectItem: { select: { itemName: true } },
          },
        },
        additionalCosts: {
          include: { vendor: { select: { name: true } } },
        },
        documents: true,
        suratJalans: {
          include: { items: true },
        },
        basts: {
          include: { items: true },
        },
        invoices: {
          include: { items: true, termins: true },
        },
        kuitansis: {
          include: { items: true },
        },
        rabTopiks: {
          where: { isDeleted: false },
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
        },
        rabRealisasi: {
          include: {
            vendor: { select: { name: true } },
            rabItem: { select: { namaItem: true } },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    let clientPayments: any[] = []
    try {
      clientPayments = await db.$queryRaw<any[]>`
        SELECT * FROM "ProjectPayment" WHERE "projectId" = ${projectId} ORDER BY "date" ASC, "createdAt" ASC
      `
    } catch (e) {
      console.warn('Error fetching client payments for export:', e)
    }

    const bucket = getSupabaseBucket()
    const zip = new JSZip()
    const logEntries: string[] = []

    // ─────────────────────────────────────────────
    // 1. BUAT RINGKASAN PROYEK (.TXT)
    // ─────────────────────────────────────────────
    const formatIDR = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
    const formatD = (d: Date | null) => (d ? new Date(d).toLocaleDateString('id-ID') : '—')

    let summaryText = `=====================================================\n`
    summaryText += `ARSIP DOKUMEN & FILE PROYEK\n`
    summaryText += `PT INTI NUSA DINAMIKA OPTIMA\n`
    summaryText += `=====================================================\n\n`
    summaryText += `Kode Proyek     : ${project.projectCode}\n`
    summaryText += `Nama Proyek     : ${project.name}\n`
    summaryText += `Tipe Proyek     : ${project.type}\n`
    summaryText += `Status          : ${project.status}\n`
    summaryText += `Nomor PO Klien  : ${project.poNumber || '—'}\n`
    summaryText += `Klien           : ${project.client?.name || '—'}\n`
    summaryText += `PIC Klien       : ${project.clientPicName || '—'} (${project.clientPicPhone || '—'})\n`
    summaryText += `Alamat Klien    : ${project.clientAddress || project.client?.address || '—'}\n`
    summaryText += `PIC Internal    : ${project.internalPic || '—'}\n`
    summaryText += `Nilai Kontrak   : ${project.contractValue ? formatIDR(project.contractValue) : '—'}\n`
    summaryText += `Include PPN     : ${project.ppnFromClient ? 'Ya' : 'Tidak'}\n`
    summaryText += `Tanggal Mulai   : ${formatD(project.startDate)}\n`
    summaryText += `Tanggal Selesai : ${formatD(project.endDate)}\n`
    summaryText += `Waktu Arsip     : ${new Date().toLocaleString('id-ID')}\n\n`

    if (project.notes) {
      summaryText += `Catatan Proyek:\n${project.notes}\n\n`
    }

    // Rekap Item (Pengadaan)
    if (project.items.length > 0) {
      summaryText += `-----------------------------------------------------\n`
      summaryText += `DAFTAR ITEM PROYEK (PENGADAAN)\n`
      summaryText += `-----------------------------------------------------\n`
      project.items.forEach((it, idx) => {
        summaryText += `${idx + 1}. ${it.itemName} | Qty: ${it.qty} ${it.unit} | Harga Satuan: ${formatIDR(it.unitPrice)} | Total: ${formatIDR(it.total)}\n`
      })
      summaryText += `\n`
    }

    // Rekap Surat Jalan
    if (project.suratJalans.length > 0) {
      summaryText += `-----------------------------------------------------\n`
      summaryText += `SURAT JALAN\n`
      summaryText += `-----------------------------------------------------\n`
      project.suratJalans.forEach((sj, idx) => {
        summaryText += `${idx + 1}. No: ${sj.sjNumber} | Tgl: ${formatD(sj.date)} | Driver: ${sj.driverName || '—'}\n`
      })
      summaryText += `\n`
    }

    // Rekap Invoice
    if (project.invoices.length > 0) {
      summaryText += `-----------------------------------------------------\n`
      summaryText += `INVOICE / TAGIHAN\n`
      summaryText += `-----------------------------------------------------\n`
      project.invoices.forEach((inv, idx) => {
        summaryText += `${idx + 1}. No: ${inv.invoiceNumber} | Tgl: ${formatD(inv.date)} | Status: ${inv.status} | Metode: ${inv.paymentMethod}\n`
      })
      summaryText += `\n`
    }

    // Rekap Pembayaran Klien
    if (clientPayments.length > 0) {
      const totalPaid = clientPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
      summaryText += `-----------------------------------------------------\n`
      summaryText += `PEMBAYARAN DARI KLIEN (Total Masuk: ${formatIDR(totalPaid)})\n`
      summaryText += `-----------------------------------------------------\n`
      clientPayments.forEach((cp: any, idx: number) => {
        summaryText += `${idx + 1}. [${cp.type}] ${cp.title}: ${formatIDR(cp.amount)} | Tgl: ${formatD(cp.date)} | Metode: ${cp.paymentMethod}${cp.invoiceNumber ? ` | Inv: ${cp.invoiceNumber}` : ''}\n`
      })
      summaryText += `\n`
    }

    zip.file(`Ringkasan_Proyek_${sanitizeFilename(project.projectCode)}.txt`, summaryText)
    logEntries.push(`[OK] Ringkasan_Proyek_${sanitizeFilename(project.projectCode)}.txt`)

    // ─────────────────────────────────────────────
    // 2. GENERATE EXCEL REKAP RAB
    // ─────────────────────────────────────────────
    try {
      const wb = new ExcelJS.Workbook()
      wb.creator = 'PT Inti Nusa Dinamika Optima'
      wb.created = new Date()

      const ws = wb.addWorksheet('RAB Proyek')
      ws.views = [{ showGridLines: true }]

      // Header judul
      ws.addRow([`REKAPITULASI RENCANA ANGGARAN BIAYA (RAB)`])
      ws.addRow([`PROYEK: ${project.name} (${project.projectCode})`])
      ws.addRow([`Klien: ${project.client?.name || '—'} | Nilai Kontrak: ${project.contractValue ? formatIDR(project.contractValue) : '—'}`])
      ws.addRow([])

      // Header kolom
      const headerRow = ws.addRow([
        'No',
        'Deskripsi / Nama Item',
        'Volume',
        'Satuan',
        'Harga Satuan (Rencana)',
        'Total (Rencana)',
        'Vendor Terkait',
        'Total Realisasi',
        'Status',
      ])

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })

      let rowNum = 1
      if (project.rabTopiks.length > 0) {
        // Tipe Jasa (bertopik)
        project.rabTopiks.forEach((topik) => {
          const tRow = ws.addRow(['', `[TOPIK] ${topik.nama}`, '', '', '', '', '', '', ''])
          tRow.font = { bold: true }
          tRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }

          topik.items.forEach((item) => {
            const jmlRencana = item.volumeRencana * item.hargaSatuanRencana
            const totRealisasi = item.realisasi.reduce((s, r) => s + r.jumlah, 0)
            const vendorNames = Array.from(new Set(item.realisasi.map((r) => r.vendor?.name).filter(Boolean))).join(', ') || '—'

            ws.addRow([
              rowNum++,
              item.namaItem,
              item.volumeRencana,
              item.satuan,
              item.hargaSatuanRencana,
              jmlRencana,
              vendorNames,
              totRealisasi,
              totRealisasi > jmlRencana ? 'Overbudget' : 'Aman',
            ])
          })
        })
      } else if (project.items.length > 0) {
        // Tipe Pengadaan (item proyek)
        project.items.forEach((item) => {
          const totBeli = item.purchases.reduce((s, p) => s + p.totalBuy, 0)
          const vendorNames = Array.from(new Set(item.purchases.map((p) => p.vendor?.name).filter(Boolean))).join(', ') || '—'

          ws.addRow([
            rowNum++,
            item.itemName,
            item.qty,
            item.unit,
            item.unitPrice,
            item.total,
            vendorNames,
            totBeli,
            totBeli > item.total ? 'Defisit' : 'Surplus',
          ])
        })
      }

      // Format kolom angka
      ws.columns = [
        { width: 6 },
        { width: 35 },
        { width: 12 },
        { width: 10 },
        { width: 22 },
        { width: 22 },
        { width: 25 },
        { width: 22 },
        { width: 15 },
      ]

      const excelBuffer = await wb.xlsx.writeBuffer()
      zip.file(
        `02_RAB_dan_Keuangan/Rekap_RAB_${sanitizeFilename(project.projectCode)}.xlsx`,
        Buffer.from(excelBuffer)
      )
      logEntries.push(`[OK] 02_RAB_dan_Keuangan/Rekap_RAB_${sanitizeFilename(project.projectCode)}.xlsx`)
    } catch (excelErr) {
      console.warn('Gagal membuat file Excel RAB:', excelErr)
    }

    // ─────────────────────────────────────────────
    // 3. UNDUH DAN MASUKKAN SEMUA FILE KE DALAM ZIP
    // ─────────────────────────────────────────────
    type FileToDownload = {
      folder: string
      filenamePrefix: string
      url: string | null | undefined
    }

    const filesQueue: FileToDownload[] = [
      // File Utama Proyek
      { folder: '01_Dokumen_Proyek', filenamePrefix: `PO_Klien_${sanitizeFilename(project.poNumber || 'File')}`, url: project.poFileUrl },
      { folder: '01_Dokumen_Proyek', filenamePrefix: 'RAB_Awal_Proyek', url: project.rabFileUrl },

      // Dokumen Tambahan Proyek
      ...project.documents.map((doc, idx) => ({
        folder: '01_Dokumen_Proyek',
        filenamePrefix: `Dokumen_${idx + 1}_${sanitizeFilename(doc.name || 'Dok')}`,
        url: doc.fileUrl,
      })),

      // Bukti Pembelian RAB (Pengadaan)
      ...project.rabPurchases.flatMap((p, idx) => [
        {
          folder: '02_RAB_dan_Keuangan/Bukti_Pembelian',
          filenamePrefix: `Nota_Beli_${idx + 1}_${sanitizeFilename(p.projectItem?.itemName || 'Item')}_${sanitizeFilename(p.vendor?.name || 'Vendor')}`,
          url: p.docUrl,
        },
        {
          folder: '02_RAB_dan_Keuangan/Bukti_Pembelian',
          filenamePrefix: `Bukti_Bayar_Beli_${idx + 1}_${sanitizeFilename(p.projectItem?.itemName || 'Item')}`,
          url: p.paymentProofUrl,
        },
      ]),

      // Biaya Tambahan (Pengadaan & Jasa)
      ...project.additionalCosts.map((c, idx) => ({
        folder: '02_RAB_dan_Keuangan/Biaya_Tambahan',
        filenamePrefix: `Biaya_${idx + 1}_${sanitizeFilename(c.category)}_${sanitizeFilename(c.description || 'Cost')}`,
        url: c.docUrl,
      })),

      // Realisasi Invoice & Bukti Bayar (Jasa / RAB Dinamis)
      ...project.rabRealisasi.flatMap((r, idx) => [
        {
          folder: '02_RAB_dan_Keuangan/Invoice_dan_Bukti_Vendor',
          filenamePrefix: `Invoice_Vendor_${idx + 1}_${sanitizeFilename(r.nomorInvoice || 'Inv')}_${sanitizeFilename(r.vendorNama || r.vendor?.name || 'Vendor')}`,
          url: r.fileBuktiUrl,
        },
        {
          folder: '02_RAB_dan_Keuangan/Invoice_dan_Bukti_Vendor',
          filenamePrefix: `Bukti_Transfer_Vendor_${idx + 1}_${sanitizeFilename(r.nomorInvoice || 'Inv')}`,
          url: r.buktiBayarUrl,
        },
      ]),

      // Surat Jalan Kembali (Signed)
      ...project.suratJalans.map((sj, idx) => ({
        folder: '03_Surat_Jalan_dan_BAST',
        filenamePrefix: `SJ_Kembali_${idx + 1}_${sanitizeFilename(sj.sjNumber)}`,
        url: sj.returnedFileUrl,
      })),

      // Pembayaran Klien (Invoice & Bukti Transfer Klien)
      ...clientPayments.flatMap((cp: any, idx: number) => [
        {
          folder: '04_Pembayaran_Klien',
          filenamePrefix: `Invoice_Klien_${idx + 1}_${sanitizeFilename(cp.invoiceNumber || cp.title || 'Invoice')}`,
          url: cp.invoiceUrl,
        },
        {
          folder: '04_Pembayaran_Klien',
          filenamePrefix: `Bukti_Bayar_Klien_${idx + 1}_${sanitizeFilename(cp.title || 'Transfer')}`,
          url: cp.proofUrl,
        },
      ]),
    ]

    // Proses unduh file secara serentak (dengan limiter)
    const validQueue = filesQueue.filter((f) => Boolean(f.url && f.url.trim()))

    await Promise.all(
      validQueue.map(async (item) => {
        if (!item.url) return
        const result = await fetchFileBuffer(item.url, bucket)
        if (result) {
          const finalFilename = `${item.filenamePrefix}.${result.ext}`
          const fullZipPath = `${item.folder}/${finalFilename}`
          zip.file(fullZipPath, result.buffer)
          logEntries.push(`[OK] ${fullZipPath}`)
        } else {
          logEntries.push(`[GAGAL] ${item.folder}/${item.filenamePrefix} (URL: ${item.url})`)
        }
      })
    )

    // Catatan isi arsip
    logEntries.unshift(
      `ARSIP FILE PROYEK: ${project.name} (${project.projectCode})`,
      `Dibuat: ${new Date().toLocaleString('id-ID')}`,
      `Total item terdaftar: ${validQueue.length}`,
      `----------------------------------------------------`
    )
    zip.file('Catatan_Daftar_File.txt', logEntries.join('\n'))

    // ─────────────────────────────────────────────
    // 4. GENERATE ZIP BUFFER & RETURN ATTACHMENT
    // ─────────────────────────────────────────────
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const zipFilename = `${sanitizeFilename(project.projectCode)}_${sanitizeFilename(project.name)}_Arsip.zip`

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Error generating project archive zip:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat arsip file proyek' },
      { status: 500 }
    )
  }
}
