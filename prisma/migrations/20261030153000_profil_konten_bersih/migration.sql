-- Bersihkan kalimat penutup dari isi profil default.
-- Kalimat "Seluruh isi halaman ini dapat disunting sendiri melalui Panel Admin."
-- diminta user untuk dihapus dari isi halaman /profil.
-- Migrasi 20261030150000_profil TIDAK diubah (sudah applied ke lokal & staging) →
-- koreksi isi dilakukan lewat UPDATE di migrasi ini.
UPDATE `profil`
SET `konten` = '<h2>Ma''had Aly Al-Imam Asy-Syathiby</h2><p>Ma''had Aly Al-Imam Asy-Syathiby adalah pusat pendidikan Islam yang berada di Cileungsi, Bogor, dengan fokus kajian ilmu syar''i dan bahasa Arab.</p><p>Program yang tersedia meliputi Hukum Keluarga Islam (HKI) jenjang S1 Ahwal Syakhsiyyah dengan masa studi empat tahun, serta KIAS (Kursus Ilmu Bahasa Arab dan Syar''i) yang terbuka untuk ikhwan dan akhwat.</p>'
WHERE `id` = 1;
