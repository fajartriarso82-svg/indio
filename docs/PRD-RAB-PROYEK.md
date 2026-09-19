# PRD — Modul RAB Dinamis (Projek)

> Versi PRD yang sudah **disesuaikan dengan kode eksisting** repo Z-Indio (PT Inti Nusa Dinamika Optima).
> Semua nama entitas, field, status, format nomor dokumen, dan pola API di dokumen ini memakai
> penamaan yang **sudah ada di repo** — bukan nama generik dari PRD asli.
>
> Dokumen pendamping: `docs/DASHBOARD-UI-GUIDE.md` (aturan UI dashboard), `docs/SUPABASE-SETUP.md`.
> Stack: Next.js 16 App Router + Prisma 6 + PostgreSQL (Supabase) + shadcn/ui.

---

## 0. Ringkasan Perubahan dari PRD Asli

| Area | PRD asli | Kondisi eksisting | Keputusan di dokumen ini |
|---|---|---|---|
| Nama entitas | `Projek`, `RAB_Topik`, `RAB_Item` | `Project`, `ProjectItem` | Pakai nama Prisma eksisting; topik jadi model baru `RABTopic` |
| PK | `id` | `String @id @default(cuid())` di semua model | Ikuti cuid |
| Nomor dokumen | `nomor_po`, `nomor_invoice` | `projectCode`, `sjNumber`, `invoiceNumber`, … | Ikuti pola nomor eksisting per dokumen |
| Status | huruf kecil (`draft`, `lunas`) | string HURUF BESAR + komentar enum | Ikuti HURUF BESAR |
| PO | `PO` + `PO_Item` (model baru) | Belum ada; yang ada `RABPurchase` (1 baris pembelian/item) | Tambah `PurchaseOrder`, `RABPurchase` **naik kelas** jadi baris PO |
| Invoice ↔ PO | Invoice milik PO | `Invoice` hanya terhubung ke `Project` | Tambah `poId` (nullable) di `Invoice` |
| Pembayaran | `Pembayaran` | Belum ada (hanya `RABPurchase.paymentDate/paymentProofUrl` dan `InvoiceTermin`) | Tambah `Payment` |
| Audit | `Log_Audit` | Belum ada | Tambah `AuditLog`; `user_id` → `staffId` (FK ke `Staff`) |
| Export Excel | Server-side streaming, `exceljs` | Client-side `xlsx` (`XLSX.writeFile`) di module | Ikuti pola eksisting; lihat §7 soal styling |
| Kompresi file | resize 1600px + PDF via Ghostscript | `sharp` terpasang tapi **belum dipakai**; tanpa kompresi | Sharp untuk gambar; PDF kompresi **ditunda** (lihat §7) |

---

## 1. Peta Model Data (PRD → Eksisting)

### 1.1 Sudah ada dan bisa langsung dipakai

| Entitas PRD | Model eksisting | Field eksisting yang relevan |
|---|---|---|
| `Projek` | **`Project`** | `id`, `projectCode` (`PRJ-YYYY-NNN`), `name`, `type` (`PENGADAAN`/`JASA`), `status` (`DRAFT`,`IN_PROGRESS`,`COMPLETED`,`CANCELLED`), `clientId`, `clientAddress`, `poNumber`, `internalPic`, `startDate`, `endDate`, `notes`, `createdBy` |
| `RAB_Item` | **`ProjectItem`** | `id`, `projectId`, `itemId` (ID Item dari PO), `itemCode` (Kode Barang), `itemName`, `qty`, `unit`, `unitPrice`, `total` (= `qty × unitPrice`), `deadline`, `notes`, `sortOrder` |
| `Vendor` | **`Vendor`** | `id`, `name`, `address`, `phone`, `email`, `picName`, `picPhone`, `category`, `bankName`, `bankAccount`, `bankHolder`, `notes` |
| `Invoice` | **`Invoice`** | `id`, `projectId`, `invoiceNumber`, `date`, **`dueDate`** (sudah ada!), `paymentMethod` (`CASH`/`TEMPO`/`TERMIN`), `status` (`UNPAID`,`PARTIAL`,`PAID`), `notes`, `items[]` (`InvoiceItem`), `termins[]` (`InvoiceTermin`) |
| biaya non-RAB | **`ProjectAdditionalCost`** | `category` (`ACCESSORIES`,`SHIPPING`,`OPERATIONAL`,`OTHER`), `description`, `amount`, `vendorId`, `vendorName`, `date`, `docUrl`, `notes` |

### 1.2 Pemetaan nama field PRD → eksisting (WAJIB dipakai di UI & API)

| PRD asli | Nama eksisting | Catatan |
|---|---|---|
| `nama_item` | `itemName` | |
| `satuan` | `unit` | |
| `volume_rencana` | `qty` | Label UI tetap "Volume" / "Qty" |
| `harga_satuan_rencana` | `unitPrice` | Label UI "Harga Satuan" |
| `jumlah_rencana` | `total` | Sudah auto-kalkulasi di API (`qty * unitPrice`), **jangan** dikirim dari client |
| `nilai_kontrak` | **tidak ada** | Lihat §6 Keputusan #1 |
| `nama_topik`, `urutan` | **belum ada** | Model baru `RABTopic` (lihat §2) |
| `rekening_bank` | `bankName` + `bankAccount` + `bankHolder` | Sudah 3 field terpisah |
| `npwp`, `pkp` | **belum ada** | Tambah `npwp String?`, `isPkp Boolean @default(false)` ke `Vendor` |
| `nomor_po` | `PurchaseOrder.poNumber` (baru) / `Project.poNumber` (PO dari klien) | ⚠️ Dua konsep berbeda — lihat §6 Keputusan #2 |
| `tipe_file`, `file_bukti_url` | Satu kolom URL per jenis (`docUrl`, `paymentProofUrl`, `photoUrl`, `ProjectDocument`) | BELUM ada multi-file per invoice — lihat §6 Keputusan #4 |
| `status_bayar` | `Invoice.status` (`UNPAID`/`PARTIAL`/`PAID`) | `OVERDUE` **dihitung**, tidak disimpan |
| `jatuh_tempo` | `Invoice.dueDate` | Sudah ada |
| `user_id` | `staffId` | FK ke `Staff` (bukan `User`) |
| `entitas`/`entitas_id` | `entity` / `entityId` | Model baru `AuditLog` |

### 1.3 Penting: `Kuitansi` di repo BUKAN bukti bayar ke vendor

`Kuitansi` (`kuitansiNumber`, `invoiceId`, `bastId`, `amount`, `paymentMethod: CASH|TRANSFER|TEMPO`)
adalah **dokumen tanda terima yang diterbitkan ke klien** (sisi pendapatan), bukan bukti
transfer ke vendor. PRD asli menyebut "Input Invoice/Kuitansi dari PO" — di repo ini
**bukti bayar ke vendor** disimpan di `RABPurchase.paymentProofUrl` / `Payment.proofUrl` (baru).
Jangan re-use `Kuitansi` untuk pembayaran vendor.

---

## 2. Model Baru yang Perlu Ditambahkan

Ditulis dengan gaya penamaan yang sama seperti `prisma/schema.prisma` (komentar enum inline,
`cuid()`, `createdAt`/`updatedAt`, `onDelete: Cascade`).

```prisma
// ─── Topik RAB (pengelompokan ProjectItem) ───
model RABTopic {
  id        String        @id @default(cuid())
  projectId String
  project   Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String // mis. Material, Jasa Instalasi, Ongkos Kirim
  sortOrder Int           @default(0)
  items     ProjectItem[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

// ProjectItem: tambah kolom berikut
//   topicId String?
//   topic   RABTopic? @relation(fields: [topicId], references: [id], onDelete: SetNull)

// ─── Purchase Order ke Vendor ───
model PurchaseOrder {
  id         String            @id @default(cuid())
  projectId  String
  project    Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  poNumber   String // NNN/PO/INDO/ROMawi/YYYY (mengikuti pola sjNumber)
  vendorId   String
  vendor     Vendor            @relation(fields: [vendorId], references: [id])
  date       DateTime          @default(now())
  status     String            @default("DRAFT") // DRAFT, ISSUED, COMPLETED, CANCELLED
  notes      String?
  items      RABPurchase[]
  invoices   Invoice[]
  payments   Payment[]
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
}

// RABPurchase naik kelas jadi baris PO + tetap punya jalur "beli cepat" tanpa PO
//   poId        String?
//   po          PurchaseOrder? @relation(fields: [poId], references: [id], onDelete: Cascade)
//   kenaPajak   Boolean        @default(false)   // ← baru
//   persenPajak Float          @default(0)       // ← baru
//   status      String         @default("REQUEST") // REQUEST, SUCCESS, CANCELLED (tetap)

// ─── Pembayaran (menggantikan pemakaian paymentDate/paymentProofUrl sebagai sumber tunggal) ───
model Payment {
  id            String         @id @default(cuid())
  projectId     String
  project       Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  poId          String? // uang muka (DP) ditautkan ke PO langsung
  po            PurchaseOrder? @relation(fields: [poId], references: [id])
  invoiceId     String? // null = uang muka sebelum invoice terbit
  invoice       Invoice?       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  type          String         @default("INVOICE") // INVOICE, DP (uang muka)
  date          DateTime       @default(now())
  amount        Float
  method        String // TRANSFER, CASH, QRIS
  proofUrl      String?
  notes         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

// ─── Audit Log ───
model AuditLog {
  id        String   @id @default(cuid())
  entity    String // ProjectItem, RABPurchase, Invoice, PurchaseOrder, Payment
  entityId  String
  field     String
  oldValue  String?
  newValue  String?
  staffId   String?
  staff     Staff?   @relation(fields: [staffId], references: [id])
  createdAt DateTime @default(now())
}
```

Nota: `Invoice` perlu tambahan `poId String?` + relasi `po`, dan `Project` perlu relasi
`rabTopics`, `purchaseOrders`, `payments`; `Staff` perlu relasi `auditLogs`.

---

## 3. Konvensi Wajib (diambil dari kode eksisting)

### 3.1 Primary key & nomor dokumen

- PK semua tabel: `String @id @default(cuid())`.
- Nomor dokumen **manusiawi** disimpan di kolom terpisah, bukan menggantikan PK:

| Dokumen | Kolom | Format | Contoh |
|---|---|---|---|
| Project | `projectCode` | `PRJ-{YYYY}-{NNN}` | `PRJ-2026-001` |
| Surat Jalan | `sjNumber` | `{NNN}/SJ/INDO/{ROMawi}/{YYYY}` | `001/SJ/INDO/IX/2026` |
| Purchase Order (baru) | `poNumber` | `{NNN}/PO/INDO/{ROMawi}/{YYYY}` | `001/PO/INDO/IX/2026` |
| Invoice | `invoiceNumber` | input manual (nomor dari vendor) | — |
| Service | `serviceId` | `SVC-{YYYY}{MM}-{NNNN}` | `SVC-202609-0001` |
| Transaksi POS | `transactionId` | `INV-{YYYY}{MM}-{NNNN}` | `INV-202609-0001` |
| Karyawan | `employeeId` | input manual | — |

Generator nomor dilakukan di **route handler** dengan pola eksisting (lihat
`api/projects/[id]/surat-jalan/route.ts`: hitung `count` bulan berjalan → `padStart` → hanya
generate kalau field kosong sehingga nomor bisa di-override manual).

### 3.2 Status (string HURUF BESAR dengan komentar enum)

```prisma
status String @default("DRAFT") // DRAFT, IN_PROGRESS, COMPLETED, CANCELLED   ← Project
status String @default("DRAFT") // DRAFT, ISSUED, COMPLETED, CANCELLED        ← PurchaseOrder
status String @default("REQUEST") // REQUEST, SUCCESS, CANCELLED              ← RABPurchase
status String @default("UNPAID") // UNPAID, PARTIAL, PAID                     ← Invoice
status String @default("UNPAID") // UNPAID, PAID                              ← InvoiceTermin
```

Aturan:
- **Jangan** menambah status `OVERDUE`/`JATUH_TEMPO` ke kolom `Invoice.status`. Status jatuh tempo
  adalah **turunan** (`dueDate < today && status !== 'PAID'`) dan dihitung di server (lihat §5).
- Label Indonesia untuk UI: `DRAFT`→"Draft", `ISSUED`→"Terbit", `REQUEST`→"Request",
  `SUCCESS`→"Lunas", `UNPAID`→"Belum Dibayar", `PARTIAL`→"Dibayar Sebagian",
  `PAID`→"Lunas", `OVERDUE`→"Jatuh Tempo".

### 3.3 Response API

Semua route di `src/app/api/projects/[id]/**/route.ts` memakai:

```ts
// sukses
NextResponse.json({ success: true, data: ... }, { status: 201 })   // create
NextResponse.json({ success: true, data: ... })                    // read/update
NextResponse.json({ success: true, message: '... deleted' })        // delete
// gagal (selalu { success: false, error })
NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
NextResponse.json({ success: false, error: 'Failed to ...' }, { status: 500 })
```

- `params` di Next 16 = `Promise`, jadi selalu `const { id } = await context.params`.
- Validasi manual (`if (!a || !b) return 400`), tanpa zod.
- Field opsional di-update dengan spread kondisional: `...(status !== undefined && { status })`.
- Operasi multi-tabel dibungkus `db.$transaction([...])` (contoh: `api/projects/[id]/items/route.ts`).

### 3.4 Upload file

Pakai `POST /api/upload` (multipart `file`) → Supabase Storage bucket `indio-uploads`
(`src/lib/supabase.ts`), respons `{ success: true, url }`. Nama file di-sanitize dan diberi
prefix `uploads/{timestamp}-{random}-`.

### 3.5 Perhitungan turunan (sesuai catatan PRD — jangan disimpan statis)

| Nilai | Rumus | Lokasi |
|---|---|---|
| `ProjectItem.total` | `qty × unitPrice` | ditulis saat create/update item (sudah jalan) |
| Total per Topik | `sum(item.total where topicId = t)` | service/route saat GET RAB |
| Total RAB Rencana | `sum(item.total)` | `GET /api/projects/[id]/rab` → `summary.totalRAB` (sudah ada) |
| Total Realisasi | `sum(rABPurchase.totalBuy)` | `summary.totalPurchases` (sudah ada) |
| Total Komitmen | `sum(po.items.totalBuy) where po.status = 'ISSUED' AND po belum punya invoice` | baru |
| Margin Rencana | `nilaiKontrak − totalRAB` | baru (tergantung Keputusan #1) |
| Margin Aktual | `nilaiKontrak − (totalRealisasi + totalKomitmen)` | baru |
| Sisa bayar invoice | `invoiceTotal − sum(payment.amount) − sum(dpForPO)` | baru |
| `OVERDUE` | `dueDate < now && status !== 'PAID'` | baru |

### 3.6 Penamaan UI & label

- Label UI **bahasa Indonesia**, istilah mengikuti menu sidebar eksisting
  ("Proyek", "Klien", "Vendor", "Keuangan").
- Komponen: `src/components/dashboard/*Module.tsx` untuk daftar, `*FormModal.tsx` untuk form,
  `*DetailModal.tsx` untuk detail. Untuk RAB projek: tetap di `ProjectDetail.tsx` tab RAB.
- Wajib ikut `docs/DASHBOARD-UI-GUIDE.md`: kartu mobile (`md:hidden`) + tabel desktop
  (`hidden md:block`), `TableHead min-w-[...]`, dialog `max-h-[90vh] overflow-y-auto`,
  tombol aksi mobile `h-9`, dan **tanpa `mr-*` pada ikon di dalam `<Button>`**.

### 3.7 Format angka & tanggal

- Mata uang: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })`.
- Tanggal: `date-fns` + locale `id` → `format(date, 'dd MMM yyyy', { locale: id })` (halaman print
  pakai `dd MMMM yyyy`).

---

## 4. User Story yang Sudah Disesuaikan

### Epic 1 — Perencanaan RAB

#### US-1.1 — Struktur Topik & Item RAB

Sebagai PM projek, saya ingin membuat **Topik** dan mengisi **Item** di bawahnya agar total RAB
otomatis terhitung.

**Kriteria penerimaan**

- Model: `RABTopic` (`name`, `sortOrder`) milik `Project`; `ProjectItem.topicId` nullable
  (item lama tanpa topik tetap valid → ditampilkan pada grup "Tanpa Topik").
- Endpoint:
  - `GET|POST /api/projects/[id]/rab/topics`
  - `PUT|DELETE /api/projects/[id]/rab/topics/[topicId]`
  - `POST|PUT /api/projects/[id]/items` (sudah ada) → tambah dukungan `topicId`
- Field item: `itemName`, `unit`, `qty` (volume), `unitPrice` (harga satuan); `itemId` &
  `itemCode` tetap opsional (warisan kolom PO dari klien).
- `total` **read-only** di UI, dihitung server (`qty × unitPrice`) — jangan pernah dikirim client.
- Validasi server: `qty >= 0` dan `unitPrice >= 0`; tolak `NaN`; `itemName` wajib.
- Hapus topik: jika masih ada item → tolak dengan `400` (`{ success:false, error: 'Topik masih memiliki item' }`).
  Repo belum memakai soft delete di mana pun, jadi **blocking delete** lebih konsisten daripada
  menambah kolom `deletedAt` (lihat Keputusan #3).
- Urutan topik & urutan item di dalam topik dikelola `sortOrder` (drag-and-drop opsional).
- Total per topik + Total RAB dihitung di `GET /api/projects/[id]/rab` dan dikembalikan pada
  `data.summary.topics[]` (jangan simpan di DB).

#### US-1.2 — Revisi RAB & jejak audit

**Kriteria penerimaan**

- Setiap perubahan `ProjectItem` (`qty`, `unitPrice`, `itemName`, `topicId`) **dan** item baru/hapus
  dicatat ke `AuditLog` dengan `entity: 'ProjectItem'`, `entityId`, `field`, `oldValue`, `newValue`,
  `staffId` (dari sesi `StaffSession`), `createdAt`.
- Pencatatan hanya aktif saat `Project.status` bukan `DRAFT` (sesuai kalimat "setelah status
  projek berjalan"), agar penyusunan awal tidak berisik.
- Badge di tab RAB: **"Direvisi N×"** dengan `N = count(AuditLog where entity='ProjectItem' and entityId in items)`;
  klik → dialog berisi tabel waktu, staff, field, nilai lama → baru (pakai `Dialog` + `Table`
  sesuai UI guide, versi mobile pakai kartu).
- Total yang ditampilkan selalu versi terbaru; histori hanya dibaca dari `AuditLog`.

### Epic 2 — Vendor, PO, Realisasi

#### US-2.1 — Data Vendor + status PKP

- Tambah `npwp String?` dan `isPkp Boolean @default(false)` pada `Vendor` (rekening bank sudah ada:
  `bankName`, `bankAccount`, `bankHolder`).
- Validasi: `npwp` wajib bila `isPkp = true` (pesan: "NPWP wajib untuk vendor PKP").
- Pencarian vendor saat membuat PO memakai `Input` search dengan pola toolbar di UI guide
  (endpoint `GET /api/vendors` sudah ada, tambahkan `?search=` bila perlu).

#### US-2.2 — PO + baris item tertaut ke Item RAB

- Model `PurchaseOrder` (1 vendor, N baris) + `RABPurchase.poId`.
- Setiap baris wajib `projectItemId` yang valid & milik project yang sama
  (validasi seperti `POST /api/projects/[id]/rab` yang sudah ada).
- Tambah `kenaPajak Boolean @default(false)` + `persenPajak Float @default(0)` per baris;
  `subtotal = qty × buyPrice × (kenaPajak ? 1 + persenPajak/100 : 1)`.
- **Peringatan over-budget, bukan blokir**: respons tetap `201` tapi menyertakan
  `warnings: [{ projectItemId, itemName, planned: total, committed: X, over: Y }]`;
  UI menampilkan toast/`Badge` kuning.
- Status PO: `DRAFT → ISSUED → COMPLETED|CANCELLED` (disimpan di `PurchaseOrder.status`).
- Endpoint: `GET|POST /api/projects/[id]/po`, `GET|PUT|DELETE /api/projects/[id]/po/[poId]`.
- Pembuatan PO + N baris **wajib** `db.$transaction`.

#### US-2.3 — Invoice dari PO

- `Invoice` dapat `poId String?` (satu PO boleh banyak invoice untuk termin/pengiriman bertahap).
- Invoice tetap boleh **tanpa PO** (perilaku lama) → `poId` nullable agar data eksisting aman.
- Upload bukti: `POST /api/upload` → simpan URL (lihat §7 untuk kompresi & multi-file).
- Validasi total invoice terhadap baris PO yang belum ditagih → **peringatan** di
  `warnings[]`, bukan `400`.

#### US-2.4 — Status pembayaran & notifikasi jatuh tempo

- `Invoice.dueDate` **sudah ada**; default dari `paymentMethod`: `CASH` → `date`, `TEMPO` → `date + 30 hari`
  (nilai net days disimpan di level `Company` — lihat Keputusan #5).
- Status turunan: `OVERDUE` bila `dueDate < now && status !== 'PAID'`.
- Widget dashboard di `DashboardHome.tsx`: kartu "Invoice Jatuh Tempo" menampilkan invoice
  dengan `dueDate <= now + 7 hari` dan yang sudah lewat, urut dari terlama; endpoint baru
  `GET /api/dashboard/invoices-due` mengembalikan `{ success, data: [...], summary: { overdue, dueSoon } }`.
- Pembayaran parsial lewat model `Payment`; `Invoice.status` diperbarui otomatis:
  `sum(payment.amount) === invoiceTotal` → `PAID`, `> 0` → `PARTIAL`, `0` → `UNPAID`.
  Nilai invoice = `sum(InvoiceItem.amount)`.

#### US-2.5 — Uang muka (DP)

- `Payment.type = 'DP'` dengan `poId` terisi dan `invoiceId = null`.
- Saat invoice final dibuat untuk PO yang sudah punya DP, kembalikan
  `sisaBayar = invoiceTotal − sum(Payment.type='DP' where poId)` di respons dan tampilkan di UI.
- Realisasi biaya **tidak** dihitung dari `Payment`, melainkan dari `RABPurchase.totalBuy`
  (satu sumber kebenaran) — DP hanya memengaruhi sisa pembayaran, agar tidak dobel hitung.

### Epic 3 — Untung-Rugi

#### US-3.1 — Ringkasan untung-rugi

- Panel "Laba / Rugi" yang sudah ada di tab **Info** (`ProjectDetail.tsx`) diperluas menjadi:

| Baris | Nilai |
|---|---|
| Nilai Kontrak | `Project.contractValue` (field baru — Keputusan #1) |
| Total RAB Rencana | `summary.totalRAB` |
| Total Realisasi | `summary.totalPurchases + totalAdditionalCosts` |
| Total Komitmen | PO `ISSUED` yang belum ditagih (`pending`), dari `PurchaseOrder` |
| Margin Rencana | Nilai Kontrak − Total RAB Rencana |
| Margin Aktual (proyeksi) | Nilai Kontrak − (Realisasi + Komitmen) |

- Breakdown per Topik: tabel Topik | Rencana | Realisasi | Komitmen | Selisih | % Terserap;
  topik dengan realisasi > rencana diberi `Badge` merah (`bg-rose-50 text-rose-600 border-rose-200`).
- Pajak yang tidak bisa dikreditkan dikonfigurasi di `Company` (bukan hardcode) — tambah
  `isPkp Boolean @default(false)` di `Company` dan terapkan sebagai faktor biaya bila perusahaan non-PKP.

### Epic 4 — Bukti Bayar & File

#### US-4.1 — Upload + kompresi bukti

- Validasi tipe: `.pdf`, `.jpg`, `.jpeg`, `.png` (whitelist MIME + ekstensi), tolak lain dengan
  `{ success:false, error:'Tipe file tidak didukung (hanya PDF/JPG/PNG)' }`.
- Gambar (JPEG/PNG): **`sharp`** (sudah ada di `package.json`) → `resize({ width: 1600, withoutEnlargement: true })`
  + `jpeg({ quality: 78 })` / `png({ compressionLevel: 9 })`, dijalankan di `POST /api/upload`
  (server) sebelum kirim ke Supabase.
- PDF: **ditunda** di fase ini (butuh Ghostscript/system dep di Vercel — Keputusan #6).
- Thumbnail: generate `width: 320` untuk gambar; untuk PDF tampilkan ikon statis (tanpa render halaman).
- Multi-file per invoice: butuh tabel lampiran (Keputusan #4). Sementara, gunakan kolom URL yang sudah
  ada: `RABPurchase.docUrl` (nota/proforma), `RABPurchase.paymentProofUrl` (bukti transfer),
  `Invoice` belum punya kolom file → **tambahkan `attachmentUrl String?`** bila tidak mau tabel baru.

### Epic 5 — Export Excel

#### US-5.1 — Export RAB (rencana vs realisasi)

- Tombol **"Export Excel"** di header tab RAB `ProjectDetail.tsx` (pola `Button variant="outline"` +
  ikon `FileDown`, seperti di `TransactionModule.tsx`).
- **Mengikuti pola eksisting**: generate di client dengan `xlsx` (`XLSX.utils.json_to_sheet` →
  `book_new` → `book_append_sheet` → `XLSX.writeFile`), **bukan** endpoint streaming server-side.
- Sheet: `"RAB Rencana vs Realisasi"`, `"Detail Transaksi"`, `"Ringkasan Untung-Rugi"` — kolom sesuai PRD.
- Nama file mengikuti pola repo: `RAB_{projectName}_{YYYYMMDD}.xlsx`
  (contoh: `RAB_Gate-ANPR-SBI-Tuban_20260919.xlsx`).
- Filter opsional: per Topik (`Select`) dan rentang tanggal transaksi (`Input type="date"`).

#### US-5.2 — Export invoice belum lunas / jatuh tempo

- Kolom: Vendor, `invoiceNumber`, `date`, `dueDate`, Jumlah, Sudah Dibayar, Sisa, Status,
  Hari Terlambat (`differenceInDays(now, dueDate)`).
- ⚠️ **Highlight baris merah muda & header bold + freeze row tidak didukung `xlsx` versi komunitas**
  yang dipakai repo. Lihat Keputusan #7.

---

## 5. Implementasi Endpoint (daftar final)

| Method & Path | Fungsi | Status |
|---|---|---|
| `GET /api/projects/[id]/rab` | item + purchases + `summary` (tambah `topics[]`) | ada, perluas |
| `POST /api/projects/[id]/rab` | tambah pembelian (baris PO) | ada, perluas |
| `PUT|DELETE /api/projects/[id]/rab/[purchaseId]` | ubah/hapus pembelian | ada, perluas |
| `GET|POST /api/projects/[id]/rab/topics` | daftar / buat topik | **baru** |
| `PUT|DELETE /api/projects/[id]/rab/topics/[topicId]` | ubah / hapus topik | **baru** |
| `GET|POST /api/projects/[id]/items` | item RAB (tambah `topicId`) | ada, perluas |
| `PUT /api/projects/[id]/items` | update batch item | ada |
| `GET|POST /api/projects/[id]/po` | daftar / buat PO + baris | **baru** |
| `GET|PUT|DELETE /api/projects/[id]/po/[poId]` | ubah / hapus PO | **baru** |
| `GET|POST /api/projects/[id]/invoices` | invoice (tambah `poId`) | ada, perluas |
| `GET|POST /api/projects/[id]/payments` | pembayaran / DP | **baru** |
| `GET /api/projects/[id]/profit-loss` | ringkasan untung-rugi + breakdown topik | **baru** |
| `GET /api/dashboard/invoices-due` | widget jatuh tempo | **baru** |
| `GET /api/projects/[id]/audit-logs` | histori revisi RAB | **baru** |

Konvensi tambahan: semua route baru memakai `interface RouteContext { params: Promise<{...}> }`,
`{ success, data }`, dan `console.error('Error ...:', error)` sebelum respons `500`.

---

## 6. Keputusan yang Perlu Diambil Sebelum Implementasi

| # | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| 1 | `nilai_kontrak` belum ada di `Project`. Sekarang "Nilai Kontrak" dihitung dari Total RAB (`poTotal`). | (a) tambah `Project.contractValue Float?`; (b) tetap pakai Total RAB | **(a)** — margin rencana mustahil dihitung tanpa nilai kontrak terpisah. Isi otomatis dari Total RAB saat pertama dibuat, lalu bisa diubah manual |
| 2 | `Project.poNumber` saat ini = nomor PO **dari klien**. PRD memakai `nomor_po` untuk PO **ke vendor**. | (a) `PurchaseOrder.poNumber` terpisah; (b) re-use | **(a)** — jangan campur; UI beri label "No. PO Klien" vs "No. PO Vendor" |
| 3 | PRD minta soft delete untuk Topik. Repo tidak memakai soft delete sama sekali. | (a) tambah `deletedAt`; (b) blokir hapus bila masih ada item | **(b)** — konsisten dengan repo, lebih sedikit efek samping |
| 4 | PRD minta multi-file per invoice. Eksisting 1 kolom URL per jenis. | (a) model `Attachment` (entity, entityId, url, type); (b) tambah kolom URL terpisah | **(a)** — lebih fleksibel & dipakai ulang untuk PO/DP/invoice |
| 5 | Default jatuh tempo (net days) | (a) konstanta di kode; (b) field di `Company` (`defaultDueDays Int @default(30)`) | **(b)** — PRD sendiri minta konfigurasi di level perusahaan |
| 6 | Kompresi PDF via Ghostscript | (a) kerjakan sekarang (butuh system dep); (b) tunda, hanya terima PDF apa adanya | **(b)** untuk fase ini |
| 7 | Styling Excel (header bold, freeze row, baris merah muda) | (a) tambah `exceljs`; (b) pakai `xlsx` tanpa styling; (c) fork `xlsx-js-style` | **(a)** bila styling wajib; **(b)** bila cukup data mentah. `xlsx` komunitas **tidak bisa** styling |
| 8 | Migrasi data RAB lama | Data `ProjectItem`/`RABPurchase` eksisting tidak punya topik/PO | Beri grup "Tanpa Topik" & `poId = null` (backward compatible); jangan migrasi paksa |

---

## 7. Catatan Implementasi

1. **Jangan** menyimpan nilai turunan (total per topik, margin, `OVERDUE`, sisa bayar) di kolom
   database — hitung di route/service. Satu-satunya pengecualian yang sudah ada di repo:
   `ProjectItem.total` dan `RABPurchase.totalBuy` (dihitung lalu disimpan saat create/update);
   pertahankan konsistensi itu agar query daftar tetap cepat.
2. **DB transaction** wajib untuk: `PurchaseOrder` + baris `RABPurchase`; `Invoice` + `InvoiceItem` +
   `InvoiceTermin`; `Payment` + update `Invoice.status`. Pola: `db.$transaction([...])` seperti
   `api/projects/[id]/items/route.ts`.
3. **Uang** memakai `Float` (kebiasaan repo), bukan `Decimal`. Catat sebagai risiko presisi jangka
   panjang; bila nanti dipindah ke `Decimal`, lakukan menyeluruh di satu PR.
4. **Nomor dokumen** harus idempotent: hitung `count` bulan berjalan di dalam transaksi yang sama
   dengan `create` untuk menghindari duplikat saat submit bersamaan.
5. **Auth**: `src/proxy.ts` (proxy Next 16, pengganti `middleware.ts`) melindungi **semua**
   `/api/*` kecuali yang ada di `PUBLIC_API_PATHS` (`/api/auth/login`, `/logout`, `/me`, `/seed`,
   `/api/company/public`) + tepat `/api`; sedangkan `/print/*` **juga dilindungi** dan akan
   redirect ke `/` bila cookie `staff_token` tidak valid. Route baru tidak perlu didaftarkan
   kecuali memang harus publik — jangan pernah menambahkan `/api` ke `PUBLIC_API_PATHS`.
6. **Mata uang & pajak**: interaksi PKP perusahaan × PKP vendor menentukan PPN yang bisa dikreditkan.
   Simpan hanya "kena pajak + persen" di baris PO, dan hitung dampaknya di layer laporan.
7. **UI**: ikuti `docs/DASHBOARD-UI-GUIDE.md` untuk semua tabel/kartu baru (versi mobile wajib ada),
   termasuk badge status dan warna destruktif.
8. **Urutan pengerjaan yang disarankan**:
   1. Skema: `RABTopic` + `ProjectItem.topicId` + `Vendor.npwp/isPkp` + `Project.contractValue` → topik & grouping di tab RAB.
   2. `AuditLog` + badge "Direvisi" (US-1.2).
   3. `PurchaseOrder` + `RABPurchase.poId/kenaPajak/persenPajak` + peringatan over-budget (US-2.2).
   4. `Invoice.poId` + `Payment` + DP + status parsial (US-2.3–2.5).
   5. Ringkasan untung-rugi + breakdown topik (US-3.1).
   6. Widget jatuh tempo dashboard (US-2.4).
   7. Export Excel (US-5.1, 5.2) — sesuai keputusan #7.
   8. Kompresi gambar via `sharp` + (opsional) tabel `Attachment` (US-4.1).
