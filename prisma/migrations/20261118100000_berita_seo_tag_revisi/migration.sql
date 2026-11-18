-- Migration: management posting blog (SEO meta, kategori SEO, tag, revisi).
--
-- `posts`             : kolom SEO (meta title/description, focus keyword, keywords,
--                       canonical, robots, OG/Twitter, schema) + management
--                       (sematkan, jumlah dilihat,cover alt, terakhir diubah).
-- `post_kategori`     : deskripsi + SEO per kategori + urutan + tampil/sembunyi.
-- `post_tags`         : tag artikel.
-- `post_tags_on_posts`: junction post <-> tag.
-- `post_revisions`    : riwayat revisi ala WordPress.
--
-- Sekaligus melebarikan `judul` & `cover_image` dari VARCHAR(191) -> VARCHAR(255):
-- batas validasi zod (judul 200, cover_image 255) selama ini lebih besar dari
-- kolomnya, jadi penulisan yang panjang gagal dengan "Data too long for column".

-- 1. Kategori: deskripsi, SEO, urutan, tampil -----------------------------
ALTER TABLE `post_kategori`
  ADD COLUMN `deskripsi` TEXT NULL,
  ADD COLUMN `seo_title` VARCHAR(255) NULL,
  ADD COLUMN `seo_description` VARCHAR(320) NULL,
  ADD COLUMN `urutan` INT NOT NULL DEFAULT 0,
  ADD COLUMN `tampil` TINYINT(1) NOT NULL DEFAULT 1;

CREATE INDEX `post_kategori_tampil_urutan_idx` ON `post_kategori`(`tampil`, `urutan`);

-- Kategori lama mengikuti urutan id-nya.
UPDATE `post_kategori` SET `urutan` = `id` WHERE `urutan` = 0;

-- 2. Posts: SEO + management ----------------------------------------------
ALTER TABLE `posts`
  MODIFY COLUMN `judul` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `cover_image` VARCHAR(255) NULL,
  ADD COLUMN `cover_alt` VARCHAR(255) NULL,
  ADD COLUMN `meta_title` VARCHAR(255) NULL,
  ADD COLUMN `meta_description` VARCHAR(320) NULL,
  ADD COLUMN `focus_keyword` VARCHAR(100) NULL,
  ADD COLUMN `seo_keywords` VARCHAR(255) NULL,
  ADD COLUMN `canonical_url` VARCHAR(255) NULL,
  ADD COLUMN `noindex` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `nofollow` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `og_image` VARCHAR(255) NULL,
  ADD COLUMN `twitter_image` VARCHAR(255) NULL,
  ADD COLUMN `schema_jsonld` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `sticky` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `views` INT NOT NULL DEFAULT 0,
  ADD COLUMN `updated_by_id` INT NULL;

CREATE INDEX `posts_status_published_at_idx` ON `posts`(`status`, `published_at`);
CREATE INDEX `posts_sticky_published_at_idx` ON `posts`(`sticky`, `published_at`);
CREATE INDEX `posts_updated_by_id_idx` ON `posts`(`updated_by_id`);

ALTER TABLE `posts` ADD CONSTRAINT `posts_updated_by_id_fkey`
  FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 3. Tag + junction -------------------------------------------------------
CREATE TABLE `post_tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `deskripsi` TEXT NULL,
  `seo_title` VARCHAR(255) NULL,
  `seo_description` VARCHAR(320) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_tags_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_tags_on_posts` (
  `post_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  KEY `post_tags_on_posts_tag_id_idx` (`tag_id`),
  CONSTRAINT `post_tags_on_posts_post_id_fkey` FOREIGN KEY (`post_id`)
    REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_tags_on_posts_tag_id_fkey` FOREIGN KEY (`tag_id`)
    REFERENCES `post_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Riwayat revisi -------------------------------------------------------
CREATE TABLE `post_revisions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `ringkasan` TEXT NULL,
  `konten` LONGTEXT NOT NULL,
  `cover_image` VARCHAR(255) NULL,
  `status` VARCHAR(191) NOT NULL,
  `kategori_id` INT NOT NULL,
  `note` VARCHAR(255) NULL,
  `created_by_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `post_revisions_post_id_created_at_idx` (`post_id`, `created_at`),
  CONSTRAINT `post_revisions_post_id_fkey` FOREIGN KEY (`post_id`)
    REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_revisions_created_by_id_fkey` FOREIGN KEY (`created_by_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
