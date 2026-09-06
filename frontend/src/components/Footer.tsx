import { useLang } from '@/hooks/useLanguage'

export function Footer() {
  const { t } = useLang()

  return (
    <footer className="text-center py-8 px-4 border-t border-slate-100 mt-12 text-ink-faint text-sm">
      <p>{t('footer')}</p>
      <p className="mt-2">
        <a
          href="https://t.me/dori_UzBot"
          target="_blank"
          rel="noopener"
          className="text-brand font-semibold no-underline hover:underline"
        >
          Telegram bot: @dori_UzBot
        </a>
      </p>
      <p className="mt-1 text-xs">{t('aloqa')}</p>
    </footer>
  )
}
