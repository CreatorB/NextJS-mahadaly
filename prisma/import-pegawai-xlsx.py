#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Konversi "DATA PEGAWAI MAHAD ALY.xlsx" -> prisma/data/pegawai.json

Pakai:  python prisma/import-pegawai-xlsx.py [path_xlsx] [path_json]

Skrip ini idempoten: boleh dijalankan ulang setiap kali admin memperbarui
Excel. Hasilnya dipakai oleh `prisma/import-pegawai.ts` (tsx) untuk
menyuntik data ke database.

Aturan nomor WhatsApp
---------------------
Sumber utama: kolom "No Whatsapp" (format +62). Kolom "Nomor WA aktif"
dipakai sebagai cadangan bila kolom utama kosong.

Bila satu nomor dipakai lebih dari satu pegawai, nomor tersebut TIDAK
dipakai untuk semuanya (nomor WA dipakai sebagai identitas login, jadi
harus unik). Untuk pegawai yang bentrok:
  1. pakai nomor lama (kolom "Nomor WA aktif") bila kolom itu punya nomor
     unik di seluruh sheet;
  2. bila tidak ada nomor unik, nomor dikosongkan (pegawai tetap bisa
     login lewat email, dan admin bisa mengisinya lewat Panel Admin).
Semua bentrok dicatat di "catatan" pada hasil JSON.
"""

import json
import os
import re
import sys
from datetime import datetime

try:
    import openpyxl
except ImportError:  # pragma: no cover
    sys.stderr.write("ERROR: module 'openpyxl' belum terpasang. Jalankan: pip install openpyxl\n")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_XLSX = os.path.join(
    os.path.dirname(ROOT), "..", "docs", "mahadaly", "DATA PEGAWAI MAHAD ALY.xlsx"
)
DEFAULT_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "pegawai.json")

HEADER_ROW = 5  # baris judul kolom pada file Google Form

BULAN = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11, "desember": 12,
    "january": 1, "february": 2, "march": 3, "may": 5, "june": 6, "july": 7,
    "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}


def bersih(v):
    """Nilai sel -> string rapi; None/kosong/"-" jadi None."""
    if v is None:
        return None
    s = str(v).strip()
    if not s or s in {"-", "--", "N/A", "n/a", "null", "None"}:
        return None
    return s


def nomor_wa(v):
    """Nomor WA -> bentuk kanonik 08xxxxxxxxx."""
    s = bersih(v)
    if not s:
        return ""
    digits = re.sub(r"\D", "", s)
    if not digits:
        return ""
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("62"):
        digits = "0" + digits[2:]
    elif digits.startswith("8") and len(digits) >= 10:
        digits = "0" + digits
    return digits


def parse_lahir(v):
    """'Tempat, Tanggal Lahir' -> (tempat_lahir, 'YYYY-MM-DD' atau None)."""
    s = bersih(v)
    if not s:
        return None, None
    if "," in s:
        bagian = [b.strip() for b in s.split(",", 1)]
        tempat = bagian[0] or None
        sisa = bagian[1].strip()
    else:
        tempat = None
        sisa = s.strip()

    m = re.match(r"^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$", sisa)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return tempat, datetime(y, mo, d).strftime("%Y-%m-%d")
        except ValueError:
            return tempat, None

    m = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", sisa)
    if m:
        d = int(m.group(1))
        mo = BULAN.get(m.group(2).lower())
        y = int(m.group(3))
        if mo:
            try:
                return tempat, datetime(y, mo, d).strftime("%Y-%m-%d")
            except ValueError:
                return tempat, None
        return tempat, None

    return tempat, None


def main():
    xlsx = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(DEFAULT_XLSX)
    out = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.abspath(DEFAULT_JSON)

    if not os.path.isfile(xlsx):
        sys.stderr.write(f"ERROR: file XLSX tidak ditemukan: {xlsx}\n")
        sys.exit(1)

    wb = openpyxl.load_workbook(xlsx, data_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))

    if len(rows) < HEADER_ROW:
        sys.stderr.write("ERROR: baris judul kolom tidak ditemukan.\n")
        sys.exit(1)

    header = [bersih(h) for h in rows[HEADER_ROW - 1]]

    def find(*prefixes):
        """Cari indeks kolom berdasarkan awalan nama kolom (case-insensitive)."""
        for pref in prefixes:
            for i, h in enumerate(header):
                if h and h.lower().startswith(pref.lower()):
                    return i
        return None

    idx = {
        "kode": find("No"),
        "nama": find("Nama (sesuai KTP)"),
        "foto": find("Pas Foto"),
        "jabatan": find("Posisi dan Jabatan"),
        "wa_lama": find("Nomor WA"),
        "email": find("Email"),
        "nik": find("Nomor KTP"),
        "jk": find("Jenis Kelamin"),
        "lahir": find("Tempat, Tanggal Lahir"),
        "wa_baru": find("No Whatsapp", "No WhatsApp", "Nomor Whatsapp"),
        "pendidikan": find("Pendidikan Terakhir"),
        "ijazah": find("Upload Ijazah"),
        "nikah": find("Status Pernikahan"),
        "alamat": find("Alamat Domisili"),
        "bergabung": find("Tahun Bergabung"),
        "keluarga": find("Anggota Keluarga"),
    }

    if idx["nama"] is None:
        sys.stderr.write("ERROR: kolom 'Nama (sesuai KTP)' tidak ditemukan.\n")
        sys.exit(1)

    def val(row, key):
        i = idx.get(key)
        if i is None or i >= len(row):
            return None
        return row[i]

    # --- Kumpulkan baris mentah ---
    mentah = []
    for row in rows[HEADER_ROW:]:
        nama = bersih(val(row, "nama"))
        if not nama:
            continue
        tempat, tgl_lahir = parse_lahir(val(row, "lahir"))
        mentah.append(
            {
                "kode": bersih(val(row, "kode")),
                "nama": nama,
                "jabatan": bersih(val(row, "jabatan")),
                "noHp": nomor_wa(val(row, "wa_baru")),
                "noHpCadangan": nomor_wa(val(row, "wa_lama")),
                "noHpMentah": bersih(val(row, "wa_baru")),
                "email": bersih(val(row, "email")),
                "nik": bersih(val(row, "nik")),
                "jk": bersih(val(row, "jk")),
                "tmpLahir": tempat,
                "tglLahir": tgl_lahir,
                "pendidikan": bersih(val(row, "pendidikan")),
                "statusPernikahan": bersih(val(row, "nikah")),
                "alamat": bersih(val(row, "alamat")),
                "tahunBergabung": bersih(val(row, "bergabung")),
                "kontakKeluarga": bersih(val(row, "keluarga")),
                "fotoUrl": bersih(val(row, "foto")),
                "ijazahUrl": bersih(val(row, "ijazah")),
            }
        )

    # --- Resolusi nomor WA yang bentrok ---
    # Nomor WA dipakai sebagai identitas login, jadi harus unik.
    # Frekuensi dihitung dari SELURUH nomor yang muncul di sheet (kolom baru + kolom lama).
    catatan = []
    semua = {}
    for d in mentah:
        for no in (d["noHp"], d["noHpCadangan"]):
            if no:
                semua[no] = semua.get(no, 0) + 1

    dipakai = set()
    for d in mentah:
        no = d["noHp"]
        if not no:
            continue
        if no in dipakai:
            # Nomor ini sudah dipakai pegawai sebelumnya -> cari nomor cadangan unik.
            cadangan = d["noHpCadangan"]
            if cadangan and semua.get(cadangan, 0) == 1 and cadangan not in dipakai:
                catatan.append(
                    f"{d['nama']}: nomor {no} dipakai lebih dari satu pegawai. "
                    f"Dipakai nomor lama {cadangan} agar tetap unik. Mohon koreksi Excel."
                )
                d["noHp"] = cadangan
            else:
                catatan.append(
                    f"{d['nama']}: nomor {no} dipakai lebih dari satu pegawai dan tidak ada nomor "
                    f"cadangan yang unik. Nomor dikosongkan (login pakai email). Mohon koreksi Excel."
                )
                d["noHp"] = ""
        dipakai.add(d["noHp"])

    hasil = []
    for d in mentah:
        d.pop("noHpCadangan", None)
        if not d["noHp"]:
            d["noHp"] = None
        hasil.append(d)

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"catatan": catatan, "pegawai": hasil}, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"SOURCE : {xlsx}")
    print(f"OUTPUT : {out}")
    print(f"PEGAWAI: {len(hasil)}")
    print(f"NO WA  : {sum(1 for d in hasil if d['noHp'])} dari {len(hasil)} terisi")
    if catatan:
        print("CATATAN:")
        for c in catatan:
            print(f"  - {c}")


if __name__ == "__main__":
    main()
