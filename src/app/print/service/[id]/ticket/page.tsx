import { db as prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function PrintServiceTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const service = await prisma.service.findUnique({
    where: { id },
    include: { client: true }
  })

  if (!service) notFound()

  const company = await prisma.company.findFirst()

  return (
    <div className="bg-white min-h-screen print:bg-white text-slate-900 font-sans">
      <div className="w-full max-w-[105mm] mx-auto p-4 sm:p-6 print:p-0 print:max-w-none box-border text-[11px] leading-tight" id="printable-area">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-2 border-b-2 border-blue-900 pb-4">
          <div className="flex flex-col gap-1 w-1/2">
            <div className="flex items-center gap-2 mb-1">
              {company?.logoFile ? (
                <img src={company.logoFile} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">LOGO</div>
              )}
              <div className="font-bold text-sm text-blue-900 uppercase leading-none">
                {company?.name || 'PT. INTI NUSA DINAMIKA OPTIMA'}
              </div>
            </div>
            <div className="text-[10px] text-slate-700">
              <span className="font-bold">Kontak:</span><br/>
              {company?.address || 'Jl. A. Yani No. 77 Cilacap'}<br/>
              {company?.phone || '0282-531042'}
            </div>
          </div>

          <div className="text-right w-1/2">
            <h1 className="text-base font-bold text-blue-900 uppercase tracking-wide mb-2">Tiket Service</h1>
            <div className="text-[10px] text-slate-700 space-y-1">
              <div>Nomor Service: <span className="font-medium text-slate-900">{service.serviceId}</span></div>
              <div>Tgl Terima: <span className="font-medium text-slate-900">{format(new Date(service.date), "dd MMMM yyyy, HH:mm", { locale: localeID })}</span></div>
            </div>
          </div>
        </div>

        {/* Info Pelanggan */}
        <div className="mb-4">
          <div className="bg-blue-100 text-slate-900 font-bold py-1 px-2 text-center text-xs mb-2 uppercase">Informasi Pelanggan</div>
          <div className="text-[10px] space-y-1 px-1">
            <div><span className="font-bold">Nama:</span> {service.clientName}</div>
            <div><span className="font-bold">No. HP:</span> {service.clientPhone || '-'}</div>
            <div><span className="font-bold">Alamat:</span> {service.clientAddress || '-'}</div>
          </div>
        </div>

        {/* Info Barang */}
        <div className="mb-6">
          <div className="bg-blue-100 text-slate-900 font-bold py-1 px-2 text-center text-xs mb-2 uppercase">Detail Barang & Kerusakan</div>
          <table className="w-full text-[10px] border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-2 font-bold w-1/3 bg-slate-50 border-r border-slate-300">Nama Barang</td>
                <td className="py-1.5 px-2 font-medium">{service.itemName}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-2 font-bold w-1/3 bg-slate-50 border-r border-slate-300">Merek / Model</td>
                <td className="py-1.5 px-2">{service.brand || '-'} {service.modelType ? `(${service.modelType})` : ''}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-2 font-bold w-1/3 bg-slate-50 border-r border-slate-300">Serial Number</td>
                <td className="py-1.5 px-2">{service.serialNumber || '-'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-1.5 px-2 font-bold w-1/3 bg-slate-50 border-r border-slate-300">Kelengkapan</td>
                <td className="py-1.5 px-2">{service.completeness || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-bold w-1/3 bg-rose-50 text-rose-700 border-r border-slate-300">Keluhan</td>
                <td className="py-1.5 px-2 font-bold text-rose-700">{service.complaint}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded p-3 text-center text-[10px] text-slate-600 mb-8 font-medium">
          Harap simpan tiket ini dan bawa saat pengambilan barang.<br/>Barang yang tidak diambil lebih dari 3 bulan bukan tanggung jawab kami.
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-8 text-center text-[10px]">
          <div className="w-1/2">
            <div className="mb-12">Penerima (Toko)</div>
            <div className="border-b border-slate-400 mx-6"></div>
          </div>
          <div className="w-1/2">
            <div className="mb-12">Pelanggan</div>
            <div className="border-b border-slate-400 mx-6"></div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A6 portrait; margin: 5mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
      <script dangerouslySetInnerHTML={{__html: `window.onload = function() { setTimeout(function() { window.print(); }, 500); }`}} />
    </div>
  )
}
