'use client'
import { useRef } from 'react'
import { useEditor, EditorContent, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { toast } from 'sonner'
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Link2, ImagePlus, Minus, Undo2, Redo2, Loader2, Video,
} from 'lucide-react'
import { useState } from 'react'
import { YouTube } from './YouTubeNode'
import { youtubeEmbedUrl, youtubeId } from '@/lib/youtube'

export async function uploadBeritaImage(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/berita/upload', { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Upload gagal')
  return json.data as { path: string; url: string }
}

function Toolbar({ editor, allowVideo }: { editor: Editor; allowVideo: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
    }),
  })

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL tautan (kosongkan untuk menghapus)', prev ?? 'https://')
    if (url === null) return
    if (!url.trim()) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const onImage = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadBeritaImage(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const insertVideo = () => {
    const url = window.prompt(
      'URL video YouTube (mis. https://youtu.be/dwqXJ3kg7bs)',
      'https://youtu.be/',
    )
    if (url === null) return
    const trimmed = url.trim()
    if (!trimmed) return
    if (!youtubeId(trimmed)) {
      toast.error('URL itu bukan tautan YouTube yang valid')
      return
    }
    editor
      .chain()
      .focus()
      .insertYouTube({ src: youtubeEmbedUrl(trimmed)!, title: 'Video YouTube' })
      .run()
    toast.success('Video disisipkan')
  }

  const btn = (active: boolean) =>
    `rounded p-1.5 transition-colors ${active ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`

  const items: { icon: typeof Bold; title: string; active: boolean; run: () => void }[] = [
    { icon: Bold, title: 'Tebal', active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, title: 'Miring', active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { icon: Underline, title: 'Garis bawah', active: state.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { icon: Strikethrough, title: 'Coret', active: state.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { icon: Heading2, title: 'Judul', active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, title: 'Sub judul', active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: List, title: 'Daftar', active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, title: 'Daftar bernomor', active: state.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: Quote, title: 'Kutipan', active: state.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { icon: Link2, title: 'Tautan', active: state.link, run: setLink },
    { icon: Minus, title: 'Garis pemisah', active: false, run: () => editor.chain().focus().setHorizontalRule().run() },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
      {items.map(({ icon: Icon, title, active, run }) => (
        <button key={title} type="button" title={title} onClick={run} className={btn(active)}>
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <button type="button" title="Sisipkan gambar" onClick={() => fileRef.current?.click()} className={btn(false)} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </button>
      {allowVideo && (
        <button type="button" title="Sisipkan video YouTube" onClick={insertVideo} className={btn(false)}>
          <Video className="h-4 w-4" />
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => onImage(e.target.files?.[0])} />
      <span className="mx-1 h-5 w-px bg-gray-300" />
      <button type="button" title="Batal" onClick={() => editor.chain().focus().undo().run()} className={btn(false)}>
        <Undo2 className="h-4 w-4" />
      </button>
      <button type="button" title="Ulangi" onClick={() => editor.chain().focus().redo().run()} className={btn(false)}>
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  allowVideo = false,
}: {
  value: string
  onChange: (html: string) => void
  /** Aktifkan tombol sisip video YouTube (hanya untuk konten Profil). */
  allowVideo?: boolean
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      Image,
      ...(allowVideo ? [YouTube] : []),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'prose-berita min-h-[320px] px-4 py-3 focus:outline-none' },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })

  if (!editor) return <div className="min-h-[370px] rounded-lg border border-gray-300 bg-gray-50" />

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-brand-primary">
      <Toolbar editor={editor} allowVideo={allowVideo} />
      <EditorContent editor={editor} />
    </div>
  )
}
