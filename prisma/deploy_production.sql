-- =============================================================
-- PRODUCTION MIGRATION - mahadaly
-- Applies migration 2 + 3 safely (combined)
--   20260602025019_add_wilayah_tables
--   20260603000000_remove_nisn_field
--
-- Jalankan via phpMyAdmin → Tab SQL → Execute
-- Pastikan sudah backup database sebelum menjalankan!
-- =============================================================

-- ------------------------------------------------------------
-- STEP 1: Create wilayah tables (safe: IF NOT EXISTS)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `provinsi` (
    `id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kabupaten_kota` (
    `id` INTEGER NOT NULL,
    `provinsi_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kecamatan` (
    `id` INTEGER NOT NULL,
    `kabupaten_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `desa` (
    `id` INTEGER NOT NULL,
    `kecamatan_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kode_pos` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- STEP 2: Foreign keys untuk wilayah
-- (Aman dijalankan karena table baru dibuat di step 1)
-- ------------------------------------------------------------

ALTER TABLE `kabupaten_kota`
    ADD CONSTRAINT `kabupaten_kota_provinsi_id_fkey`
    FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kecamatan`
    ADD CONSTRAINT `kecamatan_kabupaten_id_fkey`
    FOREIGN KEY (`kabupaten_id`) REFERENCES `kabupaten_kota`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `desa`
    ADD CONSTRAINT `desa_kecamatan_id_fkey`
    FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- STEP 3: Tambah kolom wilayah ke santri
-- (Jalankan satu per satu jika ada error "Duplicate column name")
-- ------------------------------------------------------------

ALTER TABLE `santri` ADD COLUMN `provinsi_id`  INTEGER      NULL;
ALTER TABLE `santri` ADD COLUMN `kabupaten_id` INTEGER      NULL;
ALTER TABLE `santri` ADD COLUMN `kecamatan_id` INTEGER      NULL;
ALTER TABLE `santri` ADD COLUMN `desa_id`      INTEGER      NULL;
ALTER TABLE `santri` ADD COLUMN `kode_pos`     VARCHAR(191) NULL;

-- ------------------------------------------------------------
-- STEP 4: Drop kolom lama (no_induk, nisn)
-- Hapus data NULL dulu untuk nik sebelum NOT NULL
-- ------------------------------------------------------------

-- Hapus no_induk
ALTER TABLE `santri` DROP COLUMN `no_induk`;

-- Safety: isi nik yang NULL dengan string kosong sebelum NOT NULL
UPDATE `santri` SET `nik` = '' WHERE `nik` IS NULL;
ALTER TABLE `santri` MODIFY `nik` VARCHAR(191) NOT NULL;

-- Drop nisn langsung (skip NOT NULL — tidak perlu karena langsung dihapus)
ALTER TABLE `santri` DROP COLUMN `nisn`;

-- ------------------------------------------------------------
-- STEP 5: Daftarkan migrations ke _prisma_migrations
-- Supaya prisma migrate deploy tidak mencoba re-apply
-- ------------------------------------------------------------

-- Buat tabel _prisma_migrations jika belum ada
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
    `id`                  VARCHAR(36)  NOT NULL,
    `checksum`            VARCHAR(64)  NOT NULL,
    `finished_at`         DATETIME(3)  NULL,
    `migration_name`      VARCHAR(255) NOT NULL,
    `logs`                TEXT         NULL,
    `rolled_back_at`      DATETIME(3)  NULL,
    `started_at`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Mark migration 2 as applied
INSERT INTO `_prisma_migrations`
    (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES
    (UUID(), 'manual-deploy', NOW(), '20260602025019_add_wilayah_tables', NULL, NULL, NOW(), 1);

-- Mark migration 3 as applied
INSERT INTO `_prisma_migrations`
    (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES
    (UUID(), 'manual-deploy', NOW(), '20260603000000_remove_nisn_field', NULL, NULL, NOW(), 1);

-- =============================================================
-- SELESAI. Lakukan npm run build + restart app setelah ini.
-- =============================================================
