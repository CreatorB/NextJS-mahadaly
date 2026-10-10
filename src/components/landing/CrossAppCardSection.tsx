import Link from 'next/link'
import { ArrowRight, BookOpen, Users, type LucideIcon } from 'lucide-react'
import prisma from '@/lib/prisma'

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Users,
}

interface CrossAppCardSectionProps {
  slug?: string
  title?: string
  subtitle?: string
}

export async function CrossAppCardSection({
  slug = 'card_kias',
  title = 'Program Terkait',
  subtitle,
}: CrossAppCardSectionProps) {
  const card = await prisma.crossAppCardSetting.findUnique({
    where: { slug },
  })

  if (!card || !card.isActive) return null

  const Icon: LucideIcon = (card.iconName ? ICON_MAP[card.iconName] : undefined) ?? BookOpen
  const buttonLabel = card.buttonLabel ?? 'Lihat'

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">{title}</h2>
          {subtitle && <p className="text-slate-600">{subtitle}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-10 hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="shrink-0 w-16 h-16 rounded-xl bg-brand-primary text-white flex items-center justify-center">
              <Icon className="h-8 w-8" />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{card.title}</h3>
              {card.subtitle && (
                <p className="text-sm font-medium text-brand-primary mb-2">{card.subtitle}</p>
              )}
              {card.description && (
                <p className="text-slate-600 leading-relaxed">{card.description}</p>
              )}
            </div>

            <Link
              href={card.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
