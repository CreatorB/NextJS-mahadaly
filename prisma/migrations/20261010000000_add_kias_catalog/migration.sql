-- Katalog KIAS (dipindah dari kias.syathiby.id / DB syathiby_kias).
-- Data awal diisi lewat work/mahadaly/scripts/migrate-kias-catalog.ts

-- CreateTable
CREATE TABLE `kias_jenis_program` (
    `id` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `nama_jenis` VARCHAR(191) NOT NULL,
    `rois_qism` VARCHAR(191) NULL,
    `tagline` TEXT NULL,
    `muqoddimah` TEXT NULL,
    `kompetensi` TEXT NULL,
    `peserta` TEXT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kias_jenis_program_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_program` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_program` VARCHAR(191) NOT NULL,
    `jenis_program_id` INTEGER NOT NULL,
    `tempat_belajar` VARCHAR(191) NULL,
    `hari_belajar` VARCHAR(191) NULL,
    `waktu_belajar` VARCHAR(191) NULL,
    `durasi_belajar` INTEGER NULL,
    `persyaratan` VARCHAR(191) NULL,
    `status_psb` VARCHAR(191) NOT NULL DEFAULT 'Tutup',
    `warna` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `kias_program_jenis_program_id_idx`(`jenis_program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_kitab` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jenis_program_id` INTEGER NOT NULL,
    `nama_kitab` TEXT NOT NULL,
    `penulis` TEXT NULL,
    `kelas` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `kias_kitab_jenis_program_id_idx`(`jenis_program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_pengajar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `jk` VARCHAR(191) NULL,
    `posisi` VARCHAR(191) NULL,
    `jenis_program_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `kias_pengajar_jenis_program_id_idx`(`jenis_program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_cabang` (
    `id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `alamat` TEXT NULL,
    `no_hp` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_info_psb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun_ajaran` VARCHAR(191) NOT NULL,
    `status_psb` VARCHAR(191) NOT NULL DEFAULT 'Tutup',
    `datetime_open` DATETIME(3) NULL,
    `datetime_closed` DATETIME(3) NULL,
    `akhir_psb` DATE NULL,
    `quota_ikhwan` INTEGER NULL,
    `quota_akhwat` INTEGER NULL,
    `biaya_pendaftaran` INTEGER NOT NULL DEFAULT 150000,
    `biaya_sarana_prasarana` INTEGER NOT NULL DEFAULT 300000,
    `biaya_kuliah_perdana` INTEGER NOT NULL DEFAULT 0,
    `biaya_spp_bulanan` INTEGER NOT NULL DEFAULT 250000,
    `biaya_mutasi` INTEGER NULL,
    `biaya_transkrip` INTEGER NULL,
    `konten_psb` TEXT NULL,
    `poster_images` TEXT NULL,
    `link_group` VARCHAR(500) NULL,
    `manual_password` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kias_info_psb_tahun_ajaran_key`(`tahun_ajaran`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kias_program` ADD CONSTRAINT `kias_program_jenis_program_id_fkey` FOREIGN KEY (`jenis_program_id`) REFERENCES `kias_jenis_program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kias_kitab` ADD CONSTRAINT `kias_kitab_jenis_program_id_fkey` FOREIGN KEY (`jenis_program_id`) REFERENCES `kias_jenis_program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kias_pengajar` ADD CONSTRAINT `kias_pengajar_jenis_program_id_fkey` FOREIGN KEY (`jenis_program_id`) REFERENCES `kias_jenis_program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

