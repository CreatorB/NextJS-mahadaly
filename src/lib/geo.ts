/**
 * Utilitas geografi untuk validasi absen kerja berbasis GPS.
 *
 * Menghitung jarak dua titik di permukaan bumi dengan rumus Haversine.
 * Radius bumi yang dipakai: 6.371.000 meter.
 */

const EARTH_RADIUS_METER = 6_371_000

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Jarak antara dua titik koordinat (meter).
 * Mengembalikan NaN bila koordinat tidak valid.
 */
export function jarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return Number.NaN
  }

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_METER * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * Cek apakah koordinat berada di dalam radius tertentu dari titik acuan.
 */
export function dalamRadius(
  lat: number,
  lon: number,
  latAcuan: number,
  lonAcuan: number,
  radiusMeter: number,
): { valid: boolean; jarak: number } {
  const jarak = jarakMeter(lat, lon, latAcuan, lonAcuan)
  if (!Number.isFinite(jarak)) return { valid: false, jarak: Number.NaN }
  return { valid: jarak <= radiusMeter, jarak: Math.round(jarak) }
}
