<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GoldAI Admin</title>

  <link rel="stylesheet" href="styles.css">

  <style>
    body {
      min-height: 100vh;
    }

    main {
      width: min(1100px, calc(100% - 24px));
      margin: 30px auto;
    }

    .hidden {
      display: none !important;
    }

    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 20px;
    }

    .admin-header h1 {
      margin: 0;
    }

    .admin-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }

    .stat {
      padding: 18px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.04);
    }

    .stat strong {
      display: block;
      font-size: 28px;
      margin-top: 6px;
    }

    .card {
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.035);
    }

    .card small {
      display: block;
      opacity: .7;
      margin-top: 5px;
    }

    .card p {
      line-height: 1.7;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    textarea {
      width: 100%;
      min-height: 140px;
      resize: vertical;
    }

    input,
    textarea {
      box-sizing: border-box;
    }

    .section-title {
      margin-top: 0;
    }

    .status-approved {
      color: #35d07f;
      font-weight: 700;
    }

    .status-pending {
      color: #f5b942;
      font-weight: 700;
    }

    .status-rejected {
      color: #ff6565;
      font-weight: 700;
    }

    .receipt {
      display: inline-block;
      margin-top: 8px;
      font-weight: 700;
    }

    .empty {
      opacity: .65;
      padding: 12px 0;
    }

    @media (max-width: 750px) {
      .admin-grid {
        grid-template-columns: 1fr;
      }

      .admin-header {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>

<body>

<main>

  <!-- LOGIN -->
  <section id="login" class="panel">

    <h1>GoldAI Admin</h1>

    <p>
      Secure administrator access.
    </p>

    <input
      id="ap"
      type="password"
      placeholder="Admin password"
      autocomplete="current-password"
    >

    <button id="al">
      Login
    </button>

    <p id="am" class="msg"></p>

  </section>


  <!-- ADMIN DASHBOARD -->
  <section id="admin" class="hidden">

    <div class="admin-header">

      <div>
        <h1>GoldAI Admin Dashboard</h1>
        <p>
          Manage users, payments and XAUUSD signals.
        </p>
      </div>

      <button
        id="logout"
        class="ghost"
      >
        Logout
      </button>

    </div>


    <!-- STATISTICS -->
    <div class="admin-grid">

      <div class="stat">
        <span>Total Users</span>
        <strong id="totalUsers">0</strong>
      </div>

      <div class="stat">
        <span>Pending Payments</span>
        <strong id="pendingPayments">0</strong>
      </div>

      <div class="stat">
        <span>Approved Users</span>
        <strong id="approvedUsers">0</strong>
      </div>

    </div>


    <!-- PAYMENTS -->
    <div class="panel">

      <h2 class="section-title">
        Payment Requests
      </h2>

      <p>
        Review the payment receipt before approving access.
      </p>

      <div id="payments"></div>

    </div>


    <!-- USERS -->
    <div class="panel">

      <h2 class="section-title">
        Users
      </h2>

      <div id="users"></div>

    </div>


    <!-- CREATE SIGNAL -->
    <div class="panel">

      <h2 class="section-title">
        Publish XAUUSD Signal
      </h2>

      <input
        id="st"
        type="text"
        placeholder="Signal title e.g. XAUUSD SELL NOW"
      >

      <textarea
        id="sb"
        placeholder="Example:

XAUUSD SELL 4395

TP1 4393
TP2 4391
TP3 4389
TP4 4387
TP5 4385

SL 4405"
      ></textarea>

      <button id="publish">
        Publish Signal
      </button>

      <p id="pm" class="msg"></p>

    </div>


    <!-- PUBLISHED SIGNALS -->
    <div class="panel">

      <h2 class="section-title">
        Published Signals
      </h2>

      <div id="signals"></div>

    </div>

  </section>

</main>


<script>

  const $ = (id) =>
    document.getElementById(id);


  /* =========================================================
     API HELPER
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

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Request failed."
      );

    }

    return data;

  }


  /* =========================================================
     ESCAPE HTML
  ========================================================= */

  function esc(value) {

    return String(
      value ?? ""
    ).replace(
      /[&<>"']/g,
      function (char) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[char];

      }
    );

  }


  /* =========================================================
     DATE
  ========================================================= */

  function formatDate(value) {

    if (!value) {
      return "-";
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

    return date.toLocaleString();

  }


  /* =========================================================
     STATUS CLASS
  ========================================================= */

  function statusClass(status) {

    if (
      status === "approved"
    ) {

      return "status-approved";

    }

    if (
      status === "rejected"
    ) {

      return "status-rejected";

    }

    return "status-pending";

  }


  /* =========================================================
     LOAD ADMIN DATA
  ========================================================= */

  async function load() {

    try {

      const data =
        await api(
          "/api/admin/data"
        );


      $("#login")
        .classList
        .add("hidden");

      $("#admin")
        .classList
        .remove("hidden");


      const users =
        Array.isArray(
          data.users
        )
          ? data.users
          : [];


      const payments =
        Array.isArray(
          data.payments
        )
          ? data.payments
          : [];


      const signals =
        Array.isArray(
          data.signals
        )
          ? data.signals
          : [];


      /* =====================================================
         STATISTICS
      ===================================================== */

      $("#totalUsers")
        .textContent =
          users.length;


      $("#pendingPayments")
        .textContent =
          payments.filter(
            p =>
              p.status ===
              "pending"
          ).length;


      $("#approvedUsers")
        .textContent =
          users.filter(
            u =>
              Boolean(
                u.approved
              )
          ).length;


      /* =====================================================
         PAYMENTS
      ===================================================== */

      if (!payments.length) {

        $("#payments")
          .innerHTML =
          `<div class="empty">
            No payment requests yet.
          </div>`;

      } else {

        $("#payments")
          .innerHTML =
          payments.map(
            payment => {

              const isPending =
                payment.status ===
                "pending";


              return `
                <div class="card">

                  <strong>
                    ${esc(
                      payment.name ||
                      "Unknown User"
                    )}
                  </strong>

                  <small>
                    ${esc(
                      payment.email ||
                      "-"
                    )}
                  </small>

                  <p>

                    <strong>
                      Method:
                    </strong>

                    ${esc(
                      payment.method
                    )}

                    <br>

                    <strong>
                      Amount:
                    </strong>

                    ${esc(
                      payment.amount
                    )}

                    <br>

                    <strong>
                      Reference:
                    </strong>

                    ${esc(
                      payment.reference
                    )}

                    <br>

                    <strong>
                      Status:
                    </strong>

                    <span
                      class="${statusClass(
                        payment.status
                      )}"
                    >
                      ${esc(
                        payment.status
                      )}
                    </span>

                    <br>

                    <strong>
                      Submitted:
                    </strong>

                    ${esc(
                      formatDate(
                        payment.created_at
                      )
                    )}

                  </p>

                  <a
                    class="receipt"
                    href="/api/admin/payment/${encodeURIComponent(
                      payment.id
                    )}/receipt"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Payment Receipt
                  </a>

                  ${
                    isPending
                      ? `
                        <div class="actions">

                          <button
                            onclick="approvePayment(${Number(
                              payment.id
                            )})"
                          >
                            Approve Payment
                          </button>

                          <button
                            class="ghost"
                            onclick="rejectPayment(${Number(
                              payment.id
                            )})"
                          >
                            Reject
                          </button>

                        </div>
                      `
                      : ""
                  }

                </div>
              `;

            }
          ).join("");

      }


      /* =====================================================
         USERS
      ===================================================== */

      if (!users.length) {

        $("#users")
          .innerHTML =
          `<div class="empty">
            No registered users yet.
          </div>`;

      } else {

        $("#users")
          .innerHTML =
          users.map(
            user => {

              return `
                <div class="card">

                  <strong>
                    ${esc(
                      user.name
                    )}
                  </strong>

                  <small>
                    ${esc(
                      user.email
                    )}
                  </small>

                  <p>

                    <strong>
                      Access:
                    </strong>

                    <span
                      class="${
                        user.approved
                          ? "status-approved"
                          : "status-pending"
                      }"
                    >
                      ${
                        user.approved
                          ? "Approved"
                          : "Waiting for payment approval"
                      }
                    </span>

                    <br>

                    <strong>
                      Registered:
                    </strong>

                    ${esc(
                      formatDate(
                        user.created_at
                      )
                    )}

                  </p>

                </div>
              `;

            }
          ).join("");

      }


      /* =====================================================
         SIGNALS
      ===================================================== */

      if (!signals.length) {

        $("#signals")
          .innerHTML =
          `<div class="empty">
            No published signals yet.
          </div>`;

      } else {

        $("#signals")
          .innerHTML =
          signals.map(
            signal => {

              return `
                <div class="card">

                  <strong>
                    ${esc(
                      signal.title
                    )}
                  </strong>

                  <small>
                    ${esc(
                      formatDate(
                        signal.created_at
                      )
                    )}
                  </small>

                  <p>
                    ${esc(
                      signal.body
                    ).replace(
                      /\n/g,
                      "<br>"
                    )}
                  </p>

                  <button
                    class="ghost"
                    onclick="deleteSignal(${Number(
                      signal.id
                    )})"
                  >
                    Delete Signal
                  </button>

                </div>
              `;

            }
          ).join("");

      }


    } catch (error) {

      $("#login")
        .classList
        .remove("hidden");

      $("#admin")
        .classList
        .add("hidden");

    }

  }


  /* =========================================================
     APPROVE PAYMENT
  ========================================================= */

  window.approvePayment =
    async function (id) {

      if (
        !confirm(
          "Have you checked the payment receipt and confirmed the payment?"
        )
      ) {

        return;

      }

      try {

        await api(
          `/api/admin/payment/${encodeURIComponent(
            id
          )}/approve`,
          {
            method: "POST"
          }
        );

        await load();

      } catch (error) {

        alert(
          error.message
        );

      }

    };


  /* =========================================================
     REJECT PAYMENT
  ========================================================= */

  window.rejectPayment =
    async function (id) {

      if (
        !confirm(
          "Reject this payment request?"
        )
      ) {

        return;

      }

      try {

        await api(
          `/api/admin/payment/${encodeURIComponent(
            id
          )}/reject`,
          {
            method: "POST"
          }
        );

        await load();

      } catch (error) {

        alert(
          error.message
        );

      }

    };


  /* =========================================================
     DELETE SIGNAL
  ========================================================= */

  window.deleteSignal =
    async function (id) {

      if (
        !confirm(
          "Delete this signal?"
        )
      ) {

        return;

      }

      try {

        await api(
          `/api/admin/signals/${encodeURIComponent(
            id
          )}`,
          {
            method: "DELETE"
          }
        );

        await load();

      } catch (error) {

        alert(
          error.message
        );

      }

    };


  /* =========================================================
     ADMIN LOGIN
  ========================================================= */

  $("#al")
    .addEventListener(
      "click",
      async function () {

        const password =
          $("#ap").value;

        $("#am")
          .textContent = "";


        if (!password) {

          $("#am")
            .textContent =
            "Please enter the admin password.";

          return;

        }


        try {

          await api(
            "/api/admin/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  password
                })
            }
          );


          $("#ap")
            .value = "";

          await load();


        } catch (error) {

          $("#am")
            .textContent =
            error.message;

        }

      }
    );


  /* =========================================================
     ENTER KEY LOGIN
  ========================================================= */

  $("#ap")
    .addEventListener(
      "keydown",
      function (event) {

        if (
          event.key ===
          "Enter"
        ) {

          $("#al")
            .click();

        }

      }
    );


  /* =========================================================
     LOGOUT
  ========================================================= */

  $("#logout")
    .addEventListener(
      "click",
      async function () {

        try {

          await api(
            "/api/logout",
            {
              method: "POST"
            }
          );

        } catch (_) {}

        location.reload();

      }
    );


  /* =========================================================
     PUBLISH SIGNAL
  ========================================================= */

  $("#publish")
    .addEventListener(
      "click",
      async function () {

        const title =
          $("#st")
            .value
            .trim();

        const body =
          $("#sb")
            .value
            .trim();


        $("#pm")
          .textContent = "";


        if (
          !title ||
          !body
        ) {

          $("#pm")
            .textContent =
            "Title and signal body are required.";

          return;

        }


        const button =
          $("#publish");

        button.disabled =
          true;


        try {

          await api(
            "/api/admin/signals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  title,
                  body
                })
            }
          );


          $("#st")
            .value = "";

          $("#sb")
            .value = "";

          $("#pm")
            .textContent =
            "Signal published successfully.";

          await load();


        } catch (error) {

          $("#pm")
            .textContent =
            error.message;

        } finally {

          button.disabled =
            false;

        }

      }
    );


  /* =========================================================
     START
  ========================================================= */

  load();

</script>

</body>
</html>
