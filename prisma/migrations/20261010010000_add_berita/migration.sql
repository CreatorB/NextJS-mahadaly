-- Berita: artikel per kategori + metadata postingan Instagram (tanpa token, tanpa unduh gambar).

-- CreateTable
CREATE TABLE `post_kategori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `post_kategori_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `ringkasan` TEXT NULL,
    `konten` LONGTEXT NOT NULL,
    `cover_image` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `published_at` DATETIME(3) NULL,
    `kategori_id` INTEGER NOT NULL,
    `author_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_kategori_id_status_published_at_idx`(`kategori_id`, `status`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instagram_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `kategori_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `auto_sync` BOOLEAN NOT NULL DEFAULT true,
    `last_sync_at` DATETIME(3) NULL,
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instagram_accounts_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instagram_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shortcode` VARCHAR(191) NOT NULL,
    `account_id` INTEGER NOT NULL,
    `caption` TEXT NULL,
    `posted_at` DATETIME(3) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'auto',
    `is_hidden` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instagram_posts_account_id_shortcode_key`(`account_id`, `shortcode`),
    INDEX `instagram_posts_account_id_posted_at_idx`(`account_id`, `posted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `post_kategori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instagram_accounts` ADD CONSTRAINT `instagram_accounts_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `post_kategori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instagram_posts` ADD CONSTRAINT `instagram_posts_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `instagram_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;



-- Seed kategori + akun Instagram
INSERT INTO `post_kategori` (`slug`, `nama`, `updated_at`) VALUES
  ('mahadaly', 'Ma''had Aly', CURRENT_TIMESTAMP(3)),
  ('kias', 'KIAS', CURRENT_TIMESTAMP(3));

INSERT INTO `instagram_accounts` (`username`, `kategori_id`, `updated_at`)
  SELECT 'mahadalysyathiby', id, CURRENT_TIMESTAMP(3) FROM `post_kategori` WHERE `slug` = 'mahadaly';
INSERT INTO `instagram_accounts` (`username`, `kategori_id`, `updated_at`)
  SELECT 'kias_syathiby', id, CURRENT_TIMESTAMP(3) FROM `post_kategori` WHERE `slug` = 'kias';
