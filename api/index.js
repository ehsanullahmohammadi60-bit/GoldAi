const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   NEON DATABASE
========================= */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
}

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

let dbReady = false;
let dbInitPromise = null;

async function initDatabase() {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (dbReady) return;

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          approved BOOLEAN NOT NULL DEFAULT FALSE,
          email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          method TEXT NOT NULL,
          amount TEXT NOT NULL,
          reference TEXT NOT NULL,
          receipt_data BYTEA,
          receipt_mime TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at TIMESTAMPTZ
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS signals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS support (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS payments_user_id_idx
        ON payments(user_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS support_user_id_idx
        ON support(user_id)
      `;

      dbReady = true;
    })().catch(error => {
      dbInitPromise = null;
      throw error;
    });
  }

  await dbInitPromise;
}

/* =========================
   DATABASE MIDDLEWARE
========================= */

app.use(async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (error) {
    console.error("DATABASE INIT ERROR:", error);

    res.status(500).json({
      error: "Database connection failed."
    });
  }
});

/* =========================
   HELPERS
========================= */

function createId() {
  return crypto.randomUUID();
}

const SESSION_SECRET =
  process.env.SESSION_SECRET || "goldai-change-this-secret";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "change-admin-password";

function hashPassword(password, salt) {
  const realSalt =
    salt || crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, realSalt, 64)
    .toString("hex");

  return {
    salt: realSalt,
    hash
  };
}

function checkPassword(password, stored) {
  try {
    const hash = crypto
      .scryptSync(password, stored.salt, 64)
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(stored.hash, "hex")
    );
  } catch {
    return false;
  }
}

function createToken(userId, role) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function getCookieToken(req) {
  const cookieHeader = req.headers.cookie || "";

  const cookie = cookieHeader
    .split(";")
    .map(x => x.trim())
    .find(x => x.startsWith("goldai_session="));

  if (!cookie) return null;

  return decodeURIComponent(
    cookie.substring("goldai_session=".length)
  );
}

function getSession(req) {
  const token = getCookieToken(req);

  if (!token) return null;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const payload = parts[0];
  const signature = parts[1];

  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (!data.exp || data.exp < Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `goldai_session=${encodeURIComponent(
      token
    )}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
  );
}

/* =========================
   USER HELPERS
========================= */

function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    approved: row.approved,
    emailVerified: row.email_verified,
    createdAt: row.created_at
  };
}

function formatPayment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    method: row.method,
    amount: row.amount,
    reference: row.reference,
    receipt:
      row.receipt_data
        ? `/api/admin/receipts/${row.id}`
        : null,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  };
}

/* =========================
   AUTH MIDDLEWARE
========================= */

async function requireUser(req, res, next) {
  const session = getSession(req);

  if (!session || session.role !== "user") {
    return res.status(401).json({
      error: "LOGIN_REQUIRED"
    });
  }

  try {
    const rows = await sql`
      SELECT *
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.status(401).json({
        error: "LOGIN_REQUIRED"
      });
    }

    req.user = rows[0];

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);

    return res.status(500).json({
      error: "Authentication failed."
    });
  }
}

function requireAdmin(req, res, next) {
  const session = getSession(req);

  if (!session || session.role !== "admin") {
    return res.status(401).json({
      error: "ADMIN_REQUIRED"
    });
  }

  next();
}

/* =========================
   UPLOAD
========================= */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed =
      /^image\/(png|jpe?g|webp|gif)$/i.test(
        file.mimetype
      );

    cb(null, allowed);
  }
});

/* =========================
   HEALTH
========================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online",
    database: "neon"
  });
});

app.get("/api", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online",
    database: "neon"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online",
    database: "neon"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online",
    database: "neon"
  });
});

/* =========================
   REGISTER
========================= */

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required."
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters."
      });
    }

    const cleanEmail =
      String(email).trim().toLowerCase();

    const existing = await sql`
      SELECT id
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (existing.length) {
      return res.status(409).json({
        error:
          "An account with this email already exists."
      });
    }

    const passwordData = hashPassword(
      String(password)
    );

    const userId = createId();

    const rows = await sql`
      INSERT INTO users (
        id,
        name,
        email,
        password_salt,
        password_hash,
        approved,
        email_verified
      )
      VALUES (
        ${userId},
        ${String(name).trim().slice(0, 80)},
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
      res,
      createToken(user.id, "user")
    );

    return res.json({
      ok: true,
      user: formatUser(user)
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      error: "Registration failed."
    });
  }
});

/* =========================
   LOGIN
========================= */

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

    const rows = await sql`
      SELECT *
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    const user = rows[0];

    if (
      !user ||
      !checkPassword(
        String(password || ""),
        {
          salt: user.password_salt,
          hash: user.password_hash
        }
      )
    ) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    setSessionCookie(
      res,
      createToken(user.id, "user")
    );

    return res.json({
      ok: true,
      user: formatUser(user)
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      error: "Login failed."
    });
  }
});

/* =========================
   LOGOUT
========================= */

app.post("/api/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    "goldai_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
  );

  res.json({
    ok: true
  });
});

/* =========================
   CURRENT USER
========================= */

app.get("/api/me", async (req, res) => {
  try {
    const session = getSession(req);

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

    res.status(500).json({
      error: "Could not load user."
    });
  }
});

/* =========================
   PAYMENTS
========================= */

app.post(
  "/api/payments",
  requireUser,
  upload.single("receipt"),
  async (req, res) => {
    try {
      const method = req.body.method;

      if (
        !["hesabpay", "binance"].includes(
          method
        )
      ) {
        return res.status(400).json({
          error: "Invalid payment method."
        });
      }

      if (!req.body.reference) {
        return res.status(400).json({
          error:
            "Payment reference is required."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error:
            "Receipt image is required."
        });
      }

      const pending = await sql`
        SELECT id
        FROM payments
        WHERE user_id = ${req.user.id}
          AND status = 'pending'
        LIMIT 1
      `;

      if (pending.length) {
        return res.status(409).json({
          error:
            "You already have a payment waiting for review."
        });
      }

      const paymentId = createId();

      await sql`
        INSERT INTO payments (
          id,
          user_id,
          method,
          amount,
          reference,
          receipt_data,
          receipt_mime,
          status
        )
        VALUES (
          ${paymentId},
          ${req.user.id},
          ${method},
          ${
            method === "hesabpay"
              ? "240 AFN"
              : "4 USD / USDT"
          },
          ${String(req.body.reference)
            .trim()
            .slice(0, 120)},
          ${req.file.buffer},
          ${req.file.mimetype},
          'pending'
        )
      `;

      res.json({
        ok: true
      });

    } catch (error) {
      console.error("PAYMENT ERROR:", error);

      res.status(500).json({
        error: "Payment submission failed."
      });
    }
  }
);

/* =========================
   USER ACCESS
========================= */

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
      `;

      const latest = payments[0];

      const approved =
        req.user.approved === true;

      let signals = [];

      if (approved) {
        signals = await sql`
          SELECT
            id,
            title,
            body,
            created_at AS "createdAt"
          FROM signals
          ORDER BY created_at DESC
        `;
      }

      res.json({
        approved,

        paymentStatus:
          latest?.status || "none",

        signals
      });

    } catch (error) {
      console.error("ACCESS ERROR:", error);

      res.status(500).json({
        error: "Could not load access."
      });
    }
  }
);

/* =========================
   SUPPORT
========================= */

app.post(
  "/api/support",
  requireUser,
  async (req, res) => {
    try {
      const message = req.body?.message;

      if (
        !message ||
        String(message).trim().length < 2
      ) {
        return res.status(400).json({
          error: "Message required."
        });
      }

      await sql`
        INSERT INTO support (
          id,
          user_id,
          message
        )
        VALUES (
          ${createId()},
          ${req.user.id},
          ${String(message)
            .trim()
            .slice(0, 2000)}
        )
      `;

      res.json({
        ok: true
      });

    } catch (error) {
      console.error("SUPPORT ERROR:", error);

      res.status(500).json({
        error: "Could not send support message."
      });
    }
  }
);

/* =========================
   ADMIN LOGIN
========================= */

app.post(
  "/api/admin/login",
  (req, res) => {
    const password =
      String(
        req.body?.password || ""
      );

    if (
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error:
          "Invalid admin password."
      });
    }

    setSessionCookie(
      res,
      createToken(
        "admin",
        "admin"
      )
    );

    res.json({
      ok: true
    });
  }
);

/* =========================
   ADMIN DATA
========================= */

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
          p.*,
          u.email AS user_email,
          u.name AS user_name
        FROM payments p
        LEFT JOIN users u
          ON u.id = p.user_id
        ORDER BY p.created_at DESC
      `;

      const signals = await sql`
        SELECT
          id,
          title,
          body,
          created_at AS "createdAt"
        FROM signals
        ORDER BY created_at DESC
      `;

      const support = await sql`
        SELECT
          s.id,
          s.user_id,
          s.message,
          s.created_at,
          u.email AS user_email
        FROM support s
        LEFT JOIN users u
          ON u.id = s.user_id
        ORDER BY s.created_at DESC
      `;

      res.json({
        users: users.map(formatUser),

        payments: payments.map(p => ({
          ...formatPayment(p),
          userEmail:
            p.user_email || "Unknown",
          userName:
            p.user_name || "Unknown"
        })),

        signals,

        support: support.map(s => ({
          id: s.id,
          userId: s.user_id,
          message: s.message,
          createdAt: s.created_at,
          userEmail:
            s.user_email || "Unknown"
        }))
      });

    } catch (error) {
      console.error(
        "ADMIN DATA ERROR:",
        error
      );

      res.status(500).json({
        error: "Could not load admin data."
      });
    }
  }
);

/* =========================
   ADMIN RECEIPT
========================= */

app.get(
  "/api/admin/receipts/:paymentId",
  requireAdmin,
  async (req, res) => {
    try {
      const rows = await sql`
        SELECT
          receipt_data,
          receipt_mime
        FROM payments
        WHERE id = ${req.params.paymentId}
        LIMIT 1
      `;

      if (
        !rows.length ||
        !rows[0].receipt_data
      ) {
        return res.status(404).send(
          "Receipt not found."
        );
      }

      res.setHeader(
        "Content-Type",
        rows[0].receipt_mime ||
          "image/jpeg"
      );

      res.setHeader(
        "Cache-Control",
        "private, no-store"
      );

      res.send(rows[0].receipt_data);

    } catch (error) {
      console.error(
        "RECEIPT ERROR:",
        error
      );

      res.status(500).send(
        "Could not load receipt."
      );
    }
  }
);

/* =========================
   ADMIN PAYMENT APPROVE
========================= */

app.post(
  "/api/admin/payments/:paymentId/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const paymentRows = await sql`
        SELECT *
        FROM payments
        WHERE id = ${req.params.paymentId}
        LIMIT 1
      `;

      if (!paymentRows.length) {
        return res.status(404).json({
          error: "Payment not found."
        });
      }

      const payment = paymentRows[0];

      await sql`
        UPDATE payments
        SET
          status = 'approved',
          reviewed_at = NOW()
        WHERE id = ${payment.id}
      `;

      await sql`
        UPDATE users
        SET approved = TRUE
        WHERE id = ${payment.user_id}
      `;

      res.json({
        ok: true
      });

    } catch (error) {
      console.error(
        "APPROVE ERROR:",
        error
      );

      res.status(500).json({
        error: "Could not approve payment."
      });
    }
  }
);

/* =========================
   ADMIN PAYMENT REJECT
========================= */

app.post(
  "/api/admin/payments/:paymentId/reject",
  requireAdmin,
  async (req, res) => {
    try {
      const paymentRows = await sql`
        SELECT *
        FROM payments
        WHERE id = ${req.params.paymentId}
        LIMIT 1
      `;

      if (!paymentRows.length) {
        return res.status(404).json({
          error: "Payment not found."
        });
      }

      const payment = paymentRows[0];

      await sql`
        UPDATE payments
        SET
          status = 'rejected',
          reviewed_at = NOW()
        WHERE id = ${payment.id}
      `;

      await sql`
        UPDATE users
        SET approved = FALSE
        WHERE id = ${payment.user_id}
      `;

      res.json({
        ok: true
      });

    } catch (error) {
      console.error(
        "REJECT ERROR:",
        error
      );

      res.status(500).json({
        error: "Could not reject payment."
      });
    }
  }
);

/* =========================
   ADMIN SIGNALS
========================= */

app.post(
  "/api/admin/signals",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        title,
        body
      } = req.body || {};

      if (!body) {
        return res.status(400).json({
          error:
            "Signal body required."
        });
      }

      await sql`
        INSERT INTO signals (
          id,
          title,
          body
        )
        VALUES (
          ${createId()},
          ${String(
            title || "XAUUSD Signal"
          ).slice(0, 120)},
          ${String(body).slice(0, 5000)}
        )
      `;

      res.json({
        ok: true
      });

    } catch (error) {
      console.error(
        "SIGNAL ERROR:",
        error
      );

      res.status(500).json({
        error: "Could not create signal."
      });
    }
  }
);

/* =========================
   DELETE SIGNAL
========================= */

app.delete(
  "/api/admin/signals/:id",
  requireAdmin,
  async (req, res) => {
    try {
      await sql`
        DELETE FROM signals
        WHERE id = ${req.params.id}
      `;

      res.json({
        ok: true
      });

    } catch (error) {
      console.error(
        "DELETE SIGNAL ERROR:",
        error
      );

      res.status(500).json({
        error: "Could not delete signal."
      });
    }
  }
);

/* =========================
   EXPORT FOR VERCEL
========================= */

module.exports = app;
