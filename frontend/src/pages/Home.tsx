import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, MapPin, Loader2, Clock } from 'lucide-react'
import { Hero } from '@/components/Hero'
import { DrugResultCard, CatalogCard } from '@/components/DrugCard'
import { PharmacyCard } from '@/components/PharmacyCard'
import { DrugModal } from '@/components/DrugModal'
import { useLang } from '@/hooks/useLanguage'
import * as api from '@/lib/api'
import type { DoriQidiruvResult, DoriKatalog, Dorixona } from '@/lib/api'
import { requestLocation, distanceKm, type UserLocation } from '@/lib/geo'

const HISTORY_KEY = 'dori_search_history'
const MAX_HISTORY = 20

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function addToHistory(query: string) {
  const q = query.trim()
  if (!q) return
  const prev = getHistory().filter((h) => h.toLowerCase() !== q.toLowerCase())
  const next = [q, ...prev].slice(0, MAX_HISTORY)
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY) } catch {}
}

export function Home() {
  const { t } = useLang()
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login')
  }, [navigate])

  const [results, setResults] = useState<DoriQidiruvResult[]>([])
  const [katalogResults, setKatalogResults] = useState<DoriKatalog[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pharmacies, setPharmacies] = useState<(Dorixona & { _km?: number | null })[]>([])
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [history, setHistory] = useState<string[]>(getHistory)

  const [selectedDrug, setSelectedDrug] = useState<DoriQidiruvResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    requestLocation().then(setLocation)

    api
      .dorixonalar()
      .then((data) => setPharmacies(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!location || pharmacies.length === 0) return
    setPharmacies((prev) =>
      [...prev]
        .map((ph) => ({
          ...ph,
          _km:
            ph.latitude && ph.longitude
              ? distanceKm(location.lat, location.lon, ph.latitude, ph.longitude)
              : null,
        }))
        .sort((a, b) => (a._km ?? Infinity) - (b._km ?? Infinity))
    )
  }, [location])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearching(true)
      setSearched(true)
      setError(null)
      setResults([])
      setKatalogResults([])

      const loc = location || (await requestLocation())
      if (loc) setLocation(loc)

      addToHistory(query)
      setHistory(getHistory())

      try {
        const data = await api.doriQidirish(query)
        if (data.length === 0) {
          const katData = await api.katalogQidirish(query)
          setKatalogResults(katData)
        } else {
          const sorted = loc
            ? data
                .map((item) => {
                  const ph = item.dorixona
                  const km =
                    ph?.latitude && ph?.longitude
                      ? distanceKm(loc.lat, loc.lon, ph.latitude, ph.longitude)
                      : null
                  return { ...item, _km: km }
                })
                .sort((a, b) => (a._km ?? Infinity) - (b._km ?? Infinity))
            : data
          setResults(sorted)
        }
      } catch {
        setError(t('yuklanmadi'))
      } finally {
        setSearching(false)
      }
    },
    [location, t]
  )

  return (
    <>
      <Hero onSearch={handleSearch} />

      <div className="max-w-[1180px] mx-auto px-4 pb-8">
        {searched && (
          <div className="mt-6">
            {searching && (
              <div className="flex items-center justify-center gap-2 py-8 text-ink-dim">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('qidirilmoqda')}
              </div>
            )}

            {error && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center text-ink-dim">
                {error}
              </div>
            )}

            {!searching && !error && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            )}

            {!searching && !error && results.length === 0 && katalogResults.length > 0 && (
              <>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-4 text-ink-dim text-sm">
                  {t('katalogInfo')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {katalogResults.map((k) => (
                    <CatalogCard key={k.id} drug={k} onClick={() => handleSearch(k.nomi)} />
                  ))}
                </div>
              </>
            )}

            {!searching &&
              !error &&
              results.length === 0 &&
              katalogResults.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center text-ink-dim">
                  {t('topilmadi')}
                </div>
              )}
          </div>
        )}

        {history.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-10 mb-4">
              <h2 className="flex items-center gap-2 text-xs font-bold text-ink-dim uppercase tracking-widest">
                <Clock className="w-4 h-4" />
                <span>{t('qidiruvTarixi')}</span>
                <span className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </h2>
              <button
                onClick={() => { clearHistory(); setHistory([]) }}
                className="text-xs text-ink-faint hover:text-red-500 font-semibold transition-colors"
              >
                {t('tarixniTozalash')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {history.slice(0, 6).map((q, i) => (
                <button
                  key={q + i}
                  onClick={() => handleSearch(q)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <Pill className="w-5 h-5 text-brand" />
                  </div>
                  <div className="font-bold text-ink text-sm truncate">{q}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {pharmacies.length > 0 && (
          <>
            <SectionTitle icon={<MapPin className="w-4 h-4" />} text={t('yaqinDorixonalar')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pharmacies.slice(0, 4).map((ph) => (
                <PharmacyCard
                  key={ph.id}
                  pharmacy={ph}
                  onClick={() => {
                    sessionStorage.setItem('ochilsin', String(ph.id))
                    window.location.href = '/dorixonalar.html'
                  }}
                />
              ))}
            </div>
          </>
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

function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <h2 className="flex items-center gap-2 mt-10 mb-4 text-xs font-bold text-ink-dim uppercase tracking-widest">
      {icon}
      <span>{text}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
    </h2>
  )
}
