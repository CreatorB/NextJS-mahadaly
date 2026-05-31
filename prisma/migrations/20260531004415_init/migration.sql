-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_role` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `roles_nama_role_key`(`nama_role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `santri_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_santri_id_key`(`santri_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_program` VARCHAR(191) NOT NULL,
    `status_psb` VARCHAR(191) NOT NULL DEFAULT 'Tutup',
    `keterangan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pekerjaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `info_psb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun_ajaran` VARCHAR(191) NOT NULL,
    `status_psb` VARCHAR(191) NOT NULL DEFAULT 'Tutup',
    `datetime_open` DATETIME(3) NULL,
    `datetime_closed` DATETIME(3) NULL,
    `quota_ikhwan` INTEGER NULL,
    `quota_akhwat` INTEGER NULL,
    `biaya_pendaftaran` INTEGER NOT NULL DEFAULT 150000,
    `biaya_pangkal` INTEGER NOT NULL DEFAULT 5250000,
    `biaya_kuliah_semester` INTEGER NOT NULL DEFAULT 3000000,
    `biaya_cicilan_bulanan` INTEGER NOT NULL DEFAULT 500000,
    `konten_psb` TEXT NULL,
    `poster_images` TEXT NULL,
    `link_group` VARCHAR(191) NULL,
    `manual_password` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `info_psb_tahun_ajaran_key`(`tahun_ajaran`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `santri` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_registrasi` VARCHAR(191) NOT NULL,
    `no_induk` VARCHAR(191) NULL,
    `nik` VARCHAR(191) NULL,
    `nisn` VARCHAR(191) NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jk` VARCHAR(191) NOT NULL,
    `tmp_lahir` VARCHAR(191) NOT NULL,
    `tgl_lahir` DATETIME(3) NOT NULL,
    `alamat` TEXT NOT NULL,
    `nama_ayah` VARCHAR(191) NULL,
    `no_hp_ayah` VARCHAR(191) NULL,
    `nama_ibu` VARCHAR(191) NULL,
    `no_hp_ibu` VARCHAR(191) NULL,
    `nama_wali` VARCHAR(191) NULL,
    `no_hp_wali` VARCHAR(191) NULL,
    `pendidikan` VARCHAR(191) NOT NULL,
    `pekerjaan_id` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `kode_negara` VARCHAR(191) NOT NULL DEFAULT '62',
    `no_hp` VARCHAR(191) NOT NULL,
    `hp` VARCHAR(191) NOT NULL,
    `tahun_psb` VARCHAR(191) NOT NULL,
    `program_id` INTEGER NOT NULL,
    `status_pendaftaran` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `alasan_pendaftaran` TEXT NULL,
    `status_transfer` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `alasan_transfer` TEXT NULL,
    `nominal_transfer` DECIMAL(65, 30) NULL,
    `tgl_verifikasi` DATETIME(3) NULL,
    `photo` VARCHAR(191) NULL,
    `ktp` VARCHAR(191) NULL,
    `transfer` VARCHAR(191) NULL,
    `ijazah` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `santri_kode_registrasi_key`(`kode_registrasi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `santri_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_santri_id_fkey` FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `santri` ADD CONSTRAINT `santri_pekerjaan_id_fkey` FOREIGN KEY (`pekerjaan_id`) REFERENCES `pekerjaan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `santri` ADD CONSTRAINT `santri_tahun_psb_fkey` FOREIGN KEY (`tahun_psb`) REFERENCES `info_psb`(`tahun_ajaran`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `santri` ADD CONSTRAINT `santri_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_santri_id_fkey` FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
