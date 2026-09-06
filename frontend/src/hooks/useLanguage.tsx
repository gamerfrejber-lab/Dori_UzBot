import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Lang, t, type TransKey } from '@/lib/i18n'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TransKey) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'uz',
  setLang: () => {},
  t: (key) => key,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang) || 'uz'
  )

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
    document.documentElement.lang = l
  }, [])

  const translate = useCallback((key: TransKey) => t(key, lang), [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
