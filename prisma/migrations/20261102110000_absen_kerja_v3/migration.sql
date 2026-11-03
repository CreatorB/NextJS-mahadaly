-- Absen kerja v3: standar absensi lengkap.
--
-- 1. Shift kerja + jadwal shift mingguan per pegawai (jam kerja per hari).
-- 2. Hari libur / tanggal merah (tidak dihitung alpa).
-- 3. Pengajuan izin / sakit / cuti oleh staf + persetujuan admin.
-- 4. Jejak audit perubahan data absensi.
-- 5. Aturan otomatis: batas keterlambatan -> alpa, dan simpan alpa otomatis.

-- Aturan otomatis + shift default.
ALTER TABLE `pengaturan_absensi`
  ADD COLUMN `batas_telat_menit` INT NOT NULL DEFAULT 0,
  ADD COLUMN `batas_alpa_hari` INT NOT NULL DEFAULT 1,
  ADD COLUMN `auto_simpan_alpa` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `default_shift_id` INT NULL;

-- Sumber catatan absensi (absen | pengajuan | manual).
ALTER TABLE `absensi_kerja`
  ADD COLUMN `sumber` VARCHAR(20) NOT NULL DEFAULT 'absen';

-- Template jam kerja.
CREATE TABLE `shift` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(100) NOT NULL,
  `jam_masuk` VARCHAR(8) NOT NULL DEFAULT '07:00:00',
  `jam_pulang` VARCHAR(8) NOT NULL DEFAULT '15:00:00',
  `toleransi_menit` INT NOT NULL DEFAULT 5,
  `jam_istirahat_mulai` VARCHAR(8) NULL,
  `jam_istirahat_selesai` VARCHAR(8) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `shift_nama_key` (`nama`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Jadwal shift mingguan per pegawai (0=Minggu ... 6=Sabtu).
CREATE TABLE `jadwal_shift` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pegawai_id` INT NOT NULL,
  `hari` INT NOT NULL,
  `shift_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `jadwal_shift_pegawai_id_hari_key` (`pegawai_id`, `hari`),
  KEY `jadwal_shift_shift_id_idx` (`shift_id`),
  CONSTRAINT `jadwal_shift_pegawai_id_fkey` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `jadwal_shift_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shift` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Hari libur / tanggal merah.
CREATE TABLE `hari_libur` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tanggal` DATE NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `jenis` VARCHAR(30) NOT NULL DEFAULT 'libur',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hari_libur_tanggal_key` (`tanggal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Pengajuan izin / sakit / cuti (staf -> admin).
CREATE TABLE `pengajuan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pegawai_id` INT NOT NULL,
  `jenis` VARCHAR(20) NOT NULL,
  `tanggal_mulai` DATE NOT NULL,
  `tanggal_selesai` DATE NOT NULL,
  `keterangan` TEXT NOT NULL,
  `bukti_url` VARCHAR(500) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'menunggu',
  `alasan_verifikasi` TEXT NULL,
  `reviewed_at` DATETIME(3) NULL,
  `reviewed_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `pengajuan_pegawai_id_idx` (`pegawai_id`),
  KEY `pengajuan_status_idx` (`status`),
  CONSTRAINT `pengajuan_pegawai_id_fkey` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Jejak audit perubahan absensi.
CREATE TABLE `riwayat_absensi` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `aksi` VARCHAR(50) NOT NULL,
  `entitas` VARCHAR(30) NOT NULL,
  `entitas_id` INT NULL,
  `pegawai_id` INT NULL,
  `sebelum` TEXT NULL,
  `sesudah` TEXT NULL,
  `keterangan` TEXT NULL,
  `actor_id` INT NULL,
  `actor_nama` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `riwayat_absensi_created_at_idx` (`created_at`),
  KEY `riwayat_absensi_pegawai_id_idx` (`pegawai_id`),
  CONSTRAINT `riwayat_absensi_pegawai_id_fkey` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Shift bawaan + jam kerja global disalin ke shift default.
INSERT INTO `shift` (`nama`, `jam_masuk`, `jam_pulang`, `toleransi_menit`, `is_active`)
VALUES ('Shift Default', '07:00:00', '15:00:00', 5, 1);

UPDATE `pengaturan_absensi` p
SET p.`default_shift_id` = (
  SELECT s.`id` FROM `shift` s WHERE s.`nama` = 'Shift Default' LIMIT 1
)
WHERE p.`id` = 1;
