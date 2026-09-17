# Panduan Setup Supabase (PostgreSQL + Storage)

Project **Indio** menggunakan Supabase untuk database PostgreSQL dan penyimpanan file (Storage).
Ikuti langkah berikut untuk membuat project Supabase dan menghubungkannya dengan aplikasi.

---

## 1. Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com) → **Sign in**.
2. Klik **New project**.
3. Isi:
   - **Organization**: pilih/atau buat organisasi.
   - **Project name**: `indio` (atau bebas).
   - **Database Password**: buat password kuat → **simpan baik-baik** (dipakai di connection string).
   - **Region**: pilih yang terdekat, mis. `Southeast Asia (Singapore)`.
4. Klik **Create new project** dan tunggu ±1–2 menit sampai selesai.

---

## 2. Ambil Connection String

1. Di dashboard project, buka **Project Settings → Database**.
2. Catat **Project ref** (misal `abcd1234`) dan **Region** (misal `ap-southeast-1`).
3. Scroll ke **Connection string**:
   - **URI (direct)** → untuk `DIRECT_URL` (port `5432`).
   - **Session pooler / Transaction pooler** → untuk `DATABASE_URL` (port `6543`).
4. Isi `.env` (lihat `.env.example`):

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

> Ganti `PROJECT_REF`, `DB_PASSWORD`, dan `REGION` sesuai project Anda.

---

## 3. Buat Storage Bucket

1. Buka **Storage** di menu kiri.
2. Klik **New bucket** → nama: `indio-uploads` (atau sesuaikan `SUPABASE_BUCKET` di `.env`).
3. Centang **Public bucket** (agar file bisa diakses via URL publik).
4. Klik **Create bucket**.

> File yang di-upload aplikasi akan masuk ke folder `uploads/` di dalam bucket.

---

## 4. Ambil API Keys

1. Buka **Project Settings → API**.
2. Salin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (RAHASIA — jangan pernah commit/pakai di client!)

---

## 5. Jalankan Migrasi & Seed (lokal)

```bash
# install deps (bila belum)
npm install

# generate Prisma client
npm run db:generate

# jalankan migrasi ke Supabase
npm run db:deploy

# seed data awal (admin + profil perusahaan)
# default: admin / admin123 — GANTI password default dengan env berikut:
#   PowerShell: $env:ADMIN_PASSWORD="PasswordKuat123"; npm run db:seed
#   Bash:       ADMIN_PASSWORD="PasswordKuat123" npm run db:seed
npm run db:seed
```

> Sebelum menjalankan `npm run db:deploy`, pastikan `DATABASE_URL` & `DIRECT_URL` di `.env` sudah benar.

---

## 6. Deploy ke Vercel

1. Push repository ke GitHub.
2. Di [vercel.com](https://vercel.com) → **Add New → Project** → import repo.
3. Framework otomatis terdeteksi **Next.js**.
4. Tambahkan **Environment Variables** yang sama dengan `.env`:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET`
5. Klik **Deploy**.
   - `vercel.json` sudah dikonfigurasi agar menjalankan `prisma generate && prisma migrate deploy && next build`.

---

## Variabel Environment Ringkasan

| Variabel | Keterangan | Publik? |
|---|---|---|
| `DATABASE_URL` | Pooling connection (port 6543) | ❌ |
| `DIRECT_URL` | Direct connection (port 5432), untuk migrasi | ❌ |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (rahasia) | ❌ |
| `SUPABASE_BUCKET` | Nama bucket storage (default: `indio-uploads`) | ❌ |
| `NEXT_PUBLIC_APP_URL` | URL aplikasi (dev: `http://localhost:3005`) | ✅ |
