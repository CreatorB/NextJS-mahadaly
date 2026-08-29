-- AlterTable
ALTER TABLE `santri` ADD COLUMN `registration_link_id` INTEGER NULL,
                     ADD INDEX `santri_registration_link_id_idx`(`registration_link_id`);

-- CreateTable
CREATE TABLE `registration_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `quota` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `registration_links_slug_key`(`slug`),
    INDEX `registration_links_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `santri` ADD CONSTRAINT `santri_registration_link_id_fkey` FOREIGN KEY (`registration_link_id`) REFERENCES `registration_links`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_links` ADD CONSTRAINT `registration_links_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
