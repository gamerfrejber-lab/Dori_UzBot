import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Brain, Thermometer, Wind, Stethoscope, Heart, Droplets, Bone,
  Syringe, Eye, Baby, Sparkles, Apple, ShieldPlus, Pill,
  ArrowLeft, Loader2, Star, BookOpen, Building2,
} from 'lucide-react'
import { getCategoryBySlug, type Category } from '@/lib/categories'
import { DrugResultCard, CatalogCard } from '@/components/DrugCard'
import { DrugModal } from '@/components/DrugModal'
import { useLang } from '@/hooks/useLanguage'
import * as api from '@/lib/api'
import type { DoriQidiruvResult, DoriKatalog } from '@/lib/api'
import { requestLocation, distanceKm } from '@/lib/geo'

const iconMap: Record<string, React.ElementType> = {
  Brain, Thermometer, Wind, Stethoscope, Heart, Droplets, Bone,
  Syringe, Eye, Baby, Sparkles, Apple, ShieldPlus, Pill,
}

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const category = getCategoryBySlug(slug || '')

  const [results, setResults] = useState<DoriQidiruvResult[]>([])
  const [katalogResults, setKatalogResults] = useState<DoriKatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDrug, setSelectedDrug] = useState<DoriQidiruvResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showAllKatalog, setShowAllKatalog] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login')
  }, [navigate])

  const searchCategory = useCallback(
    async (cat: Category) => {
      setLoading(true)
      setResults([])
      setKatalogResults([])
      setShowAllKatalog(false)

      const loc = await requestLocation().catch(() => null)

      const allResults: DoriQidiruvResult[] = []
      const allKatalog: DoriKatalog[] = []
      const seenDoriIds = new Set<number>()
      const seenKatIds = new Set<number>()

      for (const term of cat.search) {
        try {
          const [doriData, katData] = await Promise.all([
            api.doriQidirish(term),
            api.katalogQidirish(term, 50),
          ])

          for (const d of doriData) {
            if (!seenDoriIds.has(d.id)) {
              seenDoriIds.add(d.id)
              allResults.push(d)
            }
          }

          for (const k of katData) {
            if (!seenKatIds.has(k.id)) {
              seenKatIds.add(k.id)
              allKatalog.push(k)
            }
          }
        } catch {
          // ignore
        }
      }

      if (loc && allResults.length > 0) {
        const sorted = allResults
          .map((item) => {
            const ph = item.dorixona
            const km = ph?.latitude && ph?.longitude
              ? distanceKm(loc.lat, loc.lon, ph.latitude, ph.longitude)
              : null
            return { ...item, _km: km }
          })
          .sort((a, b) => (a._km ?? Infinity) - (b._km ?? Infinity))
        setResults(sorted)
      } else {
        setResults(allResults)
      }
      setKatalogResults(allKatalog)
      setLoading(false)
    },
    []
  )

  useEffect(() => {
    if (category) searchCategory(category)
  }, [category, searchCategory])

  if (!category) {
    return (
      <section className="max-w-[1180px] mx-auto px-4 py-12 text-center">
        <p className="text-ink-dim text-lg">{lang === 'uz' ? 'Kategoriya topilmadi' : 'Категория не найдена'}</p>
        <Link to="/" className="text-brand font-semibold mt-4 inline-block">{t('boshSahifa')}</Link>
      </section>
    )
  }

  const Icon = iconMap[category.iconName] || Pill
  const isBolalar = category.slug === 'bolalar'
  const katalogToShow = showAllKatalog ? katalogResults : katalogResults.slice(0, 12)

  return (
    <>
      <section className={`${isBolalar ? 'bg-gradient-to-br from-pink-100 via-pink-50 to-yellow-50' : `bg-gradient-to-br ${category.bgGradient}`}`}>
        <div className="max-w-[1180px] mx-auto px-4 pt-4 sm:pt-6 pb-6 sm:pb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-dim hover:text-ink transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'uz' ? 'Orqaga' : 'Назад'}
          </button>

          <div className={`${isBolalar ? 'bg-white/60' : 'bg-white/70'} backdrop-blur-sm rounded-[22px] sm:rounded-[28px] p-5 sm:p-8 border border-white/50`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${category.color} ${isBolalar ? 'bg-pink-100' : ''}`}>
                <Icon className={`w-7 sm:w-8 h-7 sm:h-8 ${isBolalar ? 'text-pink-500' : ''}`} />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-extrabold leading-tight ${isBolalar ? 'text-pink-600' : category.accentColor}`}>
                  {lang === 'uz' ? category.uz : category.ru}
                </h1>
                <p className="text-ink-dim text-sm sm:text-base mt-0.5">
                  {lang === 'uz' ? category.descUz : category.descRu}
                </p>
              </div>
            </div>

            {isBolalar && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {['🧸', '🍼', '🧒', '💊', '🌡️'].map((emoji, i) => (
                  <span key={i} className="text-xl sm:text-2xl">{emoji}</span>
                ))}
              </div>
            )}
          </div>

          {isBolalar && (
            <div className="mt-4 bg-pink-50 border border-pink-200 rounded-2xl p-4 text-sm text-pink-700">
              <Baby className="w-4 h-4 inline mr-1.5" />
              {lang === 'uz'
                ? "Bolalarga dori berishdan oldin albatta shifokor bilan maslahatlashing!"
                : 'Перед тем как давать лекарство ребёнку, обязательно проконсультируйтесь с врачом!'}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 pb-24 md:pb-8">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-ink-dim">
            <Loader2 className={`w-5 h-5 animate-spin ${isBolalar ? 'text-pink-400' : ''}`} />
            {t('qidirilmoqda')}
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <SectionHeader
              icon={<Building2 className="w-4 h-4" />}
              title={lang === 'uz' ? 'Dorixonalarda mavjud' : 'Есть в аптеках'}
              count={results.length}
              lang={lang}
              pink={isBolalar}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {results.map((drug, i) => (
                <DrugResultCard
                  key={drug.id + '-' + i}
                  drug={drug}
                  onClick={() => {
                    setSelectedDrug(drug)
                    setModalOpen(true)
                  }}
                />
              ))}
            </div>
          </>
        )}

        {!loading && katalogResults.length > 0 && (
          <>
            <SectionHeader
              icon={<BookOpen className="w-4 h-4" />}
              title={lang === 'uz' ? 'Katalogdagi dorilar' : 'Из каталога лекарств'}
              count={katalogResults.length}
              lang={lang}
              pink={isBolalar}
              className={results.length > 0 ? 'mt-8' : ''}
            />
            {results.length === 0 && (
              <div className={`${isBolalar ? 'bg-pink-50 border-pink-100' : 'bg-blue-50 border-blue-100'} rounded-2xl border p-4 mb-4 text-sm text-ink-dim`}>
                {lang === 'uz'
                  ? "Bu dorilar katalogda bor, lekin hozircha dorixonalarda kiritilmagan. Dorixonadan so'rang!"
                  : 'Эти лекарства есть в каталоге, но пока не внесены аптеками. Спросите в аптеке!'}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {katalogToShow.map((k) => (
                <CatalogCard key={k.id} drug={k} onClick={() => {
                  navigate(`/?search=${encodeURIComponent(k.nomi)}`)
                }} />
              ))}
            </div>
            {katalogResults.length > 12 && !showAllKatalog && (
              <button
                onClick={() => setShowAllKatalog(true)}
                className={`w-full mt-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
                  isBolalar
                    ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200'
                    : 'bg-brand/5 text-brand hover:bg-brand/10 border border-brand/20'
                }`}
              >
                {lang === 'uz'
                  ? `Yana ${katalogResults.length - 12} ta dorini ko'rsatish`
                  : `Показать ещё ${katalogResults.length - 12} лекарств`}
              </button>
            )}
          </>
        )}

        {!loading && results.length === 0 && katalogResults.length === 0 && (
          <div className={`mt-6 ${isBolalar ? 'bg-pink-50 border-pink-100' : 'bg-white border-slate-100'} rounded-3xl border shadow-sm p-8 text-center text-ink-dim`}>
            <Pill className={`w-8 h-8 mx-auto mb-3 ${isBolalar ? 'text-pink-300' : 'text-ink-faint'}`} />
            {t('topilmadi')}
          </div>
        )}

        {isBolalar && !loading && (results.length > 0 || katalogResults.length > 0) && (
          <div className="mt-6 bg-gradient-to-r from-pink-50 to-yellow-50 border border-pink-100 rounded-2xl p-4 flex items-start gap-3">
            <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-pink-700">
              {lang === 'uz'
                ? "Eslatma: Bolalar dozasi kattalarnikiidan farq qiladi. Shifokor ko'rsatmasiz dori bermang."
                : 'Напоминание: Детская дозировка отличается от взрослой. Не давайте лекарства без назначения врача.'}
            </p>
          </div>
        )}
      </div>

      <DrugModal
        drug={selectedDrug}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}

function SectionHeader({
  icon,
  title,
  count,
  lang,
  pink,
  className = '',
}: {
  icon: React.ReactNode
  title: string
  count: number
  lang: string
  pink?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 mt-6 mb-4 ${className}`}>
      <span className={pink ? 'text-pink-400' : 'text-ink-faint'}>{icon}</span>
      <h2 className={`text-xs font-bold uppercase tracking-widest ${pink ? 'text-pink-400' : 'text-ink-dim'}`}>
        {title}
      </h2>
      <span className={`flex-1 h-px ${pink ? 'bg-gradient-to-r from-pink-200 to-transparent' : 'bg-gradient-to-r from-slate-200 to-transparent'}`} />
      <span className="text-xs text-ink-faint font-semibold">
        {count} {lang === 'uz' ? 'ta' : 'шт'}
      </span>
    </div>
  )
}
