// Every piece of text students see, in Uzbek (Latin). Edit wording here; components only read it.
// Spelling: oʻ/gʻ use ʻ (U+02BB), the tutuq belgisi uses ʼ (U+02BC), quotes use “ ”.
// (The admin dashboard stays in English and doesn't use this file.)
import type { Category } from "../quiz";

export const uz = {
  meta: {
    title: "Xakaton saralash testi",
    description: "Mantiqiy fikrlash, tanqidiy fikrlash va jamoada ishlash boʻyicha test.",
  },

  categories: {
    logic: "Mantiqiy fikrlash",
    critical: "Tanqidiy fikrlash",
    teamwork: "Jamoada ishlash",
  } satisfies Record<Category, string>,

  register: {
    title: "Xakaton saralash testi",
    subtitle: "Mantiq, tanqidiy fikrlash va jamoada ishlash",
    questionCount: (n: number) => `${n} ta savol`,
    minutes: (n: number) => `${n} daqiqa`,
    oneAttempt: "Bitta urinish",
    nameLabel: "Ism va familiya",
    idLabel: "Oʻquvchi ID raqami yoki maktab e-pochtasi",
    start: "Testni boshlash",
    starting: "Boshlanmoqda…",
    timerNote: (minutes: number) =>
      `${minutes} daqiqalik vaqt “Testni boshlash” tugmasini bosganingizda boshlanadi va sahifani yopsangiz ham toʻxtamaydi.`,
    networkError: "Internet bilan bogʻliq xatolik. Aloqani tekshirib, qaytadan urinib koʻring.",
    serverError: (status: number) => `Xatolik yuz berdi (server xatosi ${status}). Iltimos, ustozingizga ayting.`,
  },

  quiz: {
    loading: "Yuklanmoqda…",
    loadError: "Testni yuklab boʻlmadi. Internet aloqasini tekshiring.",
    tryAgain: "Qaytadan urinish",
    answered: (done: number, total: number) => `Javob berildi: ${done} / ${total}`,
    timeLeft: "Qolgan vaqt",
    questionNav: "Savollar",
    questionButton: (n: number, answered: boolean) => `${n}-savol${answered ? ", javob berilgan" : ""}`,
    questionHeading: (n: number, total: number) => `Savol ${n} / ${total}`,
    chooseOne: "Bitta javobni tanlang",
    finish: "Yakunlash",
    previous: "Oldingi",
    next: "Keyingi",
    review: "Tekshirish va yuborish",
  },

  review: {
    title: "Javoblarni yuborasizmi?",
    timeUpTitle: "Vaqt tugadi!",
    summary: (done: number, total: number) => `Siz ${total} ta savoldan ${done} tasiga javob berdingiz.`,
    noChanges: "Yuborganingizdan keyin javoblarni oʻzgartirib boʻlmaydi.",
    sending: "Javoblaringiz yuborilmoqda.",
    unanswered: "Javob berilmagan savollar:",
    unansweredItem: (n: number) => `${n}-savol`,
    submitError: "Yuborib boʻlmadi. Internetni tekshirib, qaytadan urinib koʻring. Javoblaringiz shu qurilmada saqlanib turibdi.",
    back: "Savollarga qaytish",
    submit: "Javoblarni yuborish",
    submitting: "Yuborilmoqda…",
    retry: "Qaytadan yuborish",
  },

  done: {
    title: "Javobingiz qabul qilindi!",
    body: "Jamoalar tez orada eʼlon qilinadi.",
    note: "Iltimos, savollarni hali test yechayotgan sinfdoshlaringiz bilan muhokama qilmang.",
  },

  closed: {
    title: "Javoblar qabul qilinmaydi",
    body: "Vaqtingiz tugaganiga ancha boʻldi, shuning uchun bu javoblar saqlanmadi.",
    tellTeacher: "Iltimos, ustozingizga ayting.",
  },

  // Returned by the API and shown to the student as-is.
  errors: {
    invalidForm: "Ism-familiyangizni va ID raqamingiz yoki e-pochtangizni kiriting.",
    notRegistered: "Avval roʻyxatdan oʻting.",
    nameTakenSubmitted:
      "Bu ismdagi oʻquvchi testni allaqachon topshirgan. Agar bu siz boʻlmasangiz, ustozingizga murojaat qiling.",
    nameTakenOtherId:
      "Bu ism boshqa ID raqam bilan roʻyxatdan oʻtgan. Birinchi marta kiritgan ID raqamingizni yozing yoki ustozingizga murojaat qiling.",
    idTakenOtherName: "Bu ID raqam boshqa ism bilan roʻyxatdan oʻtgan. Iltimos, ustozingizga murojaat qiling.",
    alreadySubmitted: "Siz bu testni allaqachon topshirgansiz. Javoblaringiz saqlangan.",
    submissionsClosed: "Vaqt tugadi. Javoblar endi qabul qilinmaydi.",
  },
};
