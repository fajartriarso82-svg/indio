import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const project = await db.project.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            purchases: {
              include: {
                vendor: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        rabPurchases: {
          include: {
            vendor: { select: { id: true, name: true } },
            projectItem: { select: { id: true, itemName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        additionalCosts: {
          include: {
            vendor: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        progressNotes: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        suratJalans: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        basts: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            items: true,
            termins: { orderBy: { terminNo: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        kuitansis: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    let payments: any[] = []
    try {
      payments = await db.$queryRaw<any[]>`
        SELECT * FROM "ProjectPayment"
        WHERE "projectId" = ${id}
        ORDER BY "date" ASC, "createdAt" ASC
      `
    } catch (e) {
      console.warn('Error fetching client payments:', e)
    }

    return NextResponse.json({ success: true, data: { ...project, payments } })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      name,
      type,
      status,
      clientId,
      clientPicName,
      clientPicEmail,
      clientPicPhone,
      clientAddress,
      poNumber,
      internalPic,
      poFileUrl,
      rabFileUrl,
      contractValue,
      ppnFromClient,
      startDate,
      endDate,
      notes,
    } = body

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(clientId !== undefined && { clientId }),
        ...(clientPicName !== undefined && { clientPicName }),
        ...(clientPicEmail !== undefined && { clientPicEmail }),
        ...(clientPicPhone !== undefined && { clientPicPhone }),
        ...(clientAddress !== undefined && { clientAddress }),
        ...(poNumber !== undefined && { poNumber }),
        ...(internalPic !== undefined && { internalPic }),
        ...(poFileUrl !== undefined && { poFileUrl }),
        ...(rabFileUrl !== undefined && { rabFileUrl }),
        ...(contractValue !== undefined && { contractValue: contractValue !== null ? Number(contractValue) : null }),
        ...(ppnFromClient !== undefined && { ppnFromClient: Boolean(ppnFromClient) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        client: true,
        items: true,
      },
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

import { getSupabaseServer, getSupabaseBucket } from '@/lib/supabase'

function extractStoragePath(rawUrl: string, bucketName: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  // If already relative like "uploads/..."
  if (trimmed.startsWith('uploads/')) return trimmed

  try {
    const parsed = new URL(trimmed)
    const pathname = decodeURIComponent(parsed.pathname)

    // Pattern 1: /storage/v1/object/public/<bucketName>/<path>
    const marker = `/${bucketName}/`
    const idx = pathname.indexOf(marker)
    if (idx !== -1) {
      return pathname.substring(idx + marker.length)
    }

    // Pattern 2: /uploads/...
    const uploadsIdx = pathname.indexOf('/uploads/')
    if (uploadsIdx !== -1) {
      return pathname.substring(uploadsIdx + 1)
    }
  } catch {
    // String might not be a valid URL
    const uploadsIdx = trimmed.indexOf('uploads/')
    if (uploadsIdx !== -1) {
      return trimmed.substring(uploadsIdx)
    }
  }

  return null
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const project = await db.project.findUnique({
      where: { id },
      include: {
        documents: true,
        additionalCosts: true,
        rabPurchases: true,
        suratJalans: true,
        rabRealisasi: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Ambil file pembayaran klien jika ada
    let paymentFiles: (string | null | undefined)[] = []
    try {
      const pmts = await db.$queryRaw<any[]>`
        SELECT "invoiceUrl", "proofUrl" FROM "ProjectPayment" WHERE "projectId" = ${id}
      `
      pmts.forEach((p) => {
        if (p.invoiceUrl) paymentFiles.push(p.invoiceUrl)
        if (p.proofUrl) paymentFiles.push(p.proofUrl)
      })
    } catch (e) {
      console.warn('Error fetching payment files for deletion:', e)
    }

    // 1. Kumpulkan semua URL file yang terkait dengan proyek ini
    const fileUrls: (string | null | undefined)[] = [
      project.poFileUrl,
      project.rabFileUrl,
      ...project.documents.map((d) => d.fileUrl),
      ...project.additionalCosts.map((c) => c.docUrl),
      ...project.rabPurchases.map((p) => p.docUrl),
      ...project.rabPurchases.map((p) => p.paymentProofUrl),
      ...project.suratJalans.map((s) => s.returnedFileUrl),
      ...project.rabRealisasi.map((r) => r.fileBuktiUrl),
      ...project.rabRealisasi.map((r) => r.buktiBayarUrl),
      ...paymentFiles,
    ]

    // 2. Ekstrak path storage unik untuk dihapus dari bucket Supabase
    const bucket = getSupabaseBucket()
    const pathsToDelete = new Set<string>()

    for (const rawUrl of fileUrls) {
      if (!rawUrl) continue
      const path = extractStoragePath(rawUrl, bucket)
      if (path) {
        pathsToDelete.add(path)
        // Cek juga file thumbnail jika ada (dibuat sharp di /api/upload)
        const filename = path.split('/').pop() || ''
        if (filename && !filename.startsWith('thumb-')) {
          const dir = path.substring(0, path.lastIndexOf('/'))
          const thumbPath = dir ? `${dir}/thumb-${filename}` : `thumb-${filename}`
          pathsToDelete.add(thumbPath)
        }
      }
    }

    // 3. Hapus file dari bucket Supabase Storage
    if (pathsToDelete.size > 0) {
      try {
        const supabase = getSupabaseServer()
        const pathsArray = Array.from(pathsToDelete)
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove(pathsArray)

        if (storageError) {
          console.warn('Peringatan saat menghapus file storage:', storageError.message)
        }
      } catch (storageErr) {
        console.warn('Error saat membersihkan file di bucket Supabase:', storageErr)
      }
    }

    // 4. Hapus proyek dari database (Prisma cascade menghapus relasi anak)
    await db.project.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Proyek dan semua file terkait di bucket berhasil dihapus',
      deletedFilesCount: pathsToDelete.size,
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus proyek' },
      { status: 500 }
    )
  }
}
