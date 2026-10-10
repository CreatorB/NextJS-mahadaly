-- Seed default cross-app cards
-- Pattern: Mahadaly = source of truth for card content
--   card_kias = displayed on Mahadaly home, links to teskias.syathiby.id
--   card_hki  = displayed on KIAS home, fetched by KIAS from API, links to tesmahadaly.syathiby.id/psb
--
-- Staging URLs only (per user directive 2026-09-27: tes dulu, prod setelah ACC).
-- Production URLs (kias.syathiby.id, mahadaly.syathiby.id/psb) akan di-switch
-- setelah staging full test ACC.

INSERT INTO `cross_app_card_settings`
  (`slug`, `title`, `subtitle`, `description`, `icon_name`, `button_label`, `target_url`, `is_active`, `display_order`)
VALUES
  (
    'card_kias',
    'KIAS',
    'Kursus Ilmu bahasa Arab & Syar''i',
    'Program bahasa Arab & ilmu syar''i untuk santri dan umum. Tersedia kelas reguler dan intensif dengan pengajar berpengalaman.',
    'BookOpen',
    'Lihat Program',
    'https://teskias.syathiby.id',
    TRUE,
    1
  ),
  (
    'card_hki',
    'Program HKI',
    'Halaqah Keluarga Islam',
    'Program pendidikan keluarga Islam (HKI) Ma''had Aly. Pendaftaran Mahasiswa/i Baru Program Studi Hukum Keluarga Islam.',
    'Users',
    'Daftar Sekarang',
    'https://tesmahadaly.syathiby.id/psb',
    TRUE,
    1
  );
