-- Katalog program publik: sumber kebenaran untuk /psb (hub), /program/[slug],
-- navigasi, sitemap, dan rekap jumlah pendaftar.
-- Data & daftarSantri TIDAK digabung (tetap di `santri` dan `kias_santri`).
CREATE TABLE `program_katalog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `jenjang` VARCHAR(191) NULL,
  `ringkasan` TEXT NULL,
  `jenis_sistem` VARCHAR(50) NOT NULL DEFAULT 'mahadaly',
  `daftar_path` VARCHAR(191) NULL,
  `label_filter` VARCHAR(191) NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  `tampil_di_psb` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_katalog_slug_key` (`slug`),
  KEY `program_katalog_tampil_di_psb_urutan_idx` (`tampil_di_psb`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed dua program yang sedang aktif
INSERT INTO `program_katalog`
  (`slug`, `nama`, `jenjang`, `ringkasan`, `jenis_sistem`, `daftar_path`, `label_filter`, `urutan`, `tampil_di_psb`, `created_at`, `updated_at`)
VALUES
  ('hki', 'Hukum Keluarga Islam (HKI) — Ahwal Syakhsiyyah', 'S1',
   'Ma''had Aly — S1 Ahwal Syakhsiyyah, 4 tahun (8 semester) untuk yang sudah bisa berbahasa Arab pasif.',
   'mahadaly', '/psb/daftar', 'Ma''had Aly', 1, 1, NOW(3), NOW(3)),
  ('kias', 'Kursus Ilmu Bahasa Arab & Syar''i (KIAS)', 'Kursus Bertahap',
   'Dari belajar baca Al-Qur''an, bahasa Arab, hingga membaca kitab ulama. Tanpa syarat ijazah, untuk ikhwan & akhwat.',
   'kias', '/kias/daftar', 'KIAS', 2, 1, NOW(3), NOW(3));
