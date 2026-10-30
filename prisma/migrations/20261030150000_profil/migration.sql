-- Halaman Profil (/profil): tabel SINGLETON (satu baris, id = 1) berisi
-- profil lembaga yang disunting dari panel admin lewat editor WYSIWYG.
--   konten    = HTML (sudah tersanitasi saat disimpan API)
--   video_url = URL YouTube untuk video utama halaman profil
CREATE TABLE `profil` (
  `id` INT NOT NULL DEFAULT 1,
  `konten` LONGTEXT NOT NULL,
  `video_url` VARCHAR(255) NULL,
  `updated_by_id` INT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `profil_updated_by_id_idx` (`updated_by_id`),
  CONSTRAINT `profil_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Baris awal: isi & video bisa langsung disunting dari Panel Admin > Profil.
INSERT INTO `profil` (`id`, `konten`, `video_url`, `updated_at`)
VALUES (
  1,
  '<h2>Ma''had Aly Al-Imam Asy-Syathiby</h2><p>Ma''had Aly Al-Imam Asy-Syathiby adalah pusat pendidikan Islam yang berada di Cileungsi, Bogor, dengan fokus kajian ilmu syar''i dan bahasa Arab.</p><p>Program yang tersedia meliputi Hukum Keluarga Islam (HKI) jenjang S1 Ahwal Syakhsiyyah dengan masa studi empat tahun, serta KIAS (Kursus Ilmu Bahasa Arab dan Syar''i) yang terbuka untuk ikhwan dan akhwat.</p><p>Seluruh isi halaman ini dapat disunting sendiri melalui Panel Admin.</p>',
  'https://youtu.be/dwqXJ3kg7bs',
  NOW(3)
);
