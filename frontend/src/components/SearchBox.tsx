import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { autocomplete as fetchAC } from '@/lib/api'
import { cyrToLat, doriAsosiyNom } from '@/lib/cyrillic'
import { useLang } from '@/hooks/useLanguage'
import { cn } from '@/lib/utils'

interface Props {
  onSearch: (query: string) => void
}

interface ACItem {
  shortName: string
  rank: number
}

export function SearchBox({ onSearch }: Props) {
  const { lang, t } = useLang()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ACItem[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const doSearch = useCallback(
    (q: string) => {
      setShowDropdown(false)
      if (q.trim().length >= 2) onSearch(q.trim())
    },
    [onSearch]
  )

  const fetchSuggestions = useCallback(
    async (q: string) => {
      try {
        const data = await fetchAC(q)
        const current = inputRef.current?.value.trim().toLowerCase() ?? ''
        if (!current.startsWith(q.toLowerCase().substring(0, 2))) return

        const seen = new Set<string>()
        const candidates: ACItem[] = []

        for (const item of data) {
          const raw = item.nomi || ''
          const display = lang === 'uz' ? cyrToLat(raw) : raw
          const shortName = doriAsosiyNom(display)
          const key = shortName.toUpperCase()
          if (seen.has(key)) continue
          seen.add(key)

          const sl = shortName.toLowerCase()
          const rank = sl.startsWith(current) ? 0 : sl.includes(current) ? 1 : 2
          candidates.push({ shortName, rank })
        }

        candidates.sort((a, b) => a.rank - b.rank || a.shortName.localeCompare(b.shortName))
        setItems(candidates.slice(0, 10))
        setShowDropdown(candidates.length > 0)
        setActiveIndex(-1)
      } catch {
        // ignore
      }
    },
    [lang]
  )

  const handleInput = (value: string) => {
    setQuery(value)
    clearTimeout(timerRef.current)
    if (value.trim().length < 2) {
      setShowDropdown(false)
      return
    }
    timerRef.current = setTimeout(() => fetchSuggestions(value.trim()), 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && items[activeIndex]) {
        const val = items[activeIndex].shortName
        setQuery(val)
        doSearch(val)
      } else {
        doSearch(query)
      }
      return
    }
    if (!showDropdown || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const highlight = (text: string) => {
    const q = query.trim()
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx < 0) return text
    return (
      <>
        {text.substring(0, idx)}
        <span className="font-bold text-brand">{text.substring(idx, idx + q.length)}</span>
        {text.substring(idx + q.length)}
      </>
    )
  }

  return (
    <div className="relative z-[100] w-full max-w-none">
      <div className="relative bg-white rounded-full border border-slate-200 shadow-[0_10px_30px_rgba(2,32,71,0.06)] transition-all focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.22),0_20px_50px_rgba(2,32,71,0.1)] focus-within:-translate-y-0.5">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t('qidirish')}
          autoComplete="off"
          className="w-full py-3.5 pl-6 pr-14 bg-transparent rounded-full text-ink text-base outline-none placeholder:text-ink-faint"
        />
        <button
          onClick={() => doSearch(query)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-brand-sea to-brand flex items-center justify-center shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:scale-105 transition-transform"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>

      {showDropdown && items.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-[900] max-h-[380px] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={item.shortName}
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(item.shortName)
                doSearch(item.shortName)
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0',
                i === activeIndex
                  ? 'bg-brand/[0.08]'
                  : 'hover:bg-brand/[0.06]'
              )}
            >
              <Search className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <span className="text-sm text-ink truncate">{highlight(item.shortName)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
