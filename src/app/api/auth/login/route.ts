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
  const contentType = req.headers.get('content-type') || ''

  logToServer('📥 LOGIN REQUEST START', { method: 'POST', path: '/api/auth/login', clientIP, contentType })

  // Determine if this is a form POST (from login page form submit) or JSON (from SPA fetch)
  const isFormPost = contentType.includes('application/x-www-form-urlencoded') || 
                     contentType.includes('multipart/form-data')

  // Parse body — handle both JSON and form-urlencoded
  let body: any = {}
  try {
    if (contentType.includes('application/json')) {
      body = await req.json()
      logToServer('📦 JSON body parsed', { body })
    } else {
      // Form-urlencoded
      const formData = await req.formData()
      body = {
        email: formData.get('email'),
        password: formData.get('password'),
      }
      logToServer('📦 Form data parsed', { body })
    }
  } catch (e) {
    logToServer('❌ Body parse error', { error: e instanceof Error ? e.message : String(e) })
    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=invalid_request', req.url))
    }
    return NextResponse.json(fail('Data tidak valid - body harus JSON'), { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    logToServer('❌ Validation failed', { errors: parsed.error.issues })
    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=invalid_data', req.url))
    }
    return NextResponse.json(fail('Data tidak valid', Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), [i.message]]))), { status: 400 })
  }

  const { email, password } = parsed.data
  logToServer('📧 Login attempt', { email, passwordLength: password.length })

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
  if (!user || !user.isActive) {
    logToServer('❌ User not found or inactive', { email, found: !!user, isActive: user?.isActive })
    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=invalid_credentials', req.url))
    }
    return NextResponse.json(fail('Email atau password salah'), { status: 401 })
  }
  logToServer('✅ User found', { id: user.id, email: user.email, roleId: user.roleId, isActive: user.isActive })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    logToServer('❌ Password invalid', { email })
    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=invalid_credentials', req.url))
    }
    return NextResponse.json(fail('Email atau password salah'), { status: 401 })
  }
  logToServer('✅ Password valid', { email })

  // Create JWT token
  const token = await signToken({ userId: user.id, roleId: user.roleId, email: user.email, nama: user.nama })
  logToServer('🎫 JWT token created', { userId: user.id, roleId: user.roleId, tokenLength: token.length })

  // Determine redirect target
  const targetPath = user.roleId <= 2 ? '/admin/dashboard' : '/dashboard'
  logToServer('🎯 Redirect target', { path: targetPath, isFormPost })

  if (isFormPost) {
    // For form POST: redirect response with cookie set
    const response = NextResponse.redirect(new URL(targetPath, req.url))
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    logToServer('🍪 Cookie set + redirect response', { target: targetPath })
    const duration = Date.now() - startTime
    logToServer('✅ LOGIN SUCCESS - Form redirect sent', { duration: `${duration}ms`, roleId: user.roleId, nama: user.nama })
    return response
  } else {
    // For JSON: return JSON with cookie set
    const response = NextResponse.json(ok({ roleId: user.roleId, nama: user.nama, email: user.email }))
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    logToServer('🍪 Cookie set in JSON response', { name: COOKIE_NAME })
    const duration = Date.now() - startTime
    logToServer('✅ LOGIN SUCCESS - JSON response sent', { duration: `${duration}ms`, roleId: user.roleId, nama: user Processing... })
    return response
  }
}