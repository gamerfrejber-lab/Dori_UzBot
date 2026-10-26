import { ClipboardList } from 'lucide-react'

type Lang = 'uz' | 'ru'

/** Kichik belgi: dori kartasi va savatchada. */
export function RetseptBelgisi({ lang, yetkazilmaydi = false }: { lang: Lang; yetkazilmaydi?: boolean }) {
  const matn = lang === 'ru'
    ? (yetkazilmaydi ? 'По рецепту · без доставки' : 'По рецепту')
    : (yetkazilmaydi ? 'Retsept bilan · yetkazilmaydi' : 'Retsept bilan')
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">
      <ClipboardList className="h-3 w-3" />
      {matn}
    </span>
  )
}

/**
 * Retseptli dori haqida tushuntirish: qonunga ko'ra yetkazib bo'lmaydi, lekin bron qilish mumkin —
 * dorixona dorini faqat shifokor imzosi va muhri bor asl retseptni ko'rib beradi.
 * kop — kategoriya sahifasida, bir nechta dori haqida gapirilganda.
 */
export function RetseptOgohlantirish({ lang, className = '', kop = false }: { lang: Lang; className?: string; kop?: boolean }) {
  const ru = lang === 'ru'
  return (
    <div className={`rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900 ${className}`}>
      <p className="flex items-center gap-1.5 font-bold text-orange-800">
        <ClipboardList className="h-4 w-4 shrink-0" />
        {ru
          ? (kop ? 'Рецептурные препараты — доставки нет' : 'Рецептурный препарат — доставки нет')
          : (kop ? "Retsept bilan beriladigan dorilar — yetkazib bo'lmaydi" : "Retsept bilan beriladigan dori — yetkazib bo'lmaydi")}
      </p>
      <p className="mt-1 leading-snug">
        {ru
          ? (kop
            ? 'Эти препараты отпускаются только по рецепту врача, поэтому по закону их нельзя доставить на дом.'
            : 'Этот препарат отпускается только по рецепту врача, поэтому по закону его нельзя доставить на дом.')
          : (kop
            ? "Bu dorilar faqat shifokor retsepti bilan beriladi, shuning uchun qonunga ko'ra ularni uyga yetkazib bo'lmaydi."
            : "Bu dori faqat shifokor retsepti bilan beriladi, shuning uchun qonunga ko'ra uni uyga yetkazib bo'lmaydi.")}
      </p>
      <p className="mt-1 leading-snug">
        {ru
          ? 'Забронировать можно: приходите в аптеку с оригиналом рецепта с подписью и печатью врача — без рецепта аптека не сможет отпустить препарат.'
          : "Bron qilishingiz mumkin: dorixonaga shifokor imzosi va muhri bosilgan asl retsept bilan boring — retseptsiz dorixona dorini bera olmaydi."}
      </p>
    </div>
  )
}
