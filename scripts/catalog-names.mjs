import fs from 'node:fs';
import assert from 'node:assert/strict';

// Exact, standalone form/packaging terms only. Never fuzzy-correct a brand or dose.
const entries = [
 ['Д/СУСП','для приготовления суспензии','suspenziya tayyorlash uchun'],
 ['Д/ИНГ','для ингаляций','ingalyatsiya uchun'],
 ['ПОРОШ','порошок','kukun'], ['К-ТА','кислота','kislota'],
 ['ГРАН','гранулы','granula'], ['ДРАЖЕ','драже','draje'],
 ['ГЛ/КАПЛИ','глазные капли','ko‘z tomchilari'],
 ['Д/ИНФ','для инфузий','infuziya uchun'], ['Д/ИН','для инъекций','inyeksiya uchun'],
 ['ТАБ','таблетки','tabletka'], ['КАПС','капсулы','kapsula'],
 ['АМП','ампулы','ampula'], ['Р-Р','раствор','eritma'],
 ['ФЛ','флакон','flakon'], ['ПОР','порошок','kukun'],
 ['СУПП','суппозитории','shamcha'], ['СУСП','суспензия','suspenziya'],
 ['АЭРОЗ','аэрозоль','aerozol'], ['ПАК','пакет','paket'],
 ['ТАБЛЕТКИ','таблетки','tabletka'], ['КАПСУЛЫ','капсулы','kapsula'],
 ['РАСТВОР','раствор','eritma'], ['ПОРОШОК','порошок','kukun'],
 ['СУСПЕНЗИЯ','суспензия','suspenziya'], ['СИРОП','сироп','sirop'],
 ['СПРЕЙ','спрей','sprey'], ['КАПЛИ','капли','tomchi'],
 ['МАЗЬ','мазь','surtma'], ['ГЕЛЬ','гель','gel'], ['КРЕМ','крем','krem'],
 ['АЭРОЗОЛЬ','аэрозоль','aerozol'], ['СУППОЗИТОРИИ','суппозитории','shamcha'],
];
const generic = [
 ['БАХИЛЫ','бахилы','baxila'], ['ПАРА','пара','juft'],
 ['ШПРИЦ','шприц','shprits'], ['БИНТ','бинт','bint'], ['ВАТА','вата','paxta'],
 ['САЛФЕТКИ','салфетки','salfetka'], ['ВЛАЖ','влажные','nam'],
 ['ТЕРМОМЕТР','термометр','termometr'], ['ТОНОМЕТР','тонометр','tonometr'],
 ['ПЛАСТЫРЬ','пластырь','plastir'], ['ПЕРЧАТКИ','перчатки','qo‘lqop'],
 ['МАСКА','маска','niqob'], ['ШАМПУНЬ','шампунь','shampun'],
 ['МЫЛО','мыло','sovun'], ['МАСЛО','масло','moy'],
 ['ПОДГУЗНИКИ','подгузники','taglik'], ['ПУСТЫШКА','пустышка','so‘rg‘ich'],
 ['БУТЫЛОЧКА','бутылочка','butilka'], ['БАНДАЖ','бандаж','bandaj'],
 ['ПРЕЗЕРВАТИВЫ','презервативы','prezervativ'],
 ['Д/ЛИЦА','для лица','yuz uchun'], ['Д/РУК','для рук','qo‘l uchun'],
 ['Д/ТЕЛА','для тела','tana uchun'], ['Д/ВОЛОС','для волос','soch uchun']
];
entries.push(...generic);
const genericKeys = new Set(generic.map(x=>x[0]));
const mapping = new Map(entries.map(([key,ru,uz])=>[key,{ru,uz}]));
const cyr = [...'абвгдеёжзийклмнопрстуфхцчшщъыьэюяўқғҳ'];
const lat = ['a','b','v','g','d','e','yo','j','z','i','y','k','l','m','n','o','p','r','s','t','u','f','x','ts','ch','sh','shch','’','i','','e','yu','ya','o‘','q','g‘','h'];
const letters = new Map(cyr.map((c,i)=>[c,lat[i]]));
function translit(s) { return [...s].map(c=>letters.get(c.toLowerCase()) ?? c).join(''); }
function title(s) { return s ? s[0].toUpperCase()+s.slice(1) : s; }
export function formatName(raw,lang) {
 let value=raw.normalize('NFC').replace(/[\u00a0\s]+/g,' ').trim();
 // Only separate known units; keep every number, decimal separator and package mark.
 value=value.replace(/(\d)(МКГ|МГ|МЛ|ММ|КГ|Г|Л)(?![А-ЯЁ])/g,'$1 $2');
 value=value.replace(/№\s*(?=\d)/g,'№');
 value=value.replace(/[А-ЯЁЎҚҒҲ]+(?:[-/][А-ЯЁЎҚҒҲ]+)*/g, (word,offset)=>{
   const term=mapping.get(word);
   const standalone = !/[\p{L}\p{N}-]/u.test(value[offset-1]||' ') && !/[\p{L}\p{N}-]/u.test(value[offset+word.length]||' ');
   if(term && standalone && (offset>0 || genericKeys.has(word))) return offset===0 ? title(term[lang]) : term[lang];
   const units={МКГ:['мкг','mkg'],МГ:['мг','mg'],МЛ:['мл','ml'],ММ:['мм','mm'],КГ:['кг','kg'],Г:['г','g'],Л:['л','l']};
   if(units[word] && /\d\s*$/.test(value.slice(0,offset))) return units[word][lang==='ru'?0:1];
   // Brand spelling is preserved in Russian, transliterated (not translated) in Uzbek.
   return lang==='ru' ? (word.length<=3 ? word : title(word.toLowerCase())) : title(translit(word));
 });
 return value;
}

const source='src/main/resources/dori_katalog.tsv';
const rows=fs.readFileSync(source,'utf8').trimEnd().split(/\r?\n/).map(x=>x.split('\t'));
assert(rows.every(r=>r.length===3),'Source must have exactly three columns');
const audit=['source_line\toriginal\tnomi_ru\tnomi_uz\treview_reason'];
let changed=0, flagged=0;
const output=rows.map(([raw,maker,country],i)=>{
 const ru=formatName(raw,'ru'),uz=formatName(raw,'uz');
 assert.deepEqual(ru.match(/\d+(?:[.,]\d+)*/g),raw.match(/\d+(?:[.,]\d+)*/g));
 assert.deepEqual(uz.match(/\d+(?:[.,]\d+)*/g),raw.match(/\d+(?:[.,]\d+)*/g));
 assert.equal((ru.match(/№/g)||[]).length,(raw.match(/№/g)||[]).length);
 assert(ru.length<=1000 && uz.length<=1000);
 const reasons=[];
 if((raw.match(/\(/g)||[]).length!==(raw.match(/\)/g)||[]).length) reasons.push('unbalanced_parentheses');
 if(/^0\s/.test(raw)) reasons.push('leading_zero');
 if(/\*|\?/.test(raw)) reasons.push('source_marker');
 if(/(?:[А-ЯЁ][A-Za-z]|[A-Za-z][А-ЯЁ])/.test(raw)) reasons.push('mixed_alphabet');
 if(/(?:^|\s)[А-ЯЁ]+[/.][А-ЯЁ.]*(?=\s|$)/.test(raw.replace(/Д\/ИНФ|Д\/ИН|ГЛ\/КАПЛИ/g,''))) reasons.push('unresolved_abbreviation');
 if(reasons.length) flagged++;
 if(ru!==raw) changed++;
 audit.push([i+1,raw,ru,uz,reasons.join(',')||'brand_spelling_not_verified'].join('\t'));
 return [raw,maker,country,ru,uz].join('\t');
});
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('src/main/resources/dori_katalog_localized.tsv',output.join('\n')+'\n');
fs.writeFileSync('reports/catalog-name-audit.tsv',audit.join('\n')+'\n');
fs.writeFileSync('reports/catalog-names-review.tsv',[audit[0],...audit.slice(1).filter(x=>!x.endsWith('\tbrand_spelling_not_verified'))].join('\n')+'\n');
fs.writeFileSync('reports/catalog-name-summary.json',JSON.stringify({rows:rows.length,formatted:changed,flagged,brandSpellingsVerified:false},null,2)+'\n');
assert.equal(formatName('ПАРАЦЕТАМОЛ ТАБ 500МГ №10','ru'),'Парацетамол таблетки 500 мг №10');
assert.equal(formatName('ПАРАЦЕТАМОЛ ТАБ 500МГ №10','uz'),'Paratsetamol tabletka 500 mg №10');
assert.equal(formatName('БАТРОНАТ АМП 0,5Г/5МЛ 5МЛ №10','uz'),'Batronat ampula 0,5 g/5 ml 5 ml №10');
console.log(JSON.stringify({rows:rows.length,formatted:changed,flagged}));
