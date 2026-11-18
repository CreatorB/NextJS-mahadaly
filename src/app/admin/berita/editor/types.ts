/** Bentuk state form artikel — dipakai bersama oleh editor & panel-panelnya. */

export interface PostFormState {
  judul: string
  slug: string
  ringkasan: string
  konten: string
  coverImage: string | null
  coverAlt: string
  status: 'draft' | 'published'
  publishedAt: string
  kategoriId: number
  tagSlugs: string[]
  authorId: number | null
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  seoKeywords: string
  canonicalUrl: string
  noindex: boolean
  nofollow: boolean
  ogImage: string | null
  twitterImage: string | null
  schemaJsonLd: boolean
  sticky: boolean
}

export type SetForm = <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => void

export interface KategoriOpsi {
  id: number
  nama: string
  slug: string
  tampil: boolean
}

export interface TagOpsi {
  id: number
  slug: string
  nama: string
}

export interface PenulisOpsi {
  id: number
  nama: string
  email: string
}

export const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

export const labelClass = 'mb-1 block text-sm font-medium text-gray-700'
