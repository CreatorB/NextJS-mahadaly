-- Events (dipindah dari KIAS).

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `images` TEXT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `registration_start` DATETIME(3) NULL,
    `registration_end` DATETIME(3) NULL,
    `is_paid` BOOLEAN NOT NULL DEFAULT false,
    `price` INTEGER NOT NULL DEFAULT 0,
    `has_attendance` BOOLEAN NOT NULL DEFAULT false,
    `has_certificate` BOOLEAN NOT NULL DEFAULT false,
    `certificate_template` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `group_ikhwan` VARCHAR(500) NULL,
    `group_akhwat` VARCHAR(500) NULL,
    `group_public` VARCHAR(500) NULL,
    `quota_ikhwan` INTEGER NULL,
    `quota_akhwat` INTEGER NULL,
    `auto_accept` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_slug_key`(`slug`),
    INDEX `events_status_start_date_idx`(`status`, `start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `internal_link_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `birth_place` VARCHAR(191) NULL,
    `birth_date` DATE NULL,
    `occupation` VARCHAR(191) NULL,
    `payment_proof` VARCHAR(191) NULL,
    `payment_status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_registrations_event_id_gender_payment_status_idx`(`event_id`, `gender`, `payment_status`),
    INDEX `event_registrations_email_idx`(`email`),
    UNIQUE INDEX `event_registrations_event_id_user_id_key`(`event_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_registration_id` INTEGER NOT NULL,
    `attended_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_attendances_event_registration_id_attended_at_idx`(`event_registration_id`, `attended_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_internal_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `quota_ikhwan` INTEGER NOT NULL DEFAULT 0,
    `quota_akhwat` INTEGER NOT NULL DEFAULT 0,
    `usage_ikhwan` INTEGER NOT NULL DEFAULT 0,
    `usage_akhwat` INTEGER NOT NULL DEFAULT 0,
    `active_from` DATETIME(3) NULL,
    `active_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `event_internal_links_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_internal_link_id_fkey` FOREIGN KEY (`internal_link_id`) REFERENCES `event_internal_links`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_attendances` ADD CONSTRAINT `event_attendances_event_registration_id_fkey` FOREIGN KEY (`event_registration_id`) REFERENCES `event_registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_internal_links` ADD CONSTRAINT `event_internal_links_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


