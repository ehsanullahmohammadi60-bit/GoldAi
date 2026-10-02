const $ = (id) => document.getElementById(id);

let currentUser = null;
let selectedChartFile = null;

/* =========================
   HELPERS
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
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}

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
   REGISTER
========================= */

async function registerUser(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const nameInput =
    form.querySelector('input[name="name"]') ||
    form.querySelector('input[placeholder*="نام"]') ||
    form.querySelectorAll("input")[0];

  const emailInput =
    form.querySelector('input[type="email"]') ||
    form.querySelector('input[name="email"]');

  const passwordInput =
    form.querySelector('input[type="password"]') ||
    form.querySelector('input[name="password"]');

  const name = nameInput?.value.trim() || "";
  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  if (!name || !email || !password) {
    showMessage(
      "authMsg",
      "لطفاً تمام معلومات را وارد کنید.",
      "error"
    );
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

    currentUser = data.user || null;

    showMessage(
      "authMsg",
      data.message || "حساب با موفقیت ساخته شد.",
      "success"
    );

    await load();

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    showMessage(
      "authMsg",
      error.message,
      "error"
    );
  }
}

/* =========================
   LOGIN
========================= */

async function loginUser(event) {
  event.preventDefault();

  const form = event.currentTarget;

  /*
    مهم:
    این نسخه ایمیل و رمز عبور را مستقیماً
    از خود فرم Login پیدا می‌کند.
    بنابراین وابسته به loginEmail/loginPassword نیست.
  */

  const inputs = Array.from(
    form.querySelectorAll("input")
  );

  const emailInput =
    form.querySelector('input[type="email"]') ||
    form.querySelector('input[name="email"]') ||
    inputs.find((input) =>
      (
        input.name +
        " " +
        input.id +
        " " +
        input.placeholder
      )
        .toLowerCase()
        .includes("email")
    );

  const passwordInput =
    form.querySelector('input[type="password"]') ||
    form.querySelector('input[name="password"]') ||
    inputs.find((input) =>
      (
        input.name +
        " " +
        input.id +
        " " +
        input.placeholder
      )
        .toLowerCase()
        .includes("password")
    );

  const email =
    emailInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";

  console.log("LOGIN FORM:", {
    emailFound: !!emailInput,
    passwordFound: !!passwordInput,
    emailLength: email.length,
    passwordLength: password.length
  });

  if (!email || !password) {
    showMessage(
      "authMsg",
      "ایمیل و رمز عبور را وارد کنید.",
      "error"
    );
    return;
  }

  try {
    showMessage(
      "authMsg",
      "در حال ورود..."
    );

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
    console.error("LOGIN ERROR:", error);

    showMessage(
      "authMsg",
      error.message,
      "error"
    );
  }
}

/* =========================
   LOGOUT
========================= */

async function logoutUser() {
  try {
    await api("/api/logout", {
      method: "POST"
    });
  } catch (_) {}

  currentUser = null;

  const authSection = $("authSection");
  const dashboard = $("dashboard");

  if (authSection) {
    authSection.style.display = "";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }
}

/* =========================
   PAYMENT
========================= */

async function submitPayment(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const referenceInput =
    form.querySelector(
      'input[name="reference"]'
    ) ||
    $("paymentReference") ||
    $("reference");

  const methodInput =
    form.querySelector(
      'select[name="method"]'
    ) ||
    form.querySelector(
      'input[name="method"]'
    ) ||
    $("paymentMethod") ||
    $("method");

  const receiptInput =
    form.querySelector(
      'input[type="file"]'
    ) ||
    $("receipt") ||
    $("paymentReceipt");

  const reference =
    referenceInput?.value.trim() || "";

  const method =
    methodInput?.value || "manual";

  const file =
    receiptInput?.files?.[0];

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
    showMessage(
      "paymentMsg",
      "در حال ارسال رسید..."
    );

    const formData = new FormData();

    formData.append(
      "reference",
      reference
    );

    formData.append(
      "method",
      method
    );

    formData.append(
      "receipt",
      file
    );

    const data = await api(
      "/api/payment",
      {
        method: "POST",
        body: formData
      }
    );

    showMessage(
      "paymentMsg",
      data.message ||
        "رسید ارسال شد و منتظر تأیید ادمین است.",
      "success"
    );

    await load();

  } catch (error) {
    console.error(
      "PAYMENT ERROR:",
      error
    );

    showMessage(
      "paymentMsg",
      error.message,
      "error"
    );
  }
}

/* =========================
   SUPPORT
========================= */

async function sendSupport(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const messageInput =
    form.querySelector(
      "textarea"
    ) ||
    form.querySelector(
      'input[name="message"]'
    ) ||
    $("supportMessage") ||
    $("message");

  const message =
    messageInput?.value.trim() || "";

  if (!message) {
    showMessage(
      "supportMsg",
      "لطفاً پیام خود را بنویسید.",
      "error"
    );
    return;
  }

  try {
    showMessage(
      "supportMsg",
      "در حال ارسال..."
    );

    const data = await api(
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
        "پیام شما ارسال شد.",
      "success"
    );

    if (messageInput) {
      messageInput.value = "";
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

/* =========================
   CHART PREVIEW
========================= */

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
      previewWrap.style.display =
        "none";
    }

    return;
  }

  if (!file.type.startsWith("image/")) {
    selectedChartFile = null;

    if (previewWrap) {
      previewWrap.style.display =
        "none";
    }

    showMessage(
      "chartMsg",
      "لطفاً فقط فایل تصویری چارت را انتخاب کنید.",
      "error"
    );

    return;
  }

  if (preview) {
    preview.src =
      URL.createObjectURL(file);
  }

  if (previewWrap) {
    previewWrap.style.display =
      "block";
  }

  showMessage(
    "chartMsg",
    ""
  );
}

/* =========================
   AI CHART ANALYSIS
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

  const button =
    $("analyzeBtn");

  if (button) {
    button.disabled = true;

    button.dataset.oldText =
      button.textContent;

    button.textContent =
      "در حال تحلیل...";
  }

  showMessage(
    "chartMsg",
    "هوش مصنوعی در حال تحلیل چارت است..."
  );

  resetAnalysisResult();

  try {
    const formData =
      new FormData();

    formData.append(
      "chart",
      file
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

    /*
      اگر پاسخ به صورت JSON string باشد
    */

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

    /*
      اگر analysis داخل analysis باشد
    */

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
        "تحلیل چارت با موفقیت انجام شد.",
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
      `خطا در تحلیل: ${error.message}`,
      "error"
    );

  } finally {
    if (button) {
      button.disabled =
        false;

      button.textContent =
        button.dataset.oldText ||
        "تحلیل نمودار با هوش مصنوعی";
    }
  }
}

/* =========================
   RESET ANALYSIS
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

  ids.forEach(
    (id) => {
      const el = $(id);

      if (el) {
        el.textContent =
          "صبر کن";
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

/* =========================
   RENDER ANALYSIS
========================= */

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
      "پاسخ هوش مصنوعی قابل خواندن نبود.",
      "error"
    );

    return;
  }

  console.log(
    "AI KEYS:",
    Object.keys(
      analysis
    )
  );

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
      ]
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
      "کم"
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
      "بازار فارکس دارای ریسک است."
    );

  /*
    نمایش اطلاعات
  */

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

  /*
    BUY / SELL / WAIT
  */

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

/* =========================
   SET TEXT
========================= */

function setText(
  id,
  value
) {
  const el = $(id);

  if (!el) return;

  el.textContent =
    textValue(value);
}

/* =========================
   HISTORY
========================= */

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
        "<p>هنوز تحلیل ذخیره‌شده‌ای وجود ندارد.</p>";

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
                  Entry:
                  ${escapeHtml(
                    entry
                  )}
                </div>

                <div>
                  SL:
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
      "<p>تاریخچه تحلیل فعلاً قابل دریافت نیست.</p>";
  }
}

/* =========================
   SIGNALS
========================= */

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
        "<p>هنوز سیگنالی منتشر نشده است.</p>";

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
      "<p>سیگنال‌ها فعلاً قابل دریافت نیستند.</p>";
  }
}

/* =========================
   MAIN LOAD
========================= */

async function load() {
  try {
    const data =
      await api(
        "/api/me"
      );

    currentUser =
      data.user || null;

    const authSection =
      $("authSection");

    const dashboard =
      $("dashboard");

    /*
      کاربر وارد نشده
    */

    if (!currentUser) {
      if (authSection) {
        authSection.style.display =
          "";
      }

      if (dashboard) {
        dashboard.style.display =
          "none";
      }

      return;
    }

    /*
      کاربر وارد شده
    */

    if (authSection) {
      authSection.style.display =
        "none";
    }

    if (dashboard) {
      dashboard.style.display =
        "block";
    }

    /*
      نمایش نام کاربر
    */

    const nameElements = [
      "userName",
      "welcomeName",
      "profileName"
    ];

    nameElements.forEach(
      (id) => {
        const el = $(id);

        if (
          el &&
          currentUser.name
        ) {
          el.textContent =
            currentUser.name;
        }
      }
    );

    /*
      وضعیت پرداخت
    */

    const status =
      currentUser.payment_status ||
      currentUser.paymentStatus ||
      currentUser.status ||
      "";

    const approved =
      status ===
        "approved" ||
      currentUser.approved ===
        true ||
      currentUser.isApproved ===
        true;

    const aiPanel =
      $("aiPanel");

    const historyPanel =
      $("historyPanel");

    const signalsPanel =
      $("signalsPanel");

    if (approved) {

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

    }

  } catch (error) {
    console.error(
      "LOAD ERROR:",
      error
    );
  }
}

/* =========================
   EVENT LISTENERS
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      Register
    */

    const registerForm =
      $("registerForm");

    if (registerForm) {
      registerForm.addEventListener(
        "submit",
        registerUser
      );
    }

    /*
      Login
    */

    const loginForm =
      $("loginForm");

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        loginUser
      );
    }

    /*
      Logout
    */

    const logoutBtn =
      $("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        logoutUser
      );
    }

    /*
      Payment
    */

    const paymentForm =
      $("paymentForm");

    if (paymentForm) {
      paymentForm.addEventListener(
        "submit",
        submitPayment
      );
    }

    /*
      Support
    */

    const supportForm =
      $("supportForm");

    if (supportForm) {
      supportForm.addEventListener(
        "submit",
        sendSupport
      );
    }

    /*
      Chart file
    */

    const chartFile =
      $("chartFile");

    if (chartFile) {
      chartFile.addEventListener(
        "change",
        previewChart
      );
    }

    /*
      AI Chart Analysis
    */

    const chartForm =
      $("chartForm");

    if (chartForm) {
      chartForm.addEventListener(
        "submit",
        analyzeChart
      );
    }

    /*
      Start
    */

    load();
  }
);
