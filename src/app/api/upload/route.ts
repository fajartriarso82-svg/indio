import { NextResponse } from 'next/server'
import { getSupabaseServer, getSupabaseBucket } from '@/lib/supabase'

/**
 * Upload file ke Supabase Storage (menggantikan penyimpanan ke public/uploads).
 *
 * Return format tetap kompatibel dengan pemanggil lama:
 *   { success: true, url: "<public url>" }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const supabase = getSupabaseServer()
    const bucket = getSupabaseBucket()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    const path = `uploads/${uniqueSuffix}-${safeName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
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

    return NextResponse.json({ success: true, url: publicData.publicUrl })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal upload file' },
      { status: 500 }
    )
  }
}
