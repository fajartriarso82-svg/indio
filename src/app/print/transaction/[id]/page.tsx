import { db as prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function PrintTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      client: true,
      items: {
        include: {
          product: true
        }
      }
    }
  })

  if (!transaction) {
    notFound()
  }

  const company = await prisma.company.findFirst()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-white min-h-screen print:bg-white text-slate-900 font-sans">
      {/* Hide the default navigation/sidebar if any, but since this is a new route without the dashboard layout, it should be clean */}
      
      {/* A6 width is roughly 105mm. We use mx-auto for screen viewing, but print takes full available width controlled by @page */}
      <div className="w-full max-w-[105mm] mx-auto p-4 sm:p-6 print:p-0 print:max-w-none box-border text-[11px] leading-tight" id="printable-area">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-2">
          {/* Left: Logo & Company Name */}
          <div className="flex flex-col gap-1 w-1/2">
            <div className="flex items-center gap-2 mb-1">
              {company?.logoFile ? (
                <img src={company.logoFile} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                  LOGO
                </div>
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

          {/* Right: Invoice Info */}
          <div className="text-right w-1/2">
            <h1 className="text-base font-bold text-blue-900 uppercase tracking-wide mb-2">Ringkasan Pesanan</h1>
            <div className="text-[10px] text-slate-700 space-y-1">
              <div>Nomor Pesanan: <span className="font-medium text-slate-900">{transaction.transactionId}</span></div>
              <div>Tanggal Pesanan: <span className="font-medium text-slate-900">{format(new Date(transaction.date), "dd MMMM yyyy, HH:mm 'WIB'", { locale: localeID })}</span></div>
            </div>
          </div>
        </div>

        {/* Info Pembeli */}
        <div className="mb-4">
          <div className="bg-blue-100 text-slate-900 font-bold py-1 px-2 text-center text-xs mb-2 uppercase">
            Info Pembeli
          </div>
          <div className="text-[10px] space-y-1 px-1">
            <div><span className="font-bold">Nama:</span> {transaction.clientName}</div>
            {/* If client is registered and has company/instansi name, display it. Assuming client name is person, or address contains company */}
            {transaction.client && transaction.client.email && (
              <div><span className="font-bold">Email:</span> {transaction.client.email}</div>
            )}
            <div><span className="font-bold">Alamat:</span> {transaction.client?.address || '-'} | <span className="font-bold">No. HP:</span> {transaction.clientPhone || '-'}</div>
          </div>
        </div>

        {/* Table */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-blue-900/30 text-[10px]">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th className="border border-blue-900/30 py-1.5 px-2 text-center w-8">NO</th>
                <th className="border border-blue-900/30 py-1.5 px-2 text-left">NAMA BARANG</th>
                <th className="border border-blue-900/30 py-1.5 px-2 text-center w-20">HARGA SATUAN</th>
                <th className="border border-blue-900/30 py-1.5 px-2 text-center w-12">QTY</th>
                <th className="border border-blue-900/30 py-1.5 px-2 text-right w-24">TOTAL HARGA</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="border border-blue-900/30 py-1.5 px-2 text-center">{index + 1}.</td>
                  <td className="border border-blue-900/30 py-1.5 px-2">
                    {item.name}
                    {item.spec && <div className="text-[9px] text-slate-500 mt-0.5">{item.spec}</div>}
                  </td>
                  <td className="border border-blue-900/30 py-1.5 px-2 text-center whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                  <td className="border border-blue-900/30 py-1.5 px-2 text-center">{item.qty}</td>
                  <td className="border border-blue-900/30 py-1.5 px-2 text-right whitespace-nowrap">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6 text-[10px]">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium text-slate-900">{formatCurrency(transaction.subTotal)}</span>
            </div>
            {transaction.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Pajak (PPN):</span>
                <span className="font-medium text-slate-900">{formatCurrency(transaction.tax)}</span>
              </div>
            )}
            {transaction.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Biaya Pengiriman:</span>
                <span className="font-medium text-slate-900">{formatCurrency(transaction.shippingCost)}</span>
              </div>
            )}
            {transaction.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Diskon:</span>
                <span className="font-medium text-slate-900">- {formatCurrency(transaction.discount)}</span>
              </div>
            )}
            
            <div className="border-t-2 border-blue-900 my-2 pt-2 flex justify-between font-bold text-sm text-blue-900">
              <span>TOTAL PEMBAYARAN:</span>
              <span>{formatCurrency(transaction.grandTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-slate-800">
              <span className="uppercase">METODE PEMBAYARAN:</span>
              <span className="uppercase">{transaction.paymentMethod}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-300 mt-12 pt-4"></div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A6 portrait;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      
      {/* Auto print script */}
      <script dangerouslySetInnerHTML={{__html: `
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      `}} />
    </div>
  )
}
