const $ = (id) => document.getElementById(id);

let currentUser = null;
let selectedChartFile = null;
let selectedTimeframe = "1m";
let selectedPaymentMethod = "hesabpay";

let accessPollTimer = null;
let paymentSubmitting = false;
let analysisSubmitting = false;
let supportSubmitting = false;


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

    paymentDescription:
      "مبلغ را پرداخت کنید و سپس رسید پرداخت خود را ارسال کنید. دسترسی شما تا زمان تأیید توسط مدیر قفل خواهد بود.",

    transactionReference: "شماره تراکنش / Reference",
    submitReceipt: "ارسال رسید برای بررسی",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "تحلیلگر هوشمند نمودار XAUUSD",

    analyzerDescription:
      "ابتدا تایم‌فریم مورد نظر را انتخاب کنید، سپس یک اسکرین‌شات واضح از نمودار XAUUSD همان تایم‌فریم آپلود کنید.",

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
    footerWarning:
      "معامله‌گری دارای ریسک بازار است. تحلیل هوش مصنوعی سود را تضمین نمی‌کند.",

    loading: "در حال بارگذاری...",
    loginLoading: "در حال ورود...",
    registerLoading: "در حال ساخت حساب...",
    paymentLoading: "در حال ارسال رسید...",
    supportLoading: "در حال ارسال...",
    analysisLoading: "هوش مصنوعی در حال تحلیل چارت است...",

    loginSuccess: "ورود موفق بود.",
    registerSuccess: "حساب با موفقیت ساخته شد.",
    paymentSuccess:
      "رسید ارسال شد و منتظر تأیید مدیر است.",
    supportSuccess: "پیام شما ارسال شد.",
    analysisSuccess: "تحلیل چارت با موفقیت انجام شد.",

    fillLogin: "ایمیل و رمز عبور را وارد کنید.",
    fillRegister: "لطفاً تمام معلومات را وارد کنید.",
    chartRequired: "لطفاً اول عکس چارت XAUUSD را انتخاب کنید.",
    imageOnly: "لطفاً فقط فایل تصویری چارت را انتخاب کنید.",
    receiptRequired: "لطفاً رسید پرداخت را انتخاب کنید.",
    referenceRequired: "لطفاً شماره یا Reference پرداخت را وارد کنید.",
    supportRequired: "لطفاً پیام خود را بنویسید.",

    invalidImageSize:
      "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",

    invalidImageType:
      "فرمت تصویر مجاز نیست.",

    noHistory:
      "هنوز تحلیل ذخیره‌شده‌ای وجود ندارد.",

    historyUnavailable:
      "تاریخچه تحلیل فعلاً قابل دریافت نیست.",

    noSignals:
      "هنوز سیگنالی منتشر نشده است.",

    signalsUnavailable:
      "سیگنال‌ها فعلاً قابل دریافت نیستند.",

    notApproved:
      "حساب شما هنوز توسط مدیر تأیید نشده است.",

    pendingPayment:
      "رسید شما ثبت شده و منتظر تأیید مدیر است.",

    approvedPayment:
      "پرداخت شما تأیید شد. دسترسی شما فعال است.",

    rejectedPayment:
      "پرداخت شما رد شده است. لطفاً رسید صحیح را ارسال کنید.",

    paymentHesabPay:
      "روش پرداخت انتخاب‌شده: HesabPay — 240 AFN",

    paymentBinance:
      "روش پرداخت انتخاب‌شده: Binance Pay — 4 USD / USDT",

    wait: "در انتظار",
    low: "کم",
    medium: "متوسط",
    high: "بالا",

    entryLabel: "ورود",
    slLabel: "حد ضرر",

    activeAccount:
      "حساب شما فعال است و تمام قابلیت‌های سایت در دسترس شما قرار دارد.",

    lockedAccount:
      "تا زمانی که پرداخت شما توسط مدیر تأیید نشود، قابلیت‌های سایت قفل هستند.",

    paymentSubmitted:
      "رسید پرداخت شما ارسال شده و در انتظار بررسی مدیر است.",

    choosePayment:
      "یکی از روش‌های پرداخت را انتخاب کنید.",

    sessionExpired:
      "جلسه شما منقضی شده است. لطفاً دوباره وارد شوید.",

    networkError:
      "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.",

    accessChecking:
      "در حال بررسی وضعیت دسترسی..."
  },


  en: {
    documentTitle: "GoldAI — XAUUSD AI Analyzer",

    heroPill: "XAUUSD • AI CHART ANALYZER",
    heroTitle: "Professional Gold Analysis",
    heroText:
      "Upload your XAUUSD chart and let GoldAI analyze the visible market structure.",

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

    paymentDescription:
      "Pay once, then upload your payment receipt. Your access remains locked until an administrator verifies the payment.",

    transactionReference: "Transaction ID / Reference",
    submitReceipt: "Submit receipt for review",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "XAUUSD AI Chart Analyzer",

    analyzerDescription:
      "First select the analysis timeframe, then upload a clear screenshot of your XAUUSD chart on that timeframe.",

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
    footerWarning:
      "Trading involves market risk. AI analysis does not guarantee profit.",

    loading: "Loading...",
    loginLoading: "Logging in...",
    registerLoading: "Creating account...",
    paymentLoading: "Submitting receipt...",
    supportLoading: "Sending...",
    analysisLoading: "AI is analyzing the chart...",

    loginSuccess: "Login successful.",
    registerSuccess: "Account created successfully.",
    paymentSuccess:
      "Receipt submitted and waiting for administrator approval.",
    supportSuccess: "Your message has been sent.",
    analysisSuccess: "Chart analysis completed successfully.",

    fillLogin:
      "Please enter your email and password.",

    fillRegister:
      "Please fill in all information.",

    chartRequired:
      "Please select an XAUUSD chart image first.",

    imageOnly:
      "Please select an image file only.",

    receiptRequired:
      "Please select your payment receipt.",

    referenceRequired:
      "Please enter the payment reference.",

    supportRequired:
      "Please write your message.",

    invalidImageSize:
      "Image size must not exceed 5 MB.",

    invalidImageType:
      "This image format is not allowed.",

    noHistory:
      "No saved analyses yet.",

    historyUnavailable:
      "Analysis history is currently unavailable.",

    noSignals:
      "No signals have been published yet.",

    signalsUnavailable:
      "Signals are currently unavailable.",

    notApproved:
      "Your account has not been approved yet.",

    pendingPayment:
      "Your receipt has been submitted and is waiting for administrator approval.",

    approvedPayment:
      "Your payment has been approved. Your access is active.",

    rejectedPayment:
      "Your payment was rejected. Please submit a valid receipt.",

    paymentHesabPay:
      "Selected payment method: HesabPay — 240 AFN",

    paymentBinance:
      "Selected payment method: Binance Pay — 4 USD / USDT",

    wait: "WAIT",
    low: "Low",
    medium: "Medium",
    high: "High",

    entryLabel: "Entry",
    slLabel: "SL",

    activeAccount:
      "Your account is active and all website features are available.",

    lockedAccount:
      "Website features remain locked until your payment is approved.",

    paymentSubmitted:
      "Your payment receipt has been submitted and is waiting for administrator review.",

    choosePayment:
      "Please select a payment method.",

    sessionExpired:
      "Your session has expired. Please log in again.",

    networkError:
      "Could not connect to the server. Please try again.",

    accessChecking:
      "Checking access status..."
  },


  ar: {
    documentTitle:
      "GoldAI — محلل XAUUSD بالذكاء الاصطناعي",

    heroPill:
      "XAUUSD • تحليل الرسم البياني بالذكاء الاصطناعي",

    heroTitle:
      "تحليل احترافي للذهب",

    heroText:
      "قم برفع مخطط XAUUSD الخاص بك ودع GoldAI يحلل هيكل السوق الظاهر.",

    hesabpayActivation:
      "التفعيل عبر HesabPay",

    binanceActivation:
      "التفعيل عبر Binance Pay",

    chartImageAnalysis:
      "تحليل صورة الرسم البياني",

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

    paymentDescription:
      "ادفع مرة واحدة ثم قم برفع إيصال الدفع. سيظل الوصول مقفلاً حتى يقوم المسؤول بتأكيد الدفع.",

    transactionReference:
      "رقم المعاملة / Reference",

    submitReceipt:
      "إرسال الإيصال للمراجعة",

    goldAiVision:
      "GOLD AI VISION",

    xauusdAnalyzer:
      "محلل مخطط XAUUSD بالذكاء الاصطناعي",

    analyzerDescription:
      "اختر أولاً الإطار الزمني للتحليل، ثم قم برفع لقطة واضحة لمخطط XAUUSD على نفس الإطار الزمني.",

    selectTimeframe:
      "اختر الإطار الزمني للتحليل",

    oneMinute:
      "دقيقة واحدة",

    fiveMinutes:
      "5 دقائق",

    fifteenMinutes:
      "15 دقيقة",

    chooseChart:
      "اختر مخطط XAUUSD",

    chartFormats:
      "PNG، JPG، WEBP أو GIF • الحد الأقصى 5 ميغابايت",

    analyzeChart:
      "تحليل المخطط بالذكاء الاصطناعي",

    aiSignal:
      "إشارة الذكاء الاصطناعي",

    symbol:
      "الرمز",

    timeframe:
      "الإطار الزمني",

    entry:
      "الدخول",

    stopLoss:
      "وقف الخسارة",

    confidence:
      "مستوى الثقة",

    technicalAnalysis:
      "التحليل الفني",

    riskWarning:
      "تحذير المخاطر",

    history:
      "السجل",

    previousAnalyses:
      "التحليلات السابقة",

    privateFeed:
      "التغذية الخاصة",

    privateSignals:
      "إشارات XAUUSD الخاصة",

    support:
      "الدعم",

    websiteSupport:
      "دعم الموقع",

    writeMessage:
      "اكتب رسالتك...",

    sendSupport:
      "إرسال رسالة الدعم",

    footerTitle:
      "GoldAI • خدمة تحليل XAUUSD بالذكاء الاصطناعي",

    footerWarning:
      "التداول ينطوي على مخاطر السوق. تحليل الذكاء الاصطناعي لا يضمن الربح.",

    loading:
      "جاري التحميل...",

    loginLoading:
      "جاري تسجيل الدخول...",

    registerLoading:
      "جاري إنشاء الحساب...",

    paymentLoading:
      "جاري إرسال الإيصال...",

    supportLoading:
      "جاري الإرسال...",

    analysisLoading:
      "يقوم الذكاء الاصطناعي بتحليل الرسم البياني...",

    loginSuccess:
      "تم تسجيل الدخول بنجاح.",

    registerSuccess:
      "تم إنشاء الحساب بنجاح.",

    paymentSuccess:
      "تم إرسال الإيصال وينتظر موافقة المسؤول.",

    supportSuccess:
      "تم إرسال رسالتك.",

    analysisSuccess:
      "تم تحليل الرسم البياني بنجاح.",

    fillLogin:
      "يرجى إدخال البريد الإلكتروني وكلمة المرور.",

    fillRegister:
      "يرجى إدخال جميع المعلومات.",

    chartRequired:
      "يرجى اختيار صورة مخطط XAUUSD أولاً.",

    imageOnly:
      "يرجى اختيار ملف صورة فقط.",

    receiptRequired:
      "يرجى اختيار إيصال الدفع.",

    referenceRequired:
      "يرجى إدخال مرجع الدفع.",

    supportRequired:
      "يرجى كتابة رسالتك.",

    invalidImageSize:
      "يجب ألا يتجاوز حجم الصورة 5 ميغابايت.",

    invalidImageType:
      "صيغة الصورة غير مسموحة.",

    noHistory:
      "لا توجد تحليلات محفوظة حتى الآن.",

    historyUnavailable:
      "سجل التحليلات غير متاح حالياً.",

    noSignals:
      "لم يتم نشر أي إشارات بعد.",

    signalsUnavailable:
      "الإشارات غير متاحة حالياً.",

    notApproved:
      "لم تتم الموافقة على حسابك بعد.",

    pendingPayment:
      "تم إرسال إيصالك وينتظر موافقة المسؤول.",

    approvedPayment:
      "تمت الموافقة على الدفع. حسابك مفعل.",

    rejectedPayment:
      "تم رفض الدفع. يرجى إرسال إيصال صحيح.",

    paymentHesabPay:
      "طريقة الدفع المختارة: HesabPay — 240 AFN",

    paymentBinance:
      "طريقة الدفع المختارة: Binance Pay — 4 USD / USDT",

    wait:
      "انتظار",

    low:
      "منخفض",

    medium:
      "متوسط",

    high:
      "مرتفع",

    entryLabel:
      "الدخول",

    slLabel:
      "وقف الخسارة",

    activeAccount:
      "حسابك مفعل وجميع ميزات الموقع متاحة لك.",

    lockedAccount:
      "تبقى ميزات الموقع مقفلة حتى تتم الموافقة على الدفع.",

    paymentSubmitted:
      "تم إرسال إيصال الدفع وينتظر مراجعة المسؤول.",

    choosePayment:
      "يرجى اختيار طريقة الدفع.",

    sessionExpired:
      "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.",

    networkError:
      "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.",

    accessChecking:
      "جاري التحقق من حالة الوصول..."
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

  document.documentElement.lang = language;

  document.documentElement.dir =
    language === "en"
      ? "ltr"
      : "rtl";

  const select = $("lang");

  if (select) {
    select.value = language;
  }

  applyTranslations(language);

  updatePaymentDetails();
  updateTimeframeButtons();

  document.title =
    translations[language].documentTitle;
}


function applyTranslations(language = getLanguage()) {

  const dictionary =
    translations[language] ||
    translations.fa;

  document
    .querySelectorAll("[data-i18n]")
    .forEach((element) => {

      const key =
        element.dataset.i18n;

      if (
        Object.prototype.hasOwnProperty.call(
          dictionary,
          key
        )
      ) {
        element.textContent =
          dictionary[key];
      }
    });


  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((element) => {

      const key =
        element.dataset.i18nPlaceholder;

      if (
        Object.prototype.hasOwnProperty.call(
          dictionary,
          key
        )
      ) {
        element.placeholder =
          dictionary[key];
      }
    });


  const preview =
    $("chartPreview");

  if (preview) {

    preview.alt =
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
  message,
  type = ""
) {

  const element = $(id);

  if (!element) {
    return;
  }

  element.textContent =
    message || "";

  element.className =
    type
      ? `msg ${type}`
      : "msg";
}


function setDisplay(
  id,
  visible
) {

  const element = $(id);

  if (!element) {
    return;
  }

  element.classList.toggle(
    "hidden",
    !visible
  );
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


function safeNumber(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return String(
    Number(
      number.toFixed(5)
    )
  );
}


function getField(
  object,
  names,
  fallback = ""
) {

  if (
    !object ||
    typeof object !== "object"
  ) {
    return fallback;
  }

  for (
    const name of names
  ) {

    if (
      object[name] !== undefined &&
      object[name] !== null &&
      String(object[name]).trim() !== ""
    ) {
      return object[name];
    }
  }

  return fallback;
}


function formatDate(value) {

  if (!value) {
    return "";
  }

  try {

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return new Intl.DateTimeFormat(
      getLanguage() === "fa"
        ? "fa-IR"
        : getLanguage() === "ar"
          ? "ar"
          : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(date);

  } catch {

    return String(value);
  }
}


function getTimeframeLabel(value) {

  const map = {
    "1m": "1M",
    "5m": "5M",
    "15m": "15M"
  };

  return map[value] || value || "1M";
}


/* =========================================================
   API
========================================================= */

async function api(
  url,
  options = {}
) {

  const finalOptions = {
    credentials: "include",
    cache: "no-store",
    ...options
  };

  let response;

  try {

    response =
      await fetch(
        url,
        finalOptions
      );

  } catch (error) {

    throw new Error(
      t("networkError")
    );
  }

  let data = {};

  try {

    data =
      await response.json();

  } catch {

    data = {};
  }

  if (!response.ok) {

    const message =
      data.error ||
      data.message ||
      (
        response.status === 401
          ? t("sessionExpired")
          : `Request failed (${response.status})`
      );

    const error =
      new Error(message);

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }

  return data;
}


/* =========================================================
   AUTH TABS
========================================================= */

function setupAuthTabs() {

  document
    .querySelectorAll(".tab")
    .forEach((tab) => {

      tab.addEventListener(
        "click",
        () => {

          const target =
            tab.dataset.tab;

          document
            .querySelectorAll(".tab")
            .forEach((item) => {

              item.classList.toggle(
                "active",
                item === tab
              );
            });

          const loginForm =
            $("loginForm");

          const registerForm =
            $("registerForm");

          if (
            target === "register"
          ) {

            loginForm?.classList.add(
              "hidden"
            );

            registerForm?.classList.remove(
              "hidden"
            );

          } else {

            registerForm?.classList.add(
              "hidden"
            );

            loginForm?.classList.remove(
              "hidden"
            );
          }

          showMessage(
            "authMsg",
            ""
          );
        }
      );
    });
}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(event) {

  event.preventDefault();

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

  if (password.length < 6) {

    showMessage(
      "authMsg",
      t("password6"),
      "error"
    );

    return;
  }

  const button =
    event.submitter ||
    event.currentTarget.querySelector(
      "button[type='submit']"
    );

  try {

    if (button) {
      button.disabled = true;
    }

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
      data.user ||
      null;

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

  } finally {

    if (button) {
      button.disabled = false;
    }
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

  const button =
    event.submitter ||
    event.currentTarget.querySelector(
      "button[type='submit']"
    );

  try {

    if (button) {
      button.disabled = true;
    }

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
      data.user ||
      null;

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

  } finally {

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  stopAccessPolling();

  try {

    await api(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch (error) {

    console.warn(
      "LOGOUT ERROR:",
      error
    );
  }

  currentUser = null;
  selectedChartFile = null;

  const chartFile =
    $("chartFile");

  if (chartFile) {
    chartFile.value = "";
  }

  const chartPreview =
    $("chartPreview");

  if (chartPreview) {
    chartPreview.removeAttribute(
      "src"
    );
  }

  setDisplay(
    "chartPreviewWrap",
    false
  );

  setDisplay(
    "auth",
    true
  );

  setDisplay(
    "dashboard",
    false
  );

  const loginForm =
    $("loginForm");

  const registerForm =
    $("registerForm");

  loginForm?.reset();
  registerForm?.reset();

  showMessage(
    "authMsg",
    ""
  );
}


/* =========================================================
   PAYMENT
========================================================= */

function updatePaymentDetails() {

  const details =
    $("payDetails");

  if (!details) {
    return;
  }

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
    .querySelectorAll(
      ".pay[data-method]"
    )
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

              item.classList.toggle(
                "active",
                item === button
              );
            });

          updatePaymentDetails();

          showMessage(
            "payMsg",
            ""
          );
        }
      );
    });

  updatePaymentDetails();
}


/* =========================================================
   PAYMENT SUBMIT
========================================================= */

async function submitPayment(event) {

  event.preventDefault();

  if (
    paymentSubmitting ||
    !currentUser ||
    currentUser.approved
  ) {
    return;
  }

  const reference =
    $("reference")?.value.trim() ||
    "";

  const receipt =
    $("receipt")?.files?.[0] ||
    null;

  if (!reference) {

    showMessage(
      "payMsg",
      t("referenceRequired"),
      "error"
    );

    return;
  }

  if (!receipt) {

    showMessage(
      "payMsg",
      t("receiptRequired"),
      "error"
    );

    return;
  }

  if (
    !receipt.type.startsWith(
      "image/"
    )
  ) {

    showMessage(
      "payMsg",
      t("invalidImageType"),
      "error"
    );

    return;
  }

  if (
    receipt.size >
    5 * 1024 * 1024
  ) {

    showMessage(
      "payMsg",
      t("invalidImageSize"),
      "error"
    );

    return;
  }

  const button =
    event.submitter ||
    event.currentTarget.querySelector(
      "button[type='submit']"
    );

  const formData =
    new FormData();

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
    "reference",
    reference
  );

  formData.append(
    "receipt",
    receipt
  );

  try {

    paymentSubmitting = true;

    if (button) {
      button.disabled = true;
    }

    showMessage(
      "payMsg",
      t("paymentLoading")
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

    if ($("paymentForm")) {
      $("paymentForm").reset();
    }

    await refreshAccess();

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

  } finally {

    paymentSubmitting = false;

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================================================
   ACCESS UI
========================================================= */

function renderLockedState(
  accessData = {}
) {

  setDisplay(
    "payPanel",
    true
  );

  setDisplay(
    "approvedNotice",
    false
  );

  setDisplay(
    "aiPanel",
    false
  );

  setDisplay(
    "historyPanel",
    false
  );

  setDisplay(
    "signalsPanel",
    false
  );

  setDisplay(
    "supportPanel",
    false
  );

  const paymentStatus =
    $("paymentStatus");

  const lockNotice =
    $("paymentLockNotice");

  const status =
    accessData.paymentStatus ||
    null;

  if (paymentStatus) {

    paymentStatus.className =
      "accessStatus pending";

    if (status === "rejected") {

      paymentStatus.textContent =
        t("rejectedPayment");

      paymentStatus.classList.add(
        "error"
      );

    } else if (
      status === "pending"
    ) {

      paymentStatus.textContent =
        t("pendingPayment");

    } else {

      paymentStatus.textContent =
        t("notApproved");
    }
  }

  if (lockNotice) {

    lockNotice.textContent =
      status === "pending"
        ? t("paymentSubmitted")
        : t("lockedAccount");
  }
}


function renderApprovedState() {

  setDisplay(
    "payPanel",
    false
  );

  setDisplay(
    "approvedNotice",
    true
  );

  setDisplay(
    "aiPanel",
    true
  );

  setDisplay(
    "historyPanel",
    true
  );

  setDisplay(
    "signalsPanel",
    true
  );

  setDisplay(
    "supportPanel",
    true
  );

  const paymentStatus =
    $("paymentStatus");

  if (paymentStatus) {
    paymentStatus.textContent =
      t("approvedPayment");

    paymentStatus.className =
      "accessStatus approved";
  }

  const approvedText =
    $("approvedNoticeText");

  if (approvedText) {
    approvedText.textContent =
      t("activeAccount");
  }
}


function updateUserHeader() {

  const status =
    $("status");

  if (!status) {
    return;
  }

  if (!currentUser) {
    status.textContent = "";
    return;
  }

  const name =
    currentUser.name ||
    currentUser.email ||
    "";

  status.textContent =
    name;
}


/* =========================================================
   ACCESS / SESSION
========================================================= */

async function getCurrentUser() {

  try {

    const data =
      await api(
        "/api/me"
      );

    currentUser =
      data.user ||
      null;

    return currentUser;

  } catch (error) {

    if (
      error.status === 401
    ) {
      currentUser = null;
      return null;
    }

    throw error;
  }
}


async function refreshAccess() {

  if (!currentUser) {
    return null;
  }

  try {

    const data =
      await api(
        "/api/access"
      );

    if (
      data.user
    ) {
      currentUser =
        data.user;
    }

    if (
      data.approved !== undefined
    ) {
      currentUser.approved =
        Boolean(
          data.approved
        );
    }

    updateUserHeader();

    if (
      currentUser.approved ||
      data.approved === true
    ) {

      renderApprovedState();

      await Promise.all([
        loadHistory(),
        loadSignals()
      ]);

    } else {

      renderLockedState(
        data
      );
    }

    return data;

  } catch (error) {

    console.error(
      "ACCESS ERROR:",
      error
    );

    if (
      error.status === 401
    ) {

      currentUser = null;

      stopAccessPolling();

      setDisplay(
        "auth",
        true
      );

      setDisplay(
        "dashboard",
        false
      );

      return null;
    }

    const paymentStatus =
      $("paymentStatus");

    if (paymentStatus) {

      paymentStatus.textContent =
        error.message ||
        t("networkError");

      paymentStatus.className =
        "accessStatus error";
    }

    return null;
  }
}


function startAccessPolling() {

  stopAccessPolling();

  if (
    !currentUser ||
    currentUser.approved
  ) {
    return;
  }

  accessPollTimer =
    window.setInterval(
      async () => {

        if (
          !currentUser ||
          currentUser.approved
        ) {
          stopAccessPolling();
          return;
        }

        await refreshAccess();

        if (
          currentUser?.approved
        ) {
          stopAccessPolling();
        }

      },
      15000
    );
}


function stopAccessPolling() {

  if (
    accessPollTimer
  ) {

    window.clearInterval(
      accessPollTimer
    );

    accessPollTimer =
      null;
  }
}


/* =========================================================
   TIMEFRAME
========================================================= */

function updateTimeframeButtons() {

  document
    .querySelectorAll(
      ".timeframeOption"
    )
    .forEach((button) => {

      button.classList.toggle(
        "active",
        button.dataset.timeframe ===
          selectedTimeframe
      );
    });

  const hidden =
    $("selectedTimeframe");

  if (hidden) {
    hidden.value =
      selectedTimeframe;
  }
}


function setupTimeframes() {

  document
    .querySelectorAll(
      ".timeframeOption"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          selectedTimeframe =
            button.dataset.timeframe ||
            "1m";

          updateTimeframeButtons();
        }
      );
    });

  updateTimeframeButtons();
}


/* =========================================================
   CHART FILE
========================================================= */

function validateImageFile(
  file
) {

  if (!file) {
    return false;
  }

  const allowed = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
  ];

  if (
    !allowed.includes(
      file.type
    )
  ) {

    showMessage(
      "chartMsg",
      t("invalidImageType"),
      "error"
    );

    return false;
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

    return false;
  }

  return true;
}


function setupChartUpload() {

  const input =
    $("chartFile");

  if (!input) {
    return;
  }

  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0] ||
        null;

      if (!file) {

        selectedChartFile =
          null;

        setDisplay(
          "chartPreviewWrap",
          false
        );

        return;
      }

      if (
        !validateImageFile(
          file
        )
      ) {

        input.value = "";

        selectedChartFile =
          null;

        setDisplay(
          "chartPreviewWrap",
          false
        );

        return;
      }

      selectedChartFile =
        file;

      const preview =
        $("chartPreview");

      const wrap =
        $("chartPreviewWrap");

      if (
        preview &&
        wrap
      ) {

        const url =
          URL.createObjectURL(
            file
          );

        preview.src =
          url;

        preview.onload =
          () => {
            URL.revokeObjectURL(
              url
            );
          };

        wrap.classList.remove(
          "hidden"
        );
      }

      showMessage(
        "chartMsg",
        ""
      );
    }
  );
}


/* =========================================================
   AI ANALYSIS RESULT
========================================================= */

function normalizeDirection(
  value
) {

  const raw =
    String(
      value || ""
    )
      .trim()
      .toUpperCase();

  if (
    raw.includes("BUY") ||
    raw.includes("LONG")
  ) {
    return "BUY";
  }

  if (
    raw.includes("SELL") ||
    raw.includes("SHORT")
  ) {
    return "SELL";
  }

  return "WAIT";
}


function normalizeConfidence(
  value
) {

  const raw =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    raw.includes("high") ||
    raw.includes("بالا") ||
    raw.includes("مرتفع")
  ) {
    return t("high");
  }

  if (
    raw.includes("medium") ||
    raw.includes("متوسط")
  ) {
    return t("medium");
  }

  if (
    raw.includes("low") ||
    raw.includes("کم") ||
    raw.includes("منخفض")
  ) {
    return t("low");
  }

  return value ||
    t("wait");
}


function renderAnalysis(
  analysis,
  fallbackTimeframe
) {

  if (
    !analysis ||
    typeof analysis !== "object"
  ) {
    return;
  }

  const direction =
    normalizeDirection(
      getField(
        analysis,
        [
          "direction",
          "signal",
          "action",
          "trade_direction"
        ],
        "WAIT"
      )
    );

  const symbol =
    getField(
      analysis,
      [
        "symbol",
        "pair",
        "asset"
      ],
      "XAUUSD"
    );

  const timeframe =
    getField(
      analysis,
      [
        "timeframe",
        "tf"
      ],
      fallbackTimeframe
    );

  const entry =
    getField(
      analysis,
      [
        "entry",
        "entry_price",
        "entryPrice"
      ],
      "WAIT"
    );

  const sl =
    getField(
      analysis,
      [
        "stop_loss",
        "stopLoss",
        "sl"
      ],
      "WAIT"
    );

  const tp1 =
    getField(
      analysis,
      [
        "tp1",
        "TP1",
        "take_profit_1"
      ],
      "WAIT"
    );

  const tp2 =
    getField(
      analysis,
      [
        "tp2",
        "TP2",
        "take_profit_2"
      ],
      "WAIT"
    );

  const tp3 =
    getField(
      analysis,
      [
        "tp3",
        "TP3",
        "take_profit_3"
      ],
      "WAIT"
    );

  const tp4 =
    getField(
      analysis,
      [
        "tp4",
        "TP4",
        "take_profit_4"
      ],
      "WAIT"
    );

  const tp5 =
    getField(
      analysis,
      [
        "tp5",
        "TP5",
        "take_profit_5"
      ],
      "WAIT"
    );

  const confidence =
    getField(
      analysis,
      [
        "confidence",
        "confidence_level"
      ],
      "WAIT"
    );

  const technical =
    getField(
      analysis,
      [
        "technical_analysis",
        "technicalAnalysis",
        "analysis",
        "reasoning"
      ],
      ""
    );

  const warning =
    getField(
      analysis,
      [
        "risk_warning",
        "riskWarning",
        "risk",
        "warning"
      ],
      t("footerWarning")
    );

  const result =
    $("analysisResult");

  if (result) {
    result.classList.remove(
      "hidden"
    );
  }

  const directionElement =
    $("analysisDirection");

  if (directionElement) {

    directionElement.textContent =
      direction;
  }

  const symbolElement =
    $("analysisSymbol");

  if (symbolElement) {
    symbolElement.textContent =
      textValue(
        symbol,
        "XAUUSD"
      );
  }

  const timeframeElement =
    $("analysisTimeframe");

  if (timeframeElement) {
    timeframeElement.textContent =
      getTimeframeLabel(
        timeframe
      );
  }

  const entryElement =
    $("analysisEntry");

  if (entryElement) {
    entryElement.textContent =
      safeNumber(entry);
  }

  const slElement =
    $("analysisSL");

  if (slElement) {
    slElement.textContent =
      safeNumber(sl);
  }

  const tp1Element =
    $("analysisTP1");

  if (tp1Element) {
    tp1Element.textContent =
      safeNumber(tp1);
  }

  const tp2Element =
    $("analysisTP2");

  if (tp2Element) {
    tp2Element.textContent =
      safeNumber(tp2);
  }

  const tp3Element =
    $("analysisTP3");

  if (tp3Element) {
    tp3Element.textContent =
      safeNumber(tp3);
  }

  const tp4Element =
    $("analysisTP4");

  if (tp4Element) {
    tp4Element.textContent =
      safeNumber(tp4);
  }

  const tp5Element =
    $("analysisTP5");

  if (tp5Element) {
    tp5Element.textContent =
      safeNumber(tp5);
  }

  const confidenceElement =
    $("analysisConfidence");

  if (confidenceElement) {
    confidenceElement.textContent =
      normalizeConfidence(
        confidence
      );
  }

  const textElement =
    $("analysisTextContent");

  if (textElement) {
    textElement.textContent =
      textValue(
        technical,
        t("wait")
      );
  }

  const warningElement =
    $("analysisWarning");

  if (warningElement) {
    warningElement.textContent =
      textValue(
        warning,
        t("footerWarning")
      );
  }
}


/* =========================================================
   AI ANALYSIS
========================================================= */

async function analyzeChart(
  event
) {

  event.preventDefault();

  if (
    analysisSubmitting ||
    !currentUser ||
    !currentUser.approved
  ) {
    return;
  }

  const file =
    selectedChartFile ||
    $("chartFile")?.files?.[0] ||
    null;

  if (!file) {

    showMessage(
      "chartMsg",
      t("chartRequired"),
      "error"
    );

    return;
  }

  if (
    !validateImageFile(
      file
    )
  ) {
    return;
  }

  const button =
    $("analyzeBtn");

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

  formData.append(
    "language",
    getLanguage()
  );

  try {

    analysisSubmitting = true;

    if (button) {
      button.disabled = true;
    }

    setDisplay(
      "analysisResult",
      false
    );

    showMessage(
      "chartMsg",
      t("analysisLoading")
    );

    const data =
      await api(
        "/api/analyze-chart",
        {
          method: "POST",
          body: formData
        }
      );

    const analysis =
      data.analysis ||
      data.result ||
      data.data ||
      data;

    renderAnalysis(
      analysis,
      selectedTimeframe
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
      "ANALYSIS ERROR:",
      error
    );

    showMessage(
      "chartMsg",
      error.message,
      "error"
    );

  } finally {

    analysisSubmitting = false;

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory(
  items
) {

  const container =
    $("analysisHistory");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    container.textContent =
      t("noHistory");

    return;
  }

  items.forEach(
    (item) => {

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "historyItem";

      const direction =
        normalizeDirection(
          getField(
            item,
            [
              "direction",
              "signal",
              "action"
            ],
            "WAIT"
          )
        );

      const timeframe =
        getField(
          item,
          [
            "timeframe",
            "tf"
          ],
          "1m"
        );

      const entry =
        getField(
          item,
          [
            "entry",
            "entry_price"
          ],
          "WAIT"
        );

      const sl =
        getField(
          item,
          [
            "stop_loss",
            "stopLoss",
            "sl"
          ],
          "WAIT"
        );

      const created =
        getField(
          item,
          [
            "created_at",
            "createdAt",
            "date"
          ],
          ""
        );

      const technical =
        getField(
          item,
          [
            "technical_analysis",
            "technicalAnalysis",
            "analysis"
          ],
          ""
        );

      wrapper.innerHTML = `
        <div class="row">
          <strong>
            ${escapeHtml(direction)}
          </strong>

          <small>
            ${escapeHtml(
              getTimeframeLabel(
                timeframe
              )
            )}
          </small>
        </div>

        <div class="analysisGrid">
          <div class="analysisBox">
            <small>${escapeHtml(t("entry"))}</small>
            <b>${escapeHtml(
              safeNumber(entry)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>${escapeHtml(t("stopLoss"))}</small>
            <b>${escapeHtml(
              safeNumber(sl)
            )}</b>
          </div>
        </div>

        ${
          technical
            ? `
              <p>
                ${escapeHtml(
                  technical
                )}
              </p>
            `
            : ""
        }

        ${
          created
            ? `
              <small>
                ${escapeHtml(
                  formatDate(
                    created
                  )
                )}
              </small>
            `
            : ""
        }
      `;

      container.appendChild(
        wrapper
      );
    }
  );
}


async function loadHistory() {

  if (
    !currentUser ||
    !currentUser.approved
  ) {
    return;
  }

  try {

    const data =
      await api(
        "/api/analyses"
      );

    const items =
      data.analyses ||
      data.items ||
      data.data ||
      [];

    renderHistory(
      items
    );

  } catch (error) {

    console.error(
      "HISTORY ERROR:",
      error
    );

    const container =
      $("analysisHistory");

    if (container) {
      container.textContent =
        t("historyUnavailable");
    }
  }
}


/* =========================================================
   SIGNALS
========================================================= */

function renderSignals(
  items
) {

  const container =
    $("signals");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    container.textContent =
      t("noSignals");

    return;
  }

  items.forEach(
    (signal) => {

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "signalItem";

      const direction =
        normalizeDirection(
          getField(
            signal,
            [
              "direction",
              "signal",
              "action"
            ],
            "WAIT"
          )
        );

      const symbol =
        getField(
          signal,
          [
            "symbol",
            "pair",
            "asset"
          ],
          "XAUUSD"
        );

      const timeframe =
        getField(
          signal,
          [
            "timeframe",
            "tf"
          ],
          "1m"
        );

      const entry =
        getField(
          signal,
          [
            "entry",
            "entry_price"
          ],
          "WAIT"
        );

      const sl =
        getField(
          signal,
          [
            "stop_loss",
            "stopLoss",
            "sl"
          ],
          "WAIT"
        );

      const tp1 =
        getField(
          signal,
          [
            "tp1",
            "TP1"
          ],
          "WAIT"
        );

      const tp2 =
        getField(
          signal,
          [
            "tp2",
            "TP2"
          ],
          "WAIT"
        );

      const tp3 =
        getField(
          signal,
          [
            "tp3",
            "TP3"
          ],
          "WAIT"
        );

      const tp4 =
        getField(
          signal,
          [
            "tp4",
            "TP4"
          ],
          "WAIT"
        );

      const tp5 =
        getField(
          signal,
          [
            "tp5",
            "TP5"
          ],
          "WAIT"
        );

      const created =
        getField(
          signal,
          [
            "created_at",
            "createdAt",
            "date"
          ],
          ""
        );

      wrapper.innerHTML = `
        <div class="row">
          <strong>
            ${escapeHtml(direction)}
          </strong>

          <small>
            ${escapeHtml(symbol)}
            •
            ${escapeHtml(
              getTimeframeLabel(
                timeframe
              )
            )}
          </small>
        </div>

        <div class="analysisGrid">

          <div class="analysisBox">
            <small>${escapeHtml(t("entry"))}</small>
            <b>${escapeHtml(
              safeNumber(entry)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>${escapeHtml(t("stopLoss"))}</small>
            <b>${escapeHtml(
              safeNumber(sl)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>TP1</small>
            <b>${escapeHtml(
              safeNumber(tp1)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>TP2</small>
            <b>${escapeHtml(
              safeNumber(tp2)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>TP3</small>
            <b>${escapeHtml(
              safeNumber(tp3)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>TP4</small>
            <b>${escapeHtml(
              safeNumber(tp4)
            )}</b>
          </div>

          <div class="analysisBox">
            <small>TP5</small>
            <b>${escapeHtml(
              safeNumber(tp5)
            )}</b>
          </div>

        </div>

        ${
          created
            ? `
              <small>
                ${escapeHtml(
                  formatDate(
                    created
                  )
                )}
              </small>
            `
            : ""
        }
      `;

      container.appendChild(
        wrapper
      );
    }
  );
}


async function loadSignals() {

  if (
    !currentUser ||
    !currentUser.approved
  ) {
    return;
  }

  try {

    const data =
      await api(
        "/api/signals"
      );

    const items =
      data.signals ||
      data.items ||
      data.data ||
      [];

    renderSignals(
      items
    );

  } catch (error) {

    console.error(
      "SIGNALS ERROR:",
      error
    );

    const container =
      $("signals");

    if (container) {
      container.textContent =
        t("signalsUnavailable");
    }
  }
}


/* =========================================================
   SUPPORT
========================================================= */

async function sendSupportMessage() {

  if (
    supportSubmitting ||
    !currentUser ||
    !currentUser.approved
  ) {
    return;
  }

  const textarea =
    $("supportText");

  const message =
    textarea?.value.trim() ||
    "";

  if (!message) {

    showMessage(
      "supportMsg",
      t("supportRequired"),
      "error"
    );

    return;
  }

  const button =
    $("supportBtn");

  try {

    supportSubmitting = true;

    if (button) {
      button.disabled = true;
    }

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

    if (textarea) {
      textarea.value = "";
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

  } finally {

    supportSubmitting = false;

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

  $("lang")?.addEventListener(
    "change",
    (event) => {

      setLanguage(
        event.target.value
      );

      if (
        currentUser?.approved
      ) {
        loadHistory();
        loadSignals();
      }
    }
  );


  $("loginForm")?.addEventListener(
    "submit",
    loginUser
  );


  $("registerForm")?.addEventListener(
    "submit",
    registerUser
  );


  $("logout")?.addEventListener(
    "click",
    logoutUser
  );


  $("paymentForm")?.addEventListener(
    "submit",
    submitPayment
  );


  $("chartForm")?.addEventListener(
    "submit",
    analyzeChart
  );


  $("supportBtn")?.addEventListener(
    "click",
    sendSupportMessage
  );
}


/* =========================================================
   LOAD
========================================================= */

async function load() {

  setDisplay(
    "auth",
    false
  );

  setDisplay(
    "dashboard",
    true
  );

  updateUserHeader();

  if (!currentUser) {

    setDisplay(
      "auth",
      true
    );

    setDisplay(
      "dashboard",
      false
    );

    return;
  }

  try {

    const access =
      await refreshAccess();

    if (
      currentUser &&
      !currentUser.approved
    ) {

      startAccessPolling();

    } else {

      stopAccessPolling();
    }

    return access;

  } catch (error) {

    console.error(
      "LOAD ERROR:",
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
   INITIALIZATION
========================================================= */

async function init() {

  setLanguage(
    getLanguage()
  );

  setupAuthTabs();
  setupPaymentMethods();
  setupTimeframes();
  setupChartUpload();
  setupEvents();

  try {

    const user =
      await getCurrentUser();

    if (user) {

      await load();

    } else {

      setDisplay(
        "auth",
        true
      );

      setDisplay(
        "dashboard",
        false
      );
    }

  } catch (error) {

    console.error(
      "INIT ERROR:",
      error
    );

    currentUser = null;

    setDisplay(
      "auth",
      true
    );

    setDisplay(
      "dashboard",
      false
    );
  }
}


document.addEventListener(
  "DOMContentLoaded",
  init
);
