// The 12 test questions (student-facing, Uzbek Latin). Loaded into the DB by db/seed.ts.
// Rules checked by tests/questions.test.ts: 4 per category, 40 points per category, 4 options,
// the correct option is never the longest, and every logic puzzle has exactly one solution.
// Categories are interleaved so running out of time doesn't hit one category harder than the others.
import type { questions } from "./schema.ts";

export const questionBank: (typeof questions.$inferInsert)[] = [
  {
    id: 1,
    category: "logic",
    points: 8,
    prompt: `Quyidagi sonlar maʼlum bir qoida asosida davom etadi:

3, 4, 7, 11, 18, 29, ?

Soʻroq belgisi oʻrnida qaysi son turishi kerak?`,
    options: ["40", "43", "47", "58"],
    correctIndex: 2,
  },
  {
    id: 2,
    category: "critical",
    points: 10,
    prompt: `Maktabda 300 nafar oʻquvchi orasida soʻrovnoma oʻtkazildi. Natijaga koʻra, kuniga 4 soatdan koʻp telefon ishlatadigan oʻquvchilarning baholari oʻrtacha pastroq.

Direktor shunday xulosa qildi: “Demak, telefon baholarni pasaytiradi. Maktabda telefonni taqiqlasak, baholar albatta koʻtariladi.”

Direktorning fikridagi eng jiddiy kamchilik nimada?`,
    options: [
      "Soʻrovnoma faqat bitta maktabda oʻtkazilgan, boshqa maktablar umuman hisobga olinmagan.",
      "Ikkalasining ortida boshqa sabab turgan boʻlishi mumkin, masalan, darsga qiziqmaslik.",
      "Baʼzi aʼlochi oʻquvchilar ham telefondan kuniga 4 soatdan koʻproq foydalanadi.",
      "Telefonni taqiqlash oʻquvchilar va ota-onalar orasida katta norozilik uygʻotadi.",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    category: "teamwork",
    points: 10,
    prompt: `Xakatonda toʻrt kishilik jamoadasiz. Jamoadoshingiz Sanjar ikki kundan beri deyarli hech narsa qilmayapti: guruh chatida kam yozadi, unga topshirilgan taqdimot dizayni hali boshlanmagan. Loyihani topshirishga ikki kun qoldi.

Eng toʻgʻri yoʻl qaysi?`,
    options: [
      "Uning ishini jimgina oʻzingiz bajarib qoʻyasiz: vaqt kam, ortiqcha janjal kerak emas.",
      "Darhol ustozga borib, Sanjar hech narsa qilmayotganini aytasiz va uni jamoadan chiqarishni soʻraysiz.",
      "Guruh chatida, hamma koʻrib turgan joyda, Sanjarni ishlamayotgani uchun tanqid qilasiz.",
      "Sanjar bilan yolgʻiz gaplashib, nima xalaqit berayotganini soʻraysiz va muddatni kelishib olasiz.",
    ],
    correctIndex: 3,
  },
  {
    id: 4,
    category: "logic",
    points: 10,
    prompt: `Quyidagilar maʼlum:
• Olimpiada finaliga chiqqan har bir oʻquvchi sertifikat oladi.
• Sertifikat olgan har bir oʻquvchi iyuldagi yozgi lagerga boradi.
• Iyuldagi lagerga boradigan hech kim iyulda ingliz tili kursiga qatnamaydi.

Kamola iyul oyida ingliz tili kursiga qatnaydi. Quyidagilardan qaysi biri albatta toʻgʻri?`,
    options: [
      "Kamola olimpiadada umuman qatnashmagan.",
      "Kamola olimpiada finaliga chiqmagan.",
      "Kamola sertifikat olgan, lekin lagerga bormaydi.",
      "Kamola finalga chiqqan, ammo sertifikat olmagan.",
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    category: "critical",
    points: 8,
    prompt: `Ulugʻbek Instagram orqali uyda pishirilgan shirinliklar sotadi. U yangi pirojniy retseptini oʻylab topib, 5 nafar yaqin doʻstiga tatib koʻrishga berdi. Hammasi “juda mazali!” deb maqtashdi.

Ulugʻbek: “Demak, bu pirojniy barcha xaridorlarga yoqadi. Ertadan boshlab faqat shuni sotaman.”

Ulugʻbekning fikridagi asosiy xato nima?`,
    options: [
      "Besh nafar yaqin doʻstning fikri barcha xaridorlarning fikrini koʻrsatmaydi.",
      "Pirojniy uchun kerak boʻladigan mahsulotlarning narxi kelajakda oshib ketishi mumkin.",
      "Doʻstlari pirojniyni tekinga olgani uchun ataylab yolgʻon maqtashgan.",
      "Uyda tayyorlangan shirinlikni sotish uchun avval maxsus ruxsat olish kerak.",
    ],
    correctIndex: 0,
  },
  {
    id: 6,
    category: "teamwork",
    points: 10,
    prompt: `Taqdimotga 6 soat qoldi. Loyihangizning bitta boʻlimi hali tayyor emas. Laylo qolgan vaqtning hammasini shu boʻlimga sarflab, uni oxiriga yetkazmoqchi. Temur esa bu boʻlimni olib tashlab, tayyor qismlarga sayqal berishni taklif qilyapti. Ikkalasi bahslashib qolgan, ish toʻxtab turibdi.

Siz nima qilasiz?`,
    options: [
      "Ovozga qoʻyasiz: koʻpchilik nima desa, shunday qilinadi va bahs shu bilan tugaydi.",
      "Temurni qoʻllab-quvvatlaysiz, chunki tayyor narsani koʻrsatish xavfsizroq, Laylo esa keyin tushunadi.",
      "Ikkalasini tinglab, birga shart qoʻyasiz: boʻlim 2 soat ichida tayyor boʻlmasa, olib tashlanadi.",
      "Ularni bahslashishda qoldirib, boʻlimni oʻzingiz jimgina tugatishga urinasiz.",
    ],
    correctIndex: 2,
  },
  {
    id: 7,
    category: "logic",
    points: 12,
    prompt: `Besh doʻst (Bekzod, Dilnoza, Javohir, Madina va Sardor) kinoteatrda bir qatordagi 5 ta oʻrindiqqa oʻtirishdi. Oʻrindiqlar chapdan oʻngga 1 dan 5 gacha raqamlangan.
1. Dilnoza 1-oʻrindiqda oʻtiradi.
2. Madina chetda (1- yoki 5-oʻrindiqda) oʻtirmaydi.
3. Bekzod va Sardor yonma-yon oʻtiradi, Bekzod Sardorning chap tomonida.
4. Javohir Madinaning yonida oʻtirmaydi.

3-oʻrindiqda kim oʻtiradi?`,
    options: ["Bekzod", "Madina", "Sardor", "Javohir"],
    correctIndex: 0,
  },
  {
    id: 8,
    category: "critical",
    points: 12,
    prompt: `Mahalla futbol jamoasi bu mavsum uchun yangi butsilar sotib oldi. Jamoa ularni faqat uy oʻyinlarida kiydi, mehmonda esa eskilarida oʻynadi. Mavsum oxirida murabbiy dedi: “Bu yil oʻtgan yilgidan koʻproq gol urdik. Bunga yangi butsilar sabab boʻldi.”

Quyidagilardan qaysi biri murabbiyning bu fikrini eng koʻp shubha ostiga qoʻyadi?`,
    options: [
      "Futbolchilar yangi butsilar avvalgilaridan ancha yengil va qulay ekanini bir ovozdan aytishgan.",
      "Yangi butsilar oʻtgan mavsumdagilaridan ikki baravar qimmatga tushgan.",
      "Mehmondagi oʻyinlarda, eski butsilarda ham, jamoa uydagi kabi koʻp gol urgan.",
      "Mavsum oʻrtasida jamoaga yangi yordamchi murabbiy ishga keldi.",
    ],
    correctIndex: 2,
  },
  {
    id: 9,
    category: "teamwork",
    points: 10,
    prompt: `Jamoangizdagi Nodira kam gapiradi. Muhokama paytida u loyihadan kimlar foydalanishi haqida muhim fikr aytdi, ammo hamma oʻz gapi bilan band boʻlib, unga eʼtibor bermadi. Shundan keyin Nodira butunlay jim boʻlib qoldi.

Siz nima qilasiz?`,
    options: [
      "Hech narsa demaysiz: fikri rostdan ham muhim boʻlsa, oʻzi yana aytadi.",
      "Uning fikrini keyinroq jamoaga oʻzingiz qisqacha yetkazasiz, shunda vaqt behuda ketmaydi.",
      "Muhokamadan soʻng Nodiraga: “Koʻproq gapirishing kerak, aks holda seni hech kim eshitmaydi”, deysiz.",
      "Suhbatni Nodiraning fikriga qaytarib, undan uni batafsilroq aytib berishini soʻraysiz.",
    ],
    correctIndex: 3,
  },
  {
    id: 10,
    category: "logic",
    points: 10,
    prompt: `Tanaffus paytida kimdir sinf doskasiga hazil surat chizib qoʻyibdi. Buni Alisher, Bobur yoki Jasurdan biri qilgani aniq. Uchalasi shunday dedi:
• Alisher: “Buni Bobur chizgan.”
• Bobur: “Men chizmaganman.”
• Jasur: “Men chizmaganman.”

Ulardan faqat bittasi rost gapirgan. Suratni kim chizgan?`,
    options: ["Alisher", "Bobur", "Jasur", "Buni aniqlab boʻlmaydi"],
    correctIndex: 2,
  },
  {
    id: 11,
    category: "critical",
    points: 10,
    prompt: `Ikki oʻquv markazi reklama qilmoqda:
• “Bilim” markazi: “Bu yil 45 nafar oʻquvchimiz universitetga kirdi!”
• “Kelajak” markazi: “Bu yil oʻquvchilarimizning 90 foizi universitetga kirdi!”

Qaysi markaz yaxshiroq natija berganini solishtirish uchun eng avvalo qaysi maʼlumot kerak?`,
    options: [
      "Har bir markazda jami nechta oʻquvchi oʻqigani.",
      "Qaysi markazda oʻqish narxi arzonroq ekani.",
      "Har bir markazda qancha tajribali ustoz dars berishi.",
      "Qaysi markazning reklamasi ijtimoiy tarmoqlarda koʻproq koʻrilgani.",
    ],
    correctIndex: 0,
  },
  {
    id: 12,
    category: "teamwork",
    points: 10,
    prompt: `Taqdimotga 15 daqiqa qoldi. Siz slayddagi asosiy raqam xato ekanini payqadingiz: soʻrovnoma natijasi “80%” deb yozilgan, aslida esa 40%. Slaydlarni jamoadoshingiz Aziza tayyorlagan, u hozir ancha hayajonda.

Nima qilasiz?`,
    options: [
      "Hech narsa demaysiz: hakamlar raqamni tekshirmaydi, Azizani xafa qilishning hojati yoʻq.",
      "Azizaga xatoni xotirjam koʻrsatasiz va raqamni birga tezda tuzatasiz.",
      "Azizaga aytmasdan, slaydni oʻzingiz tuzatib qoʻyasiz, toki u battar hayajonlanmasin.",
      "Taqdimot paytida hakamlarga raqamni Aziza adashtirganini aytib, toʻgʻrisini ogʻzaki aytasiz.",
    ],
    correctIndex: 1,
  },
];
