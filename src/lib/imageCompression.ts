/**
 * Utility untuk kompresi foto / gambar di sisi client (browser) sebelum di-upload.
 * Memperkecil dimensi (maks 1600px) dan kompresi kualitas JPEG 80%,
 * mengurangi file kamera (10MB+) menjadi ratusan KB dalam hitungan milidetik.
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = options

  // Jika bukan gambar atau gambar SVG/GIF, kembalikan file asli
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          let { width, height } = img

          // Hitung rasio resize jika melewati batas maksimal
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            } else {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          // Gambar dengan smoothing yang baik
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Konversi ke JPEG terkompresi
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file)
                return
              }

              const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
              const compressedFile = new File([blob], cleanName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })

              // Jika hasil kompresi ternyata lebih besar dari file asli (kasus gambar sangat kecil), gunakan yang asli
              if (compressedFile.size >= file.size) {
                resolve(file)
              } else {
                resolve(compressedFile)
              }
            },
            'image/jpeg',
            quality
          )
        } catch (err) {
          console.warn('Gagal melakukan kompresi gambar client, memakai file asli:', err)
          resolve(file)
        }
      }

      img.onerror = () => {
        resolve(file)
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      resolve(file)
    }

    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
