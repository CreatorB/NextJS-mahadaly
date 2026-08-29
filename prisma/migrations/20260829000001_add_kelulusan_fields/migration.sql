-- AlterTable
ALTER TABLE `santri`
  ADD COLUMN `kelulusan` VARCHAR(50) NULL,
  ADD COLUMN `predikat` VARCHAR(100) NULL,
  ADD COLUMN `catatan` TEXT NULL,
  ADD COLUMN `kelulusan_at` DATETIME(3) NULL;
