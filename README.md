# Ma'had Aly Al-Imam Asy-Syathiby — Sistem PSB

[MAHADALY.SYATHIBY.ID](https://mahadaly.syathiby.id)

Sistem Penerimaan Mahasiswa/i Baru (PSB) untuk Ma'had Aly Al-Imam Asy-Syathiby.  
Program Studi: Hukum Keluarga Islam (HKI) / Ahwal Syakhsiyyah S1.

**Tech Stack**: Next.js 16 · TypeScript · Tailwind CSS v4 · MySQL · Prisma 7 · JWT

---

## Daftar Isi

1. [Kebutuhan Sistem](#kebutuhan-sistem)
2. [Setup Pertama Kali (Lokal)](#setup-pertama-kali-lokal)
3. [Akun Default](#akun-default)
4. [Workflow Migrasi Database](#workflow-migrasi-database)
5. [Struktur Proyek](#struktur-proyek)
6. [Deploy ke Production](#deploy-ke-production)
7. [Checklist Go-Live](#checklist-go-live)
8. [Scripts](#scripts)
9. [Deployment ke Shared Hosting](#deployment-ke-shared-hosting)

---

## Kebutuhan Sistem

- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **MySQL** 8+ — via [Laragon](https://laragon.org) (lokal) atau hosting
- **npm** 10+

---

## Setup Pertama Kali (Lokal)

### 1. Install dependencies

```bash
cd apps/mahadaly
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://[username]:[password]@localhost:3306/mahadaly_db"
JWT_SECRET="[your_jwt_secret_min_32_chars]"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
ADMIN_EMAIL="[admin@example.com]"
ADMIN_PASSWORD="[your_secure_password]"
```

> Untuk Laragon: user `root`, password kosong, port `3306`.

### 3. Buat database & jalankan migrasi

```bash
npm run db:migrate
# Prisma otomatis membuat database mahadaly_db dan semua tabel
```

### 4. Isi data awal (seed)

```bash
npm run db:seed
# Membuat: roles, program HKI, pekerjaan, infoPsb 2026, user admin
```

### 5. Jalankan dev server

```bash
npm run dev
# Buka http://localhost:3000
```

---

## Akun Default

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | [from ADMIN_EMAIL in .env] | [from ADMIN_PASSWORD in .env] |
| Admin | admin@mahadaly.syathiby.id | [placeholder - set after seed] |
| Santri (baru daftar) | email yang didaftarkan | kode registrasi |

**Format Kode Registrasi**: `yymmdd{urutan}`  
Contoh: daftar tanggal 31 Mei 2026, orang ke-1 → `2605311`

---

## Workflow Migrasi Database

### Konsep Penting

| Perintah | Kapan dipakai | Efek |
|---------|--------------|------|
| `prisma migrate dev` | **Lokal saja** — saat ada perubahan schema | Buat file migration + terapkan ke DB |
| `prisma migrate deploy` | **Production** — saat deploy | Hanya terapkan migration yang belum berjalan |
| `prisma migrate reset` | Lokal — reset total | ⚠️ Hapus semua data! Hanya dev |
| `prisma generate` | Setelah edit schema | Regenerate Prisma client |
| `prisma studio` | Kapan saja | GUI inspector database di localhost:5555 |

### Menambah Field Baru ke Tabel

**Langkah 1 — Edit `prisma/schema.prisma`:**

```prisma
model Santri {
  // ... field yang sudah ada ...
  noWhatsappAyah String? @map("no_whatsapp_ayah")  // tambahkan baris ini
}
```

**Langkah 2 — Jalankan migrasi:**

```bash
npx prisma migrate dev --name add_no_whatsapp_ayah
```

Prisma akan: buat file SQL di `prisma/migrations/` → terapkan ke MySQL → regenerate client.

**Langkah 3 — Cek di phpMyAdmin** (opsional):  
Buka `http://localhost/phpmyadmin` → `mahadaly_db` → tabel `santri`.

### Menghapus atau Rename Field

> ⚠️ **HATI-HATI**: Menghapus field dari schema akan **drop kolom beserta datanya** saat `migrate dev`.

Untuk **rename kolom** tanpa menghapus data, gunakan `@map`:

```prisma
// Field Prisma: noHpAyah — Kolom DB: no_hp_ayah (nama kolom di DB tidak berubah)
noHpAyah String? @map("no_hp_ayah")
```

### Jika DB Lokal Tidak Sinkron

```bash
# Cek status migration
npx prisma migrate status

# Reset total (DEV ONLY — hapus semua data)
npx prisma migrate reset
npm run db:seed
```

### Inspect Database Tanpa phpMyAdmin

```bash
npx prisma studio
# Buka http://localhost:5555 — GUI tabel interaktif
```

---

## Struktur Proyek

```
apps/mahadaly/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (/)
│   │   ├── psb/                      # /psb — pendaftaran publik
│   │   │   ├── page.tsx              # Info PSB + countdown + quota
│   │   │   └── daftar/
│   │   │       ├── page.tsx          # Form 5 langkah
│   │   │       └── sukses/           # Halaman sukses + kode registrasi
│   │   ├── login/                    # /login
│   │   ├── dashboard/                # /dashboard — portal santri
│   │   ├── admin/                    # /admin — panel admin/superadmin
│   │   │   ├── dashboard/
│   │   │   ├── pendaftaran/          # List + detail + approve/reject
│   │   │   ├── pengaturan-psb/       # Settings PSB + link grup WA
│   │   │   └── superadmin/           # Kelola user & program (roleId=1)
│   │   └── api/                      # API routes
│   ├── components/
│   │   ├── ui/                       # Button, Input, Select, Badge, Card
│   │   ├── layout/                   # Navbar, Footer, Sidebar
│   │   ├── landing/                  # Section-section landing page
│   │   ├── psb/                      # Form pendaftaran (5 steps)
│   │   ├── admin/                    # Komponen panel admin
│   │   └── dashboard/                # Komponen dashboard santri
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # JWT sign/verify + cookie helpers
│   │   ├── upload.ts                 # File upload ke disk
│   │   ├── kode-registrasi.ts        # Generator kode yymmdd{n}
│   │   ├── duplicate-check.ts        # Cek pendaftar duplikat
│   │   └── validations/              # Zod schema validasi
│   ├── proxy.ts                      # Route guard (auth middleware)
│   └── types/                        # TypeScript types
├── prisma/
│   ├── schema.prisma                 # Definisi tabel & relasi
│   ├── seed.ts                       # Data awal
│   └── migrations/                   # File SQL migration (auto-generated)
├── prisma.config.ts                  # Konfigurasi koneksi Prisma
├── uploads/                          # File upload user (gitignored)
├── .env                              # Environment variables (jangan commit!)
├── .env.example                      # Template env
└── next.config.ts
```

### Alur Status Pendaftaran

```
Santri daftar → statusPendaftaran: pending
                statusTransfer:    pending

Admin verifikasi pembayaran:
  ├── Approve → statusTransfer: approved → link grup muncul di dashboard santri
  └── Reject  → statusTransfer: rejected + alasan WAJIB diisi → tampil merah di dashboard

Admin verifikasi pendaftaran:
  ├── Approve → statusPendaftaran: approved
  └── Reject  → statusPendaftaran: rejected + alasan opsional → tampil di dashboard jika ada
```

### Warna Brand

| Variable CSS | Hex | Keterangan |
|-------------|-----|-----------|
| `--color-brand-primary` | `#00367c` | Biru tua utama |
| `--color-brand-secondary` | `#00709f` | Biru medium |
| `--color-brand-accent` | `#f5ff7d` | Kuning aksen |
| `--color-brand-light` | `#35a2c9` | Biru muda |
| `--color-brand-surface` | `#f9f9f9` | Background halaman |

---

## Deploy ke Production

### Prasyarat Hosting

Next.js memerlukan **Node.js runtime**. Pilih salah satu:

| Tipe | Node.js? | Cocok? | Contoh |
|------|---------|--------|--------|
| Shared cPanel **dengan Node.js Selector** | ✅ | ✅ | Niagahoster Business, Hostinger Business |
| Shared cPanel **tanpa Node.js** | ❌ | ❌ | Tidak bisa langsung |
| VPS Ubuntu | ✅ | ✅ Ideal | DigitalOcean, Vultr, IDCloudHost VPS |
| PaaS | ✅ | ✅ Mudah | Railway, Render |

---

### Opsi A — Shared Hosting cPanel dengan Node.js Selector

#### 1. Persiapan di lokal

```bash
npm run build

# File/folder yang perlu diupload ke server:
# ✅ .next/           (hasil build)
# ✅ src/
# ✅ prisma/
# ✅ public/
# ✅ node_modules/    (atau install ulang di server)
# ✅ package.json + package-lock.json
# ✅ next.config.ts + prisma.config.ts + tsconfig.json
# ❌ uploads/         (jangan upload — dibuat otomatis di server)
# ❌ .env             (jangan upload — buat manual di server via cPanel)
```

#### 2. Upload via Git (direkomendasikan)

```bash
# Lokal
git push origin main

# Server (via SSH)
git pull
```

#### 3. Setup Node.js di cPanel

1. Login cPanel → **Node.js Selector** → **Create Application**
2. Isi konfigurasi:
   - Node.js version: `20.x`
   - Application mode: `Production`
   - Application root: `/public_html/mahadaly`
   - Application URL: `mahadaly.syathiby.id`
3. Klik **Create**

#### 4. Set Environment Variables di cPanel

Di halaman Node.js App → tambahkan satu per satu:

```
DATABASE_URL        = mysql://dbuser:dbpassword@localhost:3306/mahadaly_db
JWT_SECRET          = kunci-rahasia-production-panjang-dan-unik
JWT_EXPIRES_IN      = 7d
NEXT_PUBLIC_APP_URL = https://mahadaly.syathiby.id
UPLOAD_DIR          = /home/username/public_html/mahadaly/uploads
NODE_ENV            = production
ADMIN_EMAIL         = superadmin@mahadaly.syathiby.id
ADMIN_PASSWORD      = password-superadmin-production
```

> Buat database MySQL dulu via cPanel → **MySQL Databases** → buat DB + user → grant ALL PRIVILEGES.

#### 5. Install dependencies & migrasi di server (via SSH)

```bash
cd /home/username/public_html/mahadaly
npm install --omit=dev
npx prisma migrate deploy    # JANGAN pakai migrate dev di production!
npm run db:seed               # Hanya pertama kali saja
```

#### 6. Buat folder uploads

```bash
mkdir -p /home/username/public_html/mahadaly/uploads
chmod 755 /home/username/public_html/mahadaly/uploads
```

#### 7. Start aplikasi

Di cPanel Node.js Selector → klik **Restart**.  
Startup command: `npm start` (menjalankan `next start`).

---

### Opsi B — VPS Ubuntu + PM2

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Clone repo & setup env
git clone https://github.com/user/repo.git
cd project/apps/mahadaly
cp .env.example .env
nano .env    # isi semua nilai production

# 3. Install, migrate, seed, build
npm install --omit=dev
npx prisma migrate deploy
npm run db:seed
npm run build

# 4. Jalankan dengan PM2
pm2 start npm --name "mahadaly" -- start
pm2 save
pm2 startup    # Agar auto-start setelah server reboot
```

**Konfigurasi Nginx** (simpan di `/etc/nginx/sites-available/mahadaly.syathiby.id`):

```nginx
server {
    listen 80;
    server_name mahadaly.syathiby.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve file upload langsung via Nginx (lebih efisien)
    location /uploads/ {
        alias /home/syathiby/public_html/mahadaly.syathiby.id/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mahadaly.syathiby.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

### Opsi C — Railway (Termudah, Tanpa Kelola Server)

1. Push ke GitHub
2. Buka [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Tambah plugin **MySQL**
4. Set env vars di Railway dashboard (`DATABASE_URL` otomatis diisi dari plugin)
5. Buka Railway Shell / Console, jalankan:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
6. Deploy otomatis setiap `git push` ke main

> ⚠️ **Catatan Railway**: Filesystem Railway **tidak persisten** — folder `uploads/` akan hilang saat redeploy. Untuk production Railway, file upload perlu dipindahkan ke object storage seperti Cloudflare R2 atau AWS S3 (perlu modifikasi `src/lib/upload.ts`).

---

### Opsi D — Shared Hosting cPanel (Node.js Selector)

Tanpa Git, tanpa SSH — deploy manual dari lokal.

#### Langkah 1: Build Aplikasi di Lokal

```bash
cd apps/mahadaly
npm run build
```

Hasil build di folder `.next/`.

#### Langkah 2: Persiapan File untuk Upload

**Yang WAJIB di-upload:**
```
apps/mahadaly/
├── .next/              # Hasil build
├── src/                # Source code
├── prisma/             # Schema & migrations
├── public/             # Static assets
├── node_modules/       # Dependencies
├── package.json        # Package manifest
├── next.config.ts      # Next.js config
├── prisma.config.ts    # Prisma config
└── .env.example        # Template env
```

**Yang DI-SKIP (jangan upload):**
```
❌ .env                  # Buat manual di server
❌ uploads/              # Folder upload user — HANYA buat di server
❌ .next/cache/          # Cache hasil build — tidak perlu
❌ *.log files           # Log files
```

**Catatan:** Folder `uploads/` kosong di lokal — jangan di-zip, cukup buat folder kosong dengan nama sama di server nanti.

#### Langkah 3: Upload ke cPanel

1. **Login cPanel** → **File Manager**
2. Navigate ke folder Node.js app (misal `/public_html/mahadaly` atau `/html/mahadaly`)
3. Jika folder sudah ada (deployment sebelumnya):
   - **Rename** folder `uploads/` → `uploads-backup/` (backup data lama!)
4. Upload semua file melalui **Upload** button di File Manager
5. Extract ZIP jika perlu

#### Langkah 4: Buat Folder `uploads/` di Server

1. Di cPanel File Manager, pilih folder aplikasi
2. Klik **+ Folder** → buat folder bernama `uploads`
3. Set permission: `755` (klik kanan folder → Permissions → 0755)

#### Langkah 5: Setup Environment Variables

Tanpa SSH, semua env vars diset via Node.js Selector UI:

1. **cPanel** → **Node.js Selector**
2. Klik **Edit** (atau nama aplikasi Anda)
3. Scroll ke **Environment Variables** → klik **Add Variable**
4. Tambah satu per satu:

| Variable | Value Contoh |
|----------|-------------|
| `DATABASE_URL` | `mysql://dbuser:dbpassword@localhost:3306/mahadaly_db` |
| `JWT_SECRET` | `[random-string-min-32-chars]` |
| `JWT_EXPIRES_IN` | `7d` |
| `NEXT_PUBLIC_APP_URL` | `https://mahadaly.syathiby.id` |
| `UPLOAD_DIR` | `/home/username/public_html/mahadaly/uploads` |
| `NODE_ENV` | `production` |
| `ADMIN_EMAIL` | `superadmin@mahadaly.syathiby.id` |
| `ADMIN_PASSWORD` | `[strong-password]` |

> **Tips:** Buat MySQL database dulu via **MySQL Databases** di cPanel sebelum setup env vars.

#### Langkah 6: Setup Database di Server

1. **cPanel** → **MySQL Databases**
2. Buat database: `mahadaly_db`
3. Buat user + grant ALL PRIVILEGES
4. Di aplikasi folder, buka **phpMyAdmin** → import migration (atau jalankan via Node.js app startup)

#### Langkah 7: Jalankan Migration & Seed

Tanpa SSH, Anda perlu build pertama kali via Node.js Selector:

1. **Node.js Selector** → klik nama aplikasi
2. Klik **Restart** atau **Start**
3. Cek logs untuk error: klik **Logs**

Jika ada error migration, bisa bantu via cPanel **Terminal** (jika tersedia) atau minta hosting support.

#### Langkah 8: Verifikasi Deployment

| Checklist | Cara Cek |
|-----------|----------|
| App running | Buka `https://mahadaly.syathiby.id` — harus tampil landing page |
| Login SuperAdmin | Akses `/login` → gunakan `ADMIN_EMAIL` + `ADMIN_PASSWORD` dari env |
| Upload works | Upload foto di form PSB → cek folder `uploads/` di File Manager |
| Data persist | Cek `uploads/` masih ada file setelah restart/redeploy |

---

### Alur Update Rutin (Git-based: VPS / Railway)

```
LOKAL                                PRODUCTION
─────                                ──────────
1. Edit schema / kode
2. npx prisma migrate dev
   (hanya jika ada perubahan schema)
3. Test di lokal
4. git add + git commit + git push
                                      5. git pull
                                      6. npx prisma migrate deploy
                                         (hanya jika ada migration baru)
                                      7. npm run build
                                      8. pm2 restart mahadaly
                                         (atau Restart di cPanel)
```

### Alur Update Rutin (cPanel Manual - Tanpa Git)

```
LOKAL                                PRODUCTION
─────                                ──────────
1. Edit kode / schema
2. npm run build (jika ada perubahan kode)
   npx prisma migrate dev (jika ada perubahan schema)
3. Test di lokal
4. ZIP file yang sudah di-build
   (exclude: .env, uploads/, cache/)
5. Login cPanel → File Manager
6. Rename uploads/ → uploads-back/ (jika ada data)
7. Upload & extract ZIP
8. Buat folder uploads/ baru (jika belum ada)
9. Set permission uploads/ → 0755
10. Restart app via Node.js Selector
11. Test manually
```

---

## Checklist Go-Live

- [ ] `.env` production sudah diisi di server (tidak di-commit ke git)
- [ ] `JWT_SECRET` production **berbeda** dari development
- [ ] `NODE_ENV=production`
- [ ] Database MySQL production sudah dibuat + user sudah dapat privileges
- [ ] `npx prisma migrate deploy` berhasil tanpa error
- [ ] `npm run db:seed` sudah dijalankan (sekali saja)
- [ ] `npm run build` berhasil tanpa error
- [ ] Folder `uploads/` ada di server dan writable (`chmod 755`)
- [ ] Domain/subdomain sudah mengarah ke aplikasi
- [ ] Test login admin: `admin@mahadaly.syathiby.id` / `[password dari seed]`
- [ ] Test login superadmin (dari nilai env `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- [ ] Test registrasi santri di `/psb` lengkap dengan upload semua file
- [ ] Test approve/reject transfer di `/admin/pendaftaran/[kode]`
- [ ] Test link grup muncul di dashboard santri setelah transfer di-approve
- [ ] Test halaman `/psb` menampilkan countdown / quota / pesan tutup sesuai kondisi

---

## Scripts

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Build production
npm run start        # Jalankan production build
npm run db:migrate   # Buat & terapkan migration baru (LOKAL SAJA)
npm run db:seed      # Isi data awal
npm run db:studio    # Buka Prisma Studio GUI (http://localhost:5555)
```

---

## Deployment ke Shared Hosting

### Database Setup & Migration

#### Environment Variables Setup

**Untuk koneksi ke production database dari lokal:**

```powershell
# PowerShell (Windows)
$env:DATABASE_URL="mysql://[DB_USER]:[DB_PASSWORD]@[DB_HOST]:3306/[DB_NAME]"
$env:ADMIN_EMAIL="[ADMIN_EMAIL]"
$env:ADMIN_PASSWORD="[ADMIN_PASSWORD]"

# Linux/Mac (bash)
export DATABASE_URL="mysql://[DB_USER]:[DB_PASSWORD]@[DB_HOST]:3306/[DB_NAME]"
export ADMIN_EMAIL="[ADMIN_EMAIL]"
export ADMIN_PASSWORD="[ADMIN_PASSWORD]"
```

#### Seed Database (Pertama Kali)

**Prerequisites:**
```bash
npm install -D tsx
```

**Jalankan seed:**
```bash
cd apps/mahadaly
npx tsx prisma/seed.ts
```

**Output yang diharapkan:**
```
✓ Roles seeded
✓ Program seeded
✓ Pekerjaan seeded
✓ InfoPsb seeded
✓ SuperAdmin seeded
✓ Admin seeded
✅ Seed complete.
```

#### Reset Database (Drop + Recreate)

**Hati-hati: Ini akan menghapus SEMUA data!**

```bash
cd apps/mahadaly

# Setup env vars
$env:DATABASE_URL="mysql://[DB_USER]:[DB_PASSWORD]@[DB_HOST]:3306/[DB_NAME]"

# Reset database (drop semua tables + recreate)
npx prisma migrate reset

# Seed ulang
npx tsx prisma/seed.ts
```

---

### Schema Changes Workflow

#### Opsi A: Prisma Migrate Deploy (Recommended)

**Untuk development (lokal):**
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_no_whatsapp_ayah

# 3. Test di lokal
npm run dev

# 4. Commit & push
git add prisma/migrations/
git commit -m "feat: add no_whatsapp_ayah field"
git push
```

**Untuk production (server):**
```bash
cd apps/mahadaly
# Setup env vars (lihat di atas)
npx prisma migrate deploy
```

#### Opsi B: Manual SQL via phpMyAdmin (Tanpa Prisma CLI di Server)

**Step 1: Generate SQL di Lokal**
```bash
cd apps/mahadaly
npx prisma migrate dev --create-only --name add_no_whatsapp_ayah
```

**Step 2: Copy SQL File**
File akan ada di: `prisma/migrations/xxxxxx_add_no_whatsapp_ayah/migration.sql`

**Step 3: Upload SQL via phpMyAdmin**
1. Login cPanel → phpMyAdmin
2. Pilih database `[DB_NAME]`
3. Tab **SQL** → paste isi file migration.sql
4. Klik **Go**

**Step 4: Generate Prisma Client (setelah DB update)**
```bash
cd apps/mahadaly
npx prisma generate
npm run build
```

---

### Production Build & Deploy

#### Step 1: Build di Lokal

```bash
cd apps/mahadaly

# Install dependencies
npm install

# Build production
npm run build

# Prepare deploy folder
rm -rf deploy
mkdir -p deploy

# Copy standalone output
cp -r .next/standalone/* deploy/
cp -r .next/static deploy/.next/static
cp -r public deploy/public
```

#### Step 2: Setup Node.js Selector di cPanel

**Di Setup Node.js App:**

| Setting | Value |
|---------|-------|
| Node.js version | 22 |
| Application mode | Production |
| Application root | `/home/syathiby/nodes/mahadaly` |
| Application startup file | `server.js` |

**Langkah:**
1. Login cPanel → **Node.js Selector**
2. Klik **Create Application**
3. Isi sesuai tabel di atas
4. Klik **Create**
5. Klik **Run NPM Install**
6. Set **Environment Variables** satu per satu

#### Step 3: Upload ke Server

**Via cPanel File Manager:**

1. ZIP folder `deploy/` → `deploy.zip`
2. Upload ke `/home/syathiby/nodes/mahadaly/`
3. Extract (replace yang lama)
4. **Jangan overwrite:** `.env` (buat manual di Node.js Selector)

**Via FTP/SCP:**
```bash
# Upload folder deploy ke server
scp -r deploy/* user@server:/home/syathiby/nodes/mahadaly/
```

#### Step 4: Server Setup

**Environment Variables (Node.js Selector UI):**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `mysql://[DB_USER]:[DB_PASSWORD]@localhost:3306/[DB_NAME]` |
| `JWT_SECRET` | `[JWT_SECRET]` |
| `JWT_EXPIRES_IN` | `7d` |
| `NEXT_PUBLIC_APP_URL` | `https://mahadaly.syathiby.id` |
| `NODE_ENV` | `production` |
| `ADMIN_EMAIL` | `[ADMIN_EMAIL]` |
| `ADMIN_PASSWORD` | `[ADMIN_PASSWORD]` |
| `UPLOAD_DIR` | `/home/syathiby/public_html/mahadaly.syathiby.id/uploads` |

#### Step 5: Restart App

1. Node.js Selector → klik app `mahadaly.syathiby.id`
2. Klik **Restart**

#### Step 6: Verify Deployment

| Checklist | URL | Expected |
|-----------|-----|----------|
| Landing page | `/` | Halaman utama tampil |
| PSB info | `/psb` | Info PSB + quota tampil |
| Login | `/login` | Form login muncul |
| Admin dashboard | `/admin` | Redirect ke login jika belum auth |

---

### Troubleshooting

| Error | Solution |
|-------|----------|
| `P1001: Can't reach database server` | Pastikan firewall MySQL buka untuk IP lokal / whitelist IP |
| `ECONNREFUSED` di fetch | Jangan fetch ke `NEXT_PUBLIC_APP_URL` — pakai direct Prisma call di server component |
| `Failed to parse URL` | Next.js 16 tidak support relative URL di `fetch()` — call function langsung |
| `Cannot find module '/npm'` | Startup file di Node.js Selector salah — set ke `npm start` |
| `BrokenPipeError` | Restart app di Node.js Selector |
