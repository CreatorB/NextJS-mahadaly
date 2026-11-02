import { safeRedirectPath } from '@/lib/safe-redirect'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { normalisasiHp } from '@/lib/phone'
import { ok, fail } from '@/types/api'
import * as fs from 'fs'
import * as path from 'path'

const COOKIE_NAME = 'mahadaly_session'
const LOG_FILE = path.join(process.cwd(), 'logs', 'login.log')

function logToServer(msg: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logLine = `[${timestamp}] ${msg}${data ? ' | ' + JSON.stringify(data) : ''}\n`
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf8')
  } catch (e) {
    console.error('[LOGIN LOG ERROR]', e)
  }
  console.log(logLine.trim())
}

function buildUrl(req: NextRequest, targetPath: string): URL {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  return new URL(targetPath, `${proto}://${host}`)
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const contentType = req.headers.get('content-type') || ''
  const host = req.headers.get('host') || 'unknown'

  logToServer('LOGIN REQUEST START', { clientIP, contentType, host })

  const isFormPost = contentType.includes('application/x-www-form-urlencoded') ||
                     contentType.includes('multipart/form-data')

  let body: any = {}
  try {
    if (contentType.includes('application/json')) {
      body = await req.json()
    } else {
      const formData = await req.formData()
      body = { email: formData.get('email'), password: formData.get('password'), next: formData.get('next') }
    }
    logToServer('Body parsed', { isFormPost, email: body.email })
  } catch (e) {
    logToServer('Body parse error', { error: e instanceof Error ? e.message : String(e) })
    if (isFormPost) return NextResponse.redirect(buildUrl(req, '/login?error=invalid'))
    return NextResponse.json(fail('Data tidak valid'), { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    logToServer('Validation failed', { errors: parsed.error.issues })
    if (isFormPost) return NextResponse.redirect(buildUrl(req, '/login?error=invalid'))
    return NextResponse.json(fail('Data tidak valid'), { status: 400 })
  }

  const { email, password } = parsed.data

  // Login menerima email ATAU nomor WhatsApp (khusus pegawai).
  const input = email.trim()
  const hp = normalisasiHp(input)
  const user = input.includes('@')
    ? await prisma.user.findUnique({ where: { email: input }, include: { role: true } })
    : hp
      ? await prisma.user.findFirst({
          where: { role: { namaRole: 'pegawai' }, pegawai: { noHp: hp } },
          include: { role: true },
        })
      : null
  if (!user || !user.isActive) {
    logToServer('User not found or inactive', { email: input })
    if (isFormPost) return NextResponse.redirect(buildUrl(req, '/login?error=invalid_credentials'))
    return NextResponse.json(fail('Email/nomor WhatsApp atau password salah'), { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    logToServer('Password invalid', { email: input })
    if (isFormPost) return NextResponse.redirect(buildUrl(req, '/login?error=invalid_credentials'))
    return NextResponse.json(fail('Email/nomor WhatsApp atau password salah'), { status: 401 })
  }

  const token = await signToken({ userId: user.id, roleId: user.roleId, email: user.email, nama: user.nama })
  // Kembali ke halaman asal (mis. halaman event) bila `next` adalah path internal yang aman.
  const next = safeRedirectPath(body.next)
  const targetPath =
    next ??
    (user.role.namaRole === 'pegawai'
      ? '/absen'
      : user.roleId <= 2
        ? '/admin/dashboard'
        : '/dashboard')
  logToServer('Login success', { roleId: user.roleId, role: user.role.namaRole, target: targetPath, isFormPost })

  if (isFormPost) {
    const response = NextResponse.redirect(buildUrl(req, targetPath))
    response.cookies.set(COOKIE_NAME, token, cookieOptions())
    logToServer('Form redirect sent', { target: targetPath, host, duration: `${Date.now() - startTime}ms` })
    return response
  } else {
    const response = NextResponse.json(ok({ roleId: user.roleId, nama: user.nama, email: user.email }))
    response.cookies.set(COOKIE_NAME, token, cookieOptions())
    logToServer('JSON response sent', { target: targetPath, duration: `${Date.now() - startTime}ms` })
    return response
  }
}
