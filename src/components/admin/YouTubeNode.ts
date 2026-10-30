import { Node, mergeAttributes } from '@tiptap/core'

export interface YouTubeOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      /** Sisipkan video YouTube (iframe) di posisi kursor. */
      insertYouTube: (options: { src: string; title?: string }) => ReturnType
    }
  }
}

/**
 * Node Tiptap untuk menyisipkan video YouTube di dalam konten WYSIWYG.
 *
 * Hasil HTML: `<iframe src="https://www.youtube.com/embed/<ID>" ...>` yang
 * nanti disanitasi lagi di server (lihat `sanitizeProfilKonten`) sehingga
 * hanya YouTube yang diizinkan.
 */
export const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        width: '100%',
        height: '315',
        frameborder: '0',
        allowfullscreen: 'true',
      },
    } as YouTubeOptions
  },

  addAttributes() {
    return {
      src: { default: null },
      title: { default: 'Video YouTube' },
    }
  },

  parseHTML() {
    return [{ tag: 'iframe[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      mergeAttributes(this.options.HTMLAttributes, {
        class: 'w-full aspect-video rounded-xl border-0 bg-black',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        loading: 'lazy',
        referrerpolicy: 'strict-origin-when-cross-origin',
      }, HTMLAttributes),
    ]
  },

  addCommands() {
    return {
      insertYouTube:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    }
  },
})
