const cyrMap: Record<string, string> = {
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'J','З':'Z',
  'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
  'С':'S','Т':'T','У':'U','Ф':'F','Х':'X','Ц':'Ts','Ч':'Ch','Ш':'Sh',
  'Щ':'Shch','Ъ':'ʼ','Ы':'I','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh',
  'щ':'shch','ъ':'ʼ','ы':'i','ь':'','э':'e','ю':'yu','я':'ya',
}

export function cyrToLat(s: string): string {
  if (!s) return s
  let r = ''
  for (let i = 0; i < s.length; i++) {
    r += cyrMap[s[i]] ?? s[i]
  }
  return r
}

export function hasCyrillic(s: string): boolean {
  return /[А-Яа-яЁё]/.test(s)
}

export function doriNomi(nomi: string, nomiRu: string | null, lang: 'uz' | 'ru'): string {
  if (lang === 'ru') return nomiRu || nomi || ''
  const n = nomi || nomiRu || ''
  return hasCyrillic(n) ? cyrToLat(n) : n
}

export function doriAsosiyNom(nomi: string): string {
  return nomi
    .replace(/\s+(TAB|KAPS|SUPP|SIROP|AMP|SUSP|MAST|GEL|KREM|SPR|KAP|INF|R-R|SHAM|POR|GRAN|DRAZH|PAST|SUP|REKT|SHPR|FL|МГ|МЛ|MG|ML|G|Г|N|№)\b.*/i, '')
    .trim()
}

export function doriShakli(nomi: string, lang: 'uz' | 'ru'): string {
  const n = (nomi || '').toUpperCase()
  const has = (s: string) => n.includes(s)
  if (has('ТАБ')) return lang === 'uz' ? 'Tabletka' : 'Таблетки'
  if (has('КАПС')) return lang === 'uz' ? 'Kapsula' : 'Капсулы'
  if (has('СИРОП')) return lang === 'uz' ? 'Sirop' : 'Сироп'
  if (has('АМП') || has('Р-Р')) return lang === 'uz' ? 'Ampula' : 'Ампулы'
  if (has('СУПП') || has('СВЕЧ')) return lang === 'uz' ? 'Svecha' : 'Свечи'
  if (has('МАЗЬ') || has('КРЕМ') || has('ГЕЛЬ')) return lang === 'uz' ? 'Malham' : 'Мазь'
  if (has('КАПЛИ') || has('СПРЕЙ')) return lang === 'uz' ? 'Tomchi' : 'Капли'
  if (has('ПОРОШ')) return lang === 'uz' ? 'Poroshok' : 'Порошок'
  return lang === 'uz' ? 'Dori' : 'Лекарство'
}

export function doriDozasi(nomi: string, lang: 'uz' | 'ru'): string {
  if (!nomi) return ''
  const shakllar = ['ТАБ','КАПС','СИРОП','АМП','Р-Р','РАСТВОР','ИНЪЕК','СУПП','СВЕЧ','МАЗЬ','КРЕМ','ГЕЛЬ','КАПЛИ','СПРЕЙ','ПОРОШ','САШЕ']
  const up = nomi.toUpperCase()
  for (const s of shakllar) {
    const idx = up.indexOf(s)
    if (idx > 0) {
      let doza = nomi.substring(idx).trim()
      if (lang === 'uz') doza = cyrToLat(doza)
      return doza
    }
  }
  const m = nomi.match(/\d+\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G)/i)
  if (m) {
    let doza = nomi.substring(m.index!).trim()
    if (lang === 'uz') doza = cyrToLat(doza)
    return doza
  }
  return ''
}
