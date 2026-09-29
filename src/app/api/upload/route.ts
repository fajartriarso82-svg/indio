import { NextResponse } from 'next/server'
import { getSupabaseServer, getSupabaseBucket } from '@/lib/supabase'
import sharp from 'sharp'

/**
 * Upload file ke Supabase Storage dengan kompresi gambar otomatis via sharp.
 * Mendukung: PDF, JPG, JPEG, PNG, WEBP.
 * Gambar otomatis di-resize (maks 1600px), dikompres, dan dibuatkan thumbnail (200px).
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const originalName = file.name || 'unnamed'
    const extension = originalName.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          success: false,
          error: `Format file tidak didukung (.${extension}). Harap upload file PDF, JPG, PNG, atau WEBP.`,
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()
    const bucket = getSupabaseBucket()

    const bytes = await file.arrayBuffer()
    let uploadBuffer: any = Buffer.from(bytes)

    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) || file.type.startsWith('image/')
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const baseSafeName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 40)

    let finalContentType = file.type || 'application/octet-stream'
    let finalPath = `uploads/${uniqueSuffix}-${baseSafeName}.${extension}`
    let thumbnailUrl: string | null = null

    if (isImage) {
      try {
        // Kompres gambar utama (maks 1600px, kualitas 80%)
        uploadBuffer = await sharp(uploadBuffer)
          .rotate() // auto-orient berdasarkan EXIF
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()

        finalContentType = 'image/webp'
        finalPath = `uploads/${uniqueSuffix}-${baseSafeName}.webp`

        // Buat thumbnail (200px)
        const thumbBuffer = await sharp(uploadBuffer)
          .resize({ width: 200, height: 200, fit: 'cover' })
          .webp({ quality: 75 })
          .toBuffer()

        const thumbPath = `uploads/thumb-${uniqueSuffix}-${baseSafeName}.webp`
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from(bucket)
          .upload(thumbPath, thumbBuffer, {
            contentType: 'image/webp',
            cacheControl: '86400',
            upsert: false,
          })

        if (!thumbError && thumbData) {
          const { data: thumbPub } = supabase.storage.from(bucket).getPublicUrl(thumbData.path)
          thumbnailUrl = thumbPub.publicUrl
        }
      } catch (sharpError) {
        console.warn('Sharp compression error, using original file buffer:', sharpError)
        // Tetap lanjutkan dengan buffer asli
      }
    }

    // Upload file utama
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, uploadBuffer, {
        contentType: finalContentType,
        cacheControl: '86400',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Gagal upload file ke storage' },
        { status: 500 }
      )
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      thumbnailUrl: thumbnailUrl || publicData.publicUrl,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal upload file' },
      { status: 500 }
    )
  }
}
