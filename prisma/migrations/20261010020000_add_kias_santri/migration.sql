-- Santri KIAS, notifikasi, daftar pekerjaan, relasi users.kias_santri_id.

-- AlterTable
ALTER TABLE `users` ADD COLUMN `kias_santri_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `kias_pekerjaan` (
    `id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_santri` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_registrasi` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jk` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `nisn` VARCHAR(191) NULL,
    `no_induk` VARCHAR(191) NULL,
    `tmp_lahir` VARCHAR(191) NULL,
    `tgl_lahir` DATE NULL,
    `alamat` TEXT NULL,
    `nama_ayah` VARCHAR(191) NULL,
    `no_hp_ayah` VARCHAR(191) NULL,
    `nama_ibu` VARCHAR(191) NULL,
    `no_hp_ibu` VARCHAR(191) NULL,
    `nama_wali` VARCHAR(191) NULL,
    `no_hp_wali` VARCHAR(191) NULL,
    `pendidikan` VARCHAR(191) NULL,
    `pekerjaan` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `kode_negara` VARCHAR(191) NOT NULL DEFAULT '62',
    `no_hp` VARCHAR(191) NULL,
    `hp` VARCHAR(191) NULL,
    `tahun_psb` VARCHAR(191) NOT NULL,
    `program_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Aktif',
    `photo` VARCHAR(500) NULL,
    `ktp` VARCHAR(500) NULL,
    `transfer` VARCHAR(500) NULL,
    `status_pendaftaran` VARCHAR(191) NOT NULL DEFAULT 'Menunggu',
    `alasan_penolakan` TEXT NULL,
    `tgl_verifikasi` DATETIME(3) NULL,
    `status_transfer` VARCHAR(191) NOT NULL DEFAULT 'Cek',
    `nominal_transfer` INTEGER NOT NULL DEFAULT 0,
    `kirim_notifikasi` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kias_santri_kode_registrasi_key`(`kode_registrasi`),
    INDEX `kias_santri_tahun_psb_jk_idx`(`tahun_psb`, `jk`),
    INDEX `kias_santri_program_id_idx`(`program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kias_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `kias_santri_id` INTEGER NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `kias_notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_kias_santri_id_key` ON `users`(`kias_santri_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_kias_santri_id_fkey` FOREIGN KEY (`kias_santri_id`) REFERENCES `kias_santri`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kias_santri` ADD CONSTRAINT `kias_santri_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `kias_program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kias_notifications` ADD CONSTRAINT `kias_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kias_notifications` ADD CONSTRAINT `kias_notifications_kias_santri_id_fkey` FOREIGN KEY (`kias_santri_id`) REFERENCES `kias_santri`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


