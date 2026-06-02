/*
  Warnings:

  - You are about to drop the column `no_induk` on the `santri` table. All the data in the column will be lost.
  - Made the column `nik` on table `santri` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nisn` on table `santri` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `santri`
    ADD COLUMN `desa_id` INTEGER NULL,
    ADD COLUMN `kabupaten_id` INTEGER NULL,
    ADD COLUMN `kecamatan_id` INTEGER NULL,
    ADD COLUMN `kode_pos` VARCHAR(191) NULL,
    ADD COLUMN `provinsi_id` INTEGER NULL,
    MODIFY `nik` VARCHAR(191) NOT NULL,
    MODIFY `nisn` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `provinsi` (
    `id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kabupaten_kota` (
    `id` INTEGER NOT NULL,
    `provinsi_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kecamatan` (
    `id` INTEGER NOT NULL,
    `kabupaten_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `desa` (
    `id` INTEGER NOT NULL,
    `kecamatan_id` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kode_pos` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kabupaten_kota` ADD CONSTRAINT `kabupaten_kota_provinsi_id_fkey` FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kecamatan` ADD CONSTRAINT `kecamatan_kabupaten_id_fkey` FOREIGN KEY (`kabupaten_id`) REFERENCES `kabupaten_kota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `desa` ADD CONSTRAINT `desa_kecamatan_id_fkey` FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
