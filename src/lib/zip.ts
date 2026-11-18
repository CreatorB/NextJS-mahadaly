import { deflateRawSync } from 'node:zlib'

/**
 * Penulis ZIP minimal (tanpa dependensi luar).
 *
 * Dipakai panel admin untuk mengunduh beberapa berkas sekaligus (bulk ZIP).
 * Format: entry lokal + central directory + end of central directory, metode
 * deflate (atau "store" kalau hasil kompresinya lebih besar).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export type ZipEntry = {
  /** Nama file di dalam ZIP (slash = subfolder). */
  name: string
  data: Buffer
}

/** Tanggal tetap (1 Januari 1996) supaya output ZIP deterministik. */
const DOS_TIME = 0
const DOS_DATE = 0x21

export function buatZip(entries: ZipEntry[]): Buffer {
  const lokal: Buffer[] = []
  const sentral: Buffer[] = []
  let offset = 0

  for (const e of entries) {
    const namaBuf = Buffer.from(e.name, 'utf8')
    const crc = crc32(e.data)
    const terkompres = deflateRawSync(e.data, { level: 6 })
    const pakaiDeflate = terkompres.length < e.data.length
    const payload = pakaiDeflate ? terkompres : e.data
    const metode = pakaiDeflate ? 8 : 0

    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0, 6)
    header.writeUInt16LE(metode, 8)
    header.writeUInt16LE(DOS_TIME, 10)
    header.writeUInt16LE(DOS_DATE, 12)
    header.writeUInt32LE(crc, 14)
    header.writeUInt32LE(payload.length, 18)
    header.writeUInt32LE(e.data.length, 22)
    header.writeUInt16LE(namaBuf.length, 26)
    header.writeUInt16LE(0, 28)
    lokal.push(header, namaBuf, payload)

    const dir = Buffer.alloc(46)
    dir.writeUInt32LE(0x02014b50, 0)
    dir.writeUInt16LE(20, 4)
    dir.writeUInt16LE(20, 6)
    dir.writeUInt16LE(0, 8)
    dir.writeUInt16LE(metode, 10)
    dir.writeUInt16LE(DOS_TIME, 12)
    dir.writeUInt16LE(DOS_DATE, 14)
    dir.writeUInt32LE(crc, 16)
    dir.writeUInt32LE(payload.length, 20)
    dir.writeUInt32LE(e.data.length, 24)
    dir.writeUInt16LE(namaBuf.length, 28)
    dir.writeUInt16LE(0, 30)
    dir.writeUInt16LE(0, 32)
    dir.writeUInt16LE(0, 34)
    dir.writeUInt16LE(0, 36)
    dir.writeUInt32LE(0, 38)
    dir.writeUInt32LE(offset, 42)
    sentral.push(dir, namaBuf)

    offset += header.length + namaBuf.length + payload.length
  }

  const dirBuf = Buffer.concat(sentral)
  const akhir = Buffer.alloc(22)
  akhir.writeUInt32LE(0x06054b50, 0)
  akhir.writeUInt16LE(0, 4)
  akhir.writeUInt16LE(0, 6)
  akhir.writeUInt16LE(entries.length, 8)
  akhir.writeUInt16LE(entries.length, 10)
  akhir.writeUInt32LE(dirBuf.length, 12)
  akhir.writeUInt32LE(offset, 16)
  akhir.writeUInt16LE(0, 20)

  return Buffer.concat([...lokal, dirBuf, akhir])
}
