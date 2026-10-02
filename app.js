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
    password6: "رمز عبور (حداقل ۶ کاراکتر)",
    fullName: "نام کامل",

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
    footerWarning: "معامله‌گری دارای ریسک بازار است. تحلیل هوش مصنوعی سود را تضمین نمی‌کند."
  },

  en: {
    heroPill: "XAUUSD • AI Chart Analysis",
    heroTitle: "Professional Gold Analysis",
    heroText: "Upload your XAUUSD chart and GoldAI will analyze the visible market structure.",
    hesabpayActivation: "Activation with HesabPay",
    binanceActivation: "Activation with Binance Pay",
    chartImageAnalysis: "Chart image analysis",

    login: "Login",
    createAccount: "Create Account",
    email: "Email",
    password: "Password",
    password6: "Password (minimum 6 characters)",
    fullName: "Full name",

    goldAiMember: "GOLD AI MEMBER",
    memberDashboard: "Member Dashboard",
    logout: "Logout",

    membership: "MEMBERSHIP",
    activateAccess: "Activate Access",
    paymentDescription: "Complete the payment and submit your payment receipt. Your access remains locked until an administrator approves your payment.",
    transactionReference: "Transaction / Reference",
    submitReceipt: "Submit Receipt",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "XAUUSD AI Chart Analyzer",
    analyzerDescription: "Select your timeframe first, then upload a clear XAUUSD chart screenshot for the same timeframe.",
    selectTimeframe: "Select Analysis Timeframe",
    oneMinute: "1 Minute",
    fiveMinutes: "5 Minutes",
    fifteenMinutes: "15 Minutes",
    chooseChart: "Choose XAUUSD Chart",
    chartFormats: "PNG, JPG, WEBP or GIF • Maximum 5 MB",
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
    previousAnalyses: "Previous Analyses",

    privateFeed: "PRIVATE FEED",
    privateSignals: "Private XAUUSD Signals",

    support: "SUPPORT",
    websiteSupport: "Website Support",
    writeMessage: "Write your message...",
    sendSupport: "Send Support Message",

    footerTitle: "GoldAI • AI XAUUSD Analysis Service",
    footerWarning: "Trading involves market risk. AI analysis does not guarantee profit."
  },

  ar: {
    heroPill: "XAUUSD • تحليل الرسم البياني بالذكاء الاصطناعي",
    heroTitle: "تحليل احترافي للذهب",
    heroText: "ارفع مخطط XAUUSD الخاص بك وسيقوم GoldAI بتحليل هيكل السوق الظاهر.",
    hesabpayActivation: "التفعيل عبر HesabPay",
    binanceActivation: "التفعيل عبر Binance Pay",
    chartImageAnalysis: "تحليل صورة الرسم البياني",

    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    password6: "كلمة المرور (6 أحرف على الأقل)",
    fullName: "الاسم الكامل",

    goldAiMember: "عضو GOLD AI",
    memberDashboard: "لوحة الأعضاء",
    logout: "تسجيل الخروج",

    membership: "العضوية",
    activateAccess: "تفعيل الوصول",
    paymentDescription: "أكمل الدفع ثم أرسل إيصال الدفع. سيبقى الوصول مقفلاً حتى تتم الموافقة على الدفع من قبل الإدارة.",
    transactionReference: "رقم المعاملة / المرجع",
    submitReceipt: "إرسال الإيصال",

    goldAiVision: "GOLD AI VISION",
    xauusdAnalyzer: "محلل XAUUSD بالذكاء الاصطناعي",
    analyzerDescription: "اختر الإطار الزمني أولاً، ثم ارفع صورة واضحة لمخطط XAUUSD لنفس الإطار الزمني.",
    selectTimeframe: "اختر الإطار الزمني للتحليل",
    oneMinute: "دقيقة واحدة",
    fiveMinutes: "5 دقائق",
    fifteenMinutes: "15 دقيقة",
    chooseChart: "اختر مخطط XAUUSD",
    chartFormats: "PNG، JPG، WEBP أو GIF • الحد الأقصى 5 ميجابايت",
    analyzeChart: "تحليل المخطط بالذكاء الاصطناعي",

    aiSignal: "إشارة الذكاء الاصطناعي",
    symbol: "الرمز",
    timeframe: "الإطار الزمني",
    entry: "الدخول",
    stopLoss: "وقف الخسارة",
    confidence: "درجة الثقة",
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
    footerWarning: "التداول ينطوي على مخاطر السوق. تحليل الذكاء الاصطناعي لا يضمن الربح."
  }

};


/* =========================================================
   LANGUAGE
========================================================= */

function getLanguage() {

  const saved =
    localStorage.getItem(
      "goldai_language"
    );

  if (
    saved &&
    translations[saved]
  ) {
    return saved;
  }

  return "fa";
}


function setLanguage(language) {

  if (
    !translations[language]
  ) {
    language = "fa";
  }

  localStorage.setItem(
    "goldai_language",
    language
  );

  const html =
    document.documentElement;

  html.lang =
    language;

  html.dir =
    language === "en"
      ? "ltr"
      : "rtl";

  const select =
    $("lang");

  if (select) {
    select.value =
      language;
  }

  document
    .querySelectorAll(
      "[data-i18n]"
    )
    .forEach(
      (element) => {

        const key =
          element.dataset.i18n;

        if (
          translations[language][key] !==
          undefined
        ) {

          element.textContent =
            translations[language][key];

        }

      }
    );


  document
    .querySelectorAll(
      "[data-i18n-placeholder]"
    )
    .forEach(
      (element) => {

        const key =
          element.dataset.i18nPlaceholder;

        if (
          translations[language][key] !==
          undefined
        ) {

          element.placeholder =
            translations[language][key];

        }

      }
    );


  renderPaymentDetails();

  if (currentUser) {
    renderStatus();
  }

}


function currentLanguage() {

  return getLanguage();

}


/* =========================================================
   HELPERS
========================================================= */

function textValue(
  value,
  fallback = "—"
) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}


function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    (character) => {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];

    }
  );

}


function formatDate(value) {

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    currentLanguage() === "fa"
      ? "fa-AF"
      : currentLanguage() === "ar"
        ? "ar"
        : "en-US"
  );

}


function timeframeLabel(value) {

  const labels = {
    "1m": "1M",
    "5m": "5M",
    "15m": "15M"
  };

  return (
    labels[value] ||
    value ||
    "—"
  );

}


/* =========================================================
   API
========================================================= */

async function api(
  url,
  options = {}
) {

  const response =
    await fetch(
      url,
      {
        credentials: "include",
        ...options
      }
    );

  let data = {};

  try {

    data =
      await response.json();

  } catch (_) {

    data = {};

  }

  if (
    !response.ok
  ) {

    throw new Error(
      data.error ||
      "Request failed."
    );

  }

  return data;

}


/* =========================================================
   AUTH TABS
========================================================= */

function showAuthTab(
  tab
) {

  const loginForm =
    $("loginForm");

  const registerForm =
    $("registerForm");

  document
    .querySelectorAll(
      ".tab[data-tab]"
    )
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.tab ===
            tab
        );

      }
    );


  if (loginForm) {

    loginForm.classList.toggle(
      "hidden",
      tab !== "login"
    );

  }


  if (registerForm) {

    registerForm.classList.toggle(
      "hidden",
      tab !== "register"
    );

  }

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function authMessage(
  message
) {

  const element =
    $("authMsg");

  if (element) {
    element.textContent =
      message || "";
  }

}


/* =========================================================
   PAYMENT DETAILS
========================================================= */

function renderPaymentDetails() {

  const details =
    $("payDetails");

  if (!details) {
    return;
  }

  if (
    selectedPaymentMethod ===
    "binance"
  ) {

    details.innerHTML = `
      <strong>Binance Pay</strong>
      <br>
      Amount: <strong>4 USD / USDT</strong>
      <br>
      Please complete the payment using the Binance Pay details provided by the administrator.
    `;

  } else {

    details.innerHTML = `
      <strong>HesabPay</strong>
      <br>
      Amount: <strong>240 AFN</strong>
      <br>
      Please complete the payment using the HesabPay details provided by the administrator.
    `;

  }

}


/* =========================================================
   RENDER STATUS
========================================================= */

function renderStatus() {

  const status =
    $("status");

  if (!status) {
    return;
  }

  const language =
    currentLanguage();

  if (
    currentUser?.approved
  ) {

    if (language === "en") {

      status.textContent =
        "✓ Your account is approved. All member features are available.";

    } else if (
      language === "ar"
    ) {

      status.textContent =
        "✓ تم اعتماد حسابك. جميع ميزات الأعضاء متاحة.";

    } else {

      status.textContent =
        "✓ حساب شما تأیید شده است. تمام امکانات اعضا فعال است.";

    }

    status.className =
      "statusApproved";

  } else {

    if (language === "en") {

      status.textContent =
        "Access locked — payment approval is required.";

    } else if (
      language === "ar"
    ) {

      status.textContent =
        "الوصول مقفل — يجب اعتماد الدفع أولاً.";

    } else {

      status.textContent =
        "دسترسی قفل است — ابتدا پرداخت شما باید تأیید شود.";

    }

    status.className =
      "statusLocked";

  }

}


/* =========================================================
   LOCKED STATE
========================================================= */

function renderLockedState(
  paymentStatus = null
) {

  const payPanel =
    $("payPanel");

  const approvedNotice =
    $("approvedNotice");

  const aiPanel =
    $("aiPanel");

  const historyPanel =
    $("historyPanel");

  const signalsPanel =
    $("signalsPanel");

  const supportPanel =
    $("supportPanel");

  if (payPanel) {
    payPanel.classList.remove(
      "hidden"
    );
  }

  if (approvedNotice) {
    approvedNotice.classList.add(
      "hidden"
    );
  }

  [
    aiPanel,
    historyPanel,
    signalsPanel,
    supportPanel
  ].forEach(
    (element) => {

      if (element) {
        element.classList.add(
          "hidden"
        );
      }

    }
  );


  const lockNotice =
    $("paymentLockNotice");

  if (lockNotice) {

    const language =
      currentLanguage();

    let message = "";

    if (
      paymentStatus ===
      "pending"
    ) {

      if (
        language === "en"
      ) {

        message =
          "Your payment receipt has been submitted and is waiting for administrator approval.";

      } else if (
        language === "ar"
      ) {

        message =
          "تم إرسال إيصال الدفع الخاص بك وهو بانتظار موافقة الإدارة.";

      } else {

        message =
          "رسید پرداخت شما ارسال شده و منتظر تأیید مدیر است.";

      }

    } else if (
      paymentStatus ===
      "rejected"
    ) {

      if (
        language === "en"
      ) {

        message =
          "Your previous payment request was rejected. Please submit a new valid payment receipt.";

      } else if (
        language === "ar"
      ) {

        message =
          "تم رفض طلب الدفع السابق. يرجى إرسال إيصال دفع صالح جديد.";

      } else {

        message =
          "درخواست پرداخت قبلی شما رد شده است. لطفاً رسید معتبر جدید ارسال کنید.";

      }

    } else {

      if (
        language === "en"
      ) {

        message =
          "Complete the payment and submit your receipt. Your account will remain locked until approval.";

      } else if (
        language === "ar"
      ) {

        message =
          "أكمل الدفع وأرسل الإيصال. سيبقى حسابك مقفلاً حتى الموافقة.";

      } else {

        message =
          "پرداخت را انجام دهید و رسید را ارسال کنید. حساب شما تا زمان تأیید قفل خواهد بود.";

      }

    }

    lockNotice.textContent =
      message;

  }

}


/* =========================================================
   APPROVED STATE
========================================================= */

function renderApprovedState() {

  const payPanel =
    $("payPanel");

  const approvedNotice =
    $("approvedNotice");

  const aiPanel =
    $("aiPanel");

  const historyPanel =
    $("historyPanel");

  const signalsPanel =
    $("signalsPanel");

  const supportPanel =
    $("supportPanel");


  /*
    Approved users must never see
    payment methods again.
  */

  if (payPanel) {
    payPanel.classList.add(
      "hidden"
    );
  }

  if (approvedNotice) {
    approvedNotice.classList.remove(
      "hidden"
    );
  }

  if (aiPanel) {
    aiPanel.classList.remove(
      "hidden"
    );
  }

  if (historyPanel) {
    historyPanel.classList.remove(
      "hidden"
    );
  }

  if (signalsPanel) {
    signalsPanel.classList.remove(
      "hidden"
    );
  }

  if (supportPanel) {
    supportPanel.classList.remove(
      "hidden"
    );
  }


  const notice =
    $("approvedNoticeText");

  if (notice) {

    const language =
      currentLanguage();

    if (
      language === "en"
    ) {

      notice.textContent =
        "Your payment has been approved. Payment options are no longer displayed because your account already has access.";

    } else if (
      language === "ar"
    ) {

      notice.textContent =
        "تمت الموافقة على دفعتك. لن تظهر خيارات الدفع مرة أخرى لأن حسابك لديه صلاحية الوصول.";

    } else {

      notice.textContent =
        "پرداخت شما تأیید شده است. چون حساب شما دسترسی دارد، گزینه‌های پرداخت دیگر نمایش داده نمی‌شوند.";

    }

  }

}


/* =========================================================
   ACCESS
========================================================= */

async function refreshAccess() {

  if (!currentUser) {
    return;
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


    currentUser.approved =
      Boolean(
        data.approved ??
        currentUser.approved
      );


    renderStatus();


    if (
      currentUser.approved
    ) {

      renderApprovedState();

      stopAccessPolling();

      await loadHistory();
      await loadSignals();

    } else {

      renderLockedState(
        data.paymentStatus
      );

      startAccessPolling();

    }

  } catch (error) {

    console.error(
      "ACCESS ERROR",
      error
    );

  }

}


/* =========================================================
   ACCESS POLLING
========================================================= */

function startAccessPolling() {

  if (
    accessPollTimer
  ) {
    return;
  }

  accessPollTimer =
    setInterval(
      async () => {

        if (
          !currentUser ||
          currentUser.approved
        ) {

          stopAccessPolling();
          return;

        }

        await refreshAccess();

      },
      15000
    );

}


function stopAccessPolling() {

  if (
    accessPollTimer
  ) {

    clearInterval(
      accessPollTimer
    );

    accessPollTimer =
      null;

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function login(
  event
) {

  event.preventDefault();

  authMessage("");

  const email =
    $("loginEmail")
      ?.value
      .trim();

  const password =
    $("loginPass")
      ?.value || "";


  if (
    !email ||
    !password
  ) {

    authMessage(
      currentLanguage() === "en"
        ? "Email and password are required."
        : currentLanguage() === "ar"
          ? "البريد الإلكتروني وكلمة المرور مطلوبان."
          : "ایمیل و رمز عبور الزامی است."
    );

    return;

  }


  const button =
    $("loginForm")
      ?.querySelector(
        "button[type='submit']"
      );

  if (button) {
    button.disabled =
      true;
  }


  try {

    const data =
      await api(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );


    currentUser =
      data.user ||
      null;


    if (!currentUser) {

      throw new Error(
        "Login succeeded but user data was not returned."
      );

    }


    authMessage("");

    await showDashboard();

    await refreshAccess();


  } catch (error) {

    authMessage(
      error.message
    );

  } finally {

    if (button) {
      button.disabled =
        false;
    }

  }

}


/* =========================================================
   REGISTER
========================================================= */

async function register(
  event
) {

  event.preventDefault();

  authMessage("");

  const name =
    $("regName")
      ?.value
      .trim();

  const email =
    $("regEmail")
      ?.value
      .trim();

  const password =
    $("regPass")
      ?.value || "";


  if (
    !name ||
    !email ||
    !password
  ) {

    authMessage(
      currentLanguage() === "en"
        ? "All fields are required."
        : currentLanguage() === "ar"
          ? "جميع الحقول مطلوبة."
          : "تمام بخش‌ها الزامی است."
    );

    return;

  }


  if (
    password.length < 6
  ) {

    authMessage(
      currentLanguage() === "en"
        ? "Password must be at least 6 characters."
        : currentLanguage() === "ar"
          ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
          : "رمز عبور باید حداقل ۶ کاراکتر باشد."
    );

    return;

  }


  const button =
    $("registerForm")
      ?.querySelector(
        "button[type='submit']"
      );

  if (button) {
    button.disabled =
      true;
  }


  try {

    const data =
      await api(
        "/api/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name,
              email,
              password
            })
        }
      );


    currentUser =
      data.user ||
      null;


    if (!currentUser) {

      throw new Error(
        "Account created but user data was not returned."
      );

    }


    authMessage("");

    await showDashboard();

    await refreshAccess();


  } catch (error) {

    authMessage(
      error.message
    );

  } finally {

    if (button) {
      button.disabled =
        false;
    }

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  stopAccessPolling();

  try {

    await api(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch (_) {}

  currentUser =
    null;

  selectedChartFile =
    null;

  const dashboard =
    $("dashboard");

  const auth =
    $("auth");

  if (dashboard) {
    dashboard.classList.add(
      "hidden"
    );
  }

  if (auth) {
    auth.classList.remove(
      "hidden"
    );
  }

  showAuthTab("login");

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

async function showDashboard() {

  const auth =
    $("auth");

  const dashboard =
    $("dashboard");

  if (auth) {
    auth.classList.add(
      "hidden"
    );
  }

  if (dashboard) {
    dashboard.classList.remove(
      "hidden"
    );
  }

  renderStatus();

}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function selectPaymentMethod(
  method
) {

  if (
    currentUser?.approved
  ) {
    return;
  }

  if (
    method !== "hesabpay" &&
    method !== "binance"
  ) {
    return;
  }

  selectedPaymentMethod =
    method;


  document
    .querySelectorAll(
      ".pay[data-method]"
    )
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.method ===
            method
        );

      }
    );


  renderPaymentDetails();

}


/* =========================================================
   PAYMENT
========================================================= */

async function submitPayment(
  event
) {

  event.preventDefault();

  if (
    paymentSubmitting
  ) {
    return;
  }

  if (
    !currentUser
  ) {
    return;
  }

  if (
    currentUser.approved
  ) {

    return;

  }


  const reference =
    $("reference")
      ?.value
      .trim();

  const receipt =
    $("receipt")
      ?.files?.[0];


  if (!reference) {

    $("payMsg").textContent =
      currentLanguage() === "en"
        ? "Payment reference is required."
        : currentLanguage() === "ar"
          ? "رقم مرجع الدفع مطلوب."
          : "شماره تراکنش الزامی است.";

    return;

  }


  if (!receipt) {

    $("payMsg").textContent =
      currentLanguage() === "en"
        ? "Please select your payment receipt."
        : currentLanguage() === "ar"
          ? "يرجى اختيار إيصال الدفع."
          : "لطفاً رسید پرداخت خود را انتخاب کنید.";

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
      receipt.type
    )
  ) {

    $("payMsg").textContent =
      currentLanguage() === "en"
        ? "Only PNG, JPG, WEBP and GIF images are allowed."
        : currentLanguage() === "ar"
          ? "يسمح فقط بصور PNG وJPG وWEBP وGIF."
          : "فقط تصاویر PNG، JPG، WEBP و GIF مجاز است.";

    return;

  }


  if (
    receipt.size >
    5 * 1024 * 1024
  ) {

    $("payMsg").textContent =
      currentLanguage() === "en"
        ? "The receipt must be smaller than 5 MB."
        : currentLanguage() === "ar"
          ? "يجب أن يكون الإيصال أقل من 5 ميجابايت."
          : "حجم رسید باید کمتر از ۵ مگابایت باشد.";

    return;

  }


  paymentSubmitting =
    true;


  const button =
    $("paymentForm")
      ?.querySelector(
        "button[type='submit']"
      );

  if (button) {
    button.disabled =
      true;
  }


  $("payMsg").textContent =
    currentLanguage() === "en"
      ? "Submitting payment receipt..."
      : currentLanguage() === "ar"
        ? "جارٍ إرسال إيصال الدفع..."
        : "در حال ارسال رسید پرداخت...";


  try {

    const formData =
      new FormData();

    formData.append(
      "method",
      selectedPaymentMethod
    );

    formData.append(
      "reference",
      reference
    );

    formData.append(
      "receipt",
      receipt
    );


    const data =
      await api(
        "/api/payment",
        {
          method: "POST",
          body: formData
        }
      );


    $("payMsg").textContent =
      data.message ||
      (
        currentLanguage() === "en"
          ? "Payment receipt submitted successfully."
          : currentLanguage() === "ar"
            ? "تم إرسال إيصال الدفع بنجاح."
            : "رسید پرداخت با موفقیت ارسال شد."
      );


    await refreshAccess();


  } catch (error) {

    $("payMsg").textContent =
      error.message;

  } finally {

    paymentSubmitting =
      false;

    if (button) {
      button.disabled =
        false;
    }

  }

}


/* =========================================================
   TIMEFRAME
========================================================= */

function selectTimeframe(
  timeframe
) {

  if (
    !["1m", "5m", "15m"]
      .includes(timeframe)
  ) {
    return;
  }

  selectedTimeframe =
    timeframe;


  const hidden =
    $("selectedTimeframe");

  if (hidden) {
    hidden.value =
      timeframe;
  }


  document
    .querySelectorAll(
      ".timeframeOption"
    )
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.timeframe ===
            timeframe
        );

      }
    );

}


/* =========================================================
   CHART FILE
========================================================= */

function handleChartFile(
  event
) {

  const file =
    event.target.files?.[0];


  selectedChartFile =
    null;


  if (!file) {
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

    $("chartMsg").textContent =
      currentLanguage() === "en"
        ? "Only PNG, JPG, WEBP and GIF images are allowed."
        : currentLanguage() === "ar"
          ? "يسمح فقط بصور PNG وJPG وWEBP وGIF."
          : "فقط تصاویر PNG، JPG، WEBP و GIF مجاز است.";

    event.target.value = "";

    return;

  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    $("chartMsg").textContent =
      currentLanguage() === "en"
        ? "Chart image must be smaller than 5 MB."
        : currentLanguage() === "ar"
          ? "يجب أن تكون صورة المخطط أقل من 5 ميجابايت."
          : "حجم تصویر نمودار باید کمتر از ۵ مگابایت باشد.";

    event.target.value = "";

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

    wrap.classList.remove(
      "hidden"
    );

    preview.onload =
      () => {

        URL.revokeObjectURL(
          url
        );

      };

  }


  $("chartMsg").textContent =
    file.name;

}


/* =========================================================
   ANALYZE CHART
========================================================= */

async function analyzeChart(
  event
) {

  event.preventDefault();

  if (
    analysisSubmitting
  ) {
    return;
  }

  if (
    !currentUser ||
    !currentUser.approved
  ) {

    return;

  }


  const file =
    selectedChartFile ||
    $("chartFile")
      ?.files?.[0];


  if (!file) {

    $("chartMsg").textContent =
      currentLanguage() === "en"
        ? "Please select a chart image first."
        : currentLanguage() === "ar"
          ? "يرجى اختيار صورة المخطط أولاً."
          : "ابتدا تصویر نمودار را انتخاب کنید.";

    return;

  }


  analysisSubmitting =
    true;


  const button =
    $("analyzeBtn");

  if (button) {
    button.disabled =
      true;
  }


  $("chartMsg").textContent =
    currentLanguage() === "en"
      ? "AI is analyzing your chart..."
      : currentLanguage() === "ar"
        ? "يقوم الذكاء الاصطناعي بتحليل المخطط..."
        : "هوش مصنوعی در حال تحلیل نمودار شما است...";


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
    currentLanguage()
  );


  try {

    const data =
      await api(
        "/api/analyze-chart",
        {
          method: "POST",
          body: formData
        }
      );


    renderAnalysis(
      data.analysis
    );


    $("chartMsg").textContent =
      currentLanguage() === "en"
        ? "Analysis completed."
        : currentLanguage() === "ar"
          ? "اكتمل التحليل."
          : "تحلیل با موفقیت انجام شد.";


    await loadHistory();


  } catch (error) {

    $("chartMsg").textContent =
      error.message;

  } finally {

    analysisSubmitting =
      false;

    if (button) {
      button.disabled =
        false;
    }

  }

}


/* =========================================================
   RENDER ANALYSIS
========================================================= */

function renderAnalysis(
  result
) {

  const container =
    $("analysisResult");

  if (!container) {
    return;
  }


  const direction =
    textValue(
      result?.direction,
      "WAIT"
    ).toUpperCase();


  const directionCard =
    $("directionCard");

  if (directionCard) {

    directionCard.classList.remove(
      "buy",
      "sell",
      "wait"
    );


    if (
      direction === "BUY"
    ) {

      directionCard.classList.add(
        "buy"
      );

    } else if (
      direction === "SELL"
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


  $("analysisDirection").textContent =
    direction;


  $("analysisSymbol").textContent =
    textValue(
      result?.symbol,
      "XAUUSD"
    );


  $("analysisTimeframe").textContent =
    timeframeLabel(
      result?.timeframe ||
      selectedTimeframe
    );


  $("analysisEntry").textContent =
    textValue(
      result?.entry,
      "WAIT"
    );


  $("analysisSL").textContent =
    textValue(
      result?.sl,
      "WAIT"
    );


  $("analysisTP1").textContent =
    textValue(
      result?.tp1,
      "WAIT"
    );


  $("analysisTP2").textContent =
    textValue(
      result?.tp2,
      "WAIT"
    );


  $("analysisTP3").textContent =
    textValue(
      result?.tp3,
      "WAIT"
    );


  $("analysisTP4").textContent =
    textValue(
      result?.tp4,
      "WAIT"
    );


  $("analysisTP5").textContent =
    textValue(
      result?.tp5,
      "WAIT"
    );


  $("analysisConfidence").textContent =
    textValue(
      result?.confidence,
      "Low"
    );


  $("analysisTextContent").textContent =
    textValue(
      result?.analysis,
      ""
    );


  $("analysisWarning").textContent =
    textValue(
      result?.warning,
      currentLanguage() === "en"
        ? "Trading involves risk. Use proper risk management."
        : currentLanguage() === "ar"
          ? "التداول ينطوي على مخاطر. استخدم إدارة مناسبة للمخاطر."
          : "معامله‌گری دارای ریسک است. مدیریت ریسک مناسب را رعایت کنید."
    );


  container.classList.remove(
    "hidden"
  );


  container.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   HISTORY
========================================================= */

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


    const analyses =
      Array.isArray(
        data.analyses
      )
        ? data.analyses
        : [];


    const container =
      $("analysisHistory");

    if (!container) {
      return;
    }


    if (!analyses.length) {

      container.innerHTML =
        `<div class="empty">${
          currentLanguage() === "en"
            ? "No previous analyses yet."
            : currentLanguage() === "ar"
              ? "لا توجد تحليلات سابقة."
              : "هنوز تحلیلی در تاریخچه وجود ندارد."
        }</div>`;

      return;

    }


    container.innerHTML =
      analyses.map(
        (item) => {

          return `
            <div class="historyItem">

              <div class="historyTop">

                <strong>
                  ${escapeHtml(
                    textValue(
                      item.direction,
                      "WAIT"
                    )
                  )}
                </strong>

                <small>
                  ${escapeHtml(
                    formatDate(
                      item.created_at
                    )
                  )}
                </small>

              </div>

              <div class="historyLevels">

                <span>
                  ${escapeHtml(
                    item.symbol ||
                    "XAUUSD"
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    timeframeLabel(
                      item.timeframe
                    )
                  )}
                </span>

                <span>
                  Entry:
                  ${escapeHtml(
                    textValue(
                      item.entry,
                      "WAIT"
                    )
                  )}
                </span>

                <span>
                  SL:
                  ${escapeHtml(
                    textValue(
                      item.sl,
                      "WAIT"
                    )
                  )}
                </span>

              </div>

              <p>
                ${escapeHtml(
                  textValue(
                    item.analysis,
                    ""
                  )
                )}
              </p>

            </div>
          `;

        }
      ).join("");


  } catch (error) {

    console.error(
      "HISTORY ERROR",
      error
    );

  }

}


/* =========================================================
   SIGNALS
========================================================= */

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


    const signals =
      Array.isArray(
        data.signals
      )
        ? data.signals
        : [];


    const container =
      $("signals");

    if (!container) {
      return;
    }


    if (!signals.length) {

      container.innerHTML =
        `<div class="empty">${
          currentLanguage() === "en"
            ? "No private signals yet."
            : currentLanguage() === "ar"
              ? "لا توجد إشارات خاصة حتى الآن."
              : "هنوز سیگنال خصوصی منتشر نشده است."
        }</div>`;

      return;

    }


    container.innerHTML =
      signals.map(
        (signal) => {

          return `
            <div class="signal">

              <div class="signalTitle">
                ${escapeHtml(
                  signal.title
                )}
              </div>

              <small>
                ${escapeHtml(
                  formatDate(
                    signal.created_at
                  )
                )}
              </small>

              <p>
                ${escapeHtml(
                  signal.body
                ).replace(
                  /\n/g,
                  "<br>"
                )}
              </p>

            </div>
          `;

        }
      ).join("");


  } catch (error) {

    console.error(
      "SIGNALS ERROR",
      error
    );

  }

}


/* =========================================================
   SUPPORT
========================================================= */

async function sendSupport() {

  if (
    supportSubmitting
  ) {
    return;
  }

  if (
    !currentUser ||
    !currentUser.approved
  ) {
    return;
  }


  const textarea =
    $("supportText");

  const message =
    textarea
      ?.value
      .trim();


  if (!message) {

    $("supportMsg").textContent =
      currentLanguage() === "en"
        ? "Please write a message."
        : currentLanguage() === "ar"
          ? "يرجى كتابة رسالة."
          : "لطفاً پیام خود را بنویسید.";

    return;

  }


  supportSubmitting =
    true;


  const button =
    $("supportBtn");

  if (button) {
    button.disabled =
      true;
  }


  try {

    const data =
      await api(
        "/api/support",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              message
            })
        }
      );


    if (textarea) {
      textarea.value =
        "";
    }


    $("supportMsg").textContent =
      data.message ||
      (
        currentLanguage() === "en"
          ? "Your message has been sent."
          : currentLanguage() === "ar"
            ? "تم إرسال رسالتك."
            : "پیام شما ارسال شد."
      );


  } catch (error) {

    $("supportMsg").textContent =
      error.message;

  } finally {

    supportSubmitting =
      false;

    if (button) {
      button.disabled =
        false;
    }

  }

}


/* =========================================================
   RESTORE SESSION
========================================================= */

async function restoreSession() {

  try {

    const data =
      await api(
        "/api/me"
      );


    if (
      data.loggedIn &&
      data.user
    ) {

      currentUser =
        data.user;

      await showDashboard();

      await refreshAccess();

      return;

    }


    currentUser =
      null;

    const dashboard =
      $("dashboard");

    const auth =
      $("auth");

    if (dashboard) {
      dashboard.classList.add(
        "hidden"
      );
    }

    if (auth) {
      auth.classList.remove(
        "hidden"
      );
    }


  } catch (error) {

    console.error(
      "SESSION ERROR",
      error
    );

  }

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  const language =
    $("lang");

  if (language) {

    language.addEventListener(
      "change",
      () => {

        setLanguage(
          language.value
        );

      }
    );

  }


  document
    .querySelectorAll(
      ".tab[data-tab]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            showAuthTab(
              button.dataset.tab
            );

          }
        );

      }
    );


  const loginForm =
    $("loginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      login
    );

  }


  const registerForm =
    $("registerForm");

  if (registerForm) {

    registerForm.addEventListener(
      "submit",
      register
    );

  }


  const logoutButton =
    $("logout");

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );

  }


  document
    .querySelectorAll(
      ".pay[data-method]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            selectPaymentMethod(
              button.dataset.method
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".timeframeOption"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            selectTimeframe(
              button.dataset.timeframe
            );

          }
        );

      }
    );


  const paymentForm =
    $("paymentForm");

  if (paymentForm) {

    paymentForm.addEventListener(
      "submit",
      submitPayment
    );

  }


  const receipt =
    $("receipt");

  if (receipt) {

    receipt.addEventListener(
      "change",
      () => {

        const file =
          receipt.files?.[0];

        if (
          file &&
          file.size >
            5 * 1024 * 1024
        ) {

          $("payMsg").textContent =
            currentLanguage() === "en"
              ? "Receipt is too large. Maximum size is 5 MB."
              : currentLanguage() === "ar"
                ? "الإيصال كبير جداً. الحد الأقصى 5 ميجابايت."
                : "رسید بسیار بزرگ است. حداکثر حجم ۵ مگابایت است.";

          receipt.value =
            "";

        }

      }
    );

  }


  const chartFile =
    $("chartFile");

  if (chartFile) {

    chartFile.addEventListener(
      "change",
      handleChartFile
    );

  }


  const chartForm =
    $("chartForm");

  if (chartForm) {

    chartForm.addEventListener(
      "submit",
      analyzeChart
    );

  }


  const supportButton =
    $("supportBtn");

  if (supportButton) {

    supportButton.addEventListener(
      "click",
      sendSupport
    );

  }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setLanguage(
      getLanguage()
    );

    showAuthTab(
      "login"
    );

    selectPaymentMethod(
      "hesabpay"
    );

    selectTimeframe(
      "1m"
    );

    bindEvents();

    await restoreSession();

  }
);
