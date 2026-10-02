const $ = (id) =>
  document.getElementById(id);

let currentUser = null;
let selectedChartFile = null;

let selectedTimeframe = "1m";
let selectedPaymentMethod =
  "hesabpay";

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
  const response =
    await fetch(
      url,
      {
        credentials:
          "include",
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
    typeof obj !==
      "object"
  ) {
    return fallback;
  }

  for (
    const name of names
  ) {
    if (
      obj[name] !==
        undefined &&
      obj[name] !== null &&
      String(
        obj[name]
      ).trim() !== ""
    ) {
      return obj[name];
    }
  }

  return fallback;
}

function escapeHtml(
  value
) {
  if (
    value ===
      undefined ||
    value === null
  ) {
    return "";
  }

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/* =========================================================
   REGISTER
========================================================= */

async function registerUser(
  event
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const name =
    $("regName")?.value
      .trim() || "";

  const email =
    $("regEmail")?.value
      .trim() || "";

  const password =
    $("regPass")?.value || "";

  if (
    !name ||
    !email ||
    !password
  ) {
    showMessage(
      "authMsg",
      "Please fill in all information.",
      "error"
    );

    return;
  }

  try {
    showMessage(
      "authMsg",
      "Creating account..."
    );

    const data =
      await api(
        "/api/register",
        {
          method:
            "POST",

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

    showMessage(
      "authMsg",
      data.message ||
        "Account created successfully.",
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

async function loginUser(
  event
) {
  event.preventDefault();

  const email =
    $("loginEmail")
      ?.value
      .trim() || "";

  const password =
    $("loginPass")
      ?.value || "";

  if (
    !email ||
    !password
  ) {
    showMessage(
      "authMsg",
      "Please enter your email and password.",
      "error"
    );

    return;
  }

  try {
    showMessage(
      "authMsg",
      "Logging in..."
    );

    const data =
      await api(
        "/api/login",
        {
          method:
            "POST",

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

    showMessage(
      "authMsg",
      data.message ||
        "Login successful.",
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
        method:
          "POST"
      }
    );
  } catch (_) {}

  currentUser =
    null;

  const auth =
    $("auth");

  const dashboard =
    $("dashboard");

  if (auth) {
    auth.style.display =
      "";
  }

  if (dashboard) {
    dashboard.style.display =
      "none";
  }
}

/* =========================================================
   PAYMENT METHOD
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
    details.innerHTML = `
      <strong>Binance Pay</strong>
      <p>
        Payment amount: <b>4 USD / USDT</b>
      </p>
      <p>
        Send your payment and enter the transaction reference below.
      </p>
    `;
  } else {
    details.innerHTML = `
      <strong>HesabPay</strong>
      <p>
        Payment amount: <b>240 AFN</b>
      </p>
      <p>
        Send your payment and enter the transaction reference below.
      </p>
    `;
  }
}

function setupPaymentMethods() {
  const buttons =
    document.querySelectorAll(
      ".pay[data-method]"
    );

  buttons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          selectedPaymentMethod =
            button.dataset.method ||
            "hesabpay";

          buttons.forEach(
            (item) => {
              if (
                item.dataset.method
              ) {
                item.classList.remove(
                  "active"
                );
              }
            }
          );

          button.classList.add(
            "active"
          );

          updatePaymentDetails();
        }
      );
    }
  );

  updatePaymentDetails();
}

/* =========================================================
   PAYMENT
========================================================= */

async function submitPayment(
  event
) {
  event.preventDefault();

  const reference =
    $("reference")
      ?.value
      .trim() || "";

  const file =
    $("receipt")
      ?.files?.[0];

  if (!reference) {
    showMessage(
      "payMsg",
      "Please enter the payment reference.",
      "error"
    );

    return;
  }

  if (!file) {
    showMessage(
      "payMsg",
      "Please select your payment receipt.",
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
      "Receipt image must be 5 MB or smaller.",
      "error"
    );

    return;
  }

  try {
    showMessage(
      "payMsg",
      "Uploading payment receipt..."
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
          method:
            "POST",
          body:
            formData
        }
      );

    showMessage(
      "payMsg",
      data.message ||
        "Payment receipt submitted for review.",
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
    $("supportText")
      ?.value
      .trim() || "";

  if (!message) {
    showMessage(
      "supportMsg",
      "Please write your message.",
      "error"
    );

    return;
  }

  try {
    showMessage(
      "supportMsg",
      "Sending..."
    );

    const data =
      await api(
        "/api/support",
        {
          method:
            "POST",

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

    showMessage(
      "supportMsg",
      data.message ||
        "Your message has been sent.",
      "success"
    );

    if (
      $("supportText")
    ) {
      $("supportText")
        .value = "";
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

function timeframeLabel(
  timeframe
) {
  if (
    timeframe ===
    "1m"
  ) {
    return "1 Minute";
  }

  if (
    timeframe ===
    "5m"
  ) {
    return "5 Minutes";
  }

  if (
    timeframe ===
    "15m"
  ) {
    return "15 Minutes";
  }

  return timeframe;
}

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
          const value =
            button.dataset
              .timeframe;

          if (
            ![
              "1m",
              "5m",
              "15m"
            ].includes(
              value
            )
          ) {
            return;
          }

          selectedTimeframe =
            value;

          buttons.forEach(
            (item) => {
              item.classList.remove(
                "active"
              );
            }
          );

          button.classList.add(
            "active"
          );

          const label =
            timeframeLabel(
              selectedTimeframe
            );

          const selectedText =
            $("selectedTimeframeText");

          if (
            selectedText
          ) {
            selectedText.textContent =
              `Selected timeframe: ${label}`;
          }

          setText(
            "analysisTimeframe",
            selectedTimeframe
          );

          showMessage(
            "chartMsg",
            `Timeframe selected: ${label}`
          );
        }
      );
    }
  );
}

/* =========================================================
   CHART PREVIEW
========================================================= */

function previewChart(
  event
) {
  const file =
    event.target.files?.[0];

  selectedChartFile =
    file ||
    null;

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

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    selectedChartFile =
      null;

    if (previewWrap) {
      previewWrap.style.display =
        "none";
    }

    showMessage(
      "chartMsg",
      "Please select an image chart.",
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
      previewWrap.style.display =
        "none";
    }

    if ($("chartFile")) {
      $("chartFile")
        .value = "";
    }

    showMessage(
      "chartMsg",
      "Chart image must be 5 MB or smaller.",
      "error"
    );

    return;
  }

  if (preview) {
    preview.src =
      URL.createObjectURL(
        file
      );
  }

  if (previewWrap) {
    previewWrap.style.display =
      "block";
  }

  showMessage(
    "chartMsg",
    `Chart selected for ${timeframeLabel(
      selectedTimeframe
    )}.`
  );
}

/* =========================================================
   AI CHART ANALYSIS
========================================================= */

async function analyzeChart(
  event
) {
  event.preventDefault();

  const file =
    selectedChartFile ||
    $("chartFile")
      ?.files?.[0];

  if (!file) {
    showMessage(
      "chartMsg",
      "Please select the XAUUSD chart first.",
      "error"
    );

    return;
  }

  if (
    ![
      "1m",
      "5m",
      "15m"
    ].includes(
      selectedTimeframe
    )
  ) {
    showMessage(
      "chartMsg",
      "Please select 1m, 5m or 15m.",
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
      "Chart image must be 5 MB or smaller.",
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
      "Analyzing...";
  }

  showMessage(
    "chartMsg",
    `AI is analyzing the XAUUSD ${timeframeLabel(
      selectedTimeframe
    )} chart...`
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
          method:
            "POST",
          body:
            formData
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
        `Analysis completed for ${timeframeLabel(
          selectedTimeframe
        )}.`,
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
      `Analysis error: ${error.message}`,
      "error"
    );

  } finally {
    if (button) {
      button.disabled =
        false;

      button.textContent =
        button.dataset.oldText ||
        "Analyze Chart with AI";
    }
  }
}

/* =========================================================
   RESET ANALYSIS
========================================================= */

function resetAnalysisResult() {
  const values = {
    analysisDirection:
      "WAIT",

    analysisSymbol:
      "XAUUSD",

    analysisTimeframe:
      selectedTimeframe,

    analysisEntry:
      "WAIT",

    analysisSL:
      "WAIT",

    analysisTP1:
      "WAIT",

    analysisTP2:
      "WAIT",

    analysisTP3:
      "WAIT",

    analysisTP4:
      "WAIT",

    analysisTP5:
      "WAIT",

    analysisConfidence:
      "Low",

    analysisTextContent:
      "",

    analysisWarning:
      ""
  };

  Object.entries(
    values
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
      ],
      "WAIT"
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
    selectedTimeframe ||
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
      selectedTimeframe
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
      ],
      "WAIT"
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
      ],
      "WAIT"
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
      ],
      "WAIT"
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
      ],
      "WAIT"
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
      ],
      "WAIT"
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
      ],
      "WAIT"
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
      ],
      "WAIT"
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
      "Low"
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
      "Trading involves market risk."
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
    analysisText,
    ""
  );

  setText(
    "analysisWarning",
    warning,
    ""
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
  value,
  fallback = "WAIT"
) {
  const el =
    $(id);

  if (!el) return;

  el.textContent =
    textValue(
      value,
      fallback
    );
}

/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {
  const container =
    $("analysisHistory");

  if (!container) {
    return;
  }

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
      !Array.isArray(
        items
      ) ||
      items.length ===
        0
    ) {
      container.innerHTML =
        "<p>No saved analyses yet.</p>";

      return;
    }

    container.innerHTML =
      items
        .map(
          (item) => {
            const direction =
              getField(
                item,
                [
                  "direction"
                ],
                "WAIT"
              );

            const timeframe =
              getField(
                item,
                [
                  "timeframe"
                ],
                "Unknown"
              );

            const entry =
              getField(
                item,
                [
                  "entry"
                ]
              );

            const sl =
              getField(
                item,
                [
                  "sl"
                ]
              );

            const tp1 =
              getField(
                item,
                [
                  "tp1"
                ]
              );

            const tp2 =
              getField(
                item,
                [
                  "tp2"
                ]
              );

            const tp3 =
              getField(
                item,
                [
                  "tp3"
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
                  Timeframe:
                  ${escapeHtml(
                    timeframe
                  )}
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
      "<p>Analysis history is currently unavailable.</p>";
  }
}

/* =========================================================
   SIGNALS
========================================================= */

async function loadSignals() {
  const container =
    $("signals");

  if (!container) {
    return;
  }

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
      !Array.isArray(
        signals
      ) ||
      signals.length ===
        0
    ) {
      container.innerHTML =
        "<p>No signals have been published yet.</p>";

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
      "<p>Signals are currently unavailable.</p>";
  }
}

/* =========================================================
   STATUS
========================================================= */

function updateMemberStatus(
  user
) {
  const status =
    $("status");

  if (!status) {
    return;
  }

  if (
    user?.approved
  ) {
    status.textContent =
      "Membership approved. AI chart analysis is available.";
  } else {
    status.textContent =
      "Your account is active, but membership approval is still pending.";
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
      data.user ||
      null;

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

    updateMemberStatus(
      currentUser
    );

    const status =
      currentUser.approved
        ? "approved"
        : "pending";

    const approved =
      status ===
      "approved";

    const aiPanel =
      $("aiPanel");

    const historyPanel =
      $("historyPanel");

    const signalsPanel =
      $("signalsPanel");

    const payPanel =
      $("payPanel");

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

      if (payPanel) {
        payPanel.style.display =
          "none";
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

      if (payPanel) {
        payPanel.style.display =
          "block";
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
              item.classList.remove(
                "active"
              );
            }
          );

          tab.classList.add(
            "active"
          );

          if (
            target ===
            "login"
          ) {
            $("loginForm")
              ?.classList.remove(
                "hidden"
              );

            $("registerForm")
              ?.classList.add(
                "hidden"
              );
          } else {
            $("loginForm")
              ?.classList.add(
                "hidden"
              );

            $("registerForm")
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
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const registerForm =
      $("registerForm");

    if (registerForm) {
      registerForm.addEventListener(
        "submit",
        registerUser
      );
    }

    const loginForm =
      $("loginForm");

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        loginUser
      );
    }

    const logoutBtn =
      $("logout");

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        logoutUser
      );
    }

    const paymentForm =
      $("paymentForm");

    if (paymentForm) {
      paymentForm.addEventListener(
        "submit",
        submitPayment
      );
    }

    const supportBtn =
      $("supportBtn");

    if (supportBtn) {
      supportBtn.addEventListener(
        "click",
        sendSupport
      );
    }

    const chartFile =
      $("chartFile");

    if (chartFile) {
      chartFile.addEventListener(
        "change",
        previewChart
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

    setupAuthTabs();
    setupTimeframes();
    setupPaymentMethods();

    load();
  }
);
