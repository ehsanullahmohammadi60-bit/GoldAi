const $ = (id) => document.getElementById(id);

let currentUser = null;
let selectedChartFile = null;

/* =========================
   Helpers
========================= */

function showMessage(id, text, type = "") {
  const el = $(id);
  if (!el) return;

  el.textContent = text || "";
  el.className = type ? `message ${type}` : "message";
}

async function api(url, options = {}) {
  const response = await fetch(url, options);

  let data = {};
  try {
    data = await response.json();
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

function textValue(value, fallback = "صبر کن") {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}

/*
  AI ممکن است بعضی فیلدها را با نام‌های مختلف برگرداند.
  این تابع همه نام‌های رایج را بررسی می‌کند.
*/
function getField(obj, names, fallback = "صبر کن") {
  if (!obj || typeof obj !== "object") {
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

/* =========================
   Auth
========================= */

async function registerUser(event) {
  event.preventDefault();

  const name = $("registerName")?.value.trim();
  const email = $("registerEmail")?.value.trim();
  const password = $("registerPassword")?.value;

  if (!name || !email || !password) {
    showMessage("authMsg", "لطفاً تمام معلومات را وارد کنید.", "error");
    return;
  }

  try {
    showMessage("authMsg", "در حال ساخت حساب...");

    const data = await api("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    if (data.user) {
      currentUser = data.user;
    }

    showMessage(
      "authMsg",
      data.message || "حساب با موفقیت ساخته شد.",
      "success"
    );

    await load();
  } catch (error) {
    showMessage("authMsg", error.message, "error");
  }
}

async function loginUser(event) {
  event.preventDefault();

  const email = $("loginEmail")?.value.trim();
  const password = $("loginPassword")?.value;

  if (!email || !password) {
    showMessage("authMsg", "ایمیل و رمز عبور را وارد کنید.", "error");
    return;
  }

  try {
    showMessage("authMsg", "در حال ورود...");

    const data = await api("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    currentUser = data.user || null;

    showMessage(
      "authMsg",
      data.message || "ورود موفق بود.",
      "success"
    );

    await load();
  } catch (error) {
    showMessage("authMsg", error.message, "error");
  }
}

async function logoutUser() {
  try {
    await api("/api/logout", {
      method: "POST"
    });
  } catch (_) {}

  currentUser = null;

  const authSection = $("authSection");
  const dashboard = $("dashboard");

  if (authSection) authSection.style.display = "";
  if (dashboard) dashboard.style.display = "none";
}

/* =========================
   Payment
========================= */

async function submitPayment(event) {
  event.preventDefault();

  const reference =
    $("paymentReference")?.value.trim() ||
    $("reference")?.value.trim() ||
    "";

  const method =
    $("paymentMethod")?.value ||
    $("method")?.value ||
    "manual";

  const file =
    $("receipt")?.files?.[0] ||
    $("paymentReceipt")?.files?.[0];

  if (!reference) {
    showMessage(
      "paymentMsg",
      "لطفاً شماره یا Reference پرداخت را وارد کنید.",
      "error"
    );
    return;
  }

  if (!file) {
    showMessage(
      "paymentMsg",
      "لطفاً رسید پرداخت را انتخاب کنید.",
      "error"
    );
    return;
  }

  try {
    showMessage("paymentMsg", "در حال ارسال رسید...");

    const formData = new FormData();

    formData.append("reference", reference);
    formData.append("method", method);
    formData.append("receipt", file);

    const data = await api("/api/payment", {
      method: "POST",
      body: formData
    });

    showMessage(
      "paymentMsg",
      data.message || "رسید ارسال شد و منتظر تأیید ادمین است.",
      "success"
    );

    await load();
  } catch (error) {
    showMessage("paymentMsg", error.message, "error");
  }
}

/* =========================
   Support
========================= */

async function sendSupport(event) {
  event.preventDefault();

  const message =
    $("supportMessage")?.value.trim() ||
    $("message")?.value.trim() ||
    "";

  if (!message) {
    showMessage(
      "supportMsg",
      "لطفاً پیام خود را بنویسید.",
      "error"
    );
    return;
  }

  try {
    showMessage("supportMsg", "در حال ارسال...");

    const data = await api("/api/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message
      })
    });

    showMessage(
      "supportMsg",
      data.message || "پیام شما ارسال شد.",
      "success"
    );

    if ($("supportMessage")) {
      $("supportMessage").value = "";
    }
  } catch (error) {
    showMessage("supportMsg", error.message, "error");
  }
}

/* =========================
   Chart Preview
========================= */

function previewChart(event) {
  const file = event.target.files?.[0];

  selectedChartFile = file || null;

  const previewWrap = $("chartPreviewWrap");
  const preview = $("chartPreview");

  if (!file) {
    if (previewWrap) previewWrap.style.display = "none";
    return;
  }

  if (!file.type.startsWith("image/")) {
    selectedChartFile = null;

    if (previewWrap) previewWrap.style.display = "none";

    showMessage(
      "chartMsg",
      "لطفاً فقط فایل تصویری چارت را انتخاب کنید.",
      "error"
    );

    return;
  }

  if (preview) {
    preview.src = URL.createObjectURL(file);
  }

  if (previewWrap) {
    previewWrap.style.display = "block";
  }

  showMessage("chartMsg", "");
}

/* =========================
   AI Chart Analysis
========================= */

async function analyzeChart(event) {
  event.preventDefault();

  const file =
    selectedChartFile ||
    $("chartFile")?.files?.[0];

  if (!file) {
    showMessage(
      "chartMsg",
      "لطفاً اول عکس چارت XAUUSD را انتخاب کنید.",
      "error"
    );
    return;
  }

  const button = $("analyzeBtn");

  if (button) {
    button.disabled = true;
    button.dataset.oldText = button.textContent;
    button.textContent = "در حال تحلیل...";
  }

  showMessage(
    "chartMsg",
    "هوش مصنوعی در حال تحلیل چارت است..."
  );

  /*
    قبل از دریافت نتیجه، کارت نتیجه را پاک می‌کنیم
    تا اطلاعات تحلیل قبلی نمایش داده نشود.
  */
  resetAnalysisResult();

  try {
    const formData = new FormData();

    formData.append("chart", file);

    const data = await api("/api/analyze-chart", {
      method: "POST",
      body: formData
    });

    console.log("FULL AI RESPONSE:", data);

    /*
      Backend ممکن است پاسخ را در یکی از این قسمت‌ها قرار داده باشد.
    */
    let analysis =
      data.analysis ||
      data.result ||
      data.signal ||
      data.data ||
      data;

    /*
      اگر analysis به شکل string باشد،
      آن را به JSON تبدیل می‌کنیم.
    */
    if (typeof analysis === "string") {
      try {
        analysis = JSON.parse(analysis);
      } catch (_) {
        /*
          اگر JSON نبود، متن را به عنوان متن تحلیل نگه می‌داریم.
        */
        analysis = {
          analysis: analysis
        };
      }
    }

    /*
      بعضی APIها پاسخ را داخل result.analysis می‌فرستند.
    */
    if (
      analysis &&
      typeof analysis === "object" &&
      analysis.analysis &&
      typeof analysis.analysis === "object"
    ) {
      analysis = analysis.analysis;
    }

    console.log("PARSED AI ANALYSIS:", analysis);

    renderAnalysis(analysis);

    showMessage(
      "chartMsg",
      data.message || "تحلیل چارت با موفقیت انجام شد.",
      "success"
    );

    await loadHistory();

  } catch (error) {
    console.error("AI ANALYSIS ERROR:", error);

    showMessage(
      "chartMsg",
      `خطا در تحلیل: ${error.message}`,
      "error"
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        button.dataset.oldText || "تحلیل نمودار با هوش مصنوعی";
    }
  }
}

/* =========================
   Reset Result
========================= */

function resetAnalysisResult() {
  const ids = [
    "analysisDirection",
    "analysisSymbol",
    "analysisTimeframe",
    "analysisEntry",
    "analysisSL",
    "analysisTP1",
    "analysisTP2",
    "analysisTP3",
    "analysisTP4",
    "analysisTP5",
    "analysisConfidence",
    "analysisTextContent",
    "analysisWarning"
  ];

  ids.forEach((id) => {
    const el = $(id);
    if (el) {
      el.textContent = "صبر کن";
    }
  });

  const result = $("analysisResult");

  if (result) {
    result.style.display = "block";
  }
}

/* =========================
   Render AI Result
========================= */

function renderAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    showMessage(
      "chartMsg",
      "پاسخ هوش مصنوعی قابل خواندن نبود.",
      "error"
    );
    return;
  }

  /*
    DEBUG:
    تمام کلیدهای پاسخ در Console دیده می‌شوند.
  */
  console.log(
    "AI KEYS:",
    Object.keys(analysis)
  );

  /*
    Direction
  */
  const direction = getField(
    analysis,
    [
      "direction",
      "signal",
      "trade_direction",
      "tradeDirection",
      "action",
      "side"
    ]
  );

  /*
    Symbol
  */
  const symbol = getField(
    analysis,
    [
      "symbol",
      "pair",
      "instrument"
    ],
    "XAUUSD"
  );

  /*
    Timeframe
  */
  const timeframe = getField(
    analysis,
    [
      "timeframe",
      "time_frame",
      "interval",
      "chart_timeframe"
    ]
  );

  /*
    Entry
  */
  const entry = getField(
    analysis,
    [
      "entry",
      "entry_price",
      "entryPrice",
      "entry_point",
      "entryPoint"
    ]
  );

  /*
    Stop Loss
  */
  const stopLoss = getField(
    analysis,
    [
      "sl",
      "stop_loss",
      "stopLoss",
      "stoploss"
    ]
  );

  /*
    Take Profits
  */

  const tp1 = getField(
    analysis,
    [
      "tp1",
      "TP1",
      "tp_1",
      "take_profit_1",
      "takeProfit1"
    ]
  );

  const tp2 = getField(
    analysis,
    [
      "tp2",
      "TP2",
      "tp_2",
      "take_profit_2",
      "takeProfit2"
    ]
  );

  const tp3 = getField(
    analysis,
    [
      "tp3",
      "TP3",
      "tp_3",
      "take_profit_3",
      "takeProfit3"
    ]
  );

  const tp4 = getField(
    analysis,
    [
      "tp4",
      "TP4",
      "tp_4",
      "take_profit_4",
      "takeProfit4"
    ]
  );

  const tp5 = getField(
    analysis,
    [
      "tp5",
      "TP5",
      "tp_5",
      "take_profit_5",
      "takeProfit5"
    ]
  );

  /*
    Confidence
  */
  const confidence = getField(
    analysis,
    [
      "confidence",
      "confidence_level",
      "confidenceLevel"
    ],
    "کم"
  );

  /*
    Analysis text
  */
  const analysisText = getField(
    analysis,
    [
      "analysis",
      "commentary",
      "reason",
      "reasoning",
      "explanation",
      "market_analysis"
    ],
    ""
  );

  /*
    Warning
  */
  const warning = getField(
    analysis,
    [
      "warning",
      "risk_warning",
      "riskWarning"
    ],
    "بازار فارکس دارای ریسک است."
  );

  /*
    حالا واقعاً فیلدها را داخل صفحه می‌گذاریم.
  */

  setText("analysisDirection", direction);
  setText("analysisSymbol", symbol);
  setText("analysisTimeframe", timeframe);
  setText("analysisEntry", entry);
  setText("analysisSL", stopLoss);

  setText("analysisTP1", tp1);
  setText("analysisTP2", tp2);
  setText("analysisTP3", tp3);
  setText("analysisTP4", tp4);
  setText("analysisTP5", tp5);

  setText("analysisConfidence", confidence);
  setText("analysisTextContent", analysisText);
  setText("analysisWarning", warning);

  /*
    تغییر رنگ/کلاس BUY و SELL
  */
  const directionCard = $("directionCard");

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

    if (normalized.includes("BUY")) {
      directionCard.classList.add("buy");
    } else if (normalized.includes("SELL")) {
      directionCard.classList.add("sell");
    } else {
      directionCard.classList.add("wait");
    }
  }

  const result = $("analysisResult");

  if (result) {
    result.style.display = "block";
  }
}

/* =========================
   Set Text
========================= */

function setText(id, value) {
  const el = $(id);

  if (!el) return;

  el.textContent = textValue(value);
}

/* =========================
   Analysis History
========================= */

async function loadHistory() {
  const historyContainer = $("analysisHistory");

  if (!historyContainer) return;

  try {
    const data = await api("/api/analyses");

    const items =
      data.analyses ||
      data.history ||
      data.data ||
      [];

    if (!Array.isArray(items) || items.length === 0) {
      historyContainer.innerHTML =
        "<p>هنوز تحلیل ذخیره‌شده‌ای وجود ندارد.</p>";
      return;
    }

    historyContainer.innerHTML = items
      .map((item) => {
        let analysis = item.analysis || item.result || item;

        if (typeof analysis === "string") {
          try {
            analysis = JSON.parse(analysis);
          } catch (_) {
            analysis = {};
          }
        }

        const direction = getField(
          analysis,
          [
            "direction",
            "signal",
            "trade_direction",
            "action",
            "side"
          ],
          "WAIT"
        );

        const entry = getField(
          analysis,
          [
            "entry",
            "entry_price",
            "entryPrice"
          ]
        );

        const sl = getField(
          analysis,
          [
            "sl",
            "stop_loss",
            "stopLoss"
          ]
        );

        const tp1 = getField(
          analysis,
          [
            "tp1",
            "TP1",
            "take_profit_1"
          ]
        );

        const tp2 = getField(
          analysis,
          [
            "tp2",
            "TP2",
            "take_profit_2"
          ]
        );

        const tp3 = getField(
          analysis,
          [
            "tp3",
            "TP3",
            "take_profit_3"
          ]
        );

        return `
          <div class="history-item">
            <div>
              <strong>${escapeHtml(direction)}</strong>
            </div>

            <div>
              Entry:
              ${escapeHtml(entry)}
            </div>

            <div>
              SL:
              ${escapeHtml(sl)}
            </div>

            <div>
              TP1:
              ${escapeHtml(tp1)}
            </div>

            <div>
              TP2:
              ${escapeHtml(tp2)}
            </div>

            <div>
              TP3:
              ${escapeHtml(tp3)}
            </div>
          </div>
        `;
      })
      .join("");

  } catch (error) {
    console.error("HISTORY ERROR:", error);

    historyContainer.innerHTML =
      "<p>تاریخچه تحلیل فعلاً قابل دریافت نیست.</p>";
  }
}

/* =========================
   Signals
========================= */

async function loadSignals() {
  const container = $("signals");

  if (!container) return;

  try {
    const data = await api("/api/signals");

    const signals =
      data.signals ||
      data.data ||
      [];

    if (!Array.isArray(signals) || signals.length === 0) {
      container.innerHTML =
        "<p>هنوز سیگنالی منتشر نشده است.</p>";
      return;
    }

    container.innerHTML = signals
      .map((signal) => `
        <div class="signal-item">
          <h3>
            ${escapeHtml(signal.title || "XAUUSD Signal")}
          </h3>

          <p>
            ${escapeHtml(signal.content || "")}
          </p>
        </div>
      `)
      .join("");

  } catch (error) {
    console.error("SIGNALS ERROR:", error);

    container.innerHTML =
      "<p>سیگنال‌ها فعلاً قابل دریافت نیستند.</p>";
  }
}

/* =========================
   Main Load
========================= */

async function load() {
  try {
    const data = await api("/api/me");

    currentUser = data.user || null;

    const authSection = $("authSection");
    const dashboard = $("dashboard");

    if (!currentUser) {
      if (authSection) authSection.style.display = "";
      if (dashboard) dashboard.style.display = "none";
      return;
    }

    if (authSection) authSection.style.display = "none";
    if (dashboard) dashboard.style.display = "block";

    /*
      نام کاربر
    */
    const nameElements = [
      "userName",
      "welcomeName",
      "profileName"
    ];

    nameElements.forEach((id) => {
      const el = $(id);

      if (el && currentUser.name) {
        el.textContent = currentUser.name;
      }
    });

    /*
      وضعیت پرداخت
    */
    const status =
      currentUser.payment_status ||
      currentUser.paymentStatus ||
      currentUser.status ||
      "";

    const approved =
      status === "approved" ||
      currentUser.approved === true ||
      currentUser.isApproved === true;

    /*
      پنل AI فقط برای کاربر تأییدشده
    */
    const aiPanel = $("aiPanel");
    const historyPanel = $("historyPanel");
    const signalsPanel = $("signalsPanel");

    if (approved) {
      if (aiPanel) aiPanel.style.display = "block";
      if (historyPanel) historyPanel.style.display = "block";
      if (signalsPanel) signalsPanel.style.display = "block";

      await Promise.all([
        loadHistory(),
        loadSignals()
      ]);
    } else {
      if (aiPanel) aiPanel.style.display = "none";
      if (historyPanel) historyPanel.style.display = "none";
    }

  } catch (error) {
    console.error("LOAD ERROR:", error);
  }
}

/* =========================
   HTML Escape
========================= */

function escapeHtml(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Event Listeners
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /*
    Register
  */
  const registerForm = $("registerForm");

  if (registerForm) {
    registerForm.addEventListener(
      "submit",
      registerUser
    );
  }

  /*
    Login
  */
  const loginForm = $("loginForm");

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      loginUser
    );
  }

  /*
    Logout
  */
  const logoutBtn = $("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener(
      "click",
      logoutUser
    );
  }

  /*
    Payment
  */
  const paymentForm = $("paymentForm");

  if (paymentForm) {
    paymentForm.addEventListener(
      "submit",
      submitPayment
    );
  }

  /*
    Support
  */
  const supportForm = $("supportForm");

  if (supportForm) {
    supportForm.addEventListener(
      "submit",
      sendSupport
    );
  }

  /*
    Chart file
  */
  const chartFile = $("chartFile");

  if (chartFile) {
    chartFile.addEventListener(
      "change",
      previewChart
    );
  }

  /*
    Chart analysis
  */
  const chartForm = $("chartForm");

  if (chartForm) {
    chartForm.addEventListener(
      "submit",
      analyzeChart
    );
  }

  /*
    Initial load
  */
  load();
});
