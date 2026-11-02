-- Absen kerja v2: jam kerja per pegawai (manual), kode pegawai, hari kerja,
-- dan link ijazah. Plus optimasi untuk rekap & pengaturan admin.

-- Jam kerja manual per pegawai (NULL = pakai pengaturan global).
ALTER TABLE `pegawai`
  ADD COLUMN `kode` VARCHAR(20) NULL,
  ADD COLUMN `jam_masuk` VARCHAR(8) NULL,
  ADD COLUMN `jam_pulang` VARCHAR(8) NULL,
  ADD COLUMN `toleransi_menit` INT NULL,
  ADD COLUMN `ijazah_url` VARCHAR(500) NULL;

CREATE INDEX `pegawai_kode_idx` ON `pegawai` (`kode`);

-- Hari kerja untuk perhitungan otomatis "tanpa absen" (0=Minggu ... 6=Sabtu).
ALTER TABLE `pengaturan_absensi`
  ADD COLUMN `hari_kerja` VARCHAR(32) NOT NULL DEFAULT '0,1,2,3,4,5,6';

-- Catatan Import Excel: sumber data pegawai + jejak import terakhir.
CREATE TABLE `riwayat_import_pegawai` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sumber` VARCHAR(255) NULL,
  `jumlah_pegawai` INT NOT NULL DEFAULT 0,
  `jumlah_baru` INT NOT NULL DEFAULT 0,
  `jumlah_diperbarui` INT NOT NULL DEFAULT 0,
  `catatan` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `riwayat_import_pegawai_created_at_idx` (`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
