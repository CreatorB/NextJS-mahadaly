-- Fitur ABSEN KERJA untuk staf (pegawai) Ma'had Aly.
--
-- 1. Role `pegawai` (akun login staf, role id 5).
-- 2. Master data pegawai (dari DATA PEGAWAI MAHAD ALY.xlsx, bisa disunting admin).
-- 3. Absensi kerja: satu baris per pegawai per tanggal (jam masuk & jam pulang).
-- 4. Pengaturan absensi (singleton id = 1): jam kerja, toleransi telat,
--    titik koordinat ma'had + radius GPS, daftar IP Wi-Fi yang diizinkan.

-- Role pegawai (akun staf untuk absen kerja).
INSERT IGNORE INTO `roles` (`id`, `nama_role`) VALUES (5, 'pegawai');

-- Master data pegawai.
CREATE TABLE `pegawai` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `jabatan` VARCHAR(191) NULL,
  `no_hp` VARCHAR(20) NULL,
  `email` VARCHAR(191) NULL,
  `nik` VARCHAR(20) NULL,
  `jk` VARCHAR(20) NULL,
  `tmp_lahir` VARCHAR(100) NULL,
  `tgl_lahir` DATE NULL,
  `pendidikan` VARCHAR(191) NULL,
  `status_pernikahan` VARCHAR(50) NULL,
  `alamat` TEXT NULL,
  `tahun_bergabung` VARCHAR(50) NULL,
  `kontak_keluarga` VARCHAR(191) NULL,
  `foto_url` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pegawai_user_id_idx` (`user_id`),
  KEY `pegawai_no_hp_idx` (`no_hp`),
  KEY `pegawai_nama_idx` (`nama`),
  CONSTRAINT `pegawai_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Absensi kerja: satu baris per pegawai per tanggal.
CREATE TABLE `absensi_kerja` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pegawai_id` INT NOT NULL,
  `tanggal` DATE NOT NULL,
  `jam_masuk` DATETIME(3) NULL,
  `jam_pulang` DATETIME(3) NULL,
  `metode` VARCHAR(10) NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `jarak_meter` INT NULL,
  `ip` VARCHAR(64) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'hadir',
  `keterangan` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `absensi_kerja_pegawai_tanggal_idx` (`pegawai_id`, `tanggal`),
  KEY `absensi_kerja_tanggal_idx` (`tanggal`),
  CONSTRAINT `absensi_kerja_pegawai_id_fkey` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Pengaturan absensi kerja (singleton, id = 1).
CREATE TABLE `pengaturan_absensi` (
  `id` INT NOT NULL DEFAULT 1,
  `jam_masuk` VARCHAR(8) NOT NULL DEFAULT '07:00:00',
  `jam_pulang` VARCHAR(8) NOT NULL DEFAULT '15:00:00',
  `toleransi_menit` INT NOT NULL DEFAULT 5,
  `latitude` DECIMAL(10, 7) NOT NULL DEFAULT -6.3951467,
  `longitude` DECIMAL(10, 7) NOT NULL DEFAULT 106.9622492,
  `radius_meter` INT NOT NULL DEFAULT 200,
  `wifi_ips` VARCHAR(255) NOT NULL DEFAULT '103.178.146.98',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Titik awal: koordinat Ma'had Imam Syathiby (Jl. Pahlawan, Cileungsi, Bogor)
-- + radius 200 m + IP Wi-Fi ma'had. Bisa disunting dari Panel Admin.
INSERT IGNORE INTO `pengaturan_absensi` (`id`, `jam_masuk`, `jam_pulang`, `toleransi_menit`, `latitude`, `longitude`, `radius_meter`, `wifi_ips`)
VALUES (1, '07:00:00', '15:00:00', 5, -6.3951467, 106.9622492, 200, '103.178.146.98');
