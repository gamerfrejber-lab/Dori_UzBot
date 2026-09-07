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

function toTitleCase(s: string): string {
  return s.replace(/[^\s-]+/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )
}

const shaklMap: [string, string, string][] = [
  ['СУСПЕНЗ', 'suspenziya', 'суспензия'],
  ['РАСТВОР', 'eritma', 'раствор'],
  ['СИРОП', 'sirop', 'сироп'],
  ['КАПЛИ', 'tomchi', 'капли'],
  ['КАПС', 'kapsula', 'капсула'],
  ['СПРЕЙ', 'sprey', 'спрей'],
  ['ПОРОШ', 'poroshok', 'порошок'],
  ['ПЛАСТ', 'plastir', 'пластырь'],
  ['СВЕЧ', 'svecha', 'свеча'],
  ['СУПП', 'svecha', 'свеча'],
  ['МАЗЬ', 'malham', 'мазь'],
  ['КРЕМ', 'krem', 'крем'],
  ['ГЕЛЬ', 'gel', 'гель'],
  ['САШЕ', 'sashe', 'саше'],
  ['ТАБ', 'tabletka', 'таблетка'],
  ['АМП', 'ampula', 'ампула'],
  ['Р-Р', 'eritma', 'раствор'],
  ['TAB', 'tabletka', 'таблетка'],
  ['CAPS', 'kapsula', 'капсула'],
  ['KAPS', 'kapsula', 'капсула'],
]

export function doriNominiTozalash(rawNomi: string, lang: 'uz' | 'ru'): string {
  if (!rawNomi) return ''

  const up = rawNomi.toUpperCase()

  let formIdx = -1
  let formUz = ''
  let formRu = ''
  for (const [kw, uz, ru] of shaklMap) {
    const idx = up.indexOf(kw)
    if (idx > 0 && (formIdx < 0 || idx < formIdx)) {
      formIdx = idx
      formUz = uz
      formRu = ru
    }
  }

  let baseName: string
  if (formIdx > 0) {
    baseName = rawNomi.substring(0, formIdx).trim()
  } else {
    const dozaIdx = rawNomi.search(/\s+\d+\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G|%)/i)
    baseName = dozaIdx > 0 ? rawNomi.substring(0, dozaIdx).trim() : rawNomi.trim()
  }

  baseName = baseName.replace(/\s*[№N]\s*\d+\s*$/i, '').trim()
  baseName = baseName.replace(/\s+\d+(?:[.,]\d+)?\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G|%)\s*$/i, '').trim()

  let displayName: string
  if (lang === 'uz') {
    displayName = hasCyrillic(baseName) ? cyrToLat(toTitleCase(baseName)) : toTitleCase(baseName)
  } else {
    displayName = toTitleCase(baseName)
  }

  const dozaMatch = rawNomi.match(/(\d+(?:[.,]\d+)?)\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G|%)/i)
  let doza = ''
  if (dozaMatch) {
    const unit = dozaMatch[2]
    if (unit === '%') {
      doza = `${dozaMatch[1]}%`
    } else {
      const unitMap: Record<string, string> = {
        'МГ': 'mg', 'MG': 'mg', 'МЛ': 'ml', 'ML': 'ml',
        'МКГ': 'mkg', 'MCG': 'mkg', 'Г': 'g', 'G': 'g',
      }
      doza = `${dozaMatch[1]} ${unitMap[unit.toUpperCase()] || unit.toLowerCase()}`
    }
  }

  const qtyMatch = rawNomi.match(/[№N]\s*(\d+)/i)
  const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0

  const form = lang === 'uz' ? formUz : formRu
  let result = displayName
  if (doza) result += ' ' + doza
  if (qty > 0 && form) {
    result += `, ${qty} ${lang === 'uz' ? 'ta' : 'шт'} ${form}`
  } else if (qty > 0) {
    result += `, ${qty} ${lang === 'uz' ? 'ta' : 'шт'}`
  } else if (form) {
    result += `, ${form}`
  }

  return result
}

/** Faqat dori asosiy nomini qaytaradi: "ПАРАЦЕТАМОЛ СУПП РЕКТ 250МГ №10" → "Paratsetamol" */
export function doriAsosiyNomi(rawNomi: string, lang: 'uz' | 'ru'): string {
  if (!rawNomi) return ''
  const up = rawNomi.toUpperCase()
  let formIdx = -1
  for (const [kw] of shaklMap) {
    const idx = up.indexOf(kw)
    if (idx > 0 && (formIdx < 0 || idx < formIdx)) formIdx = idx
  }
  let baseName: string
  if (formIdx > 0) {
    baseName = rawNomi.substring(0, formIdx).trim()
  } else {
    const dozaIdx = rawNomi.search(/\s+\d+\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G|%)/i)
    baseName = dozaIdx > 0 ? rawNomi.substring(0, dozaIdx).trim() : rawNomi.trim()
  }
  baseName = baseName.replace(/\s*[№N]\s*\d+\s*$/i, '').trim()
  baseName = baseName.replace(/\s+\d+(?:[.,]\d+)?\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G|%)\s*$/i, '').trim()
  if (lang === 'uz') {
    return hasCyrillic(baseName) ? cyrToLat(toTitleCase(baseName)) : toTitleCase(baseName)
  }
  return toTitleCase(baseName)
}

/** Shakl va dozani chiroyli qaytaradi: "СУПП РЕКТ 250МГ №10" → "Supp Rekt 250 mg" */
export function doriShakliDozasi(rawNomi: string, lang: 'uz' | 'ru'): string {
  if (!rawNomi) return ''
  const up = rawNomi.toUpperCase()
  let formIdx = -1
  for (const [kw] of shaklMap) {
    const idx = up.indexOf(kw)
    if (idx > 0 && (formIdx < 0 || idx < formIdx)) formIdx = idx
  }
  if (formIdx < 0) {
    const m = rawNomi.match(/(\d+(?:[.,]\d+)?)\s*(МГ|МЛ|МКГ|Г|MG|ML|MCG|G|%)/i)
    if (!m) return ''
    if (m[2] === '%') return `${m[1]}%`
    const unitMap: Record<string, string> = { 'МГ': 'mg', 'MG': 'mg', 'МЛ': 'ml', 'ML': 'ml', 'МКГ': 'mkg', 'MCG': 'mkg', 'Г': 'g', 'G': 'g' }
    return `${m[1]} ${unitMap[m[2].toUpperCase()] || m[2].toLowerCase()}`
  }
  let part = rawNomi.substring(formIdx).trim()
  part = part.replace(/\s*[№N]\s*\d+/gi, '').trim()
  part = part
    .replace(/(\d+)\s*(МГ|MG)/gi, '$1 mg')
    .replace(/(\d+)\s*(МЛ|ML)/gi, '$1 ml')
    .replace(/(\d+)\s*(МКГ|MCG)/gi, '$1 mkg')
    .replace(/(\d+)\s*(Г|G)\b/gi, '$1 g')
  if (lang === 'uz' && hasCyrillic(part)) part = cyrToLat(part)
  part = part.split(/\s+/).map(w => {
    if (/^\d/.test(w) || /^(mg|ml|mkg|g|%)$/i.test(w)) return w.toLowerCase()
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  }).join(' ')
  return part
}

const tavsiflar: Record<string, { uz: string; ru: string }> = {
  'ПАРАЦЕТАМОЛ': { uz: "Og'riq qoldiruvchi va isitmani tushiruvchi", ru: 'Обезболивающее и жаропонижающее' },
  'ИБУПРОФЕН': { uz: "Yallig'lanishga qarshi og'riq qoldiruvchi", ru: 'Противовоспалительное обезболивающее' },
  'НУРОФЕН': { uz: "Yallig'lanishga qarshi og'riq qoldiruvchi", ru: 'Противовоспалительное обезболивающее' },
  'АНАЛЬГИН': { uz: "Og'riq qoldiruvchi va isitmani tushiruvchi", ru: 'Обезболивающее и жаропонижающее' },
  'АСПИРИН': { uz: "Og'riq qoldiruvchi, qon suyultiruvchi", ru: 'Обезболивающее, антиагрегант' },
  'АМОКСИЦИЛЛИН': { uz: 'Keng spektrli antibiotik', ru: 'Антибиотик широкого спектра' },
  'ЦЕФТРИАКСОН': { uz: 'Kuchli antibiotik', ru: 'Антибиотик для тяжёлых инфекций' },
  'АЗИТРОМИЦИН': { uz: 'Antibiotik', ru: 'Антибиотик' },
  'МЕТФОРМИН': { uz: 'Qandli diabet (II tur) uchun', ru: 'При сахарном диабете 2 типа' },
  'АМЛОДИПИН': { uz: 'Qon bosimini tushiruvchi', ru: 'Снижает давление' },
  'ЛОРАТАДИН': { uz: 'Allergiyaga qarshi', ru: 'Антигистаминное' },
  'ЦЕТИРИЗИН': { uz: 'Allergiyaga qarshi', ru: 'Антигистаминное' },
  'ОМЕПРАЗОЛ': { uz: 'Oshqozon kislotasini kamaytiruvchi', ru: 'Снижает кислотность желудка' },
  'ДИКЛОФЕНАК': { uz: "Yallig'lanishga qarshi og'riq qoldiruvchi", ru: 'Противовоспалительное обезболивающее' },
  'ДРОТАВЕРИН': { uz: 'Spazmga qarshi', ru: 'Спазмолитик' },
  'НО-ШПА': { uz: 'Spazmga qarshi', ru: 'Спазмолитик' },
  'МЕЗИМ': { uz: 'Hazm ferment preparati', ru: 'Пищеварительный фермент' },
  'ПАНКРЕАТИН': { uz: 'Hazm ferment preparati', ru: 'Пищеварительный фермент' },
  'АКТИВИРОВАННЫЙ': { uz: 'Zaharlanishda adsorbent', ru: 'Адсорбент при отравлениях' },
  'ЛОПЕРАМИД': { uz: 'Ich ketishga qarshi', ru: 'Противодиарейное' },
  'ВАЛИДОЛ': { uz: 'Yurak va asab tinchlantiruvchi', ru: 'Седативное средство' },
  'НИФЕДИПИН': { uz: 'Qon bosimini tushiruvchi', ru: 'Снижает давление' },
  'КАПТОПРИЛ': { uz: 'Qon bosimini tushiruvchi', ru: 'Снижает давление' },
  'ЭНАЛАПРИЛ': { uz: 'Qon bosimini tushiruvchi', ru: 'Снижает давление' },
  'ЛЕВОМИЦЕТИН': { uz: "Antibiotik (ko'z tomchilari)", ru: 'Антибиотик (глазные капли)' },
  'ФУРАЗОЛИДОН': { uz: 'Infeksiyaga qarshi', ru: 'Противомикробное' },
  'ЦИПРОФЛОКСАЦИН': { uz: 'Keng spektrli antibiotik', ru: 'Антибиотик широкого спектра' },
  'МЕТРОНИДАЗОЛ': { uz: 'Antibiotik va parazitlarga qarshi', ru: 'Антибиотик и антипаразитарное' },
  'СМЕКТА': { uz: 'Ich ketishga qarshi', ru: 'Противодиарейное' },
  'МУКАЛТИН': { uz: "Yo'talga qarshi", ru: 'При кашле' },
  'БРОМГЕКСИН': { uz: "Yo'talga qarshi", ru: 'При кашле' },
  'ДЕКСАМЕТАЗОН': { uz: "Yallig'lanishga qarshi gormon", ru: 'Кортикостероид' },
  'ПРЕДНИЗОЛОН': { uz: "Yallig'lanishga qarshi gormon", ru: 'Кортикостероид' },
  'КОРВАЛОЛ': { uz: 'Asab tinchlantiruvchi', ru: 'Седативное средство' },
  'ЦЕФАЗОЛИН': { uz: 'Antibiotik', ru: 'Антибиотик' },
  'СУПРАСТИН': { uz: 'Allergiyaga qarshi', ru: 'Антигистаминное' },
  'ФЛУКОНАЗОЛ': { uz: "Zamburug'ga qarshi", ru: 'Противогрибковое' },
  'КЛОТРИМАЗОЛ': { uz: "Zamburug'ga qarshi", ru: 'Противогрибковое' },
  'КЕТОКОНАЗОЛ': { uz: "Zamburug'ga qarshi", ru: 'Противогрибковое' },
  'АЦИКЛОВИР': { uz: 'Viruslarga qarshi', ru: 'Противовирусное' },
  'ФУРАЦИЛИН': { uz: 'Antiseptik', ru: 'Антисептик' },
  'ХЛОРГЕКСИДИН': { uz: 'Antiseptik', ru: 'Антисептик' },
  'ЛИЗИНОПРИЛ': { uz: 'Qon bosimini tushiruvchi', ru: 'Снижает давление' },
  'АТЕНОЛОЛ': { uz: 'Yurak urishi va bosimni tushiruvchi', ru: 'Снижает давление и ЧСС' },
  'БИСОПРОЛОЛ': { uz: 'Yurak urishi va bosimni tushiruvchi', ru: 'Снижает давление и ЧСС' },
  'АТОРВАСТАТИН': { uz: 'Xolesterinni kamaytiruvchi', ru: 'Снижает холестерин' },
  'СИМВАСТАТИН': { uz: 'Xolesterinni kamaytiruvchi', ru: 'Снижает холестерин' },
  'КЛАРИТРОМИЦИН': { uz: 'Antibiotik', ru: 'Антибиотик' },
  'ДОКСИЦИКЛИН': { uz: 'Antibiotik', ru: 'Антибиотик' },
  'РАНИТИДИН': { uz: 'Oshqozon kislotasini kamaytiruvchi', ru: 'Снижает кислотность желудка' },
}

function getBaseForLookup(raw: string): string {
  const up = raw.toUpperCase().trim()
  for (const [kw] of shaklMap) {
    const idx = up.indexOf(kw)
    if (idx > 0) return up.substring(0, idx).trim()
  }
  const d = up.search(/\s+\d/)
  return d > 0 ? up.substring(0, d).trim() : up
}

export function doriTavsifi(rawNomi: string, lang: 'uz' | 'ru'): string {
  if (!rawNomi) return ''
  const base = getBaseForLookup(rawNomi)
  for (const [key, val] of Object.entries(tavsiflar)) {
    if (base === key || base.startsWith(key) || key.startsWith(base)) {
      return val[lang]
    }
  }
  return ''
}
