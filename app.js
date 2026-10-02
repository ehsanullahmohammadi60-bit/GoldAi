const $ = (id) => document.getElementById(id);

let currentUser = null;
let selectedChartFile = null;
let selectedTimeframe = "1m";
let selectedPaymentMethod = "hesabpay";

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {

  fa: {
    documentTitle: "GoldAI — تحلیل هوشمند XAUUSD",

    heroPill: "XAUUSD • تحلیل هوشمند نمودار",
    heroTitle: "تحلیل حرفه‌ای طلا",
    heroText: "نمودار XAUUSD خود را آپلود کنید تا GoldAI ساختار قابل مشاهده بازار را تحلیل کند.",

    hesabpayActivation: "فعال‌سازی با حساب‌پی",
    binanceActivation: "فعال‌سازی با Binance Pay",
    chartImageAnalysis: "تحلیل تصویر نمودار",

    login: "ورود",
    createAccount: "ساخت حساب",
    email: "ایمیل",
    password: "رمز عبور",
    fullName: "نام کامل",
    password6: "رمز عبور (حداقل ۶ کاراکتر)",

    goldAiMember: "عضو GOLD AI",
    memberDashboard: "داشبورد اعضا",
    logout: "خروج",

    membership: "عضویت",
    activateAccess: "فعال‌سازی دسترسی",
    paymentDescription: "مبلغ را پرداخت کنید و سپس رسید پرداخت خود را ارسال کنید. دسترسی شما تا زمان تأیید توسط مدیر قفل خواهد بود.",
    transactionReference: "شماره تراکنش / Reference",
    submitReceipt: "ارسال رسید برای بررسی",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "تحلیلگر هوشمند نمودار XAUUSD",
    analyzerDescription: "ابتدا تایم‌فریم مورد نظر را انتخاب کنید، سپس یک اسکرین‌شات واضح از نمودار XAUUSD همان تایم‌فریم آپلود کنید.",

    selectTimeframe: "انتخاب تایم‌فریم تحلیل",
    oneMinute: "۱ دقیقه",
    fiveMinutes: "۵ دقیقه",
    fifteenMinutes: "۱۵ دقیقه",

    chooseChart: "انتخاب نمودار XAUUSD",
    chartFormats: "PNG، JPG، WEBP یا GIF • حداکثر ۵ مگابایت",
    analyzeChart: "تحلیل نمودار با هوش مصنوعی",

    aiSignal: "سیگنال هوش مصنوعی",
    symbol: "نماد",
    timeframe: "تایم‌فریم",
    entry: "ورود",
    stopLoss: "حد ضرر",
    confidence: "میزان اطمینان",

    technicalAnalysis: "تحلیل تکنیکال",
    riskWarning: "هشدار ریسک",

    history: "تاریخچه",
    previousAnalyses: "تحلیل‌های قبلی",

    privateFeed: "فید خصوصی",
    privateSignals: "سیگنال‌های خصوصی XAUUSD",

    support: "پشتیبانی",
    websiteSupport: "پشتیبانی سایت",
    writeMessage: "پیام خود را بنویسید...",
    sendSupport: "ارسال پیام پشتیبانی",

    footerTitle: "GoldAI • سرویس تحلیل هوشمند XAUUSD",
    footerWarning: "معامله‌گری دارای ریسک بازار است. تحلیل هوش مصنوعی سود را تضمین نمی‌کند.",

    loading: "در حال بارگذاری...",
    loginLoading: "در حال ورود...",
    registerLoading: "در حال ساخت حساب...",
    paymentLoading: "در حال ارسال رسید...",
    supportLoading: "در حال ارسال...",
    analysisLoading: "هوش مصنوعی در حال تحلیل چارت است...",

    loginSuccess: "ورود موفق بود.",
    registerSuccess: "حساب با موفقیت ساخته شد.",
    paymentSuccess: "رسید ارسال شد و منتظر تأیید مدیر است.",
    supportSuccess: "پیام شما ارسال شد.",
    analysisSuccess: "تحلیل چارت با موفقیت انجام شد.",

    fillLogin: "ایمیل و رمز عبور را وارد کنید.",
    fillRegister: "لطفاً تمام معلومات را وارد کنید.",
    chartRequired: "لطفاً اول عکس چارت XAUUSD را انتخاب کنید.",
    imageOnly: "لطفاً فقط فایل تصویری چارت را انتخاب کنید.",
    receiptRequired: "لطفاً رسید پرداخت را انتخاب کنید.",
    referenceRequired: "لطفاً شماره یا Reference پرداخت را وارد کنید.",
    supportRequired: "لطفاً پیام خود را بنویسید.",

    invalidImageSize: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",
    invalidImageType: "فرمت تصویر مجاز نیست.",

    noHistory: "هنوز تحلیل ذخیره‌شده‌ای وجود ندارد.",
    historyUnavailable: "تاریخچه تحلیل فعلاً قابل دریافت نیست.",
    noSignals: "هنوز سیگنالی منتشر نشده است.",
    signalsUnavailable: "سیگنال‌ها فعلاً قابل دریافت نیستند.",

    notApproved: "حساب شما هنوز توسط مدیر تأیید نشده است.",

    paymentHesabPay: "روش پرداخت انتخاب‌شده: HesabPay — 240 AFN",
    paymentBinance: "روش پرداخت انتخاب‌شده: Binance Pay — 4 USD / USDT",

    wait: "صبر",
    low: "کم",
    medium: "متوسط",
    high: "بالا",

    entryLabel: "ورود",
    slLabel: "حد ضرر"
  },


  en: {
    documentTitle: "GoldAI — XAUUSD AI Analyzer",

    heroPill: "XAUUSD • AI CHART ANALYZER",
    heroTitle: "Professional Gold Analysis",
    heroText: "Upload your XAUUSD chart and let GoldAI analyze the visible market structure.",

    hesabpayActivation: "HesabPay activation",
    binanceActivation: "Binance Pay activation",
    chartImageAnalysis: "Chart image analysis",

    login: "Login",
    createAccount: "Create account",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    password6: "Password (6+ characters)",

    goldAiMember: "GOLD AI MEMBER",
    memberDashboard: "Member Dashboard",
    logout: "Logout",

    membership: "MEMBERSHIP",
    activateAccess: "Activate access",
    paymentDescription: "Pay once, then upload your payment receipt. Your access remains locked until an administrator verifies the payment.",
    transactionReference: "Transaction ID / Reference",
    submitReceipt: "Submit receipt for review",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "XAUUSD AI Chart Analyzer",
    analyzerDescription: "First select the analysis timeframe, then upload a clear screenshot of your XAUUSD chart on that timeframe.",

    selectTimeframe: "Select analysis timeframe",
    oneMinute: "1 Minute",
    fiveMinutes: "5 Minutes",
    fifteenMinutes: "15 Minutes",

    chooseChart: "Choose XAUUSD chart",
    chartFormats: "PNG, JPG, WEBP or GIF • Max 5 MB",
    analyzeChart: "Analyze Chart with AI",

    aiSignal: "AI SIGNAL",
    symbol: "Symbol",
    timeframe: "Timeframe",
    entry: "Entry",
    stopLoss: "Stop Loss",
    confidence: "Confidence",

    technicalAnalysis: "Technical Analysis",
    riskWarning: "Risk Warning",

    history: "HISTORY",
    previousAnalyses: "Previous AI Analyses",

    privateFeed: "PRIVATE FEED",
    privateSignals: "Private XAUUSD Signals",

    support: "SUPPORT",
    websiteSupport: "Website Support",
    writeMessage: "Write your message...",
    sendSupport: "Send support message",

    footerTitle: "GoldAI • XAUUSD AI analysis service",
    footerWarning: "Trading involves market risk. AI analysis does not guarantee profit.",

    loading: "Loading...",
    loginLoading: "Logging in...",
    registerLoading: "Creating account...",
    paymentLoading: "Submitting receipt...",
    supportLoading: "Sending...",
    analysisLoading: "AI is analyzing the chart...",

    loginSuccess: "Login successful.",
    registerSuccess: "Account created successfully.",
    paymentSuccess: "Receipt submitted and waiting for administrator approval.",
    supportSuccess: "Your message has been sent.",
    analysisSuccess: "Chart analysis completed successfully.",

    fillLogin: "Please enter your email and password.",
    fillRegister: "Please fill in all information.",
    chartRequired: "Please select an XAUUSD chart image first.",
    imageOnly: "Please select an image file only.",
    receiptRequired: "Please select your payment receipt.",
    referenceRequired: "Please enter the payment reference.",
    supportRequired: "Please write your message.",

    invalidImageSize: "Image size must not exceed 5 MB.",
    invalidImageType: "This image format is not allowed.",

    noHistory: "No saved analyses yet.",
    historyUnavailable: "Analysis history is currently unavailable.",
    noSignals: "No signals have been published yet.",
    signalsUnavailable: "Signals are currently unavailable.",

    notApproved: "Your account has not been approved yet.",

    paymentHesabPay: "Selected payment method: HesabPay — 240 AFN",
    paymentBinance: "Selected payment method: Binance Pay — 4 USD / USDT",

    wait: "WAIT",
    low: "Low",
    medium: "Medium",
    high: "High",

    entryLabel: "Entry",
    slLabel: "SL"
  },


  ar: {
    documentTitle: "GoldAI — محلل XAUUSD بالذكاء الاصطناعي",

    heroPill: "XAUUSD • تحليل الرسم البياني بالذكاء الاصطناعي",
    heroTitle: "تحليل احترافي للذهب",
    heroText: "قم برفع مخطط XAUUSD الخاص بك ودع GoldAI يحلل هيكل السوق الظاهر.",

    hesabpayActivation: "التفعيل عبر HesabPay",
    binanceActivation: "التفعيل عبر Binance Pay",
    chartImageAnalysis: "تحليل صورة الرسم البياني",

    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    password6: "كلمة المرور (6 أحرف على الأقل)",

    goldAiMember: "عضو GOLD AI",
    memberDashboard: "لوحة تحكم العضو",
    logout: "تسجيل الخروج",

    membership: "العضوية",
    activateAccess: "تفعيل الوصول",
    paymentDescription: "ادفع مرة واحدة ثم قم برفع إيصال الدفع. سيظل الوصول مقفلاً حتى يقوم المسؤول بتأكيد الدفع.",
    transactionReference: "رقم المعاملة / Reference",
    submitReceipt: "إرسال الإيصال للمراجعة",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "محلل مخطط XAUUSD بالذكاء الاصطناعي",
    analyzerDescription: "اختر أولاً الإطار الزمني للتحليل، ثم قم برفع لقطة واضحة لمخطط XAUUSD على نفس الإطار الزمني.",

    selectTimeframe: "اختر الإطار الزمني للتحليل",
    oneMinute: "دقيقة واحدة",
    fiveMinutes: "5 دقائق",
    fifteenMinutes: "15 دقيقة",

    chooseChart: "اختر مخطط XAUUSD",
    chartFormats: "PNG، JPG، WEBP أو GIF • الحد الأقصى 5 ميغابايت",
    analyzeChart: "تحليل المخطط بالذكاء الاصطناعي",

    aiSignal: "إشارة الذكاء الاصطناعي",
    symbol: "الرمز",
    timeframe: "الإطار الزمني",
    entry: "الدخول",
    stopLoss: "وقف الخسارة",
    confidence: "مستوى الثقة",

    technicalAnalysis: "التحليل الفني",
    riskWarning: "تحذير المخاطر",

    history: "السجل",
    previousAnalyses: "التحليلات السابقة",

    privateFeed: "التغذية الخاصة",
    privateSignals: "إشارات XAUUSD الخاصة",

    support: "الدعم",
    websiteSupport: "دعم الموقع",
    writeMessage: "اكتب رسالتك...",
    sendSupport: "إرسال رسالة الدعم",

    footerTitle: "GoldAI • خدمة تحليل XAUUSD بالذكاء الاصطناعي",
    footerWarning: "التداول ينطوي على مخاطر السوق. تحليل الذكاء الاصطناعي لا يضمن الربح.",

    loading: "جاري التحميل...",
    loginLoading: "جاري تسجيل الدخول...",
    registerLoading: "جاري إنشاء الحساب...",
    paymentLoading: "جاري إرسال الإيصال...",
    supportLoading: "جاري الإرسال...",
    analysisLoading: "يقوم الذكاء الاصطناعي بتحليل الرسم البياني...",

    loginSuccess: "تم تسجيل الدخول بنجاح.",
    registerSuccess: "تم إنشاء الحساب بنجاح.",
    paymentSuccess: "تم إرسال الإيصال وينتظر موافقة المسؤول.",
    supportSuccess: "تم إرسال رسالتك.",
    analysisSuccess: "تم تحليل الرسم البياني بنجاح.",

    fillLogin: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
    fillRegister: "يرجى إدخال جميع المعلومات.",
    chartRequired: "يرجى اختيار صورة مخطط XAUUSD أولاً.",
    imageOnly: "يرجى اختيار ملف صورة فقط.",
    receiptRequired: "يرجى اختيار إيصال الدفع.",
    referenceRequired: "يرجى إدخال مرجع الدفع.",
    supportRequired: "يرجى كتابة رسالتك.",

    invalidImageSize: "يجب ألا يتجاوز حجم الصورة 5 ميغابايت.",
    invalidImageType: "صيغة الصورة غير مسموحة.",

    noHistory: "لا توجد تحليلات محفوظة حتى الآن.",
    historyUnavailable: "سجل التحليلات غير متاح حالياً.",
    noSignals: "لم يتم نشر أي إشارات بعد.",
    signalsUnavailable: "الإشارات غير متاحة حالياً.",

    notApproved: "لم تتم الموافقة على حسابك بعد.",

    paymentHesabPay: "طريقة الدفع المختارة: HesabPay — 240 AFN",
    paymentBinance: "طريقة الدفع المختارة: Binance Pay — 4 USD / USDT",

    wait: "انتظار",
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",

    entryLabel: "الدخول",
    slLabel: "وقف الخسارة"
  }

};


/* =========================================================
   LANGUAGE
========================================================= */

function getLanguage() {
  return localStorage.getItem("goldai_language") || "fa";
}

function setLanguage(language) {
  if (!translations[language]) {
    language = "fa";
  }

  localStorage.setItem(
    "goldai_language",
    language
  );

  const html =
    document.documentElement;

  html.lang = language;

  html.dir =
    language === "en"
      ? "ltr"
      : "rtl";

  const langSelect =
    $("lang");

  if (langSelect) {
    langSelect.value = language;
  }

  applyTranslations(language);

  updatePaymentDetails();
  updateTimeframeButtons();

  document.title =
    translations[language].documentTitle;
}


function applyTranslations(language = getLanguage()) {
  const t =
    translations[language] ||
    translations.fa;

  document
    .querySelectorAll("[data-i18n]")
    .forEach((element) => {

      const key =
        element.dataset.i18n;

      if (
        Object.prototype.hasOwnProperty.call(
          t,
          key
        )
      ) {
        element.textContent =
          t[key];
      }
    });


  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((element) => {

      const key =
        element.dataset.i18nPlaceholder;

      if (
        Object.prototype.hasOwnProperty.call(
          t,
          key
        )
      ) {
        element.placeholder =
          t[key];
      }
    });


  const chartPreview =
    $("chartPreview");

  if (chartPreview) {
    chartPreview.alt =
      language === "fa"
        ? "پیش‌نمایش نمودار"
        : language === "ar"
          ? "معاينة الرسم البياني"
          : "Chart preview";
  }
}


function t(key) {
  const language =
    getLanguage();

  return (
    translations[language]?.[key] ||
    translations.en[key] ||
    key
  );
}


/* =========================================================
   HELPERS
========================================================= */

function showMessage(
  id,
  text,
  type = ""
) {
  const el = $(id);

  if (!el) return;

  el.textContent =
    text || "";

  el.className =
    type
      ? `message ${type}`
      : "message";
}


async function api(
  url,
  options = {}
) {
  const finalOptions = {
    credentials: "include",
    ...options
  };

  const response =
    await fetch(
      url,
      finalOptions
    );

  let data = {};

  try {
    data =
      await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}


function textValue(
  value,
  fallback = "WAIT"
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}


function getField(
  obj,
  names,
  fallback = "WAIT"
) {
  if (
    !obj ||
    typeof obj !== "object"
  ) {
    return fallback;
  }

  for (const name of names) {

    if (
      obj[name] !== undefined &&
      obj[name] !== null &&
      String(obj[name]).trim() !== ""
    ) {
      return obj[name];
    }

  }

  return fallback;
}


function escapeHtml(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const name =
    $("regName")?.value.trim() ||
    "";

  const email =
    $("regEmail")?.value.trim() ||
    "";

  const password =
    $("regPass")?.value ||
    "";

  if (
    !name ||
    !email ||
    !password
  ) {
    showMessage(
      "authMsg",
      t("fillRegister"),
      "error"
    );
    return;
  }

  try {

    showMessage(
      "authMsg",
      t("registerLoading")
    );

    const data =
      await api(
        "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

    currentUser =
      data.user || null;

    showMessage(
      "authMsg",
      data.message ||
        t("registerSuccess"),
      "success"
    );

    await load();

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );

    showMessage(
      "authMsg",
      error.message,
      "error"
    );
  }
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(event) {
  event.preventDefault();

  const email =
    $("loginEmail")?.value.trim() ||
    "";

  const password =
    $("loginPass")?.value ||
    "";

  if (
    !email ||
    !password
  ) {
    showMessage(
      "authMsg",
      t("fillLogin"),
      "error"
    );
    return;
  }

  try {

    showMessage(
      "authMsg",
      t("loginLoading")
    );

    const data =
      await api(
        "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

    currentUser =
      data.user || null;

    showMessage(
      "authMsg",
      data.message ||
        t("loginSuccess"),
      "success"
    );

    await load();

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    showMessage(
      "authMsg",
      error.message,
      "error"
    );
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  try {

    await api(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch (_) {}

  currentUser = null;

  const auth =
    $("auth");

  const dashboard =
    $("dashboard");

  if (auth) {
    auth.style.display = "";
  }

  if (dashboard) {
    dashboard.style.display =
      "none";
  }
}


/* =========================================================
   PAYMENT
========================================================= */

function updatePaymentDetails() {

  const details =
    $("payDetails");

  if (!details) return;

  if (
    selectedPaymentMethod ===
    "binance"
  ) {
    details.textContent =
      t("paymentBinance");
  } else {
    details.textContent =
      t("paymentHesabPay");
  }
}


function setupPaymentMethods() {

  document
    .querySelectorAll(".pay[data-method]")
    .forEach((button) => {

      if (
        button.classList.contains(
          "timeframeOption"
        )
      ) {
        return;
      }

      button.addEventListener(
        "click",
        () => {

          selectedPaymentMethod =
            button.dataset.method ||
            "hesabpay";

          document
            .querySelectorAll(
              ".pay[data-method]"
            )
            .forEach((item) => {

              if (
                item.classList.contains(
                  "timeframeOption"
                )
              ) {
                return;
              }

              item.classList.remove(
                "active"
              );
            });

          button.classList.add(
            "active"
          );

          updatePaymentDetails();
        }
      );

    });

  updatePaymentDetails();
}


async function submitPayment(event) {
  event.preventDefault();

  const reference =
    $("reference")?.value.trim() ||
    "";

  const file =
    $("receipt")?.files?.[0];

  if (!reference) {
    showMessage(
      "payMsg",
      t("referenceRequired"),
      "error"
    );
    return;
  }

  if (!file) {
    showMessage(
      "payMsg",
      t("receiptRequired"),
      "error"
    );
    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    showMessage(
      "payMsg",
      t("invalidImageSize"),
      "error"
    );
    return;
  }

  try {

    showMessage(
      "payMsg",
      t("paymentLoading")
    );

    const formData =
      new FormData();

    formData.append(
      "reference",
      reference
    );

    formData.append(
      "method",
      selectedPaymentMethod
    );

    formData.append(
      "amount",
      selectedPaymentMethod ===
        "binance"
        ? "4"
        : "240"
    );

    formData.append(
      "receipt",
      file
    );

    const data =
      await api(
        "/api/payment",
        {
          method: "POST",
          body: formData
        }
      );

    showMessage(
      "payMsg",
      data.message ||
        t("paymentSuccess"),
      "success"
    );

    await load();

  } catch (error) {

    console.error(
      "PAYMENT ERROR:",
      error
    );

    showMessage(
      "payMsg",
      error.message,
      "error"
    );
  }
}


/* =========================================================
   SUPPORT
========================================================= */

async function sendSupport() {

  const message =
    $("supportText")?.value.trim() ||
    "";

  if (!message) {
    showMessage(
      "supportMsg",
      t("supportRequired"),
      "error"
    );
    return;
  }

  try {

    showMessage(
      "supportMsg",
      t("supportLoading")
    );

    const data =
      await api(
        "/api/support",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            message
          })
        }
      );

    showMessage(
      "supportMsg",
      data.message ||
        t("supportSuccess"),
      "success"
    );

    if ($("supportText")) {
      $("supportText").value =
        "";
    }

  } catch (error) {

    console.error(
      "SUPPORT ERROR:",
      error
    );

    showMessage(
      "supportMsg",
      error.message,
      "error"
    );
  }
}


/* =========================================================
   TIMEFRAME
========================================================= */

function setupTimeframes() {

  const buttons =
    document.querySelectorAll(
      ".timeframeOption"
    );

  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          selectedTimeframe =
            button.dataset.timeframe ||
            "1m";

          const hidden =
            $("selectedTimeframe");

          if (hidden) {
            hidden.value =
              selectedTimeframe;
          }

          updateTimeframeButtons();

          showMessage(
            "chartMsg",
            ""
          );

          const result =
            $("analysisResult");

          if (result) {
            result.style.display =
              "none";
          }

        }
      );

    }
  );

  updateTimeframeButtons();
}


function updateTimeframeButtons() {

  document
    .querySelectorAll(
      ".timeframeOption"
    )
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.timeframe ===
            selectedTimeframe
        );

      }
    );

  const hidden =
    $("selectedTimeframe");

  if (hidden) {
    hidden.value =
      selectedTimeframe;
  }
}


/* =========================================================
   CHART PREVIEW
========================================================= */

function previewChart(event) {

  const file =
    event.target.files?.[0];

  selectedChartFile =
    file || null;

  const previewWrap =
    $("chartPreviewWrap");

  const preview =
    $("chartPreview");

  if (!file) {

    if (previewWrap) {
      previewWrap.classList.add(
        "hidden"
      );
    }

    return;
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    selectedChartFile =
      null;

    if (previewWrap) {
      previewWrap.classList.add(
        "hidden"
      );
    }

    showMessage(
      "chartMsg",
      t("imageOnly"),
      "error"
    );

    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {

    selectedChartFile =
      null;

    if (previewWrap) {
      previewWrap.classList.add(
        "hidden"
      );
    }

    if ($("chartFile")) {
      $("chartFile").value =
        "";
    }

    showMessage(
      "chartMsg",
      t("invalidImageSize"),
      "error"
    );

    return;
  }

  if (preview) {

    if (
      preview.dataset.objectUrl
    ) {
      URL.revokeObjectURL(
        preview.dataset.objectUrl
      );
    }

    const objectUrl =
      URL.createObjectURL(file);

    preview.src =
      objectUrl;

    preview.dataset.objectUrl =
      objectUrl;
  }

  if (previewWrap) {
    previewWrap.classList.remove(
      "hidden"
    );
  }

  showMessage(
    "chartMsg",
    ""
  );
}


/* =========================================================
   AI CHART ANALYSIS
========================================================= */

async function analyzeChart(event) {

  event.preventDefault();

  const file =
    selectedChartFile ||
    $("chartFile")?.files?.[0];

  if (!file) {
    showMessage(
      "chartMsg",
      t("chartRequired"),
      "error"
    );
    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    showMessage(
      "chartMsg",
      t("invalidImageSize"),
      "error"
    );
    return;
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
  ];

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {
    showMessage(
      "chartMsg",
      t("invalidImageType"),
      "error"
    );
    return;
  }

  const button =
    $("analyzeBtn");

  if (button) {

    button.disabled =
      true;

    button.dataset.oldText =
      button.textContent;

    button.textContent =
      t("analysisLoading");
  }

  showMessage(
    "chartMsg",
    t("analysisLoading")
  );

  resetAnalysisResult();

  try {

    const formData =
      new FormData();

    formData.append(
      "chart",
      file
    );

    formData.append(
      "timeframe",
      selectedTimeframe
    );

    const data =
      await api(
        "/api/analyze-chart",
        {
          method: "POST",
          body: formData
        }
      );

    console.log(
      "FULL AI RESPONSE:",
      data
    );

    let analysis =
      data.analysis ||
      data.result ||
      data.signal ||
      data.data ||
      data;

    if (
      typeof analysis ===
      "string"
    ) {

      try {

        analysis =
          JSON.parse(
            analysis
          );

      } catch (_) {

        analysis = {
          analysis:
            analysis
        };

      }
    }

    if (
      analysis &&
      typeof analysis ===
        "object" &&
      analysis.analysis &&
      typeof analysis.analysis ===
        "object"
    ) {

      analysis =
        analysis.analysis;
    }

    console.log(
      "PARSED AI ANALYSIS:",
      analysis
    );

    renderAnalysis(
      analysis
    );

    showMessage(
      "chartMsg",
      data.message ||
        t("analysisSuccess"),
      "success"
    );

    await loadHistory();

  } catch (error) {

    console.error(
      "AI ANALYSIS ERROR:",
      error
    );

    showMessage(
      "chartMsg",
      error.message,
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        button.dataset.oldText ||
        t("analyzeChart");
    }

  }
}


/* =========================================================
   RESET ANALYSIS
========================================================= */

function resetAnalysisResult() {

  const defaults = {
    analysisDirection: "WAIT",
    analysisSymbol: "XAUUSD",
    analysisTimeframe:
      selectedTimeframe.toUpperCase(),
    analysisEntry: "WAIT",
    analysisSL: "WAIT",
    analysisTP1: "WAIT",
    analysisTP2: "WAIT",
    analysisTP3: "WAIT",
    analysisTP4: "WAIT",
    analysisTP5: "WAIT",
    analysisConfidence: t("low"),
    analysisTextContent: "",
    analysisWarning: ""
  };

  Object.entries(
    defaults
  ).forEach(
    ([id, value]) => {

      const el =
        $(id);

      if (el) {
        el.textContent =
          value;
      }

    }
  );

  const result =
    $("analysisResult");

  if (result) {
    result.style.display =
      "block";
  }
}


/* =========================================================
   RENDER ANALYSIS
========================================================= */

function renderAnalysis(
  analysis
) {

  if (
    !analysis ||
    typeof analysis !==
      "object"
  ) {

    showMessage(
      "chartMsg",
      "AI response could not be read.",
      "error"
    );

    return;
  }

  const direction =
    getField(
      analysis,
      [
        "direction",
        "Direction",
        "signal",
        "Signal",
        "trade_direction",
        "tradeDirection",
        "action",
        "Action",
        "side",
        "Side"
      ]
    );

  const symbol =
    getField(
      analysis,
      [
        "symbol",
        "Symbol",
        "pair",
        "Pair",
        "instrument",
        "Instrument"
      ],
      "XAUUSD"
    );

  const timeframe =
    getField(
      analysis,
      [
        "timeframe",
        "Timeframe",
        "time_frame",
        "interval",
        "Interval",
        "chart_timeframe"
      ],
      selectedTimeframe.toUpperCase()
    );

  const entry =
    getField(
      analysis,
      [
        "entry",
        "Entry",
        "entry_price",
        "entryPrice",
        "entry_point",
        "entryPoint"
      ]
    );

  const stopLoss =
    getField(
      analysis,
      [
        "sl",
        "SL",
        "stop_loss",
        "stopLoss",
        "stoploss",
        "stop_loss_price"
      ]
    );

  const tp1 =
    getField(
      analysis,
      [
        "tp1",
        "TP1",
        "tp_1",
        "take_profit_1",
        "takeProfit1"
      ]
    );

  const tp2 =
    getField(
      analysis,
      [
        "tp2",
        "TP2",
        "tp_2",
        "take_profit_2",
        "takeProfit2"
      ]
    );

  const tp3 =
    getField(
      analysis,
      [
        "tp3",
        "TP3",
        "tp_3",
        "take_profit_3",
        "takeProfit3"
      ]
    );

  const tp4 =
    getField(
      analysis,
      [
        "tp4",
        "TP4",
        "tp_4",
        "take_profit_4",
        "takeProfit4"
      ]
    );

  const tp5 =
    getField(
      analysis,
      [
        "tp5",
        "TP5",
        "tp_5",
        "take_profit_5",
        "takeProfit5"
      ]
    );

  const confidence =
    getField(
      analysis,
      [
        "confidence",
        "Confidence",
        "confidence_level",
        "confidenceLevel"
      ],
      t("low")
    );

  const analysisText =
    getField(
      analysis,
      [
        "analysis",
        "Analysis",
        "commentary",
        "Commentary",
        "reason",
        "Reason",
        "reasoning",
        "Reasoning",
        "explanation",
        "Explanation",
        "market_analysis"
      ],
      ""
    );

  const warning =
    getField(
      analysis,
      [
        "warning",
        "Warning",
        "risk_warning",
        "riskWarning"
      ],
      ""
    );

  setText(
    "analysisDirection",
    direction
  );

  setText(
    "analysisSymbol",
    symbol
  );

  setText(
    "analysisTimeframe",
    timeframe
  );

  setText(
    "analysisEntry",
    entry
  );

  setText(
    "analysisSL",
    stopLoss
  );

  setText(
    "analysisTP1",
    tp1
  );

  setText(
    "analysisTP2",
    tp2
  );

  setText(
    "analysisTP3",
    tp3
  );

  setText(
    "analysisTP4",
    tp4
  );

  setText(
    "analysisTP5",
    tp5
  );

  setText(
    "analysisConfidence",
    confidence
  );

  setText(
    "analysisTextContent",
    analysisText
  );

  setText(
    "analysisWarning",
    warning
  );

  const directionCard =
    $("directionCard");

  if (directionCard) {

    directionCard.classList.remove(
      "buy",
      "sell",
      "wait"
    );

    const normalized =
      String(direction)
        .toUpperCase()
        .trim();

    if (
      normalized.includes(
        "BUY"
      )
    ) {

      directionCard.classList.add(
        "buy"
      );

    } else if (
      normalized.includes(
        "SELL"
      )
    ) {

      directionCard.classList.add(
        "sell"
      );

    } else {

      directionCard.classList.add(
        "wait"
      );
    }
  }

  const result =
    $("analysisResult");

  if (result) {
    result.style.display =
      "block";
  }
}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
  id,
  value
) {

  const el =
    $(id);

  if (!el) return;

  el.textContent =
    textValue(
      value
    );
}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

  const container =
    $("analysisHistory");

  if (!container) return;

  try {

    const data =
      await api(
        "/api/analyses"
      );

    const items =
      data.analyses ||
      data.history ||
      data.data ||
      [];

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      container.innerHTML =
        `<p>${escapeHtml(
          t("noHistory")
        )}</p>`;

      return;
    }

    container.innerHTML =
      items
        .map(
          (item) => {

            let analysis =
              item.analysis ||
              item.result ||
              item;

            if (
              typeof analysis ===
              "string"
            ) {

              try {

                analysis =
                  JSON.parse(
                    analysis
                  );

              } catch (_) {

                analysis = {};

              }
            }

            const direction =
              getField(
                analysis,
                [
                  "direction",
                  "Direction",
                  "signal",
                  "Signal",
                  "trade_direction",
                  "action",
                  "side"
                ],
                "WAIT"
              );

            const entry =
              getField(
                analysis,
                [
                  "entry",
                  "Entry",
                  "entry_price",
                  "entryPrice"
                ]
              );

            const sl =
              getField(
                analysis,
                [
                  "sl",
                  "SL",
                  "stop_loss",
                  "stopLoss"
                ]
              );

            const tp1 =
              getField(
                analysis,
                [
                  "tp1",
                  "TP1",
                  "take_profit_1"
                ]
              );

            const tp2 =
              getField(
                analysis,
                [
                  "tp2",
                  "TP2",
                  "take_profit_2"
                ]
              );

            const tp3 =
              getField(
                analysis,
                [
                  "tp3",
                  "TP3",
                  "take_profit_3"
                ]
              );

            const timeframe =
              item.timeframe ||
              analysis.timeframe ||
              "-";

            return `
              <div class="history-item">

                <div>
                  <strong>
                    ${escapeHtml(
                      direction
                    )}
                  </strong>
                </div>

                <div>
                  ${escapeHtml(
                    t("timeframe")
                  )}:
                  ${escapeHtml(
                    timeframe
                  )}
                </div>

                <div>
                  ${escapeHtml(
                    t("entryLabel")
                  )}:
                  ${escapeHtml(
                    entry
                  )}
                </div>

                <div>
                  ${escapeHtml(
                    t("slLabel")
                  )}:
                  ${escapeHtml(
                    sl
                  )}
                </div>

                <div>
                  TP1:
                  ${escapeHtml(
                    tp1
                  )}
                </div>

                <div>
                  TP2:
                  ${escapeHtml(
                    tp2
                  )}
                </div>

                <div>
                  TP3:
                  ${escapeHtml(
                    tp3
                  )}
                </div>

              </div>
            `;
          }
        )
        .join("");

  } catch (error) {

    console.error(
      "HISTORY ERROR:",
      error
    );

    container.innerHTML =
      `<p>${escapeHtml(
        t("historyUnavailable")
      )}</p>`;
  }
}


/* =========================================================
   SIGNALS
========================================================= */

async function loadSignals() {

  const container =
    $("signals");

  if (!container) return;

  try {

    const data =
      await api(
        "/api/signals"
      );

    const signals =
      data.signals ||
      data.data ||
      [];

    if (
      !Array.isArray(signals) ||
      signals.length === 0
    ) {

      container.innerHTML =
        `<p>${escapeHtml(
          t("noSignals")
        )}</p>`;

      return;
    }

    container.innerHTML =
      signals
        .map(
          (signal) => `
            <div class="signal-item">

              <h3>
                ${escapeHtml(
                  signal.title ||
                  "XAUUSD Signal"
                )}
              </h3>

              <p>
                ${escapeHtml(
                  signal.content ||
                  signal.body ||
                  ""
                )}
              </p>

            </div>
          `
        )
        .join("");

  } catch (error) {

    console.error(
      "SIGNALS ERROR:",
      error
    );

    container.innerHTML =
      `<p>${escapeHtml(
        t("signalsUnavailable")
      )}</p>`;
  }
}


/* =========================================================
   STATUS
========================================================= */

function updateUserStatus() {

  const status =
    $("status");

  if (!status || !currentUser) {
    return;
  }

  if (
    currentUser.approved ===
    true
  ) {

    status.textContent =
      getLanguage() === "fa"
        ? "حساب شما فعال است."
        : getLanguage() === "ar"
          ? "حسابك مفعل."
          : "Your account is active.";

  } else {

    status.textContent =
      t("notApproved");
  }
}


/* =========================================================
   MAIN LOAD
========================================================= */

async function load() {

  try {

    const data =
      await api(
        "/api/me"
      );

    currentUser =
      data.user || null;

    const auth =
      $("auth");

    const dashboard =
      $("dashboard");

    if (!currentUser) {

      if (auth) {
        auth.style.display =
          "";
      }

      if (dashboard) {
        dashboard.style.display =
          "none";
      }

      return;
    }

    if (auth) {
      auth.style.display =
        "none";
    }

    if (dashboard) {
      dashboard.style.display =
        "block";
    }

    updateUserStatus();

    const status =
      currentUser.approved;

    const aiPanel =
      $("aiPanel");

    const historyPanel =
      $("historyPanel");

    const signalsPanel =
      $("signalsPanel");

    if (status) {

      if (aiPanel) {
        aiPanel.style.display =
          "block";
      }

      if (historyPanel) {
        historyPanel.style.display =
          "block";
      }

      if (signalsPanel) {
        signalsPanel.style.display =
          "block";
      }

      await Promise.all([
        loadHistory(),
        loadSignals()
      ]);

    } else {

      if (aiPanel) {
        aiPanel.style.display =
          "none";
      }

      if (historyPanel) {
        historyPanel.style.display =
          "none";
      }

      if (signalsPanel) {
        signalsPanel.style.display =
          "none";
      }
    }

  } catch (error) {

    console.error(
      "LOAD ERROR:",
      error
    );
  }
}


/* =========================================================
   AUTH TABS
========================================================= */

function setupAuthTabs() {

  const tabs =
    document.querySelectorAll(
      ".tab"
    );

  tabs.forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          const target =
            tab.dataset.tab;

          tabs.forEach(
            (item) => {
              item.classList.toggle(
                "active",
                item === tab
              );
            }
          );

          if (
            target ===
            "register"
          ) {

            $("loginForm")
              ?.classList.add(
                "hidden"
              );

            $("registerForm")
              ?.classList.remove(
                "hidden"
              );

          } else {

            $("registerForm")
              ?.classList.add(
                "hidden"
              );

            $("loginForm")
              ?.classList.remove(
                "hidden"
              );
          }

          showMessage(
            "authMsg",
            ""
          );
        }
      );

    }
  );
}


/* =========================================================
   LANGUAGE SELECTOR
========================================================= */

function setupLanguage() {

  const lang =
    $("lang");

  if (!lang) return;

  lang.addEventListener(
    "change",
    () => {

      setLanguage(
        lang.value
      );

      updateUserStatus();

      loadHistory();
      loadSignals();

    }
  );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* Language */

    setLanguage(
      getLanguage()
    );

    setupLanguage();


    /* Auth tabs */

    setupAuthTabs();


    /* Register */

    const registerForm =
      $("registerForm");

    if (registerForm) {
      registerForm.addEventListener(
        "submit",
        registerUser
      );
    }


    /* Login */

    const loginForm =
      $("loginForm");

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        loginUser
      );
    }


    /* Logout */

    const logoutBtn =
      $("logout");

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        logoutUser
      );
    }


    /* Payment */

    const paymentForm =
      $("paymentForm");

    if (paymentForm) {
      paymentForm.addEventListener(
        "submit",
        submitPayment
      );
    }

    setupPaymentMethods();


    /* Support */

    const supportBtn =
      $("supportBtn");

    if (supportBtn) {
      supportBtn.addEventListener(
        "click",
        sendSupport
      );
    }


    /* Chart */

    const chartFile =
      $("chartFile");

    if (chartFile) {
      chartFile.addEventListener(
        "change",
        previewChart
      );
    }


    /* Timeframe */

    setupTimeframes();


    /* AI */

    const chartForm =
      $("chartForm");

    if (chartForm) {
      chartForm.addEventListener(
        "submit",
        analyzeChart
      );
    }


    /* Start */

    load();
  }
);
