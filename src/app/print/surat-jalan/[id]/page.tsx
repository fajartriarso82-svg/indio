import { db as prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function PrintSuratJalanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const suratJalan = await prisma.suratJalan.findUnique({
    where: { id },
    include: {
      items: true,
      project: {
        include: {
          client: true,
        }
      }
    }
  })

  if (!suratJalan) {
    notFound()
  }

  const company = await prisma.company.findFirst({
    include: { employees: true }
  })
  const direktur = company?.employees.find(e => e.position?.toLowerCase().includes('direktur'))
  const direkturName = direktur?.name || company?.picName || 'BUNTORO KADARUSMAN'

  // Format date correctly
  const sjDateFormatted = format(new Date(suratJalan.date), "dd MMMM yyyy", { locale: localeID })
  const projectDateFormatted = suratJalan.project.startDate 
    ? format(new Date(suratJalan.project.startDate), "dd/MM/yyyy", { locale: localeID })
    : format(new Date(suratJalan.project.createdAt), "dd/MM/yyyy", { locale: localeID })

  const clientName = suratJalan.project.client?.name || 'Pelanggan'
  const clientAddress = suratJalan.project.clientAddress || suratJalan.project.client?.address || ''

  // Build empty rows to match the image's layout (e.g. at least 6 empty rows)
  const emptyRows = Array.from({ length: 6 }).map((_, i) => i)

  return (
    <div className="bg-white min-h-screen print:bg-white text-black font-sans">
      <div className="w-full max-w-[210mm] mx-auto pt-8 px-8 pb-4 print:pt-4 print:px-6 print:max-w-none box-border text-[12px] leading-tight" id="printable-area">
        
        {/* Header / Kop */}
        <div className="mb-6 w-full">
          {company?.kopFile ? (
            <img src={company.kopFile} alt="Kop Surat" className="w-full h-auto max-h-32 object-contain object-left" />
          ) : (
            <div className="border-b-2 border-black pb-4 text-center">
              <h1 className="text-xl font-bold uppercase">{company?.name || 'PT. INTI NUSA DINAMIKA OPTIMA'}</h1>
              <p className="text-sm">{company?.address || 'Jl. A. Yani No. 77 Cilacap'} Telp : {company?.phone || '0282-531042'}</p>
            </div>
          )}
        </div>

        {/* Title & Date */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-lg font-bold underline underline-offset-2">SURAT JALAN</h1>
            <div className="mt-1">Nomor : {suratJalan.sjNumber}</div>
          </div>
          <div>
            Cilacap, {sjDateFormatted}
          </div>
        </div>

        {/* Kepada */}
        <div className="mb-6">
          <div className="uppercase">{clientName}</div>
          <div className="uppercase">{clientAddress.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>
        </div>

        {/* Pengantar */}
        <div className="mb-2">
          Sesuai PO No. {suratJalan.project.poNumber || '-'} tgl. {projectDateFormatted}
        </div>
        <div className="mb-2">
          Bersama ini, kami kirimkan barang dengan rincian sebagai berikut :
        </div>

        {/* Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black text-[12px]">
            <thead>
              <tr>
                <th className="border border-black py-2 px-2 text-center font-bold w-12">No.</th>
                <th className="border border-black py-2 px-2 text-center font-bold w-32">Code Barang</th>
                <th className="border border-black py-2 px-2 text-center font-bold">Description</th>
                <th className="border border-black py-2 px-2 text-center font-bold w-20">Qty</th>
                <th className="border border-black py-2 px-2 text-center font-bold w-24">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {suratJalan.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black py-1.5 px-2 text-center">{item.itemId || index + 1}</td>
                  <td className="border border-black py-1.5 px-2 text-center">{item.itemCode || '-'}</td>
                  <td className="border border-black py-1.5 px-2">{item.description}</td>
                  <td className="border border-black py-1.5 px-2 text-right">{item.qty}</td>
                  <td className="border border-black py-1.5 px-2 text-center">{item.unit}</td>
                </tr>
              ))}
              
              {/* Render empty rows for formatting padding */}
              {emptyRows.map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border border-black py-1.5 px-2 text-center text-transparent">.</td>
                  <td className="border border-black py-1.5 px-2"></td>
                  <td className="border border-black py-1.5 px-2"></td>
                  <td className="border border-black py-1.5 px-2"></td>
                  <td className="border border-black py-1.5 px-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-12">
          Demikian yang dapat kami sampaikan, kiranya dapat diterima dengan baik, atas perhatiannya kami ucapkan<br/>
          terimakasih.
        </div>

        {/* Signatures */}
        <div className="flex justify-between">
          <div className="w-1/3">
            <div className="mb-1">Pengirim,</div>
            <div className="mb-16 uppercase">{company?.name || 'PT. INTI NUSA DINAMIKA OPTIMA'}</div>
            <div className="font-bold underline underline-offset-2 uppercase">{direkturName}</div>
            <div>Direktur</div>
          </div>
          
          <div className="w-1/3 text-center pt-5 relative">
            <div className="mb-1">Penerima,</div>
            <div className="mb-16 uppercase">{clientName}</div>
            <div className="border-b border-black w-48 mx-auto"></div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 11px;
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
