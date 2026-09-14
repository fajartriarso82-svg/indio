import { db as prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function PrintServiceInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const service = await prisma.service.findUnique({
    where: { id },
    include: { client: true }
  })

  if (!service) notFound()

  const company = await prisma.company.findFirst()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  let spareparts: { name: string, price: number }[] = []
  try {
    if (service.sparepartDetails) {
      spareparts = JSON.parse(service.sparepartDetails)
    }
  } catch (e) {}

  return (
    <div className="bg-white min-h-screen print:bg-white text-slate-900 font-sans">
      <div className="w-full max-w-[105mm] mx-auto p-4 sm:p-6 print:p-0 print:max-w-none box-border text-[11px] leading-tight" id="printable-area">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-2">
          <div className="flex flex-col gap-1 w-1/2">
            <div className="flex items-center gap-2 mb-1">
              {company?.logoFile ? (
                <img src={company.logoFile} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">LOGO</div>
              )}
              <div className="font-bold text-sm text-blue-900 uppercase leading-none">
                {company?.name || 'Toko Berkah Bersama'}
              </div>
            </div>
            <div className="text-[10px] text-slate-700">
              <span className="font-bold">Contact info:</span><br/>
              {company?.address || '-'}<br/>
              {company?.phone || '-'}
            </div>
          </div>

          <div className="text-right w-1/2">
            <h1 className="text-base font-bold text-blue-900 uppercase tracking-wide mb-2">Ringkasan Service</h1>
            <div className="text-[10px] text-slate-700 space-y-1">
              <div>Nomor Service: <span className="font-medium text-slate-900">{service.serviceId}</span></div>
              <div>Tanggal Update: <span className="font-medium text-slate-900">{format(new Date(service.updatedAt), "dd MMMM yyyy, HH:mm 'WIB'", { locale: localeID })}</span></div>
            </div>
          </div>
        </div>

        {/* Info Pelanggan */}
        <div className="mb-4">
          <div className="bg-blue-100 text-slate-900 font-bold py-1 px-2 text-center text-xs mb-2 uppercase">Info Pelanggan & Barang</div>
          <div className="text-[10px] space-y-1 px-1">
            <div><span className="font-bold">Nama:</span> {service.clientName}</div>
            <div><span className="font-bold">No. HP:</span> {service.clientPhone || '-'}</div>
            <div><span className="font-bold">Alamat:</span> {service.clientAddress || '-'}</div>
            <div className="border-t border-slate-300 my-1.5"></div>
            <div><span className="font-bold">Perangkat:</span> {service.itemName} {service.brand ? `(${service.brand})` : ''}</div>
            <div className="text-rose-700"><span className="font-bold">Keluhan:</span> {service.complaint}</div>
          </div>
        </div>

        {/* Table Rincian Biaya */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-blue-900/30 text-[10px]">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th className="border border-blue-900/30 py-1.5 px-2 text-center w-8">NO</th>
                <th className="border border-blue-900/30 py-1.5 px-2 text-left">RINCIAN BIAYA</th>
                <th className="border border-blue-900/30 py-1.5 px-2 text-right w-24">BIAYA</th>
              </tr>
            </thead>
            <tbody>
              {/* Jasa Service */}
              {service.serviceFee > 0 && (
                <tr className="text-slate-800">
                  <td className="border border-blue-900/30 py-1.5 px-2 text-center">-</td>
                  <td className="border border-blue-900/30 py-1.5 px-2 font-medium">Jasa Service / Perbaikan</td>
                  <td className="border border-blue-900/30 py-1.5 px-2 text-right whitespace-nowrap">{formatCurrency(service.serviceFee)}</td>
                </tr>
              )}

              {/* Spareparts */}
              {spareparts.map((sp, index) => (
                <tr key={index} className="text-slate-800">
                  <td className="border border-blue-900/30 py-1.5 px-2 text-center">{index + 1}.</td>
                  <td className="border border-blue-900/30 py-1.5 px-2">
                    Penggantian Part: {sp.name}
                  </td>
                  <td className="border border-blue-900/30 py-1.5 px-2 text-right whitespace-nowrap">{formatCurrency(sp.price)}</td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6 text-[10px]">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal Sparepart:</span>
              <span className="font-medium text-slate-900">{formatCurrency(service.sparepartCost)}</span>
            </div>
            {service.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Ongkos Kirim:</span>
                <span className="font-medium text-slate-900">{formatCurrency(service.shippingCost)}</span>
              </div>
            )}
            
            <div className="border-t-2 border-blue-900 my-2 pt-2 flex justify-between font-bold text-sm text-blue-900">
              <span>TOTAL BIAYA:</span>
              <span>{formatCurrency(service.totalCost)}</span>
            </div>
            <div className="flex justify-between font-bold text-[10px] text-slate-800">
              <span className="uppercase">STATUS:</span>
              <span className="uppercase text-emerald-600">{service.status}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-300 mt-12 pt-4 text-center text-[10px] text-slate-500">
          Terima kasih atas kepercayaan Anda menggunakan layanan kami.
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
