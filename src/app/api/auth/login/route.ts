import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
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

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  logToServer('📥 LOGIN REQUEST START', { method: 'POST', path: '/api/auth/login', clientIP })

  try {
    // Parse body — handle non-JSON gracefully
    let body: unknown
    try {
      body = await req.json()
      logToServer('📦 Body parsed', { body: typeof body === 'object' ? 'object' : body })
    } catch (e) {
      logToServer('❌ Body parse error', { error: e instanceof Error ? e.message : String(e) })
      return NextResponse.json(fail('Data tidak valid - body harus JSON'), { status: 400 })
    }

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      logToServer('❌ Validation failed', { errors: parsed.error.issues })
      return NextResponse.json(fail('Data tidak valid', Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), [i.message]]))), { status: 400 })
    }

    const { email, password } = parsed.data
    logToServer('📧 Login attempt', { email, passwordLength: password.length })

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user || !user.isActive) {
      logToServer('❌ User not found or inactive', { email, found: !!user, isActive: user?.isActive })
      return NextResponse.json(fail('Email atau password salah'), { status: 401 })
    }
    logToServer('✅ User found', { id: user.id, email: user.email, roleId: user.roleId, isActive: user.isActive })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      logToServer('❌ Password invalid', { email })
      return NextResponse.json(fail('Email atau password salah'), { status: 401 })
    }
    logToServer('✅ Password valid', { email })

    // Create JWT token
    const token = await signToken({ userId: user.id, roleId: user.roleId, email: user.email, nama: user.nama })
    logToServer('🎫 JWT token created', { userId: user.id, roleId: user.roleId, tokenLength: token.length })

    // Set cookie explicitly via NextResponse
    const response = NextResponse.json(ok({ roleId: user.roleId, nama: user.nama, email: user.email }))
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    logToServer('🍪 Cookie set in response', { 
      name: COOKIE_NAME, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800,
      path: '/'
    })

    const duration = Date.now() - startTime
    logToServer('✅ LOGIN SUCCESS - Response sent', { duration: `${duration}ms`, roleId: user.roleId, nama: user.nama })

    return response
  } catch (e) {
    const duration = Date.now() - startTime
    const errorMsg = e instanceof Error ? e.message : String(e)
    logToServer('💥 LOGIN EXCEPTION', { 
      error: errorMsg, 
      stack: e instanceof Error ? e.stack : undefined,
      duration: `${duration}ms`
    })
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('[POST /api/auth/login]', e)
      return NextResponse.json(fail('Terjadi kesalahan server: ' + errorMsg), { status: 500 })
    }
    console.error('[POST /api/auth/login]', errorMsg)
    return NextResponse.json(fail('Terjadi kesalahan server'), { status: 500 })
  }
}
