# Panduan Konsistensi UI Dashboard Admin

Dokumen ini adalah **sumber kebenaran (single source of truth)** untuk tabel, padding, spacing, dan
komponen lain di seluruh modul dashboard (`src/components/dashboard/*`).

Tujuan: setiap modul baru **wajib** mengikuti pola di dokumen ini, dan modul lama direfaktor bertahap
agar seragam. Jika ada aturan yang harus dilanggar, tulis alasannya di PR/commit message.

Referensi implementasi paling bersih saat ini: `ClientModule.tsx`, `TransactionModule.tsx`,
`ServiceModule.tsx`, `VendorModule.tsx`.

---

## 1. Skala Spacing (WAJIB)

Semua spacing memakai skala Tailwind 4px. **Jangan pakai nilai arbitrer** (`p-[13px]`, `mt-[22px]`)
kecuali untuk tinggi layout yang memang presisi (`h-16`, `h-9`).

| Token | Nilai | Pemakaian |
|---|---|---|
| `gap-1` / `gap-1.5` | 4 / 6 px | antar ikon dalam tombol, antar tombol aksi tabel |
| `gap-2` | 8 px | antar tombol toolbar, antar field pendek |
| `gap-3` | 12 px | label–value di kartu mobile, antar elemen dalam satu blok |
| `gap-4` | 16 px | grid form, grid stat card, header vs action |
| `gap-6` | 24 px | grid layout besar (dashboards, 2 kolom) |
| `space-y-2` | 8 px | label → input (selalu berpasangan) |
| `space-y-3` | 12 px | antar blok informasi dalam kartu mobile |
| `space-y-4` | 16 px | antar field dalam form/dialog |
| `space-y-6` | 24 px | **root wrapper setiap modul** |

**Aturan turunan:**

- Root setiap modul: `<div className="space-y-6">` — tanpa `p-*` (padding sudah dari `<main>`).
- Jarak section dalam modul = `space-y-6`; jarak antar elemen dalam section = `space-y-4`.
- Jarak label→input = `space-y-2` pada wrapper field.
- **Jangan** campur `space-y-*` dan `mt-*` untuk hal yang sama di sibling yang berbeda.

---

## 2. Layout Shell (jangan diubah per modul)

Sudah diatur terpusat di `DashboardLayout.tsx`:

```tsx
<main className="flex-1 p-3 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-x-hidden">
```

- Padding konten: `p-3` (mobile) → `sm:p-6` (desktop). **Modul tidak boleh menambah `p-*` di root.**
- Header atas: `h-16 ... px-4 sm:px-6`.
- Sidebar: `w-64`, item nav `px-3 py-2.5 rounded-lg text-sm font-medium`.

Pengecualian: `SettingsModule` memakai `space-y-6 max-w-5xl mx-auto` karena halaman pengaturan
memang dibatasi lebarnya. Ini satu-satunya modul yang boleh.

---

## 3. Header Modul (Page Header)

Wajib urutan ini: judul `h2` + deskripsi, lalu aksi di kanan.

```tsx
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>
    <h2 className="text-2xl font-bold tracking-tight text-foreground">Klien</h2>
    <p className="text-sm text-muted-foreground mt-1">Kelola daftar klien Anda</p>
  </div>
  <Button className="gap-2">
    <Plus className="w-4 h-4" /> Tambah Klien
  </Button>
</div>
```

- Judul: `text-2xl font-bold tracking-tight text-foreground`. Selalu `<h2>` di dalam modul
  (`<h1>` hanya dipakai sekali di `DashboardHome` sebagai sambutan).
- Deskripsi: `text-sm text-muted-foreground mt-1`.
- Aksi: `<Button>` primary tanpa `variant`; tombol sekunder `variant="outline"`.
- Ikon tombol: `w-4 h-4`.
- **JANGAN pernah menambah `mr-*` / `ml-*` pada ikon di dalam `<Button>` atau `<TabsTrigger>`.**
  Keduanya sudah punya `gap` bawaan (`gap-2`, dan `gap-1.5` untuk `size="sm"` / `TabsTrigger`),
  sehingga margin akan membuat jarak ganda (16px, bukan 8px). Cukup tulis
  `<Plus className="w-4 h-4" /> Tambah` tanpa margin.
- Jika ada 2+ tombol aksi, bungkus: `<div className="flex gap-2 w-full sm:w-auto">` dan tiap tombol
  diberi `flex-1 sm:flex-none` agar rapi di mobile.

---

## 4. Card & Padding Card

`Card` bawaan (`ui/card.tsx`) sudah punya `gap-6 py-6 rounded-xl border shadow-sm`, dan
`CardHeader` bawaan `px-6`. Untuk modul daftar kita override agar padat:

```tsx
<Card>
  <CardHeader className="p-4 sm:px-6 pb-0">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <CardTitle className="text-lg">Daftar Klien</CardTitle>
      {/* toolbar: search / filter */}
    </div>
  </CardHeader>
  <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
    {/* loading | empty | mobile cards | desktop table */}
  </CardContent>
</Card>
```

| Bagian | Class wajib |
|---|---|
| `CardHeader` (modul daftar) | `p-4 sm:px-6 pb-0` |
| `CardTitle` (modul daftar) | `text-lg` |
| `CardContent` (modul daftar) | `p-0 sm:p-6 mt-4 sm:mt-0` |
| `CardContent` (stat card) | `p-4 lg:p-5` |
| `CardHeader` non-daftar (mis. Finance tabs) | default, tanpa override `p-*` kecuali perlu |

Alasan `p-0 sm:p-6 mt-4 sm:mt-0`: di mobile tabel/kartu harus *full-bleed* sampai tepi card,
sementara di desktop kembali punya padding.

**Aturan:** jangan pernah set `<CardContent className="p-4 sm:p-6">` untuk stat card (dipakai di
`FinanceModule`) — pakai `p-4 lg:p-5` seperti `DashboardHome` agar seragam.

---

## 5. Tabel (Desktop)

Struktur wajib — tiga lapis, jangan disederhanakan:

```tsx
<div className="hidden md:block border rounded-md overflow-hidden">
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="min-w-[160px]">Nama</TableHead>
          <TableHead className="min-w-[100px] text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>...</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

**Aturan kolom & lebar:**

1. `TableHead` **selalu** pakai `min-w-[...]`, tidak boleh `w-[...]` saja (kolom akan mengkerut).
2. Header row: `bg-muted/50`.
3. Kolom tidak penting disembunyikan bertingkat: `hidden md:table-cell`, `hidden lg:table-cell`.
   Kolom utama (identitas) selalu tampil; kolom aksi selalu tampil (`text-right` / `text-center`).
4. `TableCell` bawaan sudah `whitespace-nowrap`, jadi teks panjang **wajib** diberi
   `truncate max-w-[200px]` (atau `line-clamp-2` bila boleh 2 baris).
5. Sel identitas: dua baris — `<div className="font-medium text-foreground">` + 
   `<div className="text-xs text-muted-foreground truncate max-w-[200px]">`.
6. Sel kosong ditulis `—` (em dash), bukan `-` atau string kosong.
7. Tabel data (mis. item RAB) di dalam dialog boleh pakai `<table>` HTML manual (seperti
   `ProjectForm`) karena butuh input inline, tapi tetap ikuti padding `px-3 py-2` dan
   `bg-muted/50` untuk header, serta `min-w-[...]` untuk nama item.
8. Tabel di dalam modal (mis. `TransactionFormModal`) pakai `min-w-[...]` + `TableCell className="p-2 ..."`.

---

## 6. Kartu Mobile (WAJIB mendampingi setiap tabel)

Setiap tabel data **harus** punya pasangan kartu untuk `< md`:

```tsx
<div className="md:hidden divide-y divide-border border-t border-border">
  {items.map((item) => (
    <div key={item.id} className="p-4 space-y-3">
      {/* baris 1: judul + badge status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        </div>
        <Badge variant="outline" className="shrink-0">{item.status}</Badge>
      </div>

      {/* baris 2..n: label/value */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="min-w-0">
          <p className="text-muted-foreground">PIC</p>
          <p className="truncate mt-0.5">{item.pic || '—'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Telepon</p>
          <p className="truncate mt-0.5">{item.phone || '—'}</p>
        </div>
      </div>

      {/* baris terakhir: aksi */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" className="h-9">
          <Eye className="w-4 h-4 mr-1.5" /> Detail
        </Button>
        <Button variant="outline" size="sm" className="h-9 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  ))}
</div>
```

**Aturan kartu mobile:**

| Elemen | Class |
|---|---|
| Container list | `md:hidden divide-y divide-border border-t border-border` |
| Item | `p-4 space-y-3` |
| Judul utama | `font-semibold text-sm truncate` |
| Sub-judul | `text-xs text-muted-foreground mt-0.5 truncate` |
| Label | `text-xs text-muted-foreground` |
| Value | `text-sm` + `truncate` (atau `mt-0.5` bila 2 baris) |
| Grid label/value | `grid grid-cols-2 gap-3 text-xs` (atau `grid-cols-3` bila kolomnya sempit) |
| Badge | `Badge variant="outline" className="shrink-0"` |
| Tombol aksi | `size="sm" className="h-9"` (target tap ≥ 36px) |
| Blok aksi | `flex justify-end gap-2 pt-1` |

- Tombol aksi utama = `variant="outline"` + ikon + teks (`Detail` / `Edit` sesuai aksi dominan).
- Tombol hapus = `size="sm"` + `h-9` + ikon saja + warna bahaya (`text-destructive hover:bg-destructive/10`).
- Setiap teks panjang **wajib** `truncate` atau `line-clamp-2` agar tidak merusak layout.
- Label + value selalu dibungkus `min-w-0` supaya `truncate` bekerja di dalam flex/grid.

---

## 7. Loading, Empty State, Error

**Loading** — tinggi tetap `h-48`, ikon `w-8 h-8`:

```tsx
<div className="flex items-center justify-center h-48">
  <Loader2 className="w-8 h-8 animate-spin text-primary" />
</div>
```

**Empty state** — tinggi tetap `h-32`, selalu punya judul + subjudul:

```tsx
<div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
  <p className="font-medium text-foreground">
    {search ? 'Tidak ada hasil ditemukan' : 'Belum ada data'}
  </p>
  <p className="text-sm">
    {search ? 'Coba kata kunci lain.' : 'Tambahkan data pertama Anda untuk memulai.'}
  </p>
</div>
```

**Aturan:**

- Empty state dirender **di luar** `<Table>`/card list — jangan render `<TableRow>` kosong.
- Pesan berbeda antara "belum ada data" dan "hasil pencarian kosong".
- Loading/empty/error selalu diletakkan di dalam `CardContent`, memakai `}` ternary berurutan:
  `loading ? <Loader/> : items.length === 0 ? <Empty/> : <>...</>`.
- Empty state dengan ikon + tinggi `h-48` hanya dipakai untuk panel kosong (seperti tab Finance),
  bukan untuk list data.

---

## 8. Toolbar (Search & Filter)

```tsx
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <CardTitle className="text-lg">Daftar Klien</CardTitle>
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder="Cari klien..." className="pl-9 h-9" value={search} onChange={...} />
    </div>
    {/* select filter bila ada: <Select> ... </Select> */}
  </div>
</div>
```

- Input search: wrapper `relative w-full sm:w-64`, input `pl-9 h-9`, ikon `w-4 h-4` di `left-3`.
- Filter dropdown selalu punya opsi `Semua` dengan value sentinel (`'ALL'`/`'all'`), bukan string kosong.
- Toolbar horizontal di `sm:` ke atas, menumpuk vertikal di mobile.

---

## 9. Dialog / Modal

| Tipe dialog | Class `DialogContent` |
|---|---|
| Form sederhana | `sm:max-w-lg max-h-[90vh] overflow-y-auto` |
| Form menengah | `sm:max-w-[700px] max-h-[90vh] overflow-y-auto` |
| Form besar (POS/modul) | `w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden` |
| Form besar lebar | `w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden` |
| Konfirmasi kecil | `sm:max-w-md` |

Aturan:

- **Selalu** ada `sm:max-w-*`; jangan biarkan default.
- Dialog form tinggi: **wajib** `max-h-[90vh] overflow-y-auto` (atau `flex flex-col` + body scroll
  bila header/footer ingin sticky).
- Dialog lebar di mobile: pakai `w-[95vw]`.
- Struktur isi: `DialogHeader` (title + description) → `<form className="space-y-4 mt-2">`.
- Form multi-section: `space-y-4` + `<Separator />` antar section, atau
  `<h3 className="text-lg font-semibold border-b pb-2">` untuk blok bernama.
- Grid form: `grid grid-cols-1 sm:grid-cols-2 gap-4` (pakai `sm:col-span-2` untuk field lebar).
- Setiap field: wrapper `space-y-2` + `<Label htmlFor="...">` + `<Input id="...">`.
- Overlay/Dialog tetap pakai `DialogTrigger`/state, jangan render `<div>` overlay manual.
- **Select tidak boleh** punya `SelectItem value=""` (dilarang Radix). Gunakan sentinel
  (`'__new_client__'`) dan tangani di handler.

---

## 10. Tipografi & Warna

| Peran | Class |
|---|---|
| Judul modul | `text-2xl font-bold tracking-tight text-foreground` |
| Judul section/tab | `text-lg font-semibold text-foreground` |
| Judul card | `text-lg` (daftar) / `text-base` (panel kecil) |
| Highlight angka besar | `text-2xl font-bold text-foreground` |
| Teks body | `text-sm` |
| Teks meta/caption | `text-xs text-muted-foreground` |
| Badge/tiny label | `text-[11px]` |
| Nilai moneter | `font-semibold text-sm` / `font-bold` untuk total |

Warna status (jangan improvisasi hex baru):

| Status | Class |
|---|---|
| Sukses/Selesai | `bg-emerald-50 text-emerald-600 border-emerald-200` |
| Proses/Info | `bg-blue-50 text-blue-600 border-blue-200` |
| Pending/Warning | `bg-amber-50 text-amber-600 border-amber-200` |
| Batal/Gagal | `bg-rose-50 text-rose-600 border-rose-200` |
| Netral | `bg-muted text-muted-foreground` |
| Primary | `bg-primary/10 text-primary` |

- Badge status: `Badge variant="outline"` + class di atas.
- Badge angka/count: `Badge variant="secondary" className="text-[11px]"`.
- Elemen destruktif (hapus): `text-destructive hover:bg-destructive/10` di seluruh dashboard
  (lihat status di §12).

---

## 11. Stat Cards (KPI)

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
      </div>
      <p className="text-xl lg:text-2xl font-bold text-foreground truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{sub}</p>
    </CardContent>
  </Card>
</div>
```

- Grid: **selalu** `grid grid-cols-2 lg:grid-cols-4 gap-4`.
- Ikon container: `w-9 h-9 rounded-lg` (variannya boleh `p-2` + `w-5 h-5` seperti Finance, tapi
  pilih satu gaya per halaman dan konsisten).

---

## 12. Temuan Inkonsistensi & Status Perbaikan

Audit awal 2026-09-18 — **semua item di bawah sudah diterapkan** (kecuali yang ditandai khusus).

| # | Masalah | Lokasi | Status perbaikan |
|---|---|---|---|
| 1 | Padding stat card beda: `p-4 sm:p-6` vs `p-4 lg:p-5` | `FinanceModule.tsx` | ✅ Disamakan ke `p-4 lg:p-5` |
| 2 | `CardHeader`/`CardContent` tidak di-override | `FinanceModule.tsx` (tab penjualan & kas kecil) | ✅ Pakai `p-4 sm:px-6 pb-0` + `p-0 sm:p-6 mt-4 sm:mt-0` |
| 3 | Empty state 3 varian berbeda | `ClientModule`, `TransactionModule`, `FinanceModule` | ✅ Standar §7. Varian ikon + `h-48` **tetap diizinkan untuk panel kosong** (tab Finance), bukan untuk list data |
| 4 | Loader `w-6 h-6` vs `w-8 h-8` | `ClientModule`, `ProjectModule`, `VendorModule`, `DashboardHome`, `ProjectDetail` | ✅ Semua `w-8 h-8` dengan wrapper `h-48` |
| 5 | Warna tombol hapus: `text-destructive` vs `text-rose-600` | `InventoryModule`, `ServiceModule`, `SettingsModule`, `TransactionModule` | ✅ Semua `text-destructive hover:bg-destructive/10` |
| 6 | Judul halaman tanpa `tracking-tight` | `DashboardHome`, `ProjectDetail` | ✅ Ditambahkan |
| 7 | Jarak section manual `mt-8` / `pt-4` | `DashboardHome` | ✅ Dihapus, mengandalkan root `space-y-6` |
| 8 | `CardTitle` daftar `text-base` vs `text-lg` | `DashboardHome`, `ProjectDetail` | ⚪ **Dibiarkan** — `text-base` sah untuk panel kecil/ringkasan (lihat §10) |
| 9 | Tabel belum punya versi mobile | `ProjectDetail` (RAB), `ProjectForm` (item RAB) | ✅ Kartu mobile ditambahkan; `ProjectForm` memakai `renderItemCard()` |
| 10 | Dialog tanpa batas tinggi | `ProjectDetail` (Tambah Pembelian, Konfirmasi Bayar, Tambah Biaya) | ✅ Ditambah `max-h-[90vh] overflow-y-auto` |
| 11 | Margin `mr-*`/`ml-*` pada ikon di dalam Button | 13 file dashboard | ✅ Semua dihapus (Button sudah punya `gap`) |
| 12 | Kartu mobile tanpa `border-t` | `SettingsModule` | ✅ Ditambahkan |

Catatan: garis pemisah ikon di teks inline (mis. `<AlertCircle className="inline mr-1" />` di
`ClientModule` dan `ml-2` pada teks tanggal di `ProjectDetail`) **tidak** diubah karena bukan
konteks flex — margin di sana memang diperlukan.


---

## 13. Checklist Review (tempel di PR)

- [ ] Root modul `space-y-6`, tanpa `p-*` tambahan.
- [ ] Header modul sesuai §3 (`text-2xl font-bold tracking-tight` + deskripsi `mt-1`).
- [ ] `CardHeader` = `p-4 sm:px-6 pb-0`, `CardContent` = `p-0 sm:p-6 mt-4 sm:mt-0`.
- [ ] Tabel desktop dibungkus `hidden md:block border rounded-md overflow-hidden` → `overflow-x-auto`.
- [ ] Setiap `TableHead` data punya `min-w-[...]`.
- [ ] Ada kartu mobile (`md:hidden divide-y divide-border border-t border-border`) dengan `p-4 space-y-3`.
- [ ] Tombol aksi mobile `h-9`; tombol hapus ikon-saja berwarna destruktif.
- [ ] Loading `h-48` + `w-8 h-8`; empty state `h-32` + judul & subjudul, di luar tabel.
- [ ] Semua teks panjang `truncate`/`line-clamp-2`; sel dibungkus `min-w-0` bila di flex/grid.
- [ ] Dialog punya `sm:max-w-*` dan `max-h-[90vh] overflow-y-auto` (atau `flex flex-col p-0`).
- [ ] Tidak ada `Select` dengan `value=""`.
- [ ] Tidak ada `mr-*`/`ml-*` pada ikon di dalam `<Button>` / `<TabsTrigger>` (§3).
- [ ] Warna status hanya dari palet §10.
- [ ] Sudah dicek di viewport 375px (mobile) dan 1280px (desktop).
- [ ] `npx tsc --noEmit` bersih.
