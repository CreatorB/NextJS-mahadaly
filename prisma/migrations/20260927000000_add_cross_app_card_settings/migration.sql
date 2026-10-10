-- Create cross_app_card_settings table
-- Stores content for cards that link KIAS and Mahadaly home dashboards.
-- Mahadaly is the source of truth (admin WYSIWYG editor); KIAS fetches via API.

CREATE TABLE `cross_app_card_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `subtitle` VARCHAR(200) NULL,
  `description` TEXT NULL,
  `icon_name` VARCHAR(100) NULL,
  `button_label` VARCHAR(100) NULL,
  `target_url` VARCHAR(500) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `display_order` INT NOT NULL DEFAULT 0,
  `updated_by_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `cross_app_card_settings_slug_key`(`slug`),
  INDEX `cross_app_card_settings_is_active_display_order_idx`(`is_active`, `display_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `cross_app_card_settings`
  ADD CONSTRAINT `cross_app_card_settings_updated_by_id_fkey`
  FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
