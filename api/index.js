const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SESSION_SECRET =
  process.env.SESSION_SECRET || "goldai-change-this-secret";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "change-admin-password";

const AI_MODEL =
  process.env.OPENAI_MODEL || "gpt-6-luna";

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

/* =========================================================
   DATABASE
========================================================= */

let dbReadyPromise = null;

async function ensureDatabase() {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          approved BOOLEAN DEFAULT FALSE,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          method TEXT NOT NULL,
          amount NUMERIC,
          reference TEXT,
          receipt_data TEXT,
          receipt_mime TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          reviewed_at TIMESTAMP
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS signals (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS support (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS analyses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          symbol TEXT,
          timeframe TEXT,
          direction TEXT,
          entry TEXT,
          tp1 TEXT,
          tp2 TEXT,
          tp3 TEXT,
          tp4 TEXT,
          tp5 TEXT,
          sl TEXT,
          confidence TEXT,
          analysis TEXT,
          warning TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
    })();
  }

  return dbReadyPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error("DATABASE ERROR:", error);
    res.status(500).json({
      error: "Database connection failed."
    });
  }
});

/* =========================================================
   PASSWORD
========================================================= */

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return {
    salt,
    hash
  };
}

function checkPassword(password, stored) {
  try {
    const calculated = crypto.scryptSync(
      password,
      stored.salt,
      64
    );

    const original = Buffer.from(stored.hash, "hex");

    if (calculated.length !== original.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculated, original);
  } catch {
    return false;
  }
}

/* =========================================================
   SESSION
========================================================= */

function createToken(userId, role = "user") {
  const payload = {
    userId,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };

  const encoded = Buffer
    .from(JSON.stringify(payload))
    .toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

function getCookieToken(req) {
  const cookieHeader = req.headers.cookie || "";

  const cookies = {};

  cookieHeader.split(";").forEach((part) => {
    const index = part.indexOf("=");

    if (index === -1) return;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    cookies[key] = value;
  });

  if (!cookies.goldai_session) {
    return null;
  }

  try {
    return decodeURIComponent(cookies.goldai_session);
  } catch {
    return cookies.goldai_session;
  }
}

function getSession(req) {
  try {
    const token = getCookieToken(req);

    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const encoded = parts[0];
    const providedSignature = parts[1];

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encoded)
      .digest("base64url");

    const providedBuffer = Buffer.from(
      providedSignature
    );

    const expectedBuffer = Buffer.from(
      expectedSignature
    );

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );

    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("SESSION ERROR:", error);
    return null;
  }
}

function setSessionCookie(req, res, token) {
  const forwardedProto =
    req.headers["x-forwarded-proto"] || "";

  const secure =
    forwardedProto === "https"
      ? "; Secure"
      : "";

  res.setHeader(
    "Set-Cookie",
    `goldai_session=${encodeURIComponent(
      token
    )}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`
  );
}

function clearSessionCookie(req, res) {
  const forwardedProto =
    req.headers["x-forwarded-proto"] || "";

  const secure =
    forwardedProto === "https"
      ? "; Secure"
      : "";

  res.setHeader(
    "Set-Cookie",
    `goldai_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
  );
}

/* =========================================================
   USER
========================================================= */

function formatUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    approved: Boolean(row.approved),
    emailVerified: Boolean(row.email_verified),
    createdAt: row.created_at
  };
}

async function requireUser(req, res, next) {
  try {
    const session = getSession(req);

    if (!session || session.role !== "user") {
      return res.status(401).json({
        error: "Not authenticated."
      });
    }

    const rows = await sql`
      SELECT *
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.status(401).json({
        error: "User not found."
      });
    }

    req.user = rows[0];

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);

    res.status(500).json({
      error: "Authentication failed."
    });
  }
}

function requireAdmin(req, res, next) {
  const session = getSession(req);

  if (!session || session.role !== "admin") {
    return res.status(401).json({
      error: "Admin authentication required."
    });
  }

  next();
}

/* =========================================================
   UPLOAD
========================================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif"
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PNG, JPG, JPEG, WEBP and GIF images are allowed."
        )
      );
    }

    cb(null, true);
  }
});

/* =========================================================
   HEALTH
========================================================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online"
  });
});

app.get("/api", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online",
    database: DATABASE_URL ? "neon" : "missing",
    ai: OPENAI_API_KEY ? "configured" : "missing"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online",
    database: DATABASE_URL ? "neon" : "missing",
    ai: OPENAI_API_KEY ? "configured" : "missing"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "online"
  });
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body || {};

    const cleanName =
      String(name || "").trim();

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const cleanPassword =
      String(password || "");

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({
        error: "Name, email and password are required."
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters."
      });
    }

    const existing = await sql`
      SELECT id
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (existing.length) {
      return res.status(409).json({
        error: "An account with this email already exists."
      });
    }

    const passwordData =
      hashPassword(cleanPassword);

    const rows = await sql`
      INSERT INTO users (
        name,
        email,
        password_salt,
        password_hash,
        approved,
        email_verified
      )
      VALUES (
        ${cleanName},
        ${cleanEmail},
        ${passwordData.salt},
        ${passwordData.hash},
        FALSE,
        FALSE
      )
      RETURNING *
    `;

    const user = rows[0];

    setSessionCookie(
      req,
      res,
      createToken(user.id, "user")
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.json({
      ok: true,
      loggedIn: true,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      error: "Registration failed."
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body || {};

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const cleanPassword =
      String(password || "");

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const rows = await sql`
      SELECT *
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    const user = rows[0];

    if (
      !user ||
      !checkPassword(cleanPassword, {
        salt: user.password_salt,
        hash: user.password_hash
      })
    ) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const token =
      createToken(user.id, "user");

    setSessionCookie(
      req,
      res,
      token
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.json({
      ok: true,
      loggedIn: true,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      error: "Login failed."
    });
  }
});

/* =========================================================
   LOGOUT
========================================================= */

app.post("/api/logout", (req, res) => {
  clearSessionCookie(req, res);

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  return res.json({
    ok: true,
    loggedIn: false
  });
});

/* =========================================================
   CURRENT USER
========================================================= */

app.get("/api/me", async (req, res) => {
  try {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    const session =
      getSession(req);

    if (!session) {
      return res.json({
        loggedIn: false
      });
    }

    if (session.role === "admin") {
      return res.json({
        loggedIn: true,
        role: "admin"
      });
    }

    const rows = await sql`
      SELECT *
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `;

    if (!rows.length) {
      clearSessionCookie(req, res);

      return res.json({
        loggedIn: false
      });
    }

    return res.json({
      loggedIn: true,
      role: "user",
      user: formatUser(rows[0])
    });
  } catch (error) {
    console.error("ME ERROR:", error);

    return res.status(500).json({
      error: "Could not load session."
    });
  }
});

/* =========================================================
   PAYMENT
========================================================= */

async function handlePayment(req, res) {
  try {
    const {
      method,
      amount,
      reference
    } = req.body || {};

    if (!req.file) {
      return res.status(400).json({
        error: "Receipt image is required."
      });
    }

    const cleanMethod =
      String(method || "")
        .trim()
        .toLowerCase();

    if (
      cleanMethod !== "hesabpay" &&
      cleanMethod !== "binance"
    ) {
      return res.status(400).json({
        error: "Invalid payment method."
      });
    }

    const receiptData =
      req.file.buffer.toString("base64");

    const rows = await sql`
      INSERT INTO payments (
        user_id,
        method,
        amount,
        reference,
        receipt_data,
        receipt_mime,
        status
      )
      VALUES (
        ${req.user.id},
        ${cleanMethod},
        ${String(amount || "")},
        ${String(reference || "")},
        ${receiptData},
        ${req.file.mimetype},
        'pending'
      )
      RETURNING
        id,
        user_id,
        method,
        amount,
        reference,
        status,
        created_at
    `;

    return res.json({
      ok: true,
      payment: rows[0]
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    return res.status(500).json({
      error: "Payment submission failed."
    });
  }
}

/* Both routes are supported */
app.post(
  "/api/payments",
  requireUser,
  upload.single("receipt"),
  handlePayment
);

app.post(
  "/api/payment",
  requireUser,
  upload.single("receipt"),
  handlePayment
);

/* =========================================================
   ACCESS
========================================================= */

app.get(
  "/api/access",
  requireUser,
  async (req, res) => {
    try {
      const payments = await sql`
        SELECT *
        FROM payments
        WHERE user_id = ${req.user.id}
        ORDER BY created_at DESC
        LIMIT 20
      `;

      const signals = await sql`
        SELECT id, title, body, created_at
        FROM signals
        ORDER BY created_at DESC
        LIMIT 50
      `;

      return res.json({
        ok: true,
        approved: Boolean(req.user.approved),
        paymentStatus:
          payments[0]?.status || null,
        payments,
        signals
      });
    } catch (error) {
      console.error("ACCESS ERROR:", error);

      return res.status(500).json({
        error: "Could not load access information."
      });
    }
  }
);

/* =========================================================
   SUPPORT
========================================================= */

app.post(
  "/api/support",
  requireUser,
  async (req, res) => {
    try {
      const message =
        String(
          req.body?.message || ""
        ).trim();

      if (!message) {
        return res.status(400).json({
          error: "Message is required."
        });
      }

      const rows = await sql`
        INSERT INTO support (
          user_id,
          message
        )
        VALUES (
          ${req.user.id},
          ${message}
        )
        RETURNING *
      `;

      return res.json({
        ok: true,
        support: rows[0]
      });
    } catch (error) {
      console.error("SUPPORT ERROR:", error);

      return res.status(500).json({
        error: "Support message failed."
      });
    }
  }
);

/* =========================================================
   AI CHART ANALYSIS
========================================================= */

function cleanJsonText(text) {
  let value = String(text || "").trim();

  if (value.startsWith("```")) {
    value = value
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  return value;
}

function normalizeDirection(value) {
  const v =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    v === "BUY" ||
    v === "LONG" ||
    v.includes("خرید")
  ) {
    return "BUY";
  }

  if (
    v === "SELL" ||
    v === "SHORT" ||
    v.includes("فروش")
  ) {
    return "SELL";
  }

  return "WAIT";
}

function normalizeConfidence(value) {
  const v =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    v === "high" ||
    v.includes("بالا")
  ) {
    return "High";
  }

  if (
    v === "medium" ||
    v.includes("متوسط")
  ) {
    return "Medium";
  }

  return "Low";
}

function extractResponseText(data) {
  if (
    data &&
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text;
  }

  let result = "";

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item.content)) {
        continue;
      }

      for (const content of item.content) {
        if (
          typeof content?.text === "string"
        ) {
          result += content.text;
        }
      }
    }
  }

  return result;
}

app.post(
  "/api/analyze-chart",
  requireUser,
  upload.single("chart"),
  async (req, res) => {
    try {
      if (!req.user.approved) {
        return res.status(403).json({
          error:
            "Your account has not been approved yet."
        });
      }

      if (!OPENAI_API_KEY) {
        return res.status(500).json({
          error:
            "OPENAI_API_KEY is not configured."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error:
            "Chart image is required."
        });
      }

      const base64 =
        req.file.buffer.toString("base64");

      const imageUrl =
        `data:${req.file.mimetype};base64,${base64}`;

      const prompt = `
You are GoldAI, an XAUUSD market chart analyzer.

Analyze the uploaded XAUUSD chart carefully.

Return ONLY valid JSON.
Do not use markdown.
Do not write anything before or after the JSON.

Required JSON structure:

{
  "symbol": "XAUUSD",
  "timeframe": "15m",
  "direction": "BUY",
  "entry": "0000",
  "tp1": "0000",
  "tp2": "0000",
  "tp3": "0000",
  "tp4": "0000",
  "tp5": "0000",
  "sl": "0000",
  "confidence": "Medium",
  "analysis": "short explanation",
  "warning": "risk warning"
}

Rules:

- symbol must be XAUUSD.
- direction must be exactly BUY, SELL, or WAIT.
- timeframe must identify the visible chart timeframe if possible.
- entry must contain a realistic price level or price zone.
- tp1 through tp5 must be realistic price levels.
- sl must be a realistic stop-loss level.
- confidence must be exactly Low, Medium, or High.
- If the chart does not provide enough evidence for a directional trade, use WAIT.
- Do not invent indicators that are not visible.
- Use the actual visible price levels from the chart.
- Keep analysis concise.
- Keep warning concise.
`;

      const response =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${OPENAI_API_KEY}`
            },

            body: JSON.stringify({
              model: AI_MODEL,

              input: [
                {
                  role: "user",

                  content: [
                    {
                      type: "input_text",
                      text: prompt
                    },

                    {
                      type: "input_image",
                      image_url: imageUrl,
                      detail: "high"
                    }
                  ]
                }
              ]
            })
          }
        );

      const rawText =
        await response.text();

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          raw: rawText
        };
      }

      if (!response.ok) {
        console.error(
          "OPENAI ERROR:",
          data
        );

        return res.status(500).json({
          error:
            data?.error?.message ||
            "OpenAI analysis failed."
        });
      }

      const responseText =
        extractResponseText(data);

      if (!responseText) {
        return res.status(500).json({
          error:
            "AI returned an empty response."
        });
      }

      let result;

      try {
        result = JSON.parse(
          cleanJsonText(responseText)
        );
      } catch (error) {
        console.error(
          "AI JSON PARSE ERROR:",
          responseText
        );

        return res.status(500).json({
          error:
            "AI returned invalid analysis data."
        });
      }

      result = {
        symbol:
          result.symbol || "XAUUSD",

        timeframe:
          result.timeframe || "Unknown",

        direction:
          normalizeDirection(
            result.direction
          ),

        entry:
          result.entry ??
          result.entry_price ??
          result.entryPrice ??
          "",

        tp1:
          result.tp1 ??
          result.TP1 ??
          "",

        tp2:
          result.tp2 ??
          result.TP2 ??
          "",

        tp3:
          result.tp3 ??
          result.TP3 ??
          "",

        tp4:
          result.tp4 ??
          result.TP4 ??
          "",

        tp5:
          result.tp5 ??
          result.TP5 ??
          "",

        sl:
          result.sl ??
          result.SL ??
          result.stop_loss ??
          result.stopLoss ??
          "",

        confidence:
          normalizeConfidence(
            result.confidence
          ),

        analysis:
          result.analysis ||
          result.reason ||
          result.explanation ||
          "",

        warning:
          result.warning ||
          "Trading involves risk. Use proper risk management."
      };

      const saved = await sql`
        INSERT INTO analyses (
          user_id,
          symbol,
          timeframe,
          direction,
          entry,
          tp1,
          tp2,
          tp3,
          tp4,
          tp5,
          sl,
          confidence,
          analysis,
          warning
        )
        VALUES (
          ${req.user.id},
          ${result.symbol},
          ${result.timeframe},
          ${result.direction},
          ${String(result.entry)},
          ${String(result.tp1)},
          ${String(result.tp2)},
          ${String(result.tp3)},
          ${String(result.tp4)},
          ${String(result.tp5)},
          ${String(result.sl)},
          ${result.confidence},
          ${result.analysis},
          ${result.warning}
        )
        RETURNING *
      `;

      return res.json({
        ok: true,
        analysis: result,
        saved: saved[0]
      });
    } catch (error) {
      console.error(
        "ANALYZE ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          "Chart analysis failed."
      });
    }
  }
);

/* =========================================================
   ANALYSIS HISTORY
========================================================= */

app.get(
  "/api/analyses",
  requireUser,
  async (req, res) => {
    try {
      const rows = await sql`
        SELECT *
        FROM analyses
        WHERE user_id = ${req.user.id}
        ORDER BY created_at DESC
        LIMIT 100
      `;

      return res.json({
        ok: true,
        analyses: rows
      });
    } catch (error) {
      console.error(
        "ANALYSES ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not load analysis history."
      });
    }
  }
);

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {
  const password =
    String(
      req.body?.password || ""
    );

  if (
    !password ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      error:
        "Invalid admin password."
    });
  }

  const token =
    createToken("admin", "admin");

  setSessionCookie(
    req,
    res,
    token
  );

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  return res.json({
    ok: true,
    loggedIn: true,
    role: "admin"
  });
});

/* =========================================================
   ADMIN DATA
========================================================= */

app.get(
  "/api/admin/data",
  requireAdmin,
  async (req, res) => {
    try {
      const users = await sql`
        SELECT
          id,
          name,
          email,
          approved,
          email_verified,
          created_at
        FROM users
        ORDER BY created_at DESC
      `;

      const payments = await sql`
        SELECT
          p.id,
          p.user_id,
          p.method,
          p.amount,
          p.reference,
          p.status,
          p.created_at,
          p.reviewed_at,
          u.name,
          u.email
        FROM payments p
        LEFT JOIN users u
          ON u.id = p.user_id
        ORDER BY p.created_at DESC
      `;

      const signals = await sql`
        SELECT *
        FROM signals
        ORDER BY created_at DESC
      `;

      return res.json({
        ok: true,
        users,
        payments,
        signals
      });
    } catch (error) {
      console.error(
        "ADMIN DATA ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not load admin data."
      });
    }
  }
);

/* =========================================================
   ADMIN RECEIPT
========================================================= */

app.get(
  "/api/admin/payment/:id/receipt",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const rows = await sql`
        SELECT
          receipt_data,
          receipt_mime
        FROM payments
        WHERE id = ${id}
        LIMIT 1
      `;

      if (!rows.length) {
        return res.status(404).json({
          error: "Payment not found."
        });
      }

      if (!rows[0].receipt_data) {
        return res.status(404).json({
          error: "Receipt not found."
        });
      }

      const buffer =
        Buffer.from(
          rows[0].receipt_data,
          "base64"
        );

      res.setHeader(
        "Content-Type",
        rows[0].receipt_mime ||
          "image/jpeg"
      );

      return res.send(buffer);
    } catch (error) {
      console.error(
        "RECEIPT ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not load receipt."
      });
    }
  }
);

/* =========================================================
   ADMIN APPROVE PAYMENT
========================================================= */

app.post(
  "/api/admin/payment/:id/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const rows = await sql`
        UPDATE payments
        SET
          status = 'approved',
          reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) {
        return res.status(404).json({
          error: "Payment not found."
        });
      }

      await sql`
        UPDATE users
        SET approved = TRUE
        WHERE id = ${rows[0].user_id}
      `;

      return res.json({
        ok: true,
        payment: rows[0]
      });
    } catch (error) {
      console.error(
        "APPROVE ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not approve payment."
      });
    }
  }
);

/* =========================================================
   ADMIN REJECT PAYMENT
========================================================= */

app.post(
  "/api/admin/payment/:id/reject",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const rows = await sql`
        UPDATE payments
        SET
          status = 'rejected',
          reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) {
        return res.status(404).json({
          error: "Payment not found."
        });
      }

      return res.json({
        ok: true,
        payment: rows[0]
      });
    } catch (error) {
      console.error(
        "REJECT ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not reject payment."
      });
    }
  }
);

/* =========================================================
   ADMIN APPROVE USER
========================================================= */

app.post(
  "/api/admin/user/:id/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const rows = await sql`
        UPDATE users
        SET approved = TRUE
        WHERE id = ${id}
        RETURNING
          id,
          name,
          email,
          approved,
          email_verified,
          created_at
      `;

      if (!rows.length) {
        return res.status(404).json({
          error: "User not found."
        });
      }

      return res.json({
        ok: true,
        user: rows[0]
      });
    } catch (error) {
      console.error(
        "USER APPROVE ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not approve user."
      });
    }
  }
);

/* =========================================================
   ADMIN CREATE SIGNAL
========================================================= */

app.post(
  "/api/admin/signals",
  requireAdmin,
  async (req, res) => {
    try {
      const title =
        String(
          req.body?.title || ""
        ).trim();

      const body =
        String(
          req.body?.body || ""
        ).trim();

      if (!title || !body) {
        return res.status(400).json({
          error:
            "Title and body are required."
        });
      }

      const rows = await sql`
        INSERT INTO signals (
          title,
          body
        )
        VALUES (
          ${title},
          ${body}
        )
        RETURNING *
      `;

      return res.json({
        ok: true,
        signal: rows[0]
      });
    } catch (error) {
      console.error(
        "CREATE SIGNAL ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not create signal."
      });
    }
  }
);

/* =========================================================
   ADMIN DELETE SIGNAL
========================================================= */

app.delete(
  "/api/admin/signals/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      await sql`
        DELETE FROM signals
        WHERE id = ${id}
      `;

      return res.json({
        ok: true
      });
    } catch (error) {
      console.error(
        "DELETE SIGNAL ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not delete signal."
      });
    }
  }
);

/* =========================================================
   MULTER / GENERAL ERRORS
========================================================= */

app.use((error, req, res, next) => {
  console.error(
    "API ERROR:",
    error
  );

  if (
    error instanceof multer.MulterError
  ) {
    return res.status(400).json({
      error:
        error.message ||
        "Upload error."
    });
  }

  return res.status(500).json({
    error:
      error?.message ||
      "Server error."
  });
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = app;
