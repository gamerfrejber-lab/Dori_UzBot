import { useState } from 'react'
import { Pill, Minus, Plus, ShoppingCart, Check } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { useCart } from '@/hooks/useCart'
import { doriNominiTozalash } from '@/lib/cyrillic'
import { bronQilish } from '@/lib/api'

export function CartPanel() {
  const { lang, t } = useLang()
  const { items, updateQty, remove, clear, isOpen, close } = useCart()
  const [bronStatus, setBronStatus] = useState<{ ok: number; fail: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const jami = items.reduce((s, it) => s + (it.price || 0) * (it.soni || 1), 0)

  const handleBronAll = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    let ok = 0
    let fail = 0
    for (const it of items) {
      try {
        await bronQilish(it.id, it.soni || 1, it.tur || 'dona', token)
        ok++
      } catch {
        fail++
      }
    }
    if (ok > 0) clear()
    setBronStatus({ ok, fail })
    setLoading(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && close()}>
      <SheetContent>
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-ink">{t('savatcha')}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-12 text-ink-faint">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t('savatchaBosh')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => {
                const name = doriNominiTozalash(item.name || item.nameRu || '', lang)
                const narx = (item.price || 0) * (item.soni || 1)
                return (
                  <div key={i} className="flex gap-3 items-start py-3 border-b border-slate-50 last:border-b-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink leading-tight">{name}</div>
                      <div className="text-xs text-ink-dim mt-0.5">
                        {item.dorixona?.name}
                        {item.manufacturer && ` · ${item.manufacturer}`}
                      </div>
                      <div className="font-bold text-brand text-sm mt-1">
                        {narx.toLocaleString()} {t('som')}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQty(i, -1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand/[0.08] hover:border-brand flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-semibold text-sm min-w-[20px] text-center">
                          {item.soni || 1}
                        </span>
                        <button
                          onClick={() => updateQty(i, 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand/[0.08] hover:border-brand flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => remove(i)}
                          className="text-red-500 text-xs font-semibold hover:underline ml-auto"
                        >
                          {t('ochirish')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100">
            {bronStatus ? (
              <div className="text-center py-3">
                {bronStatus.ok > 0 && (
                  <p className="text-green-600 font-semibold">
                    <Check className="w-4 h-4 inline" /> {bronStatus.ok} {t('ta')} {lang === 'uz' ? 'dori bron qilindi!' : 'лекарств забронировано!'}
                  </p>
                )}
                {bronStatus.fail > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {bronStatus.fail} {lang === 'uz' ? 'ta xatolik' : 'ошибок'}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-ink">{t('jami')}:</span>
                  <span className="font-bold text-brand text-lg">
                    {jami.toLocaleString()} {t('som')}
                  </span>
                </div>
                <Button
                  variant="success"
                  className="w-full rounded-xl"
                  onClick={handleBronAll}
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                  {loading ? '...' : t('bronHammasi')}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
