import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Minus, Plus, ShoppingCart, Check, Truck } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { useCart, type CartItem } from '@/hooks/useCart'
import { doriKartaNomi } from '@/lib/cyrillic'
import { bronQilish, dorixonalar, type Dorixona } from '@/lib/api'
import { YetkazishOynasi } from '@/components/YetkazishOynasi'

export function CartPanel() {
  const { lang, t } = useLang()
  const { items, updateQty, remove, clear, isOpen, close } = useCart()
  const navigate = useNavigate()
  const [bronStatus, setBronStatus] = useState<{ ok: number; fail: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const jami = items.reduce((s, it) => s + (it.price || 0) * (it.soni || 1), 0)

  // Yetkazish: savatchadagi mahsulotlar dorixona bo'yicha guruhlanadi — har dorixona o'zinikini o'zi yetkazadi.
  const [dxlar, setDxlar] = useState<Dorixona[]>([])
  // Oyna ochilgan paytdagi dorixona va mahsulotlar saqlab qo'yiladi: buyurtmadan keyin ular savatchadan
  // olinsa ham, tasdiq oynasi yopilib ketmaydi.
  const [yetkazish, setYetkazish] = useState<{ dx: Dorixona; items: CartItem[] } | null>(null)
  useEffect(() => {
    if (isOpen && items.length) dorixonalar().then(setDxlar).catch(() => {})
  }, [isOpen, items.length])
  const yetkazadiganlar = useMemo(() => {
    const ids = Array.from(new Set(items.map((it) => it.dorixona?.id).filter((x): x is number => x != null)))
    return ids.map((id) => dxlar.find((d) => d.id === id)).filter((d): d is Dorixona => !!d && !!d.yetkazishYoqilgan)
  }, [items, dxlar])

  // Buyurtma berilgan dorixonaning mahsulotlari savatchadan olinadi (oxiridan boshlab — indekslar siljimasin).
  const guruhniOchir = (dxId: number) => {
    for (let i = items.length - 1; i >= 0; i--) if (items[i].dorixona?.id === dxId) remove(i)
  }

  const handleBronAll = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      // Bron faqat ro'yxatdan o'tganlarga: mehmonni kirish sahifasiga yuboramiz (savat saqlanib qoladi).
      close()
      navigate('/login')
      return
    }
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
                const name = doriKartaNomi(item, lang)
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
                {yetkazadiganlar.map((d) => (
                  <Button key={d.id} className="w-full rounded-xl mt-2" variant="secondary" onClick={() => { setYetkazish({ dx: d, items: items.filter((it) => it.dorixona?.id === d.id) }); close() }}>
                    <Truck className="w-4 h-4" />
                    {lang === 'uz' ? `Yetkazib bering — ${d.nomi || d.name}` : `Доставка — ${d.nomi || d.name}`}
                  </Button>
                ))}
              </>
            )}
          </div>
        )}
      </SheetContent>
      {yetkazish && (
        <YetkazishOynasi
          open
          onClose={() => setYetkazish(null)}
          dorixona={{ id: yetkazish.dx.id, name: yetkazish.dx.nomi || yetkazish.dx.name || '', latitude: yetkazish.dx.latitude, longitude: yetkazish.dx.longitude }}
          items={yetkazish.items}
          onBuyurtmaQilindi={() => guruhniOchir(yetkazish.dx.id)}
        />
      )}
    </Sheet>
  )
}
