const $ = selector =>
  document.querySelector(selector);

let method = "hesabpay";


/* =========================
   TRANSLATIONS
========================= */

const T = {

  en: {
    heroTitle:
      "Professional Gold Analysis",

    heroText:
      "Upload your XAUUSD chart and let GoldAI analyze the visible market structure."
  },

  fa: {
    heroTitle:
      "تحلیل حرفه‌ای طلا",

    heroText:
      "عکس چارت XAUUSD خود را آپلود کنید تا GoldAI ساختار قابل مشاهده بازار را تحلیل کند."
  },

  ar: {
    heroTitle:
      "تحليل احترافي للذهب",

    heroText:
      "قم برفع صورة شارت XAUUSD ودع GoldAI يحلل هيكل السوق الظاهر."
  }

};


/* =========================
   LANGUAGE
========================= */

function lang() {
  return localStorage.goldaiLang || "en";
}

function setLang(value) {

  localStorage.goldaiLang = value;

  document.documentElement.lang =
    value;

  document.documentElement.dir =
    value === "en"
      ? "ltr"
      : "rtl";

  if ($("#heroTitle")) {
    $("#heroTitle").textContent =
      T[value].heroTitle;
  }

  if ($("#heroText")) {
    $("#heroText").textContent =
      T[value].heroText;
  }
}


$("#lang").value = lang();

$("#lang").onchange = event => {
  setLang(event.target.value);
};

setLang(lang());


/* =========================
   API
========================= */

async function api(url, options = {}) {

  const response =
    await fetch(url, options);

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Request failed."
    );
  }

  return data;
}


/* =========================
   AUTH TABS
========================= */

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(".tab")
        .forEach(item =>
          item.classList.remove("active")
        );

      button.classList.add("active");

      $("#loginForm")
        .classList.toggle(
          "hidden",
          button.dataset.tab !== "login"
        );

      $("#registerForm")
        .classList.toggle(
          "hidden",
          button.dataset.tab !== "register"
        );

      $("#authMsg").textContent = "";
    };

  });


/* =========================
   REGISTER
========================= */

$("#registerForm").onsubmit =
  async event => {

    event.preventDefault();

    $("#authMsg").textContent =
      "Creating account...";

    try {

      await api(
        "/api/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            name:
              $("#regName").value,

            email:
              $("#regEmail").value,

            password:
              $("#regPass").value
          })
        }
      );

      await load();

    } catch (error) {

      $("#authMsg").textContent =
        error.message;
    }
  };


/* =========================
   LOGIN
========================= */

$("#loginForm").onsubmit =
  async event => {

    event.preventDefault();

    $("#authMsg").textContent =
      "Signing in...";

    try {

      await api(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email:
              $("#loginEmail").value,

            password:
              $("#loginPass").value
          })
        }
      );

      await load();

    } catch (error) {

      $("#authMsg").textContent =
        error.message;
    }
  };


/* =========================
   LOGOUT
========================= */

$("#logout").onclick =
  async () => {

    try {

      await api(
        "/api/logout",
        {
          method: "POST"
        }
      );

    } finally {

      await load();
    }
  };


/* =========================
   PAYMENT METHOD
========================= */

function showMethod() {

  document
    .querySelectorAll(".pay")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.method === method
      );

    });


  if (method === "hesabpay") {

    $("#payDetails").innerHTML = `
      <b>HesabPay — 240 AFN</b>
      <br>
      Send the exact activation fee to:
      <br>
      <strong>9004134056412319</strong>
      <br>
      <small>
        Then upload your payment receipt.
        Never enter a PIN or password.
      </small>
    `;

  } else {

    $("#payDetails").innerHTML = `
      <b>Binance Pay — 4 USD / USDT</b>
      <br>
      Send the exact activation fee using Binance Pay to:
      <br>
      <strong>760897285</strong>
      <br>
      <small>
        Then upload your payment receipt.
        Never share a seed phrase or private key.
      </small>
    `;
  }
}


document
  .querySelectorAll(".pay")
  .forEach(button => {

    button.onclick = () => {

      method =
        button.dataset.method;

      showMethod();
    };

  });


showMethod();


/* =========================
   PAYMENT SUBMISSION
========================= */

$("#paymentForm").onsubmit =
  async event => {

    event.preventDefault();

    const file =
      $("#receipt").files[0];

    if (!file) {

      $("#payMsg").textContent =
        "Please select your payment receipt.";

      return;
    }

    $("#payMsg").textContent =
      "Uploading receipt...";

    const formData =
      new FormData();

    formData.append(
      "method",
      method
    );

    formData.append(
      "reference",
      $("#reference").value
    );

    formData.append(
      "receipt",
      file
    );

    try {

      await api(
        "/api/payments",
        {
          method: "POST",
          body: formData
        }
      );

      $("#payMsg").textContent =
        "Receipt submitted. Access remains locked until admin approval.";

      await load();

    } catch (error) {

      $("#payMsg").textContent =
        error.message;
    }
  };


/* =========================
   SUPPORT
========================= */

$("#supportBtn").onclick =
  async () => {

    const message =
      $("#supportText").value.trim();

    if (!message) {

      $("#supportMsg").textContent =
        "Please write a message.";

      return;
    }

    $("#supportMsg").textContent =
      "Sending...";

    try {

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

      $("#supportText").value = "";

      $("#supportMsg").textContent =
        "Message sent.";

    } catch (error) {

      $("#supportMsg").textContent =
        error.message;
    }
  };


/* =========================
   CHART PREVIEW
========================= */

$("#chartFile").onchange =
  () => {

    const file =
      $("#chartFile").files[0];

    if (!file) {

      $("#chartPreviewWrap")
        .classList.add("hidden");

      return;
    }

    const reader =
      new FileReader();

    reader.onload = event => {

      $("#chartPreview").src =
        event.target.result;

      $("#chartPreviewWrap")
        .classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  };


/* =========================
   AI CHART ANALYSIS
========================= */

$("#chartForm").onsubmit =
  async event => {

    event.preventDefault();

    const file =
      $("#chartFile").files[0];

    if (!file) {

      $("#chartMsg").textContent =
        "Please select a chart image.";

      return;
    }


    if (file.size > 5 * 1024 * 1024) {

      $("#chartMsg").textContent =
        "Image must be smaller than 5 MB.";

      return;
    }


    $("#analyzeBtn").disabled =
      true;

    $("#analyzeBtn").textContent =
      "AI is analyzing...";

    $("#chartMsg").textContent =
      "Reading chart structure...";

    $("#analysisResult")
      .classList.add("hidden");


    const formData =
      new FormData();

    formData.append(
      "chart",
      file
    );


    try {

      const result =
        await api(
          "/api/analyze-chart",
          {
            method: "POST",
            body: formData
          }
        );


      displayAnalysis(
        result.analysis
      );


      $("#chartMsg").textContent =
        "Analysis completed.";

      await loadHistory();


    } catch (error) {

      $("#chartMsg").textContent =
        error.message;

    } finally {

      $("#analyzeBtn").disabled =
        false;

      $("#analyzeBtn").textContent =
        "Analyze Chart with AI";
    }
  };


/* =========================
   DISPLAY ANALYSIS
========================= */

function displayAnalysis(a) {

  const direction =
    String(
      a.direction || "WAIT"
    ).toUpperCase();


  $("#analysisDirection")
    .textContent =
    direction;

  $("#analysisSymbol")
    .textContent =
    a.symbol || "XAUUSD";

  $("#analysisTimeframe")
    .textContent =
    a.timeframe || "Unknown";

  $("#analysisEntry")
    .textContent =
    a.entry || "WAIT";

  $("#analysisSL")
    .textContent =
    a.sl || "WAIT";

  $("#analysisTP1")
    .textContent =
    a.tp1 || "WAIT";

  $("#analysisTP2")
    .textContent =
    a.tp2 || "WAIT";

  $("#analysisTP3")
    .textContent =
    a.tp3 || "WAIT";

  $("#analysisTP4")
    .textContent =
    a.tp4 || "WAIT";

  $("#analysisTP5")
    .textContent =
    a.tp5 || "WAIT";

  $("#analysisConfidence")
    .textContent =
    a.confidence || "Low";

  $("#analysisTextContent")
    .textContent =
    a.analysis ||
    "No detailed analysis returned.";

  $("#analysisWarning")
    .textContent =
    a.warning ||
    "Trading involves market risk. This analysis does not guarantee profit.";


  const directionCard =
    $("#directionCard");

  directionCard.classList.remove(
    "buy",
    "sell",
    "wait"
  );


  if (direction === "BUY") {

    directionCard.classList.add(
      "buy"
    );

  } else if (direction === "SELL") {

    directionCard.classList.add(
      "sell"
    );

  } else {

    directionCard.classList.add(
      "wait"
    );
  }


  $("#analysisResult")
    .classList.remove("hidden");
}


/* =========================
   ANALYSIS HISTORY
========================= */

async function loadHistory() {

  try {

    const result =
      await api(
        "/api/analyses"
      );

    const items =
      result.analyses || [];


    if (!items.length) {

      $("#historyPanel")
        .classList.add("hidden");

      return;
    }


    $("#historyPanel")
      .classList.remove("hidden");


    $("#analysisHistory").innerHTML =
      items.map(item => {

        const direction =
          escapeHtml(
            item.direction || "WAIT"
          );

        return `
          <div class="historyItem">

            <div class="historyTop">

              <strong>
                ${direction}
              </strong>

              <small>
                ${new Date(
                  item.createdAt
                ).toLocaleString()}
              </small>

            </div>

            <div class="historyLevels">

              <span>
                Entry:
                <b>${escapeHtml(
                  item.entry || "WAIT"
                )}</b>
              </span>

              <span>
                SL:
                <b>${escapeHtml(
                  item.sl || "WAIT"
                )}</b>
              </span>

              <span>
                TP1:
                <b>${escapeHtml(
                  item.tp1 || "WAIT"
                )}</b>
              </span>

            </div>

            <p>
              ${escapeHtml(
                item.analysis || ""
              )}
            </p>

          </div>
        `;

      }).join("");


  } catch (error) {

    console.error(
      "HISTORY ERROR:",
      error
    );
  }
}


/* =========================
   LOAD DASHBOARD
========================= */

async function load() {

  try {

    const me =
      await api(
        "/api/me"
      );


    $("#auth")
      .classList.toggle(
        "hidden",
        me.loggedIn
      );


    $("#dashboard")
      .classList.toggle(
        "hidden",
        !me.loggedIn
      );


    if (!me.loggedIn) {

      $("#aiPanel")
        .classList.add("hidden");

      $("#historyPanel")
        .classList.add("hidden");

      return;
    }


    const access =
      await api(
        "/api/access"
      );


    if (access.approved) {

      $("#status").innerHTML =
        `
          <span class="statusApproved">
            ✓ Your access is approved.
          </span>
        `;

      $("#payPanel")
        .classList.add("hidden");

      $("#aiPanel")
        .classList.remove("hidden");

      await loadHistory();


      /* ADMIN SIGNALS */

      $("#signalsPanel")
        .classList.remove("hidden");


      if (
        access.signals &&
        access.signals.length
      ) {

        $("#signals").innerHTML =
          access.signals
            .map(signal => {

              return `
                <div class="signal">

                  <div class="signalTitle">
                    ${escapeHtml(
                      signal.title
                    )}
                  </div>

                  <div>
                    ${escapeHtml(
                      signal.body
                    )}
                  </div>

                  <small>
                    ${new Date(
                      signal.createdAt
                    ).toLocaleString()}
                  </small>

                </div>
              `;

            })
            .join("");

      } else {

        $("#signals").innerHTML = `
          <div class="empty">
            No manual signals published yet.
          </div>
        `;
      }


    } else {

      $("#status").innerHTML =
        `
          <span class="statusLocked">
            🔒 Your access is locked until your payment receipt is reviewed.
          </span>
        `;

      $("#payPanel")
        .classList.remove("hidden");

      $("#aiPanel")
        .classList.add("hidden");

      $("#historyPanel")
        .classList.add("hidden");

      $("#signalsPanel")
        .classList.add("hidden");
    }

  } catch (error) {

    console.error(
      "LOAD ERROR:",
      error
    );
  }
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      character =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[character]
    );
}


/* =========================
   START
========================= */

load();
