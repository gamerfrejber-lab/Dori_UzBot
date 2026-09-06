from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from pypdf import PdfReader
from pathlib import Path
root=Path(r'D:/G59/Model_6/Dori_Qidiruv_bot')
pdfmetrics.registerFont(TTFont('Arial',r'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold',r'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='ArialBold')
out=root/'output/pdf/shartnoma_tahrirlangan.pdf'
c=canvas.Canvas(str(out),pagesize=A4); c.setTitle('Dori Qidiruv - xizmat ko‘rsatish shartnomasi loyihasi'); c.setAuthor('Dori Qidiruv')
W,H=A4; L=48; width=W-96; y=0; page=0
ink=HexColor('#143A38'); teal=HexColor('#007D73')
style=ParagraphStyle('body',fontName='Arial',fontSize=10.2,leading=14.5,textColor=ink,spaceAfter=5)
def p(t,size=None,bold=False,after=6):
 global y
 st=ParagraphStyle('x',parent=style,fontSize=size or 10.2,leading=(size or 10.2)*1.4,fontName='ArialBold' if bold else 'Arial')
 ob=Paragraph(t,st); _,h=ob.wrap(width,1000)
 assert y-h>48,(page,t,y,h)
 ob.drawOn(c,L,y-h);y-=h+after

def title(t): p(t,16,True,12)
def head(t): p(t,11.6,True,7)
def clause(n,t):p('<b>'+n+'</b>  '+t,after=5)
def new():
 global y,page
 if page:c.showPage()
 page+=1;y=H-68
 c.setFont('ArialBold',8);c.setFillColor(teal);c.drawString(L,H-37,'DORI QIDIRUV  /  HAMKORLIK')
 c.setFont('Arial',8);c.drawRightString(W-L,H-37,'Tahrirlangan loyiha')
 c.setStrokeColor(HexColor('#C9DBD6'));c.line(L,41,W-L,41)
 c.setFont('Arial',8);c.setFillColor(ink);c.drawString(L,27,'Dori Qidiruv');c.drawRightString(W-L,27,f'{page} / 4')
new();title('Dorixona uchun platforma haqida')
p('Dori Qidiruv mijozga kerakli dorini topish va dorixonaga borishdan oldin band qilish so‘rovini yuborishga yordam beradi. Quyida xizmatning qisqa tavsifi keltirilgan.',11,after=13)
head('Qanday ishlaydi')
p('Xaridor Telegram bot yoki veb-saytda dori nomini qidiradi. Platforma dorixonalar, narxlar va mavjudlik haqidagi ma’lumotni ko‘rsatadi. Joylashuv aniqlanganda masofa ham ko‘rinadi. Xaridor dorixonani tanlab, bron so‘rovini yuboradi; dorixona so‘rovga javob beradi.',after=13)
head('Dorixona uchun imkoniyatlar')
for t in ['<b>Xaridorlarga ko‘rinish.</b> Dorixonangizdagi mahsulotlarni ularni qidirayotgan mijozlarga ko‘rsatish.', '<b>Oldindan murojaat.</b> Mijoz kelishidan oldin mahsulot mavjudligini tekshirish va bronni tasdiqlash.', '<b>Ombor hisobi.</b> Kirim, chiqim, qoldiq va tushum haqidagi ma’lumotlarni yuritish. Ushbu imkoniyat obuna xizmatiga qo‘shimcha to‘lovsiz kiradi.', '<b>Manzil va aloqa.</b> Dorixonaning manzili, telefoni va xaritadagi joylashuvini ko‘rsatish.', '<b>Ikki tilda qidiruv.</b> O‘zbekcha va ruscha dori nomlari orqali qidirish.', '<b>Qulay foydalanish.</b> Internetga ulangan telefon va Telegram orqali ishlash. Xizmatdan foydalanish uchun alohida qurilma sotib olish talab etilmaydi.']:
 p(t,after=8)
p('Platforma muayyan mijozlar sonini, savdo hajmini yoki har bir bronning xarid bilan yakunlanishini kafolatlamaydi.',10,after=14)
head('Dorixonadan nima talab qilinadi')
p('Narx va qoldiqni to‘g‘ri kiritish, ularni yangilash, ish vaqtida bronlarga javob berish hamda tasdiqlangan mahsulotni kelishilgan muddatgacha ajratib qo‘yish. Ijrochi mas’ul xodimga kabinetdan foydalanish tartibini tushuntiradi.',after=13)
head('Xizmatning doirasi')
p('Ijrochi dori sotmaydi, saqlamaydi va yetkazib bermaydi. Sotuv dorixonada amalga oshiriladi. Dorixona mahsulot sifati, saqlash sharoiti va retsept bo‘yicha berish talablariga rioya qiladi. Platformadagi hisob dorixonaning majburiy buxgalteriya va kassa hisobini almashtirmaydi.',after=12)
p('Bu sahifa tanishtirish uchun. Tomonlarning majburiyatlari quyidagi shartnoma bandlari bilan belgilanadi.',9,after=10)
p('Telegram: <link href="https://t.me/dori_UzBot" color="#007D73">t.me/dori_UzBot</link><br/>Sayt: <link href="https://dori-qidiruv-bot-sayt.onrender.com/" color="#007D73">dori-qidiruv-bot-sayt.onrender.com</link>',9)
new();title('XIZMAT KO‘RSATISH SHARTNOMASI')
p('№ ____________ &nbsp;&nbsp;&nbsp; Toshkent shahri &nbsp;&nbsp;&nbsp; “____” ____________ 20____ yil',10,after=10)
p('Bir tomondan __________________________________________ nomidan<br/>________________________ asosida ish yurituvchi ________________________ (keyingi o‘rinlarda “Ijrochi”), ikkinchi tomondan ____________________________ nomidan ________________________ asosida ish yurituvchi ________________________ (keyingi o‘rinlarda “Buyurtmachi”), birgalikda “Tomonlar”, ushbu shartnomani tuzdilar.',after=10)
head('1. SHARTNOMA PREDMETI')
clause('1.1.','Ijrochi Buyurtmachiga “Dori Qidiruv” platformasi (Telegram bot va veb-sayt) hamda dorixona ish kabinetidan foydalanish huquqini beradi. Buyurtmachi kelishilgan obuna to‘lovini to‘laydi. Ombor hisobi obuna tarkibiga kiradi.')
clause('1.2.','Platforma mahsulotlar, narxlar, mavjudlik va dorixona manzilini ko‘rsatadi, bron so‘rovlarini Buyurtmachiga yetkazadi. Aniq qoldiq platformada ombor hisobi yuritilganda ko‘rsatiladi.')
clause('1.3.','Ijrochi dori vositalarini sotmaydi, saqlamaydi va yetkazib bermaydi. Oldi-sotdi munosabatlari Buyurtmachi va xaridor o‘rtasida yuzaga keladi.')
clause('1.4.','Bron so‘rovi xarid yoki to‘lov amalga oshganini anglatmaydi. Mahsulotni band qilish Buyurtmachi tasdig‘i va unda ko‘rsatilgan muddatga muvofiq amalga oshiriladi.')
head('2. IJROCHINING MAJBURIYATLARI')
clause('2.1.','Ish kabinetini ochish, foydalanish tartibini tushuntirish va platformaning ishlashini ta’minlash uchun zarur texnik choralarni ko‘rish.')
clause('2.2.','Buyurtmachi kiritgan ma’lumotni buzmasdan ko‘rsatish va bron so‘rovlarini kechiktirmasdan yetkazish. Aniqlangan nosozlik haqida xabar berish va uni imkon qadar tez bartaraf etish.')
clause('2.3.','Texnik murojaatlar uchun aloqa kanali: ______________________________. Murojaatga dastlabki javob berish muddati: ______ ish soati.')
clause('2.4.','Ichki tushum, sotuv hajmi va ombor harakatlarini maxfiy saqlash. Xaridorga ko‘rsatish uchun kiritilgan mahsulot nomi, narxi, mavjudligi, ko‘rsatiladigan qoldiq, dorixona manzili va aloqa ma’lumotlari bundan mustasno.')
clause('2.5.','Obuna muddati tugashidan kamida 7 (yetti) kun oldin Buyurtmachini ogohlantirish.')
head('3. BUYURTMACHINING MAJBURIYATLARI')
clause('3.1.','Dorixona va vakil haqidagi haqiqiy ma’lumotlarni taqdim etish; faoliyat uchun zarur litsenziya va vakolatlarning amal qilishini ta’minlash.')
clause('3.2.','Mahsulot narxi va qoldig‘i o‘zgarganda ma’lumotlarni yangilash; noto‘g‘ri ma’lumot aniqlansa, uni tuzatish.')
clause('3.3.','Ish vaqtida kelgan bron so‘roviga ______ soat ichida javob berish. Ish vaqtidan tashqari kelgan so‘rov uchun muddat keyingi ish vaqti boshlanganidan hisoblanadi.')
clause('3.4.','Tasdiqlangan mahsulotni kamida ______ soat ajratib qo‘yish va xaridorga bronning tugash vaqtini bildirish. Muddat tugasa yoki xaridor voz kechsa, bron holatini yangilash.')
clause('3.5.','Obuna to‘lovini o‘z vaqtida to‘lash. Kabinetga faqat vakolatli xodimlarni kiritish, kirish ma’lumotlarini begonalarga bermaslik va ruxsatsiz kirish haqida Ijrochiga xabar berish.')
new();head('4. OBUNA MUDDATI VA TO‘LOV')
clause('4.1.','Obuna muddati: ______ oy (1, 3, 6, 9 yoki 12 oy). Boshlanish sanasi: ________________. Tugash sanasi: ________________.')
clause('4.2.','Obuna uchun jami to‘lov: __________________ so‘m. QQS holati: __________________. To‘lov muddati va tartibi: ________________________________.')
clause('4.3.','To‘lov amalga oshirilgach, Ijrochi kabinetni ______ ish kuni ichida faollashtiradi. Obuna muddati amalda faollashtirilgan sanadan hisoblanadi; sanalar Tomonlar tomonidan qayd etiladi.')
clause('4.4.','Obuna uzaytirilmasa, yangi bron qabul qilish va ma’lumotlarni qidiruvda ko‘rsatish to‘xtatiladi. Avval tasdiqlangan bronlar bo‘yicha Buyurtmachi xaridorni xabardor qiladi va ularning holatini yakunlaydi.')
clause('4.5.','Obuna tugagach, hisob ma’lumotlari ______ kun saqlanadi. Shu davrda Buyurtmachi o‘z ma’lumotlarining nusxasini so‘rashi mumkin. Saqlash muddati tugagach, qonun bo‘yicha saqlanishi shart bo‘lgan ma’lumotlardan tashqari ma’lumotlarni o‘chirish yoki shaxssizlantirish tartibi qo‘llanadi.')
clause('4.6.','Yangi tarif va qo‘shimcha pullik xizmatlar Tomonlarning yozma kelishuvi bilan qo‘llanadi. To‘langan davr narxi bir tomonlama o‘zgartirilmaydi.')
head('5. TOMONLARNING JAVOBGARLIGI')
clause('5.1.','Buyurtmachi o‘zi kiritgan mahsulot, narx va qoldiq ma’lumotlarining to‘g‘riligi, sotilgan mahsulot sifati, saqlash sharoiti va retsept talablariga rioya qilinishi uchun javob beradi.')
clause('5.2.','Ijrochi o‘z majburiyatlarini bajarmaganligi yoki lozim darajada bajarmaganligi uchun qonunchilikka muvofiq javob beradi. Internet yoki Telegramdagi uzilish Ijrochini barcha majburiyatlardan avtomatik ozod qilmaydi; ta’sirlangan Tomon uzilish va ko‘rilayotgan choralar haqida xabar beradi.')
clause('5.3.','Bronlarga takroran javob berilmasa, Ijrochi buzilishlarni ko‘rsatib yozma ogohlantiradi va tuzatish uchun ______ ish kuni beradi. Kamchilik bartaraf etilmasa, yangi bronlarni vaqtincha to‘xtatishi mumkin. Tiklash shartlari xabarda ko‘rsatiladi.')
clause('5.4.','Xizmat vaqtincha to‘xtaganda obuna muddatini hisoblash va qayta hisob-kitob qilish tartibi: ________________________________________________________.')
clause('5.5.','Platforma muayyan mijozlar soni, savdo hajmi yoki har bir bronning xarid bilan yakunlanishini kafolatlamaydi.')
head('6. SHARTNOMA MUDDATI VA BEKOR QILISH')
clause('6.1.','Shartnoma imzolangan kundan kuchga kiradi va obuna muddati oxirigacha amal qiladi. Hisob-kitob va maxfiylik bo‘yicha bajarilmagan majburiyatlar tegishli tartibda davom etadi.')
clause('6.2.','Tomon bekor qilish tashabbusi haqida boshqa Tomonni kamida 10 (o‘n) kun oldin yozma xabardor qiladi. Bekor qilish asoslari, tartibi va moliyaviy oqibatlari Fuqarolik kodeksining 707-moddasi hamda Tomonlarning qonunga zid bo‘lmagan yozma kelishuvi asosida belgilanadi.')
clause('6.3.','Bekor qilishda Tomonlar ko‘rsatilgan xizmatlar, to‘lovlar va qonuniy talablarni solishtiradi. Qaytarilishi lozim bo‘lgan summa aniqlansa, uni qaytarish muddati: ______ ish kuni; tartibi: ____________________________________________. Ushbu band avtomatik ravishda to‘liq yoki mutanosib qaytarish kafolati hisoblanmaydi.')
new();head('7. MAXFIYLIK VA YAKUNIY QOIDALAR')
clause('7.1.','Tomonlar xaridorning shaxsga doir ma’lumotlaridan bronni bajarish uchun zarur hajmda va qonuniy asosda foydalanadi. Ularni qonuniy asossiz reklama uchun ishlatish yoki uchinchi shaxslarga tarqatishga yo‘l qo‘yilmaydi. Ushbu shartnoma xaridorning roziligini almashtirmaydi.')
clause('7.2.','Tomonlar kirishni cheklash va ma’lumotlarni himoya qilish choralarini ko‘radi. Ruxsatsiz kirish yoki oshkor etilish aniqlansa, boshqa Tomonni asossiz kechiktirmasdan xabardor qiladi va oqibatlarni bartaraf etishda hamkorlik qiladi.')
clause('7.3.','Nizolar muzokara yo‘li bilan hal etiladi. Kelishuv bo‘lmasa, nizo O‘zbekiston Respublikasi qonunchiligiga muvofiq vakolatli sudda ko‘riladi.')
clause('7.4.','Operativ xabarlar 8-bo‘limdagi kelishilgan aloqa kanallariga yuboriladi. Tarif, majburiyatlar yoki shartnomani o‘zgartiruvchi kelishuvlar yozma shaklda rasmiylashtiriladi.')
clause('7.5.','Shartnoma teng yuridik kuchga ega ikki nusxada, har bir Tomon uchun bittadan tuziladi. Bo‘sh maydonlar imzolashdan oldin to‘ldiriladi; qo‘llanmaydigan shartlar aniq belgilanadi.')
head('8. TOMONLARNING REKVIZITLARI VA IMZOLARI')
start=y; colw=(width-22)/2
labels1=['IJROCHI (Platforma)','To‘liq nomi / F.I.Sh.:','Tashkiliy-huquqiy maqomi:','Vakili va vakolat asosi:','Manzili:','STIR:','Bank / MFO:','Hisob raqami:','Telefon:','Kelishilgan Telegram / e-pochta:','Imzo / F.I.Sh.:','Sana:']
labels2=['BUYURTMACHI (Dorixona)','Yuridik nomi:','Dorixona / filial nomi:','Vakili va vakolat asosi:','Yuridik va dorixona manzili:','STIR / litsenziya raqami:','Bank / MFO:','Hisob raqami:','Telefon va ish vaqti:','Kelishilgan Telegram / e-pochta:','Imzo / F.I.Sh.:','Sana:']
for k,ls in enumerate([labels1,labels2]):
 x=L+k*(colw+22);cy=start
 for j,t in enumerate(ls):
  c.setFillColor(teal if j==0 else ink); c.setFont('ArialBold' if j==0 else 'Arial',9.5 if j==0 else 8.5);c.drawString(x,cy-10,t)
  if j: c.setStrokeColor(HexColor('#C9DBD6'));c.line(x,cy-28,x+colw,cy-28)
  cy-=24 if j==0 else 33
 c.setFont('Arial',8.5); c.drawString(x,cy-8,'Muhr (mavjud bo‘lsa)')
 assert cy>55,cy
c.save()
r=PdfReader(str(out));assert len(r.pages)==4
alltext='\n'.join(pg.extract_text() for pg in r.pages)
assert '\ufffd' not in alltext
(root/'tmp/pdfs/tahrirlangan.txt').write_text(alltext,encoding='utf8')
print(out); print('Pages:',len(r.pages))
